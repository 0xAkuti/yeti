#!/usr/bin/env node

import { config } from 'dotenv';
import { JsonRpcProvider, Wallet } from 'ethers';
import { YetiSDK, YetiSDKConfig } from './yeti-sdk.js';
import { ContractAddresses } from './types.js';

// Load environment variables
config();

interface WatcherConfig {
    rpcUrl: string;
    privateKey: string;
    orderbookUrl: string;
    webhookServerUrl: string;
    contracts: ContractAddresses;
    pollInterval?: number;
    batchSize?: number;
    maker?: string;
}

class OrderWatcher {
    private sdk: YetiSDK;
    private config: WatcherConfig;

    constructor(config: WatcherConfig) {
        this.config = config;
        
        // Initialize provider and signer
        const provider = new JsonRpcProvider(config.rpcUrl);
        const signer = new Wallet(config.privateKey, provider);
        
        // Initialize YetiSDK with all required components
        const sdkConfig: YetiSDKConfig = {
            provider,
            signer,
            webhookServerUrl: config.webhookServerUrl,
            orderbookServerUrl: config.orderbookUrl,
            contracts: config.contracts
        };
        
        this.sdk = new YetiSDK(sdkConfig);
    }

    async start(): Promise<void> {
        console.log('🚀 Starting Yeti Order Watcher...');
        console.log(`📊 Orderbook: ${this.config.orderbookUrl}`);
        console.log(`⏱️  Poll interval: ${this.config.pollInterval || 5000}ms`);
        
        if (this.config.maker) {
            console.log(`🎯 Maker filter: ${this.config.maker}`);
        }

        // Start the order filling process
        await this.sdk.orderbookFiller.startFilling({
            pollInterval: this.config.pollInterval || 5000,
            batchSize: this.config.batchSize || 10,
            maker: this.config.maker
        });

        console.log('✅ Order watcher running. Press Ctrl+C to stop.');
    }

    stop(): void {
        console.log('🛑 Stopping order watcher...');
        this.sdk.orderbookFiller.stopFilling();
        console.log('✅ Order watcher stopped.');
    }

    getStatus() {
        return this.sdk.orderbookFiller.getStatus();
    }

    /**
     * Get the YetiSDK instance for access to all components
     */
    getSDK(): YetiSDK {
        return this.sdk;
    }
}

// Function to create and start the watcher
export async function startOrderWatcher(config: WatcherConfig): Promise<OrderWatcher> {
    const watcher = new OrderWatcher(config);
    await watcher.start();
    return watcher;
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
    // Get configuration from environment variables
    const config: WatcherConfig = {
        rpcUrl: process.env.RPC_URL || 'http://localhost:8545',
        privateKey: process.env.PRIVATE_KEY || '',
        orderbookUrl: process.env.ORDERBOOK_URL || 'http://localhost:3001',
        webhookServerUrl: process.env.WEBHOOK_SERVER_URL || 'http://localhost:3000',
        contracts: {
            limitOrderProtocol: process.env.LIMIT_ORDER_PROTOCOL_ADDRESS || '',
            webhookOracle: process.env.WEBHOOK_ORACLE_ADDRESS || '',
            webhookPredicate: process.env.WEBHOOK_PREDICATE_ADDRESS || '',
            chainlinkCalculator: process.env.CHAINLINK_CALCULATOR_ADDRESS || ''
        },
        pollInterval: process.env.POLL_INTERVAL ? parseInt(process.env.POLL_INTERVAL) : 5000,
        batchSize: process.env.BATCH_SIZE ? parseInt(process.env.BATCH_SIZE) : 10,
        maker: process.env.MAKER_ADDRESS || undefined
    };

    // Validate required configuration
    if (!config.privateKey) {
        console.error('❌ PRIVATE_KEY environment variable is required');
        process.exit(1);
    }

    if (!config.contracts.limitOrderProtocol) {
        console.error('❌ LIMIT_ORDER_PROTOCOL_ADDRESS environment variable is required');
        process.exit(1);
    }

    if (!config.webhookServerUrl || config.webhookServerUrl === 'http://localhost:3000') {
        console.warn('⚠️  Using default WEBHOOK_SERVER_URL. Set WEBHOOK_SERVER_URL environment variable for production use.');
    }

    // Start the watcher
    const watcher = await startOrderWatcher(config);

    // Handle graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n🛑 Received SIGINT, shutting down gracefully...');
        watcher.stop();
        process.exit(0);
    });

    process.on('SIGTERM', () => {
        console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
        watcher.stop();
        process.exit(0);
    });

    // Keep the process alive
    process.on('uncaughtException', (error) => {
        console.error('❌ Uncaught exception:', error);
        watcher.stop();
        process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
        console.error('❌ Unhandled rejection at:', promise, 'reason:', reason);
        watcher.stop();
        process.exit(1);
    });
}

export { OrderWatcher };