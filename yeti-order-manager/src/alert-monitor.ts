import { JsonRpcProvider, Contract, EventLog } from 'ethers';
import { AlertEvent, Action, ContractAddresses } from './types.js';
import { OrderbookClient } from './orderbook/index.js';

export class AlertMonitor {
    private provider: JsonRpcProvider;
    private contracts: ContractAddresses;
    private webhookOracle: Contract;
    private webhookPredicate: Contract;
    private orderbookClient?: OrderbookClient;

    constructor(provider: JsonRpcProvider, contracts: ContractAddresses, orderbookClient?: OrderbookClient) {
        this.provider = provider;
        this.contracts = contracts;
        this.orderbookClient = orderbookClient;
        
        const webhookOracleAbi = [
            'function getAlert(bytes16 _alertId) external view returns (tuple(bytes16 alertId, uint32 timestamp, uint8 action))',
            'event AlertSubmitted(bytes16 indexed alertId, uint8 action, uint32 timestamp)'
        ];
        
        const webhookPredicateAbi = [
            'function checkPredicate(bytes16 alertId, uint8 expectedAction) external view returns (bool)'
        ];
        
        this.webhookOracle = new Contract(contracts.webhookOracle, webhookOracleAbi, provider);
        this.webhookPredicate = new Contract(contracts.webhookPredicate, webhookPredicateAbi, provider);
    }

    async watchAlert(alertId: string, expectedAction: Action = Action.LONG): Promise<AlertEvent> {
        return new Promise((resolve, reject) => {
            let resolved = false;
            
            // Listen for AlertSubmitted events
            this.webhookOracle.on('AlertSubmitted', async (eventAlertId: string, action: number, timestamp: number, event: EventLog) => {
                if (resolved) return;
                
                // Check if this is our alert ID
                const receivedAlertId = eventAlertId.toString().toLowerCase();
                const expectedAlertId = alertId.toLowerCase();
                
                if (receivedAlertId === expectedAlertId && Number(action) === expectedAction) {
                    try {
                        // Verify predicate passes
                        const predicateResult = await this.webhookPredicate.checkPredicate(alertId, expectedAction);
                        
                        if (predicateResult) {
                            resolved = true;
                            this.webhookOracle.removeAllListeners('AlertSubmitted');
                            
                            // Trigger orderbook orders if available
                            await this.triggerOrderbookOrders(eventAlertId);
                            
                            resolve({
                                alertId: eventAlertId,
                                action: Number(action) as Action,
                                timestamp: Number(timestamp),
                                blockNumber: event.blockNumber,
                                transactionHash: event.transactionHash
                            });
                        }
                    } catch (error) {
                        console.error('Predicate check failed:', error);
                    }
                }
            });
            
            // Polling fallback in case events are missed
            const pollInterval = setInterval(async () => {
                if (resolved) {
                    clearInterval(pollInterval);
                    return;
                }
                
                try {
                    const alertData = await this.webhookOracle.getAlert(alertId);
                    if (Number(alertData.action) === expectedAction && Number(alertData.timestamp) > 0) {
                        clearInterval(pollInterval);
                        
                        // Verify predicate
                        const predicateResult = await this.webhookPredicate.checkPredicate(alertId, expectedAction);
                        
                        if (predicateResult && !resolved) {
                            resolved = true;
                            this.webhookOracle.removeAllListeners('AlertSubmitted');
                            
                            // Trigger orderbook orders if available
                            await this.triggerOrderbookOrders(alertData.alertId);
                            
                            resolve({
                                alertId: alertData.alertId,
                                action: Number(alertData.action) as Action,
                                timestamp: Number(alertData.timestamp)
                            });
                        }
                    }
                } catch (error) {
                    // Alert doesn't exist yet, continue polling
                }
            }, 3000);
            
            // Timeout after 5 minutes
            setTimeout(() => {
                if (!resolved) {
                    clearInterval(pollInterval);
                    this.webhookOracle.removeAllListeners('AlertSubmitted');
                    reject(new Error('Timeout waiting for alert after 5 minutes'));
                }
            }, 300000);
        });
    }

    async checkPredicate(alertId: string, expectedAction: Action): Promise<boolean> {
        try {
            return await this.webhookPredicate.checkPredicate(alertId, expectedAction);
        } catch (error) {
            console.error('Predicate check failed:', error);
            return false;
        }
    }

    async getAlert(alertId: string) {
        try {
            const alertData = await this.webhookOracle.getAlert(alertId);
            return {
                alertId: alertData.alertId,
                action: Number(alertData.action) as Action,
                timestamp: Number(alertData.timestamp)
            };
        } catch (error) {
            throw new Error(`Failed to get alert ${alertId}: ${error}`);
        }
    }

    /**
     * Trigger all orders in the orderbook for a given alert ID
     */
    private async triggerOrderbookOrders(alertId: string): Promise<void> {
        if (!this.orderbookClient) {
            console.log('No orderbook client available, skipping order triggering');
            return;
        }

        try {
            const result = await this.orderbookClient.triggerOrdersByAlert(alertId);
            console.log(`📦 Triggered ${result.updated_count} orders in orderbook for alert ${alertId}`);
        } catch (error) {
            console.error(`Failed to trigger orderbook orders for alert ${alertId}:`, error);
        }
    }

    /**
     * Set orderbook client for dependency injection
     */
    setOrderbookClient(client: OrderbookClient): void {
        this.orderbookClient = client;
    }

    /**
     * Check if orderbook integration is available
     */
    hasOrderbookIntegration(): boolean {
        return !!this.orderbookClient;
    }

    /**
     * Watch for alerts and automatically trigger orderbook orders
     * This is useful for backend services that want to automatically
     * trigger orders when alerts fire
     */
    async startOrderbookMonitoring(alertIds: string[]): Promise<void> {
        if (!this.orderbookClient) {
            throw new Error('OrderbookClient not available. Cannot start orderbook monitoring.');
        }

        console.log(`🔍 Starting orderbook monitoring for ${alertIds.length} alerts...`);

        // Listen for any AlertSubmitted events
        this.webhookOracle.on('AlertSubmitted', async (eventAlertId: string, action: number, timestamp: number, event: EventLog) => {
            const alertId = eventAlertId.toString().toLowerCase();
            
            // Check if this is one of our monitored alerts
            if (alertIds.some(id => id.toLowerCase() === alertId)) {
                console.log(`🚨 Alert triggered: ${alertId}, action: ${action}`);
                
                try {
                    // Verify predicate passes
                    const predicateResult = await this.webhookPredicate.checkPredicate(eventAlertId, action);
                    
                    if (predicateResult) {
                        await this.triggerOrderbookOrders(eventAlertId);
                    }
                } catch (error) {
                    console.error(`Error processing alert ${alertId}:`, error);
                }
            }
        });

        console.log('✅ Orderbook monitoring started');
    }

    /**
     * Stop all event listeners
     */
    stopMonitoring(): void {
        this.webhookOracle.removeAllListeners('AlertSubmitted');
        console.log('🛑 Alert monitoring stopped');
    }
}