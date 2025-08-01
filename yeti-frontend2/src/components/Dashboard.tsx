'use client';

import { useState, useEffect } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useYetiSDK } from '@/hooks/useYetiSDK';
import { getTokenByAddress, Token } from '@/lib/tokens';

interface Order {
  id: string;
  order_hash: string;
  chain_id: number;
  maker: string;
  maker_asset: string;
  taker_asset: string;
  making_amount: string;
  taking_amount: string;
  status: 'pending' | 'triggered' | 'partially_filled' | 'filled' | 'cancelled' | 'expired';
  filled_amount: string;
  remaining_amount: string;
  created_at: string;
  updated_at: string;
  expires_at: string;
  token_pair: string;
  alert_id: string;
  webhook_id: string;
}

const ORDER_STATUS_COLORS = {
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  triggered: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  partially_filled: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  filled: 'bg-green-500/20 text-green-400 border-green-500/30',
  cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
  expired: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
};

function getTokenInfo(address: string): { symbol: string; logo: string; decimals: number } {
  const token = getTokenByAddress(address);
  return token ? {
    symbol: token.symbol,
    logo: token.logoURI || 'https://via.placeholder.com/24/64748b/ffffff?text=?',
    decimals: token.decimals
  } : { 
    symbol: `${address.slice(0, 6)}...${address.slice(-4)}`, 
    logo: 'https://via.placeholder.com/24/64748b/ffffff?text=?',
    decimals: 18
  };
}

function copyToClipboard(text: string, label: string) {
  navigator.clipboard.writeText(text).then(() => {
    // You could add a toast notification here
    console.log(`${label} copied to clipboard:`, text);
  }).catch(err => {
    console.error('Failed to copy:', err);
  });
}

function formatAmount(amount: string, decimals: number = 18): string {
  const num = parseFloat(amount) / Math.pow(10, decimals);
  return num.toLocaleString(undefined, { 
    minimumFractionDigits: 0, 
    maximumFractionDigits: 6 
  });
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function calculateFillPercentage(filledAmount: string, makingAmount: string): number {
  const filled = parseFloat(filledAmount);
  const total = parseFloat(makingAmount);
  if (total === 0) return 0;
  return Math.min(100, (filled / total) * 100);
}

type SortField = 'created_at' | 'token_pair' | 'status' | 'making_amount' | 'filled_percentage';
type SortDirection = 'asc' | 'desc';

interface CopyButtonProps {
  text: string;
  displayText: string;
  label: string;
}

function CopyButton({ text, displayText, label }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    copyToClipboard(text, label);
    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
  };

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center space-x-1 text-gray-300 hover:text-white transition-colors font-mono text-xs"
    >
      <span>{displayText}</span>
      <svg 
        className={`w-3 h-3 ${copied ? 'text-green-400' : 'text-gray-400'}`} 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        {copied ? (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        )}
      </svg>
    </button>
  );
}

