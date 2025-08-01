export interface TokenBalance {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  balance: string;
  balanceUSD: string;
  logoURI?: string;
  tags: string[];
  isCustom: boolean;
}

export interface TokenInfo {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
  tags: string[];
  isCustom: boolean;
}

export class OneInchService {
  // Get user token balances via backend API
  async getUserBalances(walletAddress: string, spenderAddress?: string): Promise<TokenBalance[]> {
    try {
      const params = new URLSearchParams({
        walletAddress,
      });

      if (spenderAddress) {
        params.append('spenderAddress', spenderAddress);
      }

      const response = await fetch(`/api/balances?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get user balances:', error);
      return [];
    }
  }

  // Get token information via backend API
  async getTokenInfo(tokenAddress: string): Promise<TokenInfo | null> {
    try {
      const response = await fetch(`/api/token/${tokenAddress}`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get token info:', error);
      return null;
    }
  }

  // Get balance for a specific token
  async getTokenBalance(walletAddress: string, tokenAddress: string): Promise<TokenBalance | null> {
    const balances = await this.getUserBalances(walletAddress);
    return balances.find(token => 
      token.address.toLowerCase() === tokenAddress.toLowerCase()
    ) || null;
  }

  // Format balance for display
  static formatBalance(balance: string, decimals: number): string {
    const balanceNum = parseFloat(balance) / Math.pow(10, decimals);
    if (balanceNum === 0) return '0.0000';
    if (balanceNum < 0.0001) return '<0.0001';
    return balanceNum.toFixed(4);
  }

  // Format USD value
  static formatUSD(value: string): string {
    const num = parseFloat(value);
    if (num === 0) return '$0.00';
    if (num < 0.01) return '<$0.01';
    return `$${num.toFixed(2)}`;
  }
}

// Export singleton instance
export const oneInchService = new OneInchService();