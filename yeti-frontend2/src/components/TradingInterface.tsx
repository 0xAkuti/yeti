'use client';

import { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useWallets } from '@privy-io/react-auth';
import { ArrowUpDown, Settings, RefreshCw } from 'lucide-react';
import { BASE_TOKENS, Token } from '@/lib/tokens';
import { AssetSelector } from './AssetSelector';
import { ConnectButton } from './ConnectButton';
import { TradingViewSetup } from './TradingViewSetup';
import { useTokenBalances } from '@/hooks/useTokenBalances';

export function TradingInterface() {
  const { authenticated, ready } = usePrivy();
  const { wallets } = useWallets();
  const { balances, loading: balancesLoading, getTokenBalance, formatBalance, formatUSD, refetch } = useTokenBalances();
  
  const [sellToken, setSellToken] = useState<Token>(BASE_TOKENS[0]); // USDC
  const [buyToken, setBuyToken] = useState<Token>(BASE_TOKENS[2]); // WETH
  const [sellAmount, setSellAmount] = useState<string>('');
  const [sellPercentage, setSellPercentage] = useState<number>(0);
  const [isLimitOrder, setIsLimitOrder] = useState(true);
  const [showTradingViewSetup, setShowTradingViewSetup] = useState(false);

  // Get the connected wallet
  const connectedWallet = wallets[0];

  // Get token balance
  const sellTokenBalance = getTokenBalance(sellToken.address);

  const handleCreateLimitOrder = () => {
    // TODO: Integrate Yeti SDK to create limit order
    setShowTradingViewSetup(true);
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

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex space-x-4">
            <button
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                !isLimitOrder
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
              onClick={() => setIsLimitOrder(false)}
            >
              Swap
            </button>
            <button
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isLimitOrder
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
              onClick={() => setIsLimitOrder(true)}
            >
              Limit
            </button>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={refetch}
              disabled={balancesLoading}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
              title="Refresh balances"
            >
              <RefreshCw size={20} className={balancesLoading ? 'animate-spin' : ''} />
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
              <>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm text-gray-500">
                    {formatUSD(sellTokenBalance.balanceUSD)}
                  </span>
                  <button
                    onClick={handleMaxClick}
                    className="text-sm text-blue-400 hover:text-blue-300"
                  >
                    Max
                  </button>
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
              </>
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
            <span className="text-sm text-gray-400">You receive</span>
          </div>
          <div className="bg-gray-700 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="text-2xl font-semibold text-gray-500 flex-1 min-w-0">
                {sellAmount && isLimitOrder ? '~' : ''}0
              </div>
              <div className="flex-shrink-0">
                <AssetSelector
                  selectedToken={buyToken}
                  onSelect={setBuyToken}
                  tokens={BASE_TOKENS.filter(token => token.address !== sellToken.address)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Connect/Trade Button */}
        {!ready ? (
          <button className="w-full bg-gray-600 text-white font-semibold py-4 rounded-xl">
            Loading...
          </button>
        ) : !authenticated ? (
          <ConnectButton />
        ) : (
          <button
            onClick={isLimitOrder ? handleCreateLimitOrder : undefined}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-xl transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
            disabled={!sellAmount || parseFloat(sellAmount) <= 0}
          >
            {isLimitOrder ? 'Create Limit Order' : 'Swap'}
          </button>
        )}

        {/* Limit Order Info */}
        {isLimitOrder && (
          <div className="mt-4 p-4 bg-blue-900/20 border border-blue-800 rounded-xl">
            <p className="text-sm text-blue-200">
              🔗 This will create a TradingView-triggered limit order using Yeti
            </p>
          </div>
        )}
      </div>

      {/* TradingView Setup Modal */}
      <TradingViewSetup
        isOpen={showTradingViewSetup}
        onClose={() => setShowTradingViewSetup(false)}
      />
    </div>
  );
}