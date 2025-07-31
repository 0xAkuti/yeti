import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import DatabaseConnection from './database/connection.js';
import MigrationManager from './database/migrate.js';
import { OrderRepository } from './database/repository.js';
import { AlertMonitor, AlertMonitorConfig } from './services/alert-monitor.js';
import ordersRouter from './routes/orders.js';
import statsRouter from './routes/stats.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

// Global AlertMonitor instance
let alertMonitor: AlertMonitor | null = null;

// Swagger configuration
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Yeti Orderbook Server API',
            version: '1.0.0',
            description: 'Order storage and discovery server for Yeti conditional orders',
            license: {
                name: 'MIT',
            },
        },
        servers: [
            {
                url: `http://localhost:${PORT}`,
                description: 'Development server',
            },
        ],
        components: {
            schemas: {
                Order: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        order_hash: { type: 'string' },
                        chain_id: { type: 'number' },
                        maker: { type: 'string' },
                        maker_asset: { type: 'string' },
                        taker_asset: { type: 'string' },
                        making_amount: { type: 'string' },
                        taking_amount: { type: 'string' },
                        salt: { type: 'string' },
                        maker_traits: { type: 'string' },
                        extension: { type: 'string' },
                        receiver: { type: 'string' },
                        signature: { type: 'string' },
                        alert_id: { type: 'string' },
                        webhook_id: { type: 'string' },
                        status: { 
                            type: 'string',
                            enum: ['pending', 'triggered', 'partially_filled', 'filled', 'cancelled', 'expired']
                        },
                        filled_amount: { type: 'string' },
                        remaining_amount: { type: 'string' },
                        created_at: { type: 'string', format: 'date-time' },
                        updated_at: { type: 'string', format: 'date-time' },
                        expires_at: { type: 'string', format: 'date-time' },
                        token_pair: { type: 'string' }
                    }
                },
                CreateOrderRequest: {
                    type: 'object',
                    required: ['order_hash', 'signature', 'maker', 'chain_id', 'maker_asset', 'taker_asset', 'making_amount', 'taking_amount', 'salt', 'maker_traits', 'alert_id', 'webhook_id'],
                    properties: {
                        order_hash: { type: 'string' },
                        chain_id: { type: 'number' },
                        maker: { type: 'string' },
                        maker_asset: { type: 'string' },
                        taker_asset: { type: 'string' },
                        making_amount: { type: 'string' },
                        taking_amount: { type: 'string' },
                        salt: { type: 'string' },
                        maker_traits: { type: 'string' },
                        extension: { type: 'string' },
                        receiver: { type: 'string' },
                        signature: { type: 'string' },
                        alert_id: { type: 'string' },
                        webhook_id: { type: 'string' },
                        expires_at: { type: 'string', format: 'date-time' }
                    }
                },
                OrderFill: {
                    type: 'object',
                    properties: {
                        id: { type: 'number' },
                        order_hash: { type: 'string' },
                        taker: { type: 'string' },
                        filled_amount: { type: 'string' },
                        transaction_hash: { type: 'string' },
                        block_number: { type: 'number' },
                        gas_used: { type: 'number' },
                        created_at: { type: 'string', format: 'date-time' }
                    }
                },
                Error: {
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                        details: { type: 'string' }
                    }
                },
                SuccessResponse: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' }
                    }
                }
            }
        }
    },
    apis: ['./src/routes/*.ts', './src/index.ts'],
};

const specs = swaggerJsdoc(swaggerOptions);

// Middleware
app.use(helmet());
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000'
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Swagger UI
app.use('/docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }'
}));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
    next();
});

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns the health status of the server and AlertMonitor
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Server is healthy
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
 *                   example: "Yeti Orderbook Server is running"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 database:
 *                   type: string
 *                   example: "/path/to/database.db"
 *                 alertMonitor:
 *                   type: object
 *                   properties:
 *                     enabled:
 *                       type: boolean
 *                     running:
 *                       type: boolean
 *                     providerUrl:
 *                       type: string
 *                     currentBlock:
 *                       type: number
 */
app.get('/health', async (_req, res) => {
    const healthData: any = {
        success: true,
        message: 'Yeti Orderbook Server is running',
        timestamp: new Date().toISOString(),
        database: DatabaseConnection.getDatabasePath()
    };

    // Add AlertMonitor status if available
    if (alertMonitor) {
        const status = alertMonitor.getStatus();
        try {
            const currentBlock = await alertMonitor.getCurrentBlock();
            healthData.alertMonitor = {
                enabled: true,
                running: status.isRunning,
                providerUrl: status.providerUrl,
                currentBlock,
                reconnectAttempts: status.reconnectAttempts,
                contracts: status.contractAddresses
            };
        } catch (error) {
            healthData.alertMonitor = {
                enabled: true,
                running: false,
                error: 'Failed to connect to blockchain',
                providerUrl: status.providerUrl,
                reconnectAttempts: status.reconnectAttempts
            };
        }
    } else {
        healthData.alertMonitor = {
            enabled: false,
            message: 'AlertMonitor not configured'
        };
    }

    res.json(healthData);
});

// API routes
app.use('/api/orders', ordersRouter);
app.use('/api/stats', statsRouter);

/**
 * @swagger
 * /:
 *   get:
 *     summary: API information endpoint
 *     description: Returns basic information about the API
 *     tags: [Info]
 *     responses:
 *       200:
 *         description: API information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                   example: "Yeti Orderbook Server"
 *                 version:
 *                   type: string
 *                   example: "1.0.0"
 *                 description:
 *                   type: string
 *                   example: "Order storage and discovery server for Yeti conditional orders"
 *                 endpoints:
 *                   type: object
 *                   properties:
 *                     health:
 *                       type: string
 *                       example: "/health"
 *                     orders:
 *                       type: string
 *                       example: "/api/orders"
 *                     stats:
 *                       type: string
 *                       example: "/api/stats"
 *                     docs:
 *                       type: string
 *                       example: "/docs"
 */
app.get('/', (_req, res) => {
    res.json({
        name: 'Yeti Orderbook Server',
        version: '1.0.0',
        description: 'Order storage and discovery server for Yeti conditional orders',
        endpoints: {
            health: '/health',
            orders: '/api/orders',
            stats: '/api/stats',
            docs: '/docs'
        }
    });
});

// Error handling middleware
app.use((error: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('Unhandled error:', error);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Not found',
        message: `Route ${req.method} ${req.originalUrl} not found`
    });
});

// Initialize database and start server
async function startServer() {
    try {
        console.log('🚀 Starting Yeti Orderbook Server...');
        
        // Run database migrations
        const migrationManager = new MigrationManager();
        await migrationManager.runMigrations();
        
        // Initialize AlertMonitor if blockchain configuration is provided
        const alertMonitorEnabled = process.env.ALERT_MONITOR_ENABLED !== 'false';
        
        if (alertMonitorEnabled && process.env.RPC_URL && process.env.WEBHOOK_ORACLE_ADDRESS && process.env.WEBHOOK_PREDICATE_ADDRESS) {
            console.log('🔍 Initializing AlertMonitor...');
            
            const alertConfig: AlertMonitorConfig = {
                providerUrl: process.env.RPC_URL,
                webhookOracleAddress: process.env.WEBHOOK_ORACLE_ADDRESS,
                webhookPredicateAddress: process.env.WEBHOOK_PREDICATE_ADDRESS,
                reconnectDelay: parseInt(process.env.RECONNECT_DELAY || '5000'),
                maxReconnectAttempts: parseInt(process.env.MAX_RECONNECT_ATTEMPTS || '10'),
                pollInterval: parseInt(process.env.POLL_INTERVAL || '30000')
            };
            
            const orderRepo = new OrderRepository();
            alertMonitor = new AlertMonitor(alertConfig, orderRepo);
            
            try {
                await alertMonitor.start();
                console.log('✅ AlertMonitor started successfully');
            } catch (error) {
                console.error('⚠️ AlertMonitor failed to start:', error);
                console.log('📝 Server will continue without blockchain monitoring');
            }
        } else {
            console.log('ℹ️ AlertMonitor disabled or missing blockchain configuration');
            console.log('📝 Set RPC_URL, WEBHOOK_ORACLE_ADDRESS, and WEBHOOK_PREDICATE_ADDRESS to enable');
        }
        
        // Start server
        app.listen(PORT, () => {
            console.log(`✅ Server running on port ${PORT}`);
            console.log(`📡 Health check: http://localhost:${PORT}/health`);
            console.log(`📚 API info: http://localhost:${PORT}/`);
            console.log(`🚀 Swagger UI: http://localhost:${PORT}/docs`);
            console.log(`📁 Database: ${DatabaseConnection.getDatabasePath()}`);
            
            if (alertMonitor) {
                const status = alertMonitor.getStatus();
                console.log(`🔍 AlertMonitor: ${status.isRunning ? 'Running' : 'Stopped'}`);
                console.log(`🔗 RPC: ${status.providerUrl}`);
                console.log(`🏛️ Oracle: ${status.contractAddresses.webhookOracle}`);
            }
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Graceful shutdown
async function shutdown() {
    console.log('\n🛑 Shutting down server...');
    
    if (alertMonitor) {
        console.log('🔍 Stopping AlertMonitor...');
        await alertMonitor.stop();
    }
    
    DatabaseConnection.closeConnection();
    process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Start the server
startServer();