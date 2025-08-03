import { JsonRpcProvider, Contract, EventLog } from 'ethers';
import { AlertEvent, Action, ContractAddresses } from './types.js';

export class AlertMonitor {
    private provider: JsonRpcProvider;
    private contracts: ContractAddresses;
    private webhookOracle: Contract;
    private webhookPredicate: Contract;

    constructor(provider: JsonRpcProvider, contracts: ContractAddresses) {
        this.provider = provider;
        this.contracts = contracts;
        
        const webhookOracleAbi = [
            'function getAlert(bytes16 _alertId) external view returns (tuple(bytes16 alertId, uint32 timestamp, uint8 action, uint32 nonce))',
            'event AlertSubmitted(bytes16 indexed alertId, uint8 action, uint32 timestamp, uint32 nonce)'
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
            this.webhookOracle.on('AlertSubmitted', async (eventAlertId: string, action: number, timestamp: number, nonce: number, event: EventLog) => {
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
                            
                            resolve({
                                alertId: eventAlertId,
                                action: Number(action) as Action,
                                timestamp: Number(timestamp),
                                nonce: Number(nonce),
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
                            
                            resolve({
                                alertId: alertData.alertId,
                                action: Number(alertData.action) as Action,
                                timestamp: Number(alertData.timestamp),
                                nonce: Number(alertData.nonce)
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
                timestamp: Number(alertData.timestamp),
                nonce: Number(alertData.nonce)
            };
        } catch (error) {
            throw new Error(`Failed to get alert ${alertId}: ${error}`);
        }
    }

    /**
     * Stop all event listeners
     */
    stopMonitoring(): void {
        this.webhookOracle.removeAllListeners('AlertSubmitted');
        console.log('🛑 Alert monitoring stopped');
    }
}