import { Router, Request, Response } from 'express';
import { OrderRepository } from '../database/repository.js';

const router = Router();
const orderRepo = new OrderRepository();

/**
 * @swagger
 * /api/stats:
 *   get:
 *     summary: Get orderbook statistics
 *     description: Retrieves statistical information about the orderbook
 *     tags: [Statistics]
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   description: Statistical data about orders
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to fetch statistics"
 *                 details:
 *                   type: string
 */
router.get('/', async (req: Request, res: Response) => {
    try {
        const stats = await orderRepo.getOrderStats();

        res.json({
            success: true,
            data: stats
        });
    } catch (error: any) {
        console.error('Error fetching stats:', error);
        res.status(500).json({
            error: 'Failed to fetch statistics',
            details: error.message
        });
    }
});

export default router;