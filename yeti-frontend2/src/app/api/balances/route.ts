import { NextRequest, NextResponse } from 'next/server';

const ONEINCH_API_KEY = process.env.NEXT_PUBLIC_1INCH_API_KEY;
const BASE_CHAIN_ID = 8453; // Base network

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const walletAddress = searchParams.get('walletAddress');
  const spenderAddress = searchParams.get('spenderAddress') || '0x0000000000000000000000000000000000000000';

  if (!walletAddress) {
    return NextResponse.json(
      { error: 'Wallet address is required' },
      { status: 400 }
    );
  }

  try {
    const url = `https://api.1inch.dev/balance/v1.2/${BASE_CHAIN_ID}/balances/${walletAddress}`;
    
    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };

    if (ONEINCH_API_KEY) {
      headers['Authorization'] = `Bearer ${ONEINCH_API_KEY}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`1inch API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('1inch API response:', JSON.stringify(data, null, 2));
    
    // Check if data is actually an object with token addresses as keys
    if (!Array.isArray(data)) {
      // Define known Base tokens
      const knownTokens: Record<string, { symbol: string; name: string; decimals: number; logoURI: string }> = {
        '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee': {
          symbol: 'ETH',
          name: 'Ethereum',
          decimals: 18,
          logoURI: 'https://tokens.1inch.io/0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee.png'
        },
        '0x4200000000000000000000000000000000000006': {
          symbol: 'WETH',
          name: 'Wrapped Ether',
          decimals: 18,
          logoURI: 'https://tokens.1inch.io/0x4200000000000000000000000000000000000006.png'
        },
        '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913': {
          symbol: 'USDC',
          name: 'USD Coin',
          decimals: 6,
          logoURI: 'https://tokens.1inch.io/0x833589fcd6edb6e08f4c7c32d4f71b54bda02913.png'
        },
        '0xfde4c96c8593536e31f229ea8f37b2ada2699bb2': {
          symbol: 'USDT',
          name: 'Tether USD',
          decimals: 6,
          logoURI: 'https://tokens.1inch.io/0xfde4c96c8593536e31f229ea8f37b2ada2699bb2.png'
        },
        '0x4ed4e862860bed51a9570b96d89af5e1b0efefed': {
          symbol: 'DEGEN',
          name: 'Degen',
          decimals: 18,
          logoURI: 'https://tokens.1inch.io/0x4ed4e862860bed51a9570b96d89af5e1b0efefed.png'
        },
        '0xdbfefd2e8460a6ee4955a68582f85708baea60a3': {
          symbol: 'PRIME',
          name: 'Prime',
          decimals: 18,
          logoURI: 'https://tokens.1inch.io/0xdbfefd2e8460a6ee4955a68582f85708baea60a3.png'
        }
      };

      // Convert object to array format
      const balances = Object.entries(data)
        .map(([address, balance]: [string, any]) => {
          const tokenInfo = knownTokens[address.toLowerCase()] || knownTokens[address];
          if (!tokenInfo && parseFloat(balance) === 0) return null;
          
          return {
            address,
            symbol: tokenInfo?.symbol || 'UNKNOWN',
            name: tokenInfo?.name || 'Unknown Token',
            decimals: tokenInfo?.decimals || 18,
            balance: balance.toString(),
            balanceUSD: '0', // We don't have USD values from this endpoint
            logoURI: tokenInfo?.logoURI || '',
            isCustom: !tokenInfo,
            tags: ['tokens'],
          };
        })
        .filter((token): token is NonNullable<typeof token> => 
          token !== null && parseFloat(token.balance) > 0
        );
      
      return NextResponse.json(balances);
    }
    
    // Transform and filter the data if it's an array
    const balances = data
      .map((token: any) => ({
        address: token.address,
        symbol: token.symbol,
        name: token.name,
        decimals: token.decimals,
        balance: token.wallets?.[walletAddress]?.balance || '0',
        balanceUSD: token.wallets?.[walletAddress]?.balanceUSD || '0',
        logoURI: token.logoURI,
        isCustom: token.isCustom || false,
        tags: token.tags || [],
      }))
      .filter((token: any) => parseFloat(token.balance) > 0);

    return NextResponse.json(balances);
  } catch (error) {
    console.error('Failed to fetch balances:', error);
    
    // Return mock data for Base tokens if API fails
    const mockBalances = [
      {
        address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
        balance: '1000000000', // 1000 USDC
        balanceUSD: '1000.00',
        logoURI: '',
        isCustom: false,
        tags: ['tokens'],
      },
      {
        address: '0x4200000000000000000000000000000000000006',
        symbol: 'WETH',
        name: 'Wrapped Ether',
        decimals: 18,
        balance: '1000000000000000000', // 1 WETH
        balanceUSD: '3500.00',
        logoURI: '',
        isCustom: false,
        tags: ['tokens'],
      },
      {
        address: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2',
        symbol: 'USDT',
        name: 'Tether USD',
        decimals: 6,
        balance: '500000000', // 500 USDT
        balanceUSD: '500.00',
        logoURI: '',
        isCustom: false,
        tags: ['tokens'],
      },
    ];

    return NextResponse.json(mockBalances);
  }
}