export function Dashboard() {
  const { authenticated } = usePrivy();
  const { wallets } = useWallets();
  const { getUserOrders, isReady } = useYetiSDK();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters and sorting
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [assetFilter, setAssetFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const connectedWallet = wallets[0];

  useEffect(() => {
    if (!authenticated || !connectedWallet || !isReady) {
      setLoading(false);
      return;
    }

    fetchUserOrders();
  }, [authenticated, connectedWallet, isReady]);

  // Filter and sort orders whenever orders, filters, or sort changes
  useEffect(() => {
    console.log('Filtering orders:', { 
      totalOrders: orders.length, 
      statusFilter, 
      assetFilter 
    });
    
    let filtered = [...orders];

    // Apply status filter
    if (statusFilter !== 'all') {
      const beforeStatusFilter = filtered.length;
      filtered = filtered.filter(order => order.status === statusFilter);
      console.log(`Status filter applied: ${beforeStatusFilter} -> ${filtered.length}`);
    }

    // Apply asset filter
    if (assetFilter !== 'all') {
      const beforeAssetFilter = filtered.length;
      filtered = filtered.filter(order => 
        order.maker_asset.toLowerCase() === assetFilter.toLowerCase() ||
        order.taker_asset.toLowerCase() === assetFilter.toLowerCase()
      );
      console.log(`Asset filter applied: ${beforeAssetFilter} -> ${filtered.length}`, {
        assetFilter,
        sampleOrder: filtered[0] ? {
          maker_asset: filtered[0].maker_asset,
          taker_asset: filtered[0].taker_asset
        } : 'no orders'
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortField) {
        case 'created_at':
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        case 'token_pair':
          const aTokenInfo = getTokenInfo(a.maker_asset);
          const bTokenInfo = getTokenInfo(b.maker_asset);
          aValue = `${aTokenInfo.symbol}-${getTokenInfo(a.taker_asset).symbol}`;
          bValue = `${bTokenInfo.symbol}-${getTokenInfo(b.taker_asset).symbol}`;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'making_amount':
          aValue = parseFloat(a.making_amount);
          bValue = parseFloat(b.making_amount);
          break;
        case 'filled_percentage':
          aValue = calculateFillPercentage(a.filled_amount, a.making_amount);
          bValue = calculateFillPercentage(b.filled_amount, b.making_amount);
          break;
        default:
          aValue = a.created_at;
          bValue = b.created_at;
      }

      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    setFilteredOrders(filtered);
  }, [orders, statusFilter, assetFilter, sortField, sortDirection]);

  const fetchUserOrders = async () => {
    if (!connectedWallet || !getUserOrders) return;

    try {
      setLoading(true);
      setError(null);

      const ordersResponse = await getUserOrders(connectedWallet.address);
      console.log('Orders response structure:', ordersResponse);
      setOrders(ordersResponse.data || ordersResponse.orders || []);
    } catch (err) {
      console.error('Failed to fetch user orders:', err);
      setError(err instanceof Error ? err.message : 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Get unique assets for filter dropdown
  const uniqueAssets = Array.from(new Set([
    ...orders.flatMap(order => [order.maker_asset, order.taker_asset])
  ])).map(address => ({
    address,
    ...getTokenInfo(address)
  }));

  if (!authenticated || !connectedWallet) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center">
          <div className="text-gray-400 mb-4">Connect your wallet to view your orders</div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <div className="text-gray-400">Loading your orders...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center">
          <div className="text-red-400 mb-4">Error loading orders</div>
          <div className="text-gray-400 mb-4">{error}</div>
          <button
            onClick={fetchUserOrders}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">My Orders</h1>
        <button
          onClick={fetchUserOrders}
          className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Refresh</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gray-800/30 rounded-lg border border-gray-700">
        <div className="flex items-center space-x-2">
          <label className="text-sm text-gray-400">Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-gray-700 text-white text-sm rounded-lg px-3 py-1 border border-gray-600 focus:border-blue-500 focus:outline-none"
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="triggered">Triggered</option>
            <option value="partially_filled">Partially Filled</option>
            <option value="filled">Filled</option>
            <option value="cancelled">Cancelled</option>
            <option value="expired">Expired</option>
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <label className="text-sm text-gray-400">Asset:</label>
          <select
            value={assetFilter}
            onChange={(e) => setAssetFilter(e.target.value)}
            className="bg-gray-700 text-white text-sm rounded-lg px-3 py-1 border border-gray-600 focus:border-blue-500 focus:outline-none"
          >
            <option value="all">All Assets</option>
            {uniqueAssets.map((token) => (
              <option key={token.address} value={token.address}>
                {token.symbol}
              </option>
            ))}
          </select>
        </div>

        <div className="text-sm text-gray-400">
          Showing {filteredOrders.length} of {orders.length} orders
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            {orders.length === 0 ? 'No orders found' : 'No orders match your filters'}
          </div>
          <div className="text-sm text-gray-500">
            {orders.length === 0 ? 'Create your first limit order to see it here' : 'Try adjusting your filters'}
          </div>
        </div>
      ) : (
        <div className="bg-gray-800/30 rounded-lg border border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800/50 border-b border-gray-700">
                <tr>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort('token_pair')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Pair</span>
                      {sortField === 'token_pair' && (
                        <svg className={`w-3 h-3 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Status</span>
                      {sortField === 'status' && (
                        <svg className={`w-3 h-3 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort('making_amount')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Amount</span>
                      {sortField === 'making_amount' && (
                        <svg className={`w-3 h-3 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort('filled_percentage')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Filled</span>
                      {sortField === 'filled_percentage' && (
                        <svg className={`w-3 h-3 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort('created_at')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Created</span>
                      {sortField === 'created_at' && (
                        <svg className={`w-3 h-3 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    IDs
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredOrders.map((order) => {
                  const makerToken = getTokenInfo(order.maker_asset);
                  const takerToken = getTokenInfo(order.taker_asset);
                  const fillPercentage = calculateFillPercentage(order.filled_amount, order.making_amount);
                  
                  return (
                    <tr key={order.id} className="hover:bg-gray-800/50 transition-colors">
                      {/* Trading Pair */}
                      <td className="px-4 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center -space-x-1">
                            <img src={makerToken.logo} alt={makerToken.symbol} className="w-6 h-6 rounded-full border border-gray-600" />
                            <img src={takerToken.logo} alt={takerToken.symbol} className="w-6 h-6 rounded-full border border-gray-600" />
                          </div>
                          <div>
                            <div className="text-white font-medium">
                              {makerToken.symbol} → {takerToken.symbol}
                            </div>
                            <div className="text-xs text-gray-400">
                              {formatAmount(order.making_amount, makerToken.decimals)} for {formatAmount(order.taking_amount, takerToken.decimals)}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4">
                        <div className={`px-2 py-1 rounded-full text-xs font-medium border ${ORDER_STATUS_COLORS[order.status]} inline-block`}>
                          {order.status.replace('_', ' ')}
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="px-4 py-4">
                        <div className="text-white font-medium">
                          {formatAmount(order.making_amount, makerToken.decimals)}
                        </div>
                        <div className="text-xs text-gray-400">
                          {makerToken.symbol}
                        </div>
                      </td>

                      {/* Filled */}
                      <td className="px-4 py-4">
                        <div className="text-white font-medium">
                          {fillPercentage.toFixed(1)}%
                        </div>
                        <div className="w-20 bg-gray-700 rounded-full h-2 mt-1">
                          <div 
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${fillPercentage}%` }}
                          />
                        </div>
                      </td>

                      {/* Created */}
                      <td className="px-4 py-4 text-white">
                        {formatDate(order.created_at)}
                      </td>

                      {/* IDs */}
                      <td className="px-4 py-4 space-y-1">
                        <CopyButton 
                          text={order.order_hash}
                          displayText={`${order.order_hash.slice(0, 6)}...${order.order_hash.slice(-4)}`}
                          label="Order Hash"
                        />
                        <CopyButton 
                          text={order.alert_id}
                          displayText={`${order.alert_id.slice(0, 6)}...${order.alert_id.slice(-4)}`}
                          label="Alert ID"
                        />
                        <CopyButton 
                          text={order.webhook_id}
                          displayText={`${order.webhook_id.slice(0, 6)}...${order.webhook_id.slice(-4)}`}
                          label="Webhook ID"
                        />
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-4">
                        <div className="flex items-center space-x-2">
                          {order.status === 'pending' && (
                            <button className="text-red-400 hover:text-red-300 text-sm transition-colors">
                              Cancel
                            </button>
                          )}
                          <button className="text-blue-400 hover:text-blue-300 text-sm transition-colors">
                            Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}