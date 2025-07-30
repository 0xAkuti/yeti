import DatabaseConnection from './connection.js';
import type { 
    StoredOrder, 
    OrderFill, 
    CreateOrderRequest, 
    OrderFilters, 
    OrderUpdateRequest
} from './types.js';
import { OrderStatus } from './types.js';
import { randomUUID } from 'crypto';

export class OrderRepository {
    private db: any;

    constructor() {
        this.db = DatabaseConnection.getConnection();
    }

    async createOrder(orderData: CreateOrderRequest): Promise<string> {
        const orderId = randomUUID();
        
        // Generate token pair for indexing
        const tokenPair = this.generateTokenPair(orderData.maker_asset, orderData.taker_asset);
        
        const stmt = this.db.prepare(`
            INSERT INTO orders (
                id, order_hash, chain_id, maker, maker_asset, taker_asset,
                making_amount, taking_amount, salt, maker_traits, extension, receiver,
                signature, alert_id, webhook_id, remaining_amount, expires_at,
                token_pair
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        try {
            stmt.run(
                orderId,
                orderData.order_hash,
                orderData.chain_id,
                orderData.maker,
                orderData.maker_asset,
                orderData.taker_asset,
                orderData.making_amount,
                orderData.taking_amount,
                orderData.salt,
                orderData.maker_traits,
                orderData.extension || '',
                orderData.receiver || '',
                orderData.signature,
                orderData.alert_id,
                orderData.webhook_id,
                orderData.making_amount, // Initially, remaining = making amount
                orderData.expires_at,
                tokenPair
            );

            return orderId;
        } catch (error: any) {
            if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
                throw new Error('Order with this hash already exists');
            }
            throw error;
        }
    }

    async getOrderById(id: string): Promise<StoredOrder | null> {
        const stmt = this.db.prepare('SELECT * FROM orders WHERE id = ?');
        const order = stmt.get(id);
        return order || null;
    }

    async getOrderByHash(orderHash: string): Promise<StoredOrder | null> {
        const stmt = this.db.prepare('SELECT * FROM orders WHERE order_hash = ?');
        const order = stmt.get(orderHash);
        return order || null;
    }

    async getOrders(filters: OrderFilters = {}): Promise<{ orders: StoredOrder[], total: number }> {
        let whereClause = 'WHERE 1=1';
        const params: any[] = [];

        // Build WHERE clause
        if (filters.status) {
            whereClause += ' AND status = ?';
            params.push(filters.status);
        }

        if (filters.maker) {
            whereClause += ' AND maker = ?';
            params.push(filters.maker);
        }

        if (filters.maker_asset) {
            whereClause += ' AND maker_asset = ?';
            params.push(filters.maker_asset);
        }

        if (filters.taker_asset) {
            whereClause += ' AND taker_asset = ?';
            params.push(filters.taker_asset);
        }

        if (filters.token_pair) {
            whereClause += ' AND token_pair = ?';
            params.push(filters.token_pair);
        }


        // Count total
        const countStmt = this.db.prepare(`SELECT COUNT(*) as count FROM orders ${whereClause}`);
        const { count: total } = countStmt.get(...params);

        // Build ORDER BY clause
        const orderBy = filters.order_by || 'created_at';
        const orderDirection = filters.order_direction || 'DESC';
        const orderClause = `ORDER BY ${orderBy} ${orderDirection}`;

        // Build LIMIT clause
        const limit = Math.min(filters.limit || 100, 1000); // Max 1000 orders
        const offset = filters.offset || 0;
        const limitClause = `LIMIT ? OFFSET ?`;

        // Get orders
        const ordersStmt = this.db.prepare(`
            SELECT * FROM orders 
            ${whereClause} 
            ${orderClause} 
            ${limitClause}
        `);
        
        const orders = ordersStmt.all(...params, limit, offset);

        return { orders, total };
    }

    async updateOrder(orderHash: string, updates: OrderUpdateRequest): Promise<boolean> {
        const setClauses: string[] = [];
        const params: any[] = [];

        if (updates.status) {
            setClauses.push('status = ?');
            params.push(updates.status);
        }

        if (updates.filled_amount) {
            setClauses.push('filled_amount = ?');
            params.push(updates.filled_amount);
        }

        if (updates.remaining_amount) {
            setClauses.push('remaining_amount = ?');
            params.push(updates.remaining_amount);
        }

        if (setClauses.length === 0) {
            return false;
        }

        params.push(orderHash);

        const stmt = this.db.prepare(`
            UPDATE orders 
            SET ${setClauses.join(', ')}
            WHERE order_hash = ?
        `);

        const result = stmt.run(...params);
        return result.changes > 0;
    }

    async deleteOrder(orderHash: string): Promise<boolean> {
        const stmt = this.db.prepare('DELETE FROM orders WHERE order_hash = ?');
        const result = stmt.run(orderHash);
        return result.changes > 0;
    }

    async getOrdersByAlertId(alertId: string): Promise<StoredOrder[]> {
        const stmt = this.db.prepare('SELECT * FROM orders WHERE alert_id = ?');
        return stmt.all(alertId);
    }

    async markOrdersAsTriggered(alertId: string): Promise<number> {
        const stmt = this.db.prepare(`
            UPDATE orders 
            SET status = ? 
            WHERE alert_id = ? AND status = ?
        `);
        
        const result = stmt.run(OrderStatus.TRIGGERED, alertId, OrderStatus.PENDING);
        return result.changes;
    }

    async recordOrderFill(
        orderHash: string,
        taker: string,
        filledAmount: string,
        transactionHash: string,
        blockNumber: number,
        gasUsed?: number
    ): Promise<void> {
        const stmt = this.db.prepare(`
            INSERT INTO order_fills (
                order_hash, taker, filled_amount, transaction_hash, block_number, gas_used
            ) VALUES (?, ?, ?, ?, ?, ?)
        `);

        stmt.run(orderHash, taker, filledAmount, transactionHash, blockNumber, gasUsed);
    }

    async getOrderFills(orderHash: string): Promise<OrderFill[]> {
        const stmt = this.db.prepare('SELECT * FROM order_fills WHERE order_hash = ? ORDER BY created_at DESC');
        return stmt.all(orderHash);
    }

    async getOrderStats(): Promise<{
        total: number;
        by_status: Record<OrderStatus, number>;
        recent_fills: number;
    }> {
        // Total orders
        const totalStmt = this.db.prepare('SELECT COUNT(*) as count FROM orders');
        const { count: total } = totalStmt.get();

        // Orders by status
        const statusStmt = this.db.prepare(`
            SELECT status, COUNT(*) as count 
            FROM orders 
            GROUP BY status
        `);
        const statusResults = statusStmt.all();
        const by_status: Record<OrderStatus, number> = {
            [OrderStatus.PENDING]: 0,
            [OrderStatus.TRIGGERED]: 0,
            [OrderStatus.PARTIALLY_FILLED]: 0,
            [OrderStatus.FILLED]: 0,
            [OrderStatus.CANCELLED]: 0,
            [OrderStatus.EXPIRED]: 0
        };
        
        statusResults.forEach((row: any) => {
            by_status[row.status as OrderStatus] = row.count;
        });

        // Recent fills (last 24 hours)
        const recentFillsStmt = this.db.prepare(`
            SELECT COUNT(*) as count 
            FROM order_fills 
            WHERE created_at > datetime('now', '-1 day')
        `);
        const { count: recent_fills } = recentFillsStmt.get();

        return { total, by_status, recent_fills };
    }


    private generateTokenPair(makerAsset: string, takerAsset: string): string {
        // Create a consistent token pair format (e.g., "USDC-WETH")
        // This is simplified - in production you'd want to resolve token symbols
        const makerSymbol = this.getTokenSymbol(makerAsset);
        const takerSymbol = this.getTokenSymbol(takerAsset);
        return `${makerSymbol}-${takerSymbol}`;
    }

    private getTokenSymbol(address: string): string {
        // Simplified token symbol resolution
        const knownTokens: Record<string, string> = {
            '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48': 'USDC',
            '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2': 'WETH',
            '0x6B175474E89094C44Da98b954EedeAC495271d0F': 'DAI',
            '0xdAC17F958D2ee523a2206206994597C13D831ec7': 'USDT',
        };

        return knownTokens[address] || address.slice(0, 8);
    }
}