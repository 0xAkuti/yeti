import { useState, useEffect, useCallback } from 'react';
import { useWallets, usePrivy } from '@privy-io/react-auth';
import { OneInchService, TokenBalance } from '@/lib/1inch';

const oneInchService = new OneInchService();

export function useTokenBalances() {
  const { ready, authenticated } = usePrivy();
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Always call useWallets but handle when not ready
  const { wallets } = useWallets();
  
  const walletAddress = ready && authenticated && wallets.length > 0 ? wallets[0]?.address : undefined;

  console.log('useTokenBalances:', { ready, authenticated, walletAddress, balancesCount: balances.length });

  const fetchBalances = useCallback(async () => {
    if (!walletAddress || !ready || !authenticated) {
      setBalances([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Fetching balances for:', walletAddress);
      const userBalances = await oneInchService.getUserBalances(walletAddress);
      console.log('Fetched balances:', userBalances);
      setBalances(userBalances);
    } catch (err) {
      console.error('Balance fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch balances');
      setBalances([]);
    } finally {
      setLoading(false);
    }
  }, [walletAddress, ready, authenticated]);

  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  const getTokenBalance = useCallback((tokenAddress: string): TokenBalance | null => {
    return balances.find(token => 
      token.address.toLowerCase() === tokenAddress.toLowerCase()
    ) || null;
  }, [balances]);

  const formatBalance = useCallback((balance: string, decimals: number): string => {
    return OneInchService.formatBalance(balance, decimals);
  }, []);

  const formatUSD = useCallback((value: string): string => {
    return OneInchService.formatUSD(value);
  }, []);

  return {
    balances,
    loading,
    error,
    refetch: fetchBalances,
    getTokenBalance,
    formatBalance,
    formatUSD,
  };
}