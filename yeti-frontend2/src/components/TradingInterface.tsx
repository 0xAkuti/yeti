'use client';

import React, { useState, useMemo } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useWallets } from '@privy-io/react-auth';
import { ArrowUpDown, Settings, RefreshCw } from 'lucide-react';
import { BASE_TOKENS, Token } from '@/lib/tokens';
import { AssetSelector } from './AssetSelector';
import { ConnectButton } from './ConnectButton';
import { useTokenBalances } from '@/hooks/useTokenBalances';
import { useTokenPrices } from '@/hooks/useTokenPrices';
import { useYetiSDK } from '@/hooks/useYetiSDK';

interface TradingInterfaceProps {
  onNavigateToDashboard?: () => void;
}

export function TradingInterface({ onNavigateToDashboard }: TradingInterfaceProps) {
  const { authenticated, ready } = usePrivy();
  const { wallets } = useWallets();
  const { loading: balancesLoading, getTokenBalance, formatBalance, formatUSD, refetch } = useTokenBalances();
  
  const [sellToken, setSellToken] = useState<Token>(BASE_TOKENS[0]); // USDC
  const [buyToken, setBuyToken] = useState<Token>(BASE_TOKENS[2]); // WETH
  
  // Memoize token addresses to prevent constant refetching
  const tokenAddresses = useMemo(() => [
    sellToken.address,
    buyToken.address
  ], [sellToken.address, buyToken.address]);
  
  // Get prices for both tokens
  const { loading: pricesLoading, getTokenPrice, calculateOutputAmount, refetch: refetchPrices } = useTokenPrices(tokenAddresses);
  const { createLimitOrder, submitOrder, loading: orderLoading, error: orderError, isReady: yetiReady } = useYetiSDK();
  
  const [sellAmount, setSellAmount] = useState<string>('');
  const [sellPercentage, setSellPercentage] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<'order' | 'setup' | 'success'>('order');
  const [orderResult, setOrderResult] = useState<any>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Get the connected wallet
  const connectedWallet = wallets[0];

  // Enhanced copy to clipboard function
  const copyToClipboard = async (text: string, field: string) => {
    console.log('Copy button clicked for field:', field);
    try {
      await navigator.clipboard.writeText(text);
      console.log('Successfully copied to clipboard');
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 3000);
    } catch (err) {
      console.error('Failed to copy:', err);
      // Fallback for older browsers
      try {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        console.log('Successfully copied using fallback method');
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 3000);
      } catch (fallbackErr) {
        console.error('Fallback copy also failed:', fallbackErr);
      }
    }
  };

  // Function to get TradingView symbol from token pair
  const getTradingViewSymbol = (sellToken: Token, buyToken: Token) => {
    // Map token addresses to TradingView symbols
    const tokenSymbolMap: Record<string, string> = {
      // ETH tokens
      '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee': 'ETH',
      '0x4200000000000000000000000000000000000006': 'ETH', // WETH
      // BTC tokens
      '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599': 'BTC', // WBTC
      '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf': 'BTC', // cbBTC
      // USD tokens
      '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913': 'USD', // USDC
      '0xfde4c96c8593536e31f229ea8f37b2ada2699bb2': 'USD', // USDT
      '0x50c5725949a6f0c72e6c4a641f24049a917db0cb': 'USD', // DAI
    };

    const sellSymbol = tokenSymbolMap[sellToken.address.toLowerCase()] || sellToken.symbol;
    const buySymbol = tokenSymbolMap[buyToken.address.toLowerCase()] || buyToken.symbol;

    // Handle reversed USD pairs (when USD is the sell token)
    if (sellSymbol === 'USD' && (buySymbol === 'ETH' || buySymbol === 'BTC')) {
      return `1/${buySymbol}USD`;
    }
    
    // Standard pairs (crypto to USD)
    if (buySymbol === 'USD' && (sellSymbol === 'ETH' || sellSymbol === 'BTC')) {
      return `${sellSymbol}USD`;
    }

    // Fallback for other pairs
    return `${sellSymbol}${buySymbol}`;
  };

  // Function to open TradingView chart
  const openTradingView = () => {
    const symbol = getTradingViewSymbol(sellToken, buyToken);
    const url = `https://www.tradingview.com/chart/?symbol=${symbol}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Get token balance and prices
  const sellTokenBalance = getTokenBalance(sellToken.address);
  const sellTokenPrice = getTokenPrice(sellToken.address);
  const buyTokenPrice = getTokenPrice(buyToken.address);
  
  // Calculate estimated output amount
  const estimatedOutput = sellAmount && sellAmount !== '0' 
    ? calculateOutputAmount(
        sellAmount,
        sellToken.decimals,
        sellTokenPrice,
        buyTokenPrice,
        buyToken.decimals
      )
    : '0';

  const handleCreateLimitOrder = async () => {
    if (!sellAmount || parseFloat(sellAmount) <= 0) {
      return;
    }

    try {
      // Determine action based on tokens (simplified logic)
      // In a real app, this would be determined by user selection or market analysis
      const action: 'LONG' | 'SHORT' = 'LONG'; // Default to LONG for now
      
      const result = await createLimitOrder({
        sellToken: sellToken.address,
        sellAmount,
        buyToken: buyToken.address,
        action
      });

      setOrderResult(result);
      setCurrentPage('setup');

      // Submit to orderbook
      await submitOrder(result.orderData, result.signature, result.webhook.webhookId);
      
      console.log('Limit order created and submitted:', result);
    } catch (error) {
      console.error('Failed to create limit order:', error);
    }
  };

  const handleSwapTokens = () => {
    const temp = sellToken;
    setSellToken(buyToken);
    setBuyToken(temp);
    setSellAmount('');
    setSellPercentage(0);
  };

  const handleMaxClick = () => {
    if (sellTokenBalance) {
      const maxAmount = formatBalance(sellTokenBalance.balance, sellTokenBalance.decimals);
      setSellAmount(maxAmount);
      setSellPercentage(100);
    }
  };

  const handlePercentageChange = (percentage: number) => {
    setSellPercentage(percentage);
    if (sellTokenBalance) {
      const balanceNum = parseFloat(sellTokenBalance.balance) / Math.pow(10, sellTokenBalance.decimals);
      const amount = (balanceNum * percentage / 100).toFixed(sellTokenBalance.decimals);
      setSellAmount(amount);
    }
  };

  const handleAmountChange = (value: string) => {
    setSellAmount(value);
    if (sellTokenBalance && parseFloat(value) > 0) {
      const balanceNum = parseFloat(sellTokenBalance.balance) / Math.pow(10, sellTokenBalance.decimals);
      const percentage = (parseFloat(value) / balanceNum) * 100;
      setSellPercentage(Math.min(percentage, 100));
    } else {
      setSellPercentage(0);
    }
  };

  // Page 1: Order Creation
  const renderOrderPage = () => (
    <div className="flex justify-center w-full">
      <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 w-96 h-[600px] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-semibold text-white">Limit Order</h2>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => {
                refetch();
                refetchPrices();
              }}
              disabled={balancesLoading || pricesLoading}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
              title="Refresh balances and prices"
            >
              <RefreshCw size={20} className={balancesLoading || pricesLoading ? 'animate-spin' : ''} />
            </button>
            <button className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
              <Settings size={20} />
            </button>
          </div>
        </div>

        {/* Sell Section */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-400">You pay</span>
            {authenticated && connectedWallet && sellTokenBalance && (
              <span className="text-sm text-gray-400">
                Balance: {formatBalance(sellTokenBalance.balance, sellTokenBalance.decimals)}
              </span>
            )}
          </div>
          <div className="bg-gray-700 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <input
                type="text"
                placeholder="0"
                value={sellAmount}
                onChange={(e) => handleAmountChange(e.target.value)}
                className="bg-transparent text-2xl font-semibold outline-none flex-1 mr-4 min-w-0"
              />
              <div className="flex-shrink-0">
                <AssetSelector
                  selectedToken={sellToken}
                  onSelect={setSellToken}
                  tokens={BASE_TOKENS}
                />
              </div>
            </div>
            {authenticated && connectedWallet && sellTokenBalance && (
              <React.Fragment key="sell-token-info">
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm text-gray-500">
                    {sellTokenPrice > 0 && sellAmount ? 
                      `$${(parseFloat(sellAmount) * sellTokenPrice).toFixed(2)}` : 
                      formatUSD(sellTokenBalance.balanceUSD)
                    }
                  </span>
                  <div className="flex items-center space-x-2">
                    {sellTokenPrice > 0 && (
                      <span className="text-xs text-gray-400">
                        ${sellTokenPrice.toFixed(sellTokenPrice < 1 ? 4 : 2)}
                      </span>
                    )}
                    <button
                      onClick={handleMaxClick}
                      className="text-sm text-blue-400 hover:text-blue-300"
                    >
                      Max
                    </button>
                  </div>
                </div>
                
                {/* Percentage Slider */}
                <div className="mt-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-gray-400">Amount: {sellPercentage.toFixed(0)}%</span>
                    <div className="flex space-x-2">
                      {[25, 50, 75, 100].map((percentage) => (
                        <button
                          key={percentage}
                          onClick={() => handlePercentageChange(percentage)}
                          className={`px-2 py-1 text-xs rounded transition-colors ${
                            Math.abs(sellPercentage - percentage) < 1
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                          }`}
                        >
                          {percentage}%
                        </button>
                      ))}
                    </div>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={sellPercentage}
                    onChange={(e) => handlePercentageChange(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                    style={{
                      background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${sellPercentage}%, #4b5563 ${sellPercentage}%, #4b5563 100%)`
                    }}
                  />
                </div>
              </React.Fragment>
            )}
          </div>
        </div>

        {/* Swap Button */}
        <div className="flex justify-center my-4">
          <button
            onClick={handleSwapTokens}
            className="p-2 bg-gray-700 hover:bg-gray-600 rounded-xl transition-colors border border-gray-600"
          >
            <ArrowUpDown size={20} />
          </button>
        </div>

        {/* Buy Section */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-400">You receive (estimated)</span>
            {buyTokenPrice > 0 && (
              <span className="text-xs text-gray-400">
                ${buyTokenPrice.toFixed(buyTokenPrice < 1 ? 4 : 2)}
              </span>
            )}
          </div>
          <div className="bg-gray-700 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="text-2xl font-semibold flex-1 min-w-0">
                <span className={estimatedOutput !== '0' ? 'text-white' : 'text-gray-500'}>
                  {estimatedOutput !== '0' ? `~${estimatedOutput}` : '0'}
                </span>
              </div>
              <div className="flex-shrink-0">
                <AssetSelector
                  selectedToken={buyToken}
                  onSelect={setBuyToken}
                  tokens={BASE_TOKENS.filter(token => token.address !== sellToken.address)}
                />
              </div>
            </div>
            {estimatedOutput !== '0' && buyTokenPrice > 0 && (
              <div className="mt-2">
                <span className="text-sm text-gray-500">
                  ${(parseFloat(estimatedOutput) * buyTokenPrice).toFixed(2)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Error Display */}
        {orderError && (
          <div className="mb-4 p-3 bg-red-900/20 border border-red-600 rounded-xl">
            <p className="text-sm text-red-200">
              Error: {orderError}
            </p>
          </div>
        )}

        {/* Spacer to push button to bottom */}
        <div className="flex-1"></div>

        {/* Connect/Trade Button */}
        <div className="mt-auto">
          {!ready ? (
            <button className="w-full bg-gray-600 text-white font-semibold py-4 rounded-xl">
              Loading...
            </button>
          ) : !authenticated ? (
            <ConnectButton />
          ) : (
            <button
              onClick={handleCreateLimitOrder}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-xl transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
              disabled={!sellAmount || parseFloat(sellAmount) <= 0 || orderLoading || !yetiReady}
              title="🔗 This will create a TradingView-triggered limit order using Yeti&#10;&#10;Note: Estimated output is based on current market prices. Actual execution depends on price when TradingView alert triggers."
            >
              {orderLoading ? 'Creating Order...' : 'Create Limit Order & Sign'}
            </button>
          )}
        </div>
      </div>
    </div>
  );

  // Page 2: TradingView Setup Instructions
  const renderSetupPage = () => {
    if (!orderResult) return null;

    const webhookUrl = orderResult.webhook?.webhookUrl || '';
    const alertMessage = orderResult.webhook?.buyMessage || '';

    return (
      <div className="flex justify-center w-full">
        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 w-96 h-[600px] flex flex-col">
          {/* Step 1 Header */}
          <div className="mb-4 text-center">
            <h2 className="text-lg font-semibold text-white">1. Setup Alert with your indicator</h2>
          </div>

          {/* Open TradingView Button */}
          <div className="mb-6 text-center">
            <button
              onClick={openTradingView}
              className="bg-gradient-to-r from-[#006e4e] to-[#008f6a] hover:from-[#005a42] hover:to-[#007055] text-white px-6 py-3 rounded-lg font-bold transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center space-x-2 mx-auto"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              <span>Open TradingView</span>
            </button>
          </div>

          {/* Step 2 Header */}
          <div className="mb-4 text-center">
            <h2 className="text-lg font-semibold text-white">2. Set Alert Message</h2>
          </div>

          {/* Copy Alert Message Button */}
          <div className="mb-6 text-center">
            <button
              onClick={() => copyToClipboard(alertMessage, 'alert')}
              className={`px-6 py-3 rounded-lg font-bold transition-all duration-200 transform shadow-lg flex items-center space-x-2 mx-auto ${
                copiedField === 'alert'
                  ? 'bg-green-600 hover:bg-green-700 text-white scale-105'
                  : 'bg-gradient-to-r from-[#006e4e] to-[#008f6a] hover:from-[#005a42] hover:to-[#007055] text-white hover:scale-105'
              }`}
            >
              {copiedField === 'alert' ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
              <span>{copiedField === 'alert' ? 'Copied Alert Message!' : 'Copy Alert Message'}</span>
            </button>
          </div>

          {/* Step 3 Header */}
          <div className="mb-4 text-center">
            <h2 className="text-lg font-semibold text-white">3. Enable and set Webhook URL</h2>
          </div>

          {/* Copy Webhook URL Button */}
          <div className="mb-6 text-center">
            <button
              onClick={() => copyToClipboard(webhookUrl, 'webhook')}
              className={`px-6 py-3 rounded-lg font-bold transition-all duration-200 transform shadow-lg flex items-center space-x-2 mx-auto ${
                copiedField === 'webhook'
                  ? 'bg-green-600 hover:bg-green-700 text-white scale-105'
                  : 'bg-gradient-to-r from-[#006e4e] to-[#008f6a] hover:from-[#005a42] hover:to-[#007055] text-white hover:scale-105'
              }`}
            >
              {copiedField === 'webhook' ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
              <span>{copiedField === 'webhook' ? 'Copied Webhook URL!' : 'Copy Webhook URL'}</span>
            </button>
          </div>

          {/* Help Button */}
          <div className="mb-6 text-center">
            <button
              onClick={() => setShowHelp(!showHelp)}
              className="inline-flex items-center space-x-2 text-gray-400 hover:text-white text-sm transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Detailed Instructions</span>
              <svg className={`w-4 h-4 transition-transform ${showHelp ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {/* Collapsible Help Section */}
          {showHelp && (
            <div className="mb-6 bg-gray-700 rounded-lg p-4">
              <div className="text-sm text-gray-300 space-y-2">
                <p><strong>1.</strong> Open TradingView and navigate to your chart</p>
                <p><strong>2.</strong> Click the "Alert" button (bell icon) or press Alt + A</p>
                <p><strong>3.</strong> Set your alert condition (price level, indicator, etc.)</p>
                <p><strong>4.</strong> In the "Notifications" tab, enable "Webhook URL"</p>
                <p><strong>5.</strong> Paste the webhook URL from step 1</p>
                <p><strong>6.</strong> Paste the alert message from step 2</p>
                <p><strong>7.</strong> Click "Create" to activate your alert</p>
              </div>
              <div className="flex items-center space-x-2 mt-3 pt-3 border-t border-gray-600">
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                <button 
                  onClick={openTradingView}
                  className="text-blue-400 hover:text-blue-300 text-sm underline"
                >
                  Open TradingView
                </button>
              </div>
            </div>
          )}

          {/* Spacer to push button to bottom */}
          <div className="flex-1"></div>

          {/* Confirm Button */}
          <div className="mt-auto">
            <button
              onClick={() => setCurrentPage('success')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-lg transition-colors"
            >
              I've Set Up My TradingView Alert
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Page 3: Success Message
  const renderSuccessPage = () => (
    <div className="flex justify-center w-full">
      <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 w-96 h-[600px] flex flex-col">
        {/* Success Icon */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Setup Complete!</h2>
          <p className="text-gray-300">
            Your TradingView alert is now connected to your limit order.
          </p>
        </div>

        {/* Next Steps */}
        <div className="bg-blue-900/20 border border-blue-800 rounded-xl p-4 mb-6">
          <h3 className="text-blue-200 font-semibold mb-2">What happens next?</h3>
          <ul className="text-blue-300 text-sm space-y-1">
            <li>• Your limit order will execute automatically when the alert triggers</li>
            <li>• You can monitor your orders in the Dashboard tab</li>
            <li>• Make sure you have sufficient balance in your connected wallet</li>
          </ul>
        </div>

        {/* Spacer to push buttons to bottom */}
        <div className="flex-1"></div>

        {/* Actions */}
        <div className="space-y-3 mt-auto">
          <button
            onClick={() => {
              setCurrentPage('order');
              setOrderResult(null);
              setSellAmount('');
              setSellPercentage(0);
              setShowHelp(false);
            }}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            Create Another Order
          </button>
          <button
            onClick={onNavigateToDashboard}
            className="w-full border border-gray-600 hover:border-gray-500 text-gray-300 hover:text-white font-semibold py-3 rounded-lg transition-colors"
          >
            View My Orders
          </button>
        </div>
      </div>
    </div>
  );

  // Main render function
  return (
    <React.Fragment key="trading-interface">
      {currentPage === 'order' && renderOrderPage()}
      {currentPage === 'setup' && renderSetupPage()}
      {currentPage === 'success' && renderSuccessPage()}
    </React.Fragment>
  );
}