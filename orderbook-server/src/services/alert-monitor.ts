import { JsonRpcProvider, Contract, EventLog } from 'ethers';
import { OrderRepository } from '../database/repository.js';
import { OrderStatus } from '../database/types.js';

export interface AlertMonitorConfig {
    providerUrl: string;
    webhookOracleAddress: string;
    webhookPredicateAddress: string;
    reconnectDelay?: number;
    maxReconnectAttempts?: number;
    pollInterval?: number; // For polling fallback
}

export interface AlertEvent {
    alertId: string;
    action: number;
    timestamp: number;
    blockNumber: number;
    transactionHash: string;
}

/**
 * AlertMonitor - Watches blockchain for AlertSubmitted events and updates order status
 * 
 * This service runs on the orderbook server and is responsible for:
 * 1. Monitoring AlertSubmitted events on the webhook oracle contract
 * 2. Validating predicates when alerts fire
 * 3. Updating order status from "pending" to "triggered" in the database
 * 4. Providing resilient connection with auto-reconnect
 */
export class AlertMonitor {
    private provider!: JsonRpcProvider;
    private webhookOracle!: Contract;
    private webhookPredicate!: Contract;
    private orderRepo: OrderRepository;
    private config: AlertMonitorConfig;
    
    private isRunning: boolean = false;
    private reconnectAttempts: number = 0;
    private pollIntervalId?: NodeJS.Timeout;

    constructor(config: AlertMonitorConfig, orderRepo: OrderRepository) {
        this.config = {
            reconnectDelay: 5000,        // 5 seconds
            maxReconnectAttempts: 10,    // Max reconnection attempts
            pollInterval: 30000,         // 30 seconds polling fallback
            ...config
        };
        
        this.orderRepo = orderRepo;
        this.initializeProvider();
    }

    private initializeProvider(): void {
        this.provider = new JsonRpcProvider(this.config.providerUrl);
        
        const webhookOracleAbi = [
            'function getAlert(bytes16 _alertId) external view returns (tuple(bytes16 alertId, uint32 timestamp, uint8 action))',
            'event AlertSubmitted(bytes16 indexed alertId, uint8 action, uint32 timestamp)'
        ];
        
        const webhookPredicateAbi = [
            'function checkPredicate(bytes16 alertId, uint8 expectedAction) external view returns (bool)'
        ];
        
        this.webhookOracle = new Contract(
            this.config.webhookOracleAddress, 
            webhookOracleAbi, 
            this.provider
        );
        
        this.webhookPredicate = new Contract(
            this.config.webhookPredicateAddress, 
            webhookPredicateAbi, 
            this.provider
        );
    }

    /**
     * Start monitoring for AlertSubmitted events
     */
    async start(): Promise<void> {
        if (this.isRunning) {
            console.log('🔍 AlertMonitor is already running');
            return;
        }

        console.log('🚀 Starting AlertMonitor...');
        console.log(`📡 Provider: ${this.config.providerUrl}`);
        console.log(`🏛️ Webhook Oracle: ${this.config.webhookOracleAddress}`);
        console.log(`⚖️ Webhook Predicate: ${this.config.webhookPredicateAddress}`);
        
        this.isRunning = true;
        
        try {
            // Test connection
            await this.provider.getBlockNumber();
            console.log('✅ Blockchain connection established');
            
            // Start event listening
            this.startEventListening();
            
            // Start polling fallback
            this.startPollingFallback();
            
            console.log('🔍 AlertMonitor started successfully');
            
        } catch (error) {
            console.error('❌ Failed to start AlertMonitor:', error);
            this.isRunning = false;
            throw error;
        }
    }

    /**
     * Stop monitoring
     */
    async stop(): Promise<void> {
        console.log('🛑 Stopping AlertMonitor...');
        
        this.isRunning = false;
        
        // Remove event listeners
        this.webhookOracle.removeAllListeners('AlertSubmitted');
        
        // Clear polling interval
        if (this.pollIntervalId) {
            clearInterval(this.pollIntervalId);
            this.pollIntervalId = undefined;
        }
        
        console.log('✅ AlertMonitor stopped');
    }

    /**
     * Start listening for AlertSubmitted events
     */
    private startEventListening(): void {
        console.log('👂 Starting event listening...');
        
        this.webhookOracle.on('AlertSubmitted', async (alertId: string, action: number, timestamp: number, event: EventLog) => {
            try {
                console.log(`🚨 AlertSubmitted event detected: ${alertId}, action: ${action}`);
                
                await this.processAlert({
                    alertId,
                    action,
                    timestamp,
                    blockNumber: event.blockNumber,
                    transactionHash: event.transactionHash
                });
                
            } catch (error) {
                console.error(`❌ Error processing alert ${alertId}:`, error);
            }
        });

        // Handle provider connection errors
        this.provider.on('error', async (error) => {
            console.error('🔌 Provider error:', error);
            await this.handleConnectionError();
        });
    }

    /**
     * Start polling fallback for missed events
     */
    private startPollingFallback(): void {
        if (!this.config.pollInterval) return;
        
        console.log(`🔄 Starting polling fallback (every ${this.config.pollInterval}ms)`);
        
        this.pollIntervalId = setInterval(async () => {
            try {
                await this.pollForMissedAlerts();
            } catch (error) {
                console.error('❌ Polling fallback error:', error);
            }
        }, this.config.pollInterval);
    }

    /**
     * Process an alert event
     */
    private async processAlert(alertEvent: AlertEvent): Promise<void> {
        const { alertId, action } = alertEvent;
        
        try {
            // Find orders with this alert ID
            const orders = await this.orderRepo.getOrdersByAlertId(alertId);
            
            if (orders.length === 0) {
                console.log(`ℹ️ No orders found for alert ${alertId}`);
                return;
            }
            
            console.log(`📋 Found ${orders.length} orders for alert ${alertId}`);
            
            // Process each order
            let triggeredCount = 0;
            
            for (const order of orders) {
                try {
                    // Skip if not in pending status
                    if (order.status !== OrderStatus.PENDING) {
                        console.log(`⏭️ Skipping order ${order.order_hash} - status: ${order.status}`);
                        continue;
                    }
                    
                    // Verify predicate
                    const predicateResult = await this.webhookPredicate.checkPredicate(alertId, action);
                    
                    if (predicateResult) {
                        // Update order status to triggered
                        const success = await this.orderRepo.updateOrder(order.order_hash, {
                            status: OrderStatus.TRIGGERED
                        });
                        
                        if (success) {
                            triggeredCount++;
                            console.log(`✅ Order ${order.order_hash} marked as triggered`);
                        } else {
                            console.error(`❌ Failed to update order ${order.order_hash}`);
                        }
                    } else {
                        console.log(`⚠️ Predicate check failed for order ${order.order_hash}`);
                    }
                    
                } catch (error) {
                    console.error(`❌ Error processing order ${order.order_hash}:`, error);
                }
            }
            
            console.log(`🎯 Alert ${alertId}: ${triggeredCount}/${orders.length} orders triggered`);
            
        } catch (error) {
            console.error(`❌ Error processing alert ${alertId}:`, error);
        }
    }

    /**
     * Handle connection errors and attempt reconnection
     */
    private async handleConnectionError(): Promise<void> {
        if (!this.isRunning) return;
        
        console.log(`🔄 Connection lost, attempting reconnection (${this.reconnectAttempts + 1}/${this.config.maxReconnectAttempts})...`);
        
        // Remove existing listeners
        this.webhookOracle.removeAllListeners('AlertSubmitted');
        this.provider.removeAllListeners('error');
        
        // Wait before reconnecting
        await new Promise(resolve => setTimeout(resolve, this.config.reconnectDelay));
        
        try {
            // Reinitialize provider and contracts
            this.initializeProvider();
            
            // Test connection
            await this.provider.getBlockNumber();
            
            // Restart event listening
            this.startEventListening();
            
            console.log('✅ Reconnection successful');
            this.reconnectAttempts = 0;
            
        } catch (error) {
            this.reconnectAttempts++;
            
            if (this.reconnectAttempts >= this.config.maxReconnectAttempts!) {
                console.error('💥 Max reconnection attempts reached, stopping AlertMonitor');
                await this.stop();
            } else {
                console.error(`❌ Reconnection failed, will retry in ${this.config.reconnectDelay}ms`);
                setTimeout(() => this.handleConnectionError(), this.config.reconnectDelay);
            }
        }
    }

    /**
     * Poll for missed alerts (fallback mechanism)
     */
    private async pollForMissedAlerts(): Promise<void> {
        try {
            // Get orders that are still pending and might have missed alert events
            const pendingOrders = await this.orderRepo.getOrders({
                status: OrderStatus.PENDING,
                limit: 100
            });
            
            if (pendingOrders.orders.length === 0) {
                return;
            }
            
            // Group orders by alert_id for efficient checking
            const alertGroups = new Map<string, typeof pendingOrders.orders>();
            
            for (const order of pendingOrders.orders) {
                if (!alertGroups.has(order.alert_id)) {
                    alertGroups.set(order.alert_id, []);
                }
                alertGroups.get(order.alert_id)!.push(order);
            }
            
            // Check each alert group
            for (const [alertId, orders] of alertGroups) {
                try {
                    // Get alert data from contract
                    const alertData = await this.webhookOracle.getAlert(alertId);
                    
                    // If alert has fired (timestamp > 0), process it
                    if (Number(alertData.timestamp) > 0) {
                        console.log(`🔄 Polling detected fired alert: ${alertId}`);
                        
                        await this.processAlert({
                            alertId: alertData.alertId,
                            action: Number(alertData.action),
                            timestamp: Number(alertData.timestamp),
                            blockNumber: 0, // Not available from polling
                            transactionHash: '0x0' // Not available from polling
                        });
                    }
                    
                } catch (error) {
                    // Alert doesn't exist yet or other error - this is normal
                    // console.log(`Alert ${alertId} not fired yet or error:`, error.message);
                }
            }
            
        } catch (error) {
            console.error('❌ Error in polling fallback:', error);
        }
    }

    /**
     * Get monitor status
     */
    getStatus(): {
        isRunning: boolean;
        reconnectAttempts: number;
        providerUrl: string;
        contractAddresses: {
            webhookOracle: string;
            webhookPredicate: string;
        };
    } {
        return {
            isRunning: this.isRunning,
            reconnectAttempts: this.reconnectAttempts,
            providerUrl: this.config.providerUrl,
            contractAddresses: {
                webhookOracle: this.config.webhookOracleAddress,
                webhookPredicate: this.config.webhookPredicateAddress
            }
        };
    }

    /**
     * Get current block number (for health check)
     */
    async getCurrentBlock(): Promise<number> {
        return await this.provider.getBlockNumber();
    }
}