import { useState, useEffect, useCallback } from 'react';

interface TokenPrices {
  [address: string]: string;
}

export function useTokenPrices(tokenAddresses: string[]) {
  const [prices, setPrices] = useState<TokenPrices>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create a stable string representation of addresses for dependency comparison
  const addressesKey = tokenAddresses.sort().join(',');

  const fetchPrices = useCallback(async () => {
    if (tokenAddresses.length === 0) {
      setPrices({});
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const addressesParam = tokenAddresses.join(',');
      const response = await fetch(`/api/price?addresses=${addressesParam}&currency=USD`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch prices: ${response.status}`);
      }

      const data = await response.json();
      console.log('Token prices:', data);
      setPrices(data);
    } catch (err) {
      console.error('Price fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch prices');
      setPrices({});
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addressesKey]); // Use stable string key instead of array

  useEffect(() => {
    fetchPrices();
  }, [fetchPrices]);

  const getTokenPrice = useCallback((tokenAddress: string): number => {
    const price = prices[tokenAddress] || prices[tokenAddress.toLowerCase()];
    return price ? parseFloat(price) : 0;
  }, [prices]);

  const calculateOutputAmount = useCallback((
    sellAmount: string,
    sellTokenDecimals: number,
    sellTokenPrice: number,
    buyTokenPrice: number,
    buyTokenDecimals: number
  ): string => {
    if (!sellAmount || sellTokenPrice <= 0 || buyTokenPrice <= 0) {
      return '0';
    }

    try {
      const sellAmountNum = parseFloat(sellAmount);
      const sellValueUSD = sellAmountNum * sellTokenPrice;
      const buyAmountNum = sellValueUSD / buyTokenPrice;
      
      return buyAmountNum.toFixed(Math.min(buyTokenDecimals, 6));
    } catch {
      return '0';
    }
  }, []);

  return {
    prices,
    loading,
    error,
    refetch: fetchPrices,
    getTokenPrice,
    calculateOutputAmount,
  };
}