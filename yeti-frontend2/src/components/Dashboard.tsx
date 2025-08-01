'use client';

import { useState, useEffect } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useYetiSDK } from '@/hooks/useYetiSDK';

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

const TOKEN_ADDRESSES: Record<string, string> = {
  '0x833589fCD6eDb6E08f4c7C32D4f71b54bda02913': 'USDC',
  '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2': 'USDT', 
  '0x4200000000000000000000000000000000000006': 'WETH',
  '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf': 'cbBTC'
};

function formatTokenAddress(address: string): string {
  return TOKEN_ADDRESSES[address] || `${address.slice(0, 6)}...${address.slice(-4)}`;
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

export function Dashboard() {
  const { authenticated } = usePrivy();
  const { wallets } = useWallets();
  const { getUserOrders, isReady } = useYetiSDK();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const connectedWallet = wallets[0];

  useEffect(() => {
    if (!authenticated || !connectedWallet || !isReady) {
      setLoading(false);
      return;
    }

    fetchUserOrders();
  }, [authenticated, connectedWallet, isReady]);

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
    <div className="max-w-6xl mx-auto">
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

      {orders.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">No orders found</div>
          <div className="text-sm text-gray-500">
            Create your first limit order to see it here
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 backdrop-blur-sm"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="text-lg font-semibold text-white">
                    {formatTokenAddress(order.maker_asset)} → {formatTokenAddress(order.taker_asset)}
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium border ${ORDER_STATUS_COLORS[order.status]}`}>
                    {order.status.replace('_', ' ')}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-400">Order Hash</div>
                  <div className="text-xs font-mono text-gray-300">
                    {order.order_hash.slice(0, 8)}...{order.order_hash.slice(-8)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <div className="text-sm text-gray-400 mb-1">Selling</div>
                  <div className="text-white font-medium">
                    {formatAmount(order.making_amount)} {formatTokenAddress(order.maker_asset)}
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-400 mb-1">For</div>
                  <div className="text-white font-medium">
                    {formatAmount(order.taking_amount)} {formatTokenAddress(order.taker_asset)}
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-400 mb-1">Filled</div>
                  <div className="text-white font-medium">
                    {formatAmount(order.filled_amount)} / {formatAmount(order.making_amount)}
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2 mt-1">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${Math.min(100, (parseFloat(order.filled_amount) / parseFloat(order.making_amount)) * 100)}%` 
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-400 mb-1">Created</div>
                  <div className="text-white font-medium">
                    {formatDate(order.created_at)}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                <div className="flex items-center space-x-4 text-sm text-gray-400">
                  <span>Alert ID: {order.alert_id.slice(0, 8)}...</span>
                  <span>Webhook: {order.webhook_id.slice(0, 8)}...</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  {order.status === 'pending' && (
                    <button className="text-red-400 hover:text-red-300 text-sm">
                      Cancel
                    </button>
                  )}
                  <button className="text-blue-400 hover:text-blue-300 text-sm">
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}