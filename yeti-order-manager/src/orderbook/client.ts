import {
    OrderbookClientConfig,
    CreateOrderRequest,
    CreateOrderResponse,
    OrderFilters,
    PaginatedOrderResponse,
    StoredOrder,
    OrderUpdateRequest,
    OrderFill,
    FillRequest,
    TriggerOrdersResponse,
    HealthResponse,
    OrderbookStats,
    ApiResponse,
    OrderbookError,
    OrderbookNetworkError,
    OrderbookValidationError,
    OrderNotFoundError,
    OrderAlreadyExistsError
} from './types.js';

/**
 * HTTP client for interacting with the Yeti Orderbook Server
 * Provides methods for order management, fill tracking, and statistics
 */
export class OrderbookClient {
    private readonly baseUrl: string;
    private readonly timeout: number;
    private readonly retries: number;
    private readonly retryDelay: number;

    constructor(config: OrderbookClientConfig) {
        this.baseUrl = config.baseUrl.replace(/\/$/, ''); // Remove trailing slash
        this.timeout = config.timeout ?? 10000; // 10 seconds default
        this.retries = config.retries ?? 3;
        this.retryDelay = config.retryDelay ?? 1000; // 1 second base delay
    }

    /**
     * Core HTTP request method with retry logic and error handling
     */
    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const url = `${this.baseUrl}${endpoint}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const requestOptions: RequestInit = {
            ...options,
            signal: controller.signal,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        };

        let lastError: Error | undefined;

        for (let attempt = 0; attempt <= this.retries; attempt++) {
            try {
                const response = await fetch(url, requestOptions);
                clearTimeout(timeoutId);

                // Handle different response types
                if (!response.ok) {
                    const errorText = await response.text();
                    let errorData: any;
                    
                    try {
                        errorData = JSON.parse(errorText);
                    } catch {
                        errorData = { error: errorText };
                    }

                    // Throw specific error types based on status
                    switch (response.status) {
                        case 400:
                            throw new OrderbookValidationError(
                                errorData.error || 'Validation error',
                                errorData
                            );
                        case 404:
                            throw new OrderNotFoundError(
                                errorData.error || 'Resource not found',
                                errorData
                            );
                        case 409:
                            throw new OrderAlreadyExistsError(
                                errorData.error || 'Resource already exists',
                                errorData
                            );
                        default:
                            throw new OrderbookError(
                                errorData.error || `HTTP ${response.status}`,
                                response.status,
                                errorData
                            );
                    }
                }

                const data = await response.json();
                return data as T;

            } catch (error) {
                lastError = error as Error;

                // Don't retry for client errors (4xx) or specific error types
                if (error instanceof OrderbookValidationError ||
                    error instanceof OrderNotFoundError ||
                    error instanceof OrderAlreadyExistsError ||
                    (error instanceof OrderbookError && error.status && error.status < 500)) {
                    throw error;
                }

                // Don't retry on last attempt
                if (attempt === this.retries) {
                    break;
                }

                // Exponential backoff delay
                const delay = this.retryDelay * Math.pow(2, attempt);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }

        clearTimeout(timeoutId);

        // Wrap network/timeout errors
        if (lastError?.name === 'AbortError') {
            throw new OrderbookNetworkError(`Request timeout after ${this.timeout}ms`, { url });
        }

        throw new OrderbookNetworkError(
            `Request failed after ${this.retries + 1} attempts: ${lastError?.message || 'Unknown error'}`,
            { url, originalError: lastError }
        );
    }

    /**
     * Health check - verify server is accessible and healthy
     */
    async healthCheck(): Promise<HealthResponse> {
        return this.request<HealthResponse>('/health');
    }

    /**
     * Submit a new order to the orderbook
     */
    async submitOrder(order: CreateOrderRequest): Promise<CreateOrderResponse> {
        return this.request<CreateOrderResponse>('/api/orders', {
            method: 'POST',
            body: JSON.stringify(order),
        });
    }

    /**
     * Get orders with optional filtering and pagination
     */
    async getOrders(filters: OrderFilters = {}): Promise<PaginatedOrderResponse> {
        const params = new URLSearchParams();
        
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                params.append(key, String(value));
            }
        });

        const queryString = params.toString();
        const endpoint = queryString ? `/api/orders?${queryString}` : '/api/orders';
        
        return this.request<PaginatedOrderResponse>(endpoint);
    }

    /**
     * Get a specific order by its internal ID
     */
    async getOrderById(id: string): Promise<StoredOrder | null> {
        try {
            const response = await this.request<ApiResponse<StoredOrder>>(`/api/orders/${id}`);
            return response.data || null;
        } catch (error) {
            if (error instanceof OrderNotFoundError) {
                return null;
            }
            throw error;
        }
    }

    /**
     * Get a specific order by its order hash
     */
    async getOrderByHash(orderHash: string): Promise<StoredOrder | null> {
        try {
            const response = await this.request<ApiResponse<StoredOrder>>(`/api/orders/hash/${orderHash}`);
            return response.data || null;
        } catch (error) {
            if (error instanceof OrderNotFoundError) {
                return null;
            }
            throw error;
        }
    }

    /**
     * Get all orders for a specific alert ID
     */
    async getOrdersByAlertId(alertId: string): Promise<StoredOrder[]> {
        const response = await this.request<ApiResponse<StoredOrder[]>>(`/api/orders/alert/${alertId}`);
        return response.data || [];
    }

    /**
     * Update an existing order
     */
    async updateOrder(orderHash: string, updates: OrderUpdateRequest): Promise<void> {
        await this.request<ApiResponse>(`/api/orders/hash/${orderHash}`, {
            method: 'PATCH',
            body: JSON.stringify(updates),
        });
    }

    /**
     * Delete an order by hash
     */
    async deleteOrder(orderHash: string): Promise<void> {
        await this.request<ApiResponse>(`/api/orders/hash/${orderHash}`, {
            method: 'DELETE',
        });
    }

    /**
     * Get all fills for a specific order
     */
    async getOrderFills(orderHash: string): Promise<OrderFill[]> {
        const response = await this.request<ApiResponse<OrderFill[]>>(`/api/orders/hash/${orderHash}/fills`);
        return response.data || [];
    }

    /**
     * Record a new fill for an order
     */
    async recordOrderFill(orderHash: string, fillData: FillRequest): Promise<void> {
        await this.request<ApiResponse>(`/api/orders/hash/${orderHash}/fills`, {
            method: 'POST',
            body: JSON.stringify(fillData),
        });
    }

    /**
     * Trigger all orders associated with an alert ID
     */
    async triggerOrdersByAlert(alertId: string): Promise<TriggerOrdersResponse> {
        return this.request<TriggerOrdersResponse>(`/api/orders/alert/${alertId}/trigger`, {
            method: 'POST',
        });
    }

    /**
     * Get orderbook statistics
     */
    async getStats(): Promise<OrderbookStats> {
        const response = await this.request<ApiResponse<OrderbookStats>>('/api/stats');
        return response.data || {};
    }

    /**
     * Check if the orderbook server is accessible
     */
    async isHealthy(): Promise<boolean> {
        try {
            await this.healthCheck();
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Get base URL for debugging/logging
     */
    getBaseUrl(): string {
        return this.baseUrl;
    }
}