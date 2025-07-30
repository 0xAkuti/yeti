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

export enum OrderStatus {
    PENDING = 'pending',
    TRIGGERED = 'triggered',
    PARTIALLY_FILLED = 'partially_filled', 
    FILLED = 'filled',
    CANCELLED = 'cancelled',
    EXPIRED = 'expired'
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

export interface OrderUpdateRequest {
    status?: OrderStatus;
    filled_amount?: string;
    remaining_amount?: string;
}

export interface Migration {
    version: string;
    description: string;
    applied_at: string;
}