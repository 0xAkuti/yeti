import { NextRequest, NextResponse } from 'next/server';

const ONEINCH_API_KEY = process.env.NEXT_PUBLIC_1INCH_API_KEY;
const BASE_CHAIN_ID = 8453; // Base network

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  const resolvedParams = await params;
  const tokenAddress = resolvedParams.address;

  if (!tokenAddress) {
    return NextResponse.json(
      { error: 'Token address is required' },
      { status: 400 }
    );
  }

  try {
    const url = `https://api.1inch.dev/token/v1.2/${BASE_CHAIN_ID}/${tokenAddress}`;
    
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
    
    return NextResponse.json({
      address: data.address,
      symbol: data.symbol,
      name: data.name,
      decimals: data.decimals,
      logoURI: data.logoURI,
      tags: data.tags || [],
      isCustom: data.isCustom || false,
    });
  } catch (error) {
    console.error('Failed to fetch token info:', error);
    
    // Return null or error
    return NextResponse.json(
      { error: 'Failed to fetch token information' },
      { status: 500 }
    );
  }
}