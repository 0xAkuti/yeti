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

// ETH/USD oracle on Base (Chainlink)
const ETH_USD_ORACLE = process.env.NEXT_PUBLIC_ETH_USD_ORACLE_ADDRESS || '0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70';

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
        oracle: ETH_USD_ORACLE
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