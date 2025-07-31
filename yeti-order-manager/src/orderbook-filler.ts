import { JsonRpcProvider, Wallet } from 'ethers';
import { OrderbookClient, StoredOrder, OrderStatus } from './orderbook/index.js';
import { OrderFiller } from './order-filler.js';
import { ContractAddresses } from './types.js';
import { LimitOrder } from '@1inch/limit-order-sdk';

/**
 * OrderbookFiller - Monitors orderbook for triggered orders and fills them
 * 
 * This class is responsible for:
 * 1. Querying the orderbook for orders in "triggered" status
 * 2. Filling those orders using the existing OrderFiller
 * 3. Recording fills back to the orderbook
 * 
 * Note: The orderbook server itself is responsible for updating order status
 * from "pending" to "triggered" when it detects AlertSubmitted events on-chain.
 */
export class OrderbookFiller {
    private orderbook: OrderbookClient;
    private orderFiller: OrderFiller;
    private isRunning: boolean = false;
    private intervalId?: NodeJS.Timeout;

    constructor(
        orderbook: OrderbookClient,
        provider: JsonRpcProvider,
        signer: Wallet,
        contracts: ContractAddresses
    ) {
        this.orderbook = orderbook;
        this.orderFiller = new OrderFiller(provider, signer, contracts);
    }

    /**
     * Start monitoring the orderbook for triggered orders and fill them
     */
    async startFilling(options: {
        pollInterval?: number; // milliseconds
        batchSize?: number;    // orders to process per batch
        maker?: string;        // only fill orders from specific maker
    } = {}): Promise<void> {
        if (this.isRunning) {
            console.log('OrderbookFiller is already running');
            return;
        }

        const {
            pollInterval = 5000,  // 5 seconds default
            batchSize = 10,
            maker
        } = options;

        this.isRunning = true;
        console.log('🤖 Starting orderbook order filling...');

        this.intervalId = setInterval(async () => {
            try {
                await this.processTriggteredOrders(batchSize, maker);
            } catch (error) {
                console.error('Error processing triggered orders:', error);
            }
        }, pollInterval);
    }

    /**
     * Stop the order filling process
     */
    stopFilling(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = undefined;
        }
        this.isRunning = false;
        console.log('🛑 Orderbook order filling stopped');
    }

    /**
     * Process triggered orders from the orderbook
     */
    private async processTriggteredOrders(batchSize: number, maker?: string): Promise<void> {
        // Query orderbook for triggered orders
        const response = await this.orderbook.getOrders({
            status: OrderStatus.TRIGGERED,
            maker,
            limit: batchSize,
            order_by: 'created_at',
            order_direction: 'ASC'
        });

        const triggeredOrders = response.data || [];
        
        if (triggeredOrders.length === 0) {
            return; // No triggered orders to process
        }

        console.log(`📋 Found ${triggeredOrders.length} triggered orders to fill`);

        // Process each order
        for (const storedOrder of triggeredOrders) {
            try {
                await this.fillStoredOrder(storedOrder);
            } catch (error) {
                console.error(`Failed to fill order ${storedOrder.order_hash}:`, error);
                
                // Update order status to failed or keep as triggered for retry
                // depending on the error type
                await this.handleFillError(storedOrder, error as Error);
            }
        }
    }

    /**
     * Fill a specific stored order from the orderbook
     */
    private async fillStoredOrder(storedOrder: StoredOrder): Promise<void> {
        console.log(`⚡ Attempting to fill order: ${storedOrder.order_hash}`);

        // Reconstruct LimitOrder from stored data
        const limitOrder = this.reconstructLimitOrder(storedOrder);

        // Fill the order
        const txHash = await this.orderFiller.fillOrder({
            order: limitOrder,
            signature: storedOrder.signature
        });

        console.log(`✅ Order filled successfully: ${txHash}`);

        // Record the fill in the orderbook
        // Note: In a real implementation, you'd want to get actual fill details from the transaction
        await this.orderbook.recordOrderFill(storedOrder.order_hash, {
            taker: await this.orderFiller.getSigner().getAddress(),
            filled_amount: storedOrder.making_amount, // Full fill for simplicity
            transaction_hash: txHash,
            block_number: await this.orderFiller.getProvider().getBlockNumber(),
            gas_used: 150000 // Estimated, should be actual from receipt
        });

        // Update order status to filled
        await this.orderbook.updateOrder(storedOrder.order_hash, {
            status: OrderStatus.FILLED,
            filled_amount: storedOrder.making_amount,
            remaining_amount: '0'
        });

        console.log(`📝 Order ${storedOrder.order_hash} marked as filled`);
    }

    /**
     * Reconstruct a LimitOrder from stored orderbook data
     */
    private reconstructLimitOrder(storedOrder: StoredOrder): LimitOrder {
        // This is a simplified reconstruction
        // In a real implementation, you'd need to properly reconstruct
        // the LimitOrder with all its extensions and traits
        
        // For now, we'll assume the OrderFiller can work with the basic order data
        // The actual implementation would depend on how orders are stored and reconstructed
        throw new Error('LimitOrder reconstruction not implemented - needs proper extension handling');
    }

    /**
     * Handle errors during order filling
     */
    private async handleFillError(storedOrder: StoredOrder, error: Error): Promise<void> {
        console.error(`❌ Fill failed for order ${storedOrder.order_hash}: ${error.message}`);

        // Determine if this is a permanent failure or temporary
        if (error.message.includes('insufficient balance') || 
            error.message.includes('expired') ||
            error.message.includes('already filled')) {
            
            // Permanent failure - mark as cancelled
            await this.orderbook.updateOrder(storedOrder.order_hash, {
                status: OrderStatus.CANCELLED
            });
            
            console.log(`📝 Order ${storedOrder.order_hash} marked as cancelled due to permanent failure`);
        }
        
        // For temporary failures, leave status as triggered for retry
    }

    /**
     * Fill a specific order by hash (manual trigger)
     */
    async fillOrderByHash(orderHash: string): Promise<string | null> {
        const storedOrder = await this.orderbook.getOrderByHash(orderHash);
        
        if (!storedOrder) {
            throw new Error(`Order not found: ${orderHash}`);
        }

        if (storedOrder.status !== OrderStatus.TRIGGERED) {
            throw new Error(`Order is not in triggered status: ${storedOrder.status}`);
        }

        await this.fillStoredOrder(storedOrder);
        return `Order ${orderHash} filled successfully`;
    }

    /**
     * Get status of the order filler
     */
    getStatus(): { running: boolean; intervalId?: NodeJS.Timeout } {
        return {
            running: this.isRunning,
            intervalId: this.intervalId
        };
    }
}