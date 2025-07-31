import { Router, Request, Response } from 'express';
import { OrderRepository } from '../database/repository.js';
import type { CreateOrderRequest, OrderFilters, OrderUpdateRequest } from '../database/types.js';
import { OrderStatus } from '../database/types.js';

const router = Router();
const orderRepo = new OrderRepository();

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Create a new order
 *     description: Creates a new limit order in the orderbook
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateOrderRequest'
 *     responses:
 *       201:
 *         description: Order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 order_id:
 *                   type: string
 *                   example: "12345"
 *                 message:
 *                   type: string
 *                   example: "Order created successfully"
 *       400:
 *         description: Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Order with this hash already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Get orders with filtering
 *     description: Retrieves orders from the orderbook with optional filtering and pagination
 *     tags: [Orders]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, triggered, partially_filled, filled, cancelled, expired]
 *         description: Filter by order status
 *       - in: query
 *         name: maker
 *         schema:
 *           type: string
 *         description: Filter by maker address
 *       - in: query
 *         name: maker_asset
 *         schema:
 *           type: string
 *         description: Filter by maker asset address
 *       - in: query
 *         name: taker_asset
 *         schema:
 *           type: string
 *         description: Filter by taker asset address
 *       - in: query
 *         name: token_pair
 *         schema:
 *           type: string
 *         description: Filter by token pair
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 1000
 *           default: 100
 *         description: Number of orders to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Number of orders to skip
 *       - in: query
 *         name: order_by
 *         schema:
 *           type: string
 *           enum: [created_at, expires_at]
 *           default: created_at
 *         description: Field to order by
 *       - in: query
 *         name: order_direction
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *         description: Order direction
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 150
 *                     limit:
 *                       type: integer
 *                       example: 100
 *                     offset:
 *                       type: integer
 *                       example: 0
 *                     has_more:
 *                       type: boolean
 *                       example: true
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Get order by ID
 *     description: Retrieves a specific order by its internal ID
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Internal order ID
 *     responses:
 *       200:
 *         description: Order retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *       404:
 *         description: Order not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

/**
 * @swagger
 * /api/orders/hash/{orderHash}:
 *   get:
 *     summary: Get order by hash
 *     description: Retrieves a specific order by its order hash
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: orderHash
 *         required: true
 *         schema:
 *           type: string
 *         description: Order hash
 *     responses:
 *       200:
 *         description: Order retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *       404:
 *         description: Order not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

/**
 * @swagger
 * /api/orders/hash/{orderHash}:
 *   patch:
 *     summary: Update order
 *     description: Updates an existing order by hash
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: orderHash
 *         required: true
 *         schema:
 *           type: string
 *         description: Order hash
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, triggered, partially_filled, filled, cancelled, expired]
 *               filled_amount:
 *                 type: string
 *               remaining_amount:
 *                 type: string
 *     responses:
 *       200:
 *         description: Order updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       404:
 *         description: Order not found or no changes made
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

/**
 * @swagger
 * /api/orders/hash/{orderHash}:
 *   delete:
 *     summary: Delete order
 *     description: Deletes an order by hash
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: orderHash
 *         required: true
 *         schema:
 *           type: string
 *         description: Order hash
 *     responses:
 *       200:
 *         description: Order deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       404:
 *         description: Order not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

/**
 * @swagger
 * /api/orders/alert/{alertId}:
 *   get:
 *     summary: Get orders by alert ID
 *     description: Retrieves all orders associated with a specific alert ID
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: alertId
 *         required: true
 *         schema:
 *           type: string
 *         description: Alert ID
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

/**
 * @swagger
 * /api/orders/hash/{orderHash}/fills:
 *   get:
 *     summary: Get order fills
 *     description: Retrieves all fills for a specific order
 *     tags: [Order Fills]
 *     parameters:
 *       - in: path
 *         name: orderHash
 *         required: true
 *         schema:
 *           type: string
 *         description: Order hash
 *     responses:
 *       200:
 *         description: Order fills retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/OrderFill'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

/**
 * @swagger
 * /api/orders/hash/{orderHash}/fills:
 *   post:
 *     summary: Record order fill
 *     description: Records a new fill for an order
 *     tags: [Order Fills]
 *     parameters:
 *       - in: path
 *         name: orderHash
 *         required: true
 *         schema:
 *           type: string
 *         description: Order hash
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [taker, filled_amount, transaction_hash, block_number]
 *             properties:
 *               taker:
 *                 type: string
 *                 description: Taker address
 *               filled_amount:
 *                 type: string
 *                 description: Amount filled in this transaction
 *               transaction_hash:
 *                 type: string
 *                 description: Transaction hash of the fill
 *               block_number:
 *                 type: number
 *                 description: Block number where the fill occurred
 *               gas_used:
 *                 type: number
 *                 description: Gas used for the transaction (optional)
 *     responses:
 *       201:
 *         description: Order fill recorded successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

/**
 * @swagger
 * /api/orders/alert/{alertId}/trigger:
 *   post:
 *     summary: Trigger orders by alert ID
 *     description: Marks all orders associated with an alert as triggered when the alert fires
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: alertId
 *         required: true
 *         schema:
 *           type: string
 *         description: Alert ID
 *     responses:
 *       200:
 *         description: Orders marked as triggered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "5 order(s) marked as triggered"
 *                 updated_count:
 *                   type: number
 *                   example: 5
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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