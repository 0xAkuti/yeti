import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import DatabaseConnection from './database/connection.js';
import MigrationManager from './database/migrate.js';
import ordersRouter from './routes/orders.js';
import statsRouter from './routes/stats.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(helmet());
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000'
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
    next();
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Yeti Orderbook Server is running',
        timestamp: new Date().toISOString(),
        database: DatabaseConnection.getDatabasePath()
    });
});

// API routes
app.use('/api/orders', ordersRouter);
app.use('/api/stats', statsRouter);

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        name: 'Yeti Orderbook Server',
        version: '1.0.0',
        description: 'Order storage and discovery server for Yeti conditional orders',
        endpoints: {
            health: '/health',
            orders: '/api/orders',
            stats: '/api/stats'
        }
    });
});

// Error handling middleware
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
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
        
        // Start server
        app.listen(PORT, () => {
            console.log(`✅ Server running on port ${PORT}`);
            console.log(`📡 Health check: http://localhost:${PORT}/health`);
            console.log(`📚 API docs: http://localhost:${PORT}/`);
            console.log(`📁 Database: ${DatabaseConnection.getDatabasePath()}`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    DatabaseConnection.closeConnection();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down server...');
    DatabaseConnection.closeConnection();
    process.exit(0);
});

// Start the server
startServer();