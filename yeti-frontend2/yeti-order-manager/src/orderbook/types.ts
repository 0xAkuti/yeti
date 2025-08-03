/**
 * TypeScript interfaces for Orderbook Server API
 * Matches the server-side types and API responses
 */

export enum OrderStatus {
    PENDING = 'pending',
    TRIGGERED = 'triggered',
    PARTIALLY_FILLED = 'partially_filled',
    FILLED = 'filled',
    CANCELLED = 'cancelled',
    EXPIRED = 'expired'
}

export interface StoredOrder {
    id: string;
    order_hash: string;
    chain_id: number;
    
    // Order data
    maker: string;
    maker_asset: string;
    taker_asset: string;
    making_amount: string;
    taking_amount: string;
    salt: string;
    maker_traits: string;
    extension: string;
    receiver: string;
    
    // Execution data
    signature: string;
    alert_id: string;
    webhook_id: string;
    
    // Status
    status: OrderStatus;
    filled_amount: string;
    remaining_amount: string;
    
    // Metadata
    created_at: string;
    updated_at: string;
    expires_at?: string;
    token_pair?: string;
}

export interface CreateOrderRequest {
    order_hash: string;
    chain_id: number;
    maker: string;
    maker_asset: string;
    taker_asset: string;
    making_amount: string;
    taking_amount: string;
    salt: string;
    maker_traits: string;
    extension?: string;
    receiver?: string;
    signature: string;
    alert_id: string;
    webhook_id: string;
    expires_at?: string;
}

export interface OrderUpdateRequest {
    status?: OrderStatus;
    filled_amount?: string;
    remaining_amount?: string;
}

export interface OrderFilters {
    status?: OrderStatus;
    maker?: string;
    maker_asset?: string;
    taker_asset?: string;
    token_pair?: string;
    limit?: number;
    offset?: number;
    order_by?: 'created_at' | 'expires_at';
    order_direction?: 'ASC' | 'DESC';
}

export interface OrderFill {
    id: number;
    order_hash: string;
    taker: string;
    filled_amount: string;
    transaction_hash: string;
    block_number: number;
    gas_used?: number;
    created_at: string;
}

export interface FillRequest {
    taker: string;
    filled_amount: string;
    transaction_hash: string;
    block_number: number;
    gas_used?: number;
}

// API Response Types
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
    details?: string;
}

export interface PaginatedOrderResponse extends ApiResponse<StoredOrder[]> {
    pagination: {
        total: number;
        limit: number;
        offset: number;
        has_more: boolean;
    };
}

export interface CreateOrderResponse extends ApiResponse {
    order_id: string;
}

export interface TriggerOrdersResponse extends ApiResponse {
    updated_count: number;
}

export interface HealthResponse extends ApiResponse {
    message: string;
    timestamp: string;
    database: string;
}

export interface OrderbookStats {
    [key: string]: any; // Flexible stats object
}

// Configuration Types
export interface OrderbookClientConfig {
    baseUrl: string;
    timeout?: number;
    retries?: number;
    retryDelay?: number;
}

// Error Types
export class OrderbookError extends Error {
    constructor(
        message: string,
        public readonly status?: number,
        public readonly context?: any
    ) {
        super(message);
        this.name = 'OrderbookError';
    }
}

export class OrderbookNetworkError extends OrderbookError {
    constructor(message: string, context?: any) {
        super(message, undefined, context);
        this.name = 'OrderbookNetworkError';
    }
}

export class OrderbookValidationError extends OrderbookError {
    constructor(message: string, context?: any) {
        super(message, 400, context);
        this.name = 'OrderbookValidationError';
    }
}

export class OrderNotFoundError extends OrderbookError {
    constructor(message: string = 'Order not found', context?: any) {
        super(message, 404, context);
        this.name = 'OrderNotFoundError';
    }
}

export class OrderAlreadyExistsError extends OrderbookError {
    constructor(message: string = 'Order already exists', context?: any) {
        super(message, 409, context);
        this.name = 'OrderAlreadyExistsError';
    }
}