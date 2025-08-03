'use client';

import { useState } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { Token } from '@/lib/tokens';
import { useTokenBalances } from '@/hooks/useTokenBalances';
import { TokenIcon } from './TokenIcon';

interface AssetSelectorProps {
  selectedToken: Token;
  onSelect: (token: Token) => void;
  tokens: Token[];
}

export function AssetSelector({ selectedToken, onSelect, tokens }: AssetSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { getTokenBalance, formatBalance, formatUSD } = useTokenBalances();

  const handleSelect = (token: Token) => {
    onSelect(token);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-500 px-3 py-2 rounded-lg transition-colors"
      >
        {selectedToken.logoURI && (
          <TokenIcon src={selectedToken.logoURI} symbol={selectedToken.symbol} size={20} />
        )}
        <span className="font-semibold">{selectedToken.symbol}</span>
        <ChevronDown size={16} />
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-2xl w-full max-w-md border border-gray-700">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h3 className="text-lg font-semibold">Select a token</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Token List */}
            <div className="p-4">
              <div className="space-y-2">
                {tokens.map((token) => (
                  <button
                    key={token.address}
                    onClick={() => handleSelect(token)}
                    className="w-full flex items-center space-x-3 p-3 hover:bg-gray-700 rounded-xl transition-colors text-left"
                  >
                    {/* Token Icon */}
                    <TokenIcon src={token.logoURI || ''} symbol={token.symbol} size={32} />
                    
                    {/* Token Info */}
                    <div className="flex-1">
                      <div className="font-semibold">{token.symbol}</div>
                      <div className="text-sm text-gray-400">{token.name}</div>
                    </div>

                    {/* Balance Info */}
                    <div className="text-right">
                      {(() => {
                        const balance = getTokenBalance(token.address);
                        return balance ? (
                          <>
                            <div className="font-semibold">
                              {formatBalance(balance.balance, balance.decimals)}
                            </div>
                            <div className="text-sm text-gray-400">
                              {formatUSD(balance.balanceUSD)}
                            </div>
                          </>
                        ) : (
                          <div className="text-sm text-gray-500">0</div>
                        );
                      })()}
                    </div>

                    {/* Selected Indicator */}
                    {selectedToken.address === token.address && (
                      <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center ml-2">
                        <div className="w-2 h-2 bg-white rounded-full" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}