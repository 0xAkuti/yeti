import { LimitOrder } from '@1inch/limit-order-sdk';

export enum Action {
    NONE = 0,
    SHORT = 1,
    LONG = 2
}

export interface ContractAddresses {
    webhookOracle: string;
    webhookPredicate: string;
    chainlinkCalculator: string;
    limitOrderProtocol: string;
}

export interface WebhookInfo {
    webhookId: string;
    alertId: string;
    webhookUrl: string;
    alertMessage: string;
}

export interface ConditionalOrderParams {
    sell: {
        token: string;
        amount: string;
    };
    buy: {
        token: string;
    };
    action: 'LONG' | 'SHORT';
    oracle: string;
}

export interface OrderData {
    order: LimitOrder;
    orderHash: string;
    alertId: string;
}

export interface AlertEvent {
    alertId: string;
    action: Action;
    timestamp: number;
    blockNumber?: number;
    transactionHash?: string;
}

export interface FillOrderParams {
    order: LimitOrder;
    signature: string;
    amount?: bigint;
}

export interface StoredOrder {
    id: string;
    orderHash: string;
    chainId: number;
    
    // Order data
    maker: string;
    makerAsset: string;
    takerAsset: string;
    makingAmount: string;
    takingAmount: string;
    salt: string;
    makerTraits: string;
    extension: string;
    
    // Execution data
    signature: string;
    alertId: string;
    webhookId: string;
    
    // Status
    status: 'pending' | 'partially_filled' | 'filled' | 'cancelled' | 'expired';
    filledAmount: string;
    remainingAmount: string;
    
    // Metadata
    createdAt: Date;
    updatedAt: Date;
    expiresAt?: Date;
    priceRatio?: number;
    tokenPair?: string;
}

export interface OrderFilters {
    status?: string;
    maker?: string;
    makerAsset?: string;
    takerAsset?: string;
    tokenPair?: string;
    minPriceRatio?: number;
    maxPriceRatio?: number;
    limit?: number;
    offset?: number;
}