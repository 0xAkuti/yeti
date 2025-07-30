import { Router, Request, Response } from 'express';
import { OrderRepository } from '../database/repository.js';
import type { CreateOrderRequest, OrderFilters, OrderUpdateRequest } from '../database/types.js';
import { OrderStatus } from '../database/types.js';

const router = Router();
const orderRepo = new OrderRepository();

// POST /orders - Create new order
router.post('/', async (req: Request, res: Response) => {
    try {
        const orderData: CreateOrderRequest = req.body;

        // Basic validation
        if (!orderData.order_hash || !orderData.signature || !orderData.maker) {
            return res.status(400).json({
                error: 'Missing required fields: order_hash, signature, maker'
            });
        }

        const orderId = await orderRepo.createOrder(orderData);

        res.status(201).json({
            success: true,
            order_id: orderId,
            message: 'Order created successfully'
        });
    } catch (error: any) {
        console.error('Error creating order:', error);
        
        if (error.message.includes('already exists')) {
            return res.status(409).json({
                error: 'Order with this hash already exists'
            });
        }

        res.status(500).json({
            error: 'Failed to create order',
            details: error.message
        });
    }
});

// GET /orders - Get orders with filtering
router.get('/', async (req: Request, res: Response) => {
    try {
        const filters: OrderFilters = {
            status: req.query.status as any,
            maker: req.query.maker as string,
            maker_asset: req.query.maker_asset as string,
            taker_asset: req.query.taker_asset as string,
            token_pair: req.query.token_pair as string,
            limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
            offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
            order_by: req.query.order_by as any,
            order_direction: req.query.order_direction as any
        };

        const result = await orderRepo.getOrders(filters);

        res.json({
            success: true,
            data: result.orders,
            pagination: {
                total: result.total,
                limit: filters.limit || 100,
                offset: filters.offset || 0,
                has_more: (filters.offset || 0) + result.orders.length < result.total
            }
        });
    } catch (error: any) {
        console.error('Error fetching orders:', error);
        res.status(500).json({
            error: 'Failed to fetch orders',
            details: error.message
        });
    }
});

// GET /orders/:id - Get order by ID
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const order = await orderRepo.getOrderById(id);

        if (!order) {
            return res.status(404).json({
                error: 'Order not found'
            });
        }

        res.json({
            success: true,
            data: order
        });
    } catch (error: any) {
        console.error('Error fetching order:', error);
        res.status(500).json({
            error: 'Failed to fetch order',
            details: error.message
        });
    }
});

// GET /orders/hash/:orderHash - Get order by hash
router.get('/hash/:orderHash', async (req: Request, res: Response) => {
    try {
        const { orderHash } = req.params;
        const order = await orderRepo.getOrderByHash(orderHash);

        if (!order) {
            return res.status(404).json({
                error: 'Order not found'
            });
        }

        res.json({
            success: true,
            data: order
        });
    } catch (error: any) {
        console.error('Error fetching order:', error);
        res.status(500).json({
            error: 'Failed to fetch order',
            details: error.message
        });
    }
});

// PATCH /orders/:orderHash - Update order
router.patch('/hash/:orderHash', async (req: Request, res: Response) => {
    try {
        const { orderHash } = req.params;
        const updates: OrderUpdateRequest = req.body;

        const success = await orderRepo.updateOrder(orderHash, updates);

        if (!success) {
            return res.status(404).json({
                error: 'Order not found or no changes made'
            });
        }

        res.json({
            success: true,
            message: 'Order updated successfully'
        });
    } catch (error: any) {
        console.error('Error updating order:', error);
        res.status(500).json({
            error: 'Failed to update order',
            details: error.message
        });
    }
});

// DELETE /orders/:orderHash - Delete order
router.delete('/hash/:orderHash', async (req: Request, res: Response) => {
    try {
        const { orderHash } = req.params;
        const success = await orderRepo.deleteOrder(orderHash);

        if (!success) {
            return res.status(404).json({
                error: 'Order not found'
            });
        }

        res.json({
            success: true,
            message: 'Order deleted successfully'
        });
    } catch (error: any) {
        console.error('Error deleting order:', error);
        res.status(500).json({
            error: 'Failed to delete order',
            details: error.message
        });
    }
});

// GET /orders/alert/:alertId - Get orders by alert ID
router.get('/alert/:alertId', async (req: Request, res: Response) => {
    try {
        const { alertId } = req.params;
        const orders = await orderRepo.getOrdersByAlertId(alertId);

        res.json({
            success: true,
            data: orders
        });
    } catch (error: any) {
        console.error('Error fetching orders by alert ID:', error);
        res.status(500).json({
            error: 'Failed to fetch orders',
            details: error.message
        });
    }
});

// GET /orders/:orderHash/fills - Get order fills
router.get('/hash/:orderHash/fills', async (req: Request, res: Response) => {
    try {
        const { orderHash } = req.params;
        const fills = await orderRepo.getOrderFills(orderHash);

        res.json({
            success: true,
            data: fills
        });
    } catch (error: any) {
        console.error('Error fetching order fills:', error);
        res.status(500).json({
            error: 'Failed to fetch order fills',
            details: error.message
        });
    }
});

// POST /orders/:orderHash/fills - Record order fill
router.post('/hash/:orderHash/fills', async (req: Request, res: Response) => {
    try {
        const { orderHash } = req.params;
        const { taker, filled_amount, transaction_hash, block_number, gas_used } = req.body;

        if (!taker || !filled_amount || !transaction_hash || !block_number) {
            return res.status(400).json({
                error: 'Missing required fields: taker, filled_amount, transaction_hash, block_number'
            });
        }

        await orderRepo.recordOrderFill(
            orderHash,
            taker,
            filled_amount,
            transaction_hash,
            block_number,
            gas_used
        );

        res.status(201).json({
            success: true,
            message: 'Order fill recorded successfully'
        });
    } catch (error: any) {
        console.error('Error recording order fill:', error);
        res.status(500).json({
            error: 'Failed to record order fill',
            details: error.message
        });
    }
});

// POST /orders/alert/:alertId/trigger - Mark orders as triggered when alert fires
router.post('/alert/:alertId/trigger', async (req: Request, res: Response) => {
    try {
        const { alertId } = req.params;
        const updatedCount = await orderRepo.markOrdersAsTriggered(alertId);

        res.json({
            success: true,
            message: `${updatedCount} order(s) marked as triggered`,
            updated_count: updatedCount
        });
    } catch (error: any) {
        console.error('Error marking orders as triggered:', error);
        res.status(500).json({
            error: 'Failed to mark orders as triggered',
            details: error.message
        });
    }
});

export default router;