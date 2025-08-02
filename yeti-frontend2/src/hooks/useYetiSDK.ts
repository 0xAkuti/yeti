import { useState, useCallback, useMemo } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { createWalletClient, custom, parseUnits } from 'viem';
import { base } from 'viem/chains';
import { YetiSDK, ConditionalOrderParams } from 'yeti-order-manager';
import { JsonRpcProvider } from 'ethers';

interface ContractAddresses {
  webhookOracle: string;
  webhookPredicate: string;
  chainlinkCalculator: string;
  limitOrderProtocol: string;
}

// Load configuration from environment variables
const WEBHOOK_SERVER_URL = process.env.NEXT_PUBLIC_WEBHOOK_SERVER_URL || 'http://localhost:3001';
const ORDERBOOK_SERVER_URL = process.env.NEXT_PUBLIC_ORDERBOOK_SERVER_URL || 'http://localhost:3002';

const BASE_CONTRACTS: ContractAddresses = {
  webhookOracle: process.env.NEXT_PUBLIC_WEBHOOK_ORACLE_ADDRESS || '0x1234567890123456789012345678901234567890',
  webhookPredicate: process.env.NEXT_PUBLIC_WEBHOOK_PREDICATE_ADDRESS || '0x1234567890123456789012345678901234567891',
  chainlinkCalculator: process.env.NEXT_PUBLIC_CHAINLINK_CALCULATOR_ADDRESS || '0x1234567890123456789012345678901234567892',
  limitOrderProtocol: process.env.NEXT_PUBLIC_LIMIT_ORDER_PROTOCOL_ADDRESS || '0x1111111254EEB25477B68fb85Ed929f73A960582'
};

// Base network oracle addresses
const BASE_ORACLES: Record<string, string> = {
  'ETH/USD': '0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70',
  'USDC/USD': '0x7e860098F58bBFC8648a4311b374B1D669a2bc6B',
  'USDT/USD': '0xf19d560eB8d2ADf07BD6D13ed03e1D11215721F9',
  'cbBTC/USD': '0x07DA0E54543a844a80ABE69c8A12F22B3aA59f9D'
};

// Base network token addresses
const BASE_TOKENS: Record<string, string> = {
  '0x4200000000000000000000000000000000000006': 'ETH', // WETH on Base
  '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913': 'USDC', // USDC on Base
  '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2': 'USDT', // USDT on Base
  '0xcbB7C0000aB88B473b1f5aFd9ef808440eeD33Bf': 'cbBTC', // cbBTC on Base
};

/**
 * Select appropriate Chainlink oracle based on token pair
 */
function selectOracle(sellToken: string, buyToken: string): string {
  // Get token symbols
  const sellSymbol = BASE_TOKENS[sellToken.toLowerCase()] || BASE_TOKENS[sellToken];
  const buySymbol = BASE_TOKENS[buyToken.toLowerCase()] || BASE_TOKENS[buyToken];

  // For trading pairs, determine which oracle to use
  // If one token is ETH and the other has a USD oracle, use the non-ETH oracle
  if (sellSymbol === 'ETH' && buySymbol && BASE_ORACLES[`${buySymbol}/USD`]) {
    return BASE_ORACLES[`${buySymbol}/USD`];
  }
  if (buySymbol === 'ETH' && sellSymbol && BASE_ORACLES[`${sellSymbol}/USD`]) {
    return BASE_ORACLES[`${sellSymbol}/USD`];
  }

  // Default to ETH/USD for ETH pairs or unknown tokens
  return BASE_ORACLES['ETH/USD'];
}

// Configuration validation
function validateConfiguration() {
  const errors: string[] = [];
  
  if (WEBHOOK_SERVER_URL.includes('localhost') && typeof window !== 'undefined') {
    console.warn('⚠️ Using localhost webhook server. Make sure it\'s running on', WEBHOOK_SERVER_URL);
  }
  
  if (ORDERBOOK_SERVER_URL.includes('localhost') && typeof window !== 'undefined') {
    console.warn('⚠️ Using localhost orderbook server. Make sure it\'s running on', ORDERBOOK_SERVER_URL);
  }
  
  // Check if we're using default contract addresses (which need deployment)
  if (BASE_CONTRACTS.webhookOracle.startsWith('0x1234567890')) {
    console.warn('⚠️ Using default webhook oracle address. Deploy contracts and update NEXT_PUBLIC_WEBHOOK_ORACLE_ADDRESS');
  }
  
  if (errors.length > 0) {
    console.error('❌ Configuration errors:', errors);
    return false;
  }
  
  return true;
}

export interface YetiOrderParams {
  sellToken: string;
  sellAmount: string;
  buyToken: string;
  action: 'LONG' | 'SHORT';
}

export function useYetiSDK() {
  const { ready, authenticated } = usePrivy();
  const { wallets } = useWallets();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connectedWallet = wallets[0];

  // Initialize Yeti SDK
  const yetiSDK = useMemo(() => {
    if (!ready) return null;

    // Validate configuration
    if (!validateConfiguration()) {
      return null;
    }

    const provider = new JsonRpcProvider('https://mainnet.base.org');
    
    console.log('🚀 Initializing Yeti SDK with configuration:', {
      webhookServerUrl: WEBHOOK_SERVER_URL,
      orderbookServerUrl: ORDERBOOK_SERVER_URL,
      contracts: BASE_CONTRACTS
    });
    
    return new YetiSDK({
      provider,
      webhookServerUrl: WEBHOOK_SERVER_URL,
      orderbookServerUrl: ORDERBOOK_SERVER_URL,
      contracts: BASE_CONTRACTS
    });
  }, [ready]);

  // Create and sign limit order
  const createLimitOrder = useCallback(async (params: YetiOrderParams) => {
    if (!yetiSDK || !connectedWallet || !authenticated) {
      throw new Error('SDK not initialized or wallet not connected');
    }

    setLoading(true);
    setError(null);

    try {
      // Select appropriate oracle for the token pair
      const selectedOracle = selectOracle(params.sellToken, params.buyToken);
      console.log(`Selected oracle for ${params.sellToken} -> ${params.buyToken}:`, selectedOracle);

      // Build order parameters
      const orderParams: ConditionalOrderParams = {
        sell: {
          token: params.sellToken,
          amount: params.sellAmount
        },
        buy: {
          token: params.buyToken
        },
        action: params.action,
        oracle: selectedOracle
      };

      // Create the conditional order (uses proxy URLs automatically)
      const { webhook, orderData } = await yetiSDK.createConditionalOrder(
        orderParams,
        connectedWallet.address
      );

      // Get order for signing
      const signingData = yetiSDK.getOrderForSigning(orderData, base.id);

      // Get wallet provider for signing
      const provider = await connectedWallet.getEthereumProvider();
      const walletClient = createWalletClient({
        account: connectedWallet.address as `0x${string}`,
        chain: base,
        transport: custom(provider)
      });

      // Sign the typed data
      const signature = await walletClient.signTypedData({
        domain: signingData.typedData.domain,
        types: signingData.typedData.types,
        primaryType: 'Order',
        message: signingData.typedData.message
      });

      console.log('Order signed:', {
        orderHash: signingData.orderHash,
        signature,
        webhook: webhook.webhookUrl,
        alertId: webhook.alertId
      });

      return {
        orderData,
        signature,
        webhook,
        orderHash: signingData.orderHash
      };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create limit order';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [yetiSDK, connectedWallet, authenticated]);

  // Submit signed order to orderbook
  const submitOrder = useCallback(async (orderData: any, signature: string, webhookId: string) => {
    if (!yetiSDK) {
      throw new Error('SDK not initialized');
    }

    try {
      // Uses proxy URL automatically from environment config
      const orderId = await yetiSDK.orderBuilder.submitToOrderbook(
        orderData,
        signature,
        webhookId,
        base.id
      );

      console.log('Order submitted to orderbook:', orderId);
      return orderId;
    } catch (err) {
      console.error('Failed to submit order:', err);
      throw err;
    }
  }, [yetiSDK]);

  // Get user orders from orderbook
  const getUserOrders = useCallback(async (userAddress: string) => {
    if (!yetiSDK) {
      throw new Error('SDK not initialized');
    }

    try {
      const orders = await yetiSDK.orderbook.getOrders({
        maker: userAddress,
        chain_id: base.id
      });

      console.log('Retrieved user orders:', orders);
      return orders;
    } catch (err) {
      console.error('Failed to get user orders:', err);
      throw err;
    }
  }, [yetiSDK]);

  // Cancel order on-chain
  const cancelOrder = useCallback(async (orderHash: string, makerTraits: string) => {
    if (!connectedWallet || !authenticated) {
      throw new Error('Wallet not connected or not authenticated');
    }

    setLoading(true);
    setError(null);

    try {
      // Get wallet provider for transaction
      const provider = await connectedWallet.getEthereumProvider();
      const walletClient = createWalletClient({
        account: connectedWallet.address as `0x${string}`,
        chain: base,
        transport: custom(provider)
      });

      // Prepare the cancel order transaction
      const limitOrderProtocolAddress = BASE_CONTRACTS.limitOrderProtocol;
      
      // ABI for cancelOrder function
      const cancelOrderABI = [
        {
          name: 'cancelOrder',
          type: 'function',
          inputs: [
            { name: 'makerTraits', type: 'uint256' },
            { name: 'orderHash', type: 'bytes32' }
          ],
          outputs: []
        }
      ] as const;

      // Send the transaction
      const txHash = await walletClient.writeContract({
        address: limitOrderProtocolAddress as `0x${string}`,
        abi: cancelOrderABI,
        functionName: 'cancelOrder',
        args: [BigInt(makerTraits), orderHash as `0x${string}`]
      });

      console.log('Cancel order transaction sent:', txHash);

      // Update order status in orderbook (mark as cancelled)
      if (yetiSDK) {
        try {
          await yetiSDK.orderbook.updateOrder(orderHash, { status: 'cancelled' as any });
          console.log('Order status updated to cancelled in orderbook');
        } catch (err) {
          console.warn('Failed to update order status in orderbook:', err);
        }
      }

      return txHash;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel order';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [connectedWallet, authenticated, yetiSDK]);

  return {
    yetiSDK,
    loading,
    error,
    createLimitOrder,
    submitOrder,
    getUserOrders,
    cancelOrder,
    isReady: ready && authenticated && !!connectedWallet
  };
}