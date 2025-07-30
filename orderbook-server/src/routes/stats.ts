import { Router, Request, Response } from 'express';
import { OrderRepository } from '../database/repository.js';

const router = Router();
const orderRepo = new OrderRepository();

// GET /stats - Get orderbook statistics
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