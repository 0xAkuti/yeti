import { JsonRpcProvider, Wallet } from 'ethers';
import { WebhookManager } from './webhook-manager.js';
import { ConditionalOrderBuilder } from './order-builder.js';
import { AlertMonitor } from './alert-monitor.js';
import { OrderFiller } from './order-filler.js';
import { OrderbookClient } from './orderbook/index.js';
import { OrderbookFiller } from './orderbook-filler.js';
import { ContractAddresses, ConditionalOrderParams, OrderData, WebhookInfo } from './types.js';

export interface YetiSDKConfig {
    provider: JsonRpcProvider;
    signer?: Wallet; // Optional - only needed for order filling
    webhookServerUrl: string;
    orderbookServerUrl?: string; // Optional - orderbook integration
    contracts: ContractAddresses;
}

export class YetiSDK {
    public readonly webhooks: WebhookManager;
    public readonly orderBuilder: ConditionalOrderBuilder;
    public readonly monitor: AlertMonitor;
    public readonly filler: OrderFiller;
    public readonly orderbook: OrderbookClient;
    public readonly orderbookFiller: OrderbookFiller;
    
    private config: YetiSDKConfig;

    constructor(config: YetiSDKConfig) {
        this.config = config;
        
        // Initialize components
        this.webhooks = new WebhookManager(config.webhookServerUrl);
        this.orderBuilder = new ConditionalOrderBuilder(config.contracts);
        this.monitor = new AlertMonitor(config.provider, config.contracts);
        
        // OrderFiller requires a signer
        if (config.signer) {
            this.filler = new OrderFiller(config.provider, config.signer, config.contracts);
        } else {
            // Create a placeholder that throws helpful errors
            this.filler = new Proxy({} as OrderFiller, {
                get: () => {
                    throw new Error('OrderFiller requires a signer. Initialize YetiSDK with a signer to use order filling functionality.');
                }
            });
        }

        // OrderbookClient is optional
        if (config.orderbookServerUrl) {
            this.orderbook = new OrderbookClient({
                baseUrl: config.orderbookServerUrl,
                timeout: 10000,
                retries: 3,
                retryDelay: 1000
            });
            
            // Inject orderbook client into order builder
            this.orderBuilder.setOrderbookClient(this.orderbook);

            // OrderbookFiller requires both orderbook and signer
            if (config.signer) {
                this.orderbookFiller = new OrderbookFiller(
                    this.orderbook,
                    config.provider,
                    config.signer,
                    config.contracts
                );
            } else {
                this.orderbookFiller = new Proxy({} as OrderbookFiller, {
                    get: () => {
                        throw new Error('OrderbookFiller requires both orderbookServerUrl and signer in config.');
                    }
                });
            }
        } else {
            // Create placeholders that throw helpful errors
            this.orderbook = new Proxy({} as OrderbookClient, {
                get: () => {
                    throw new Error('OrderbookClient requires orderbookServerUrl in config. Add orderbookServerUrl to YetiSDKConfig to use orderbook functionality.');
                }
            });
            
            this.orderbookFiller = new Proxy({} as OrderbookFiller, {
                get: () => {
                    throw new Error('OrderbookFiller requires orderbookServerUrl in config. Add orderbookServerUrl to YetiSDKConfig to use orderbook filling functionality.');
                }
            });
        }
    }

    // Convenience method for complete order creation workflow
    async createConditionalOrder(params: ConditionalOrderParams, maker: string): Promise<{
        webhook: WebhookInfo;
        orderData: OrderData;
        tradingViewSetup: string;
    }> {
        // 1. Create webhook
        const webhook = await this.webhooks.createWebhook();
        
        // 2. Build conditional order
        const orderData = this.orderBuilder.buildWebhookOrder(params, webhook.alertId, maker);
        
        // 3. Generate TradingView setup instructions
        const tradingViewSetup = this.webhooks.generateTradingViewSetup(webhook, params.action);
        
        return {
            webhook,
            orderData,
            tradingViewSetup
        };
    }

    // Helper method to get order ready for frontend signing
    getOrderForSigning(orderData: OrderData, chainId: number) {
        return this.orderBuilder.getOrderForSigning(orderData, chainId);
    }

    // Monitor and auto-fill orders (for backend services)
    async watchAndFillOrder(orderData: OrderData, signature: string): Promise<string> {
        console.log(`Watching for alert: ${orderData.alertId}`);
        
        // Wait for alert
        const alert = await this.monitor.watchAlert(orderData.alertId);
        console.log(`Alert received:`, alert);
        
        // Fill order when alert is triggered
        const txHash = await this.filler.fillOrder({
            order: orderData.order,
            signature
        });
        
        console.log(`Order filled: ${txHash}`);
        return txHash;
    }

    // Create a new SDK instance with a signer (for order filling)
    withSigner(signer: Wallet): YetiSDK {
        return new YetiSDK({
            ...this.config,
            signer
        });
    }

    // Get contract addresses
    getContracts(): ContractAddresses {
        return { ...this.config.contracts };
    }

    // Get provider
    getProvider(): JsonRpcProvider {
        return this.config.provider;
    }
}