import { NextRequest, NextResponse } from 'next/server';

const ONEINCH_API_KEY = process.env['1INCH_API_KEY'];
const BASE_CHAIN_ID = 8453; // Base network

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const addresses = searchParams.get('addresses');
  const currency = searchParams.get('currency') || 'USD';

  if (!addresses) {
    return NextResponse.json(
      { error: 'Token addresses are required' },
      { status: 400 }
    );
  }

  try {
    const url = `https://api.1inch.dev/price/v1.1/${BASE_CHAIN_ID}/${addresses}?currency=${currency}`;
    
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
    console.log('1inch Price API response:', JSON.stringify(data, null, 2));
    console.log('Requested addresses:', addresses);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to fetch prices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch token prices from 1inch API' },
      { status: 500 }
    );
  }
}