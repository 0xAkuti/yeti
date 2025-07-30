# Yeti Orderbook Server

Order storage and discovery server for Yeti conditional orders. Provides a REST API for storing signed limit orders and discovering profitable orders for takers.

## Features

- 📦 **SQLite Database** with proper migrations and versioning
- 🔍 **Order Discovery** with advanced filtering and pagination
- 📊 **Order Statistics** and analytics
- 🚀 **High Performance** with indexed queries
- 🔒 **Production Ready** with proper error handling and logging
- 🎯 **Order Lifecycle Management** with proper state tracking

## Order Lifecycle

Orders progress through the following states:

1. **`pending`** - Order created and waiting for TradingView alert
2. **`triggered`** - Alert fired, order condition met, ready for execution
3. **`partially_filled`** - Order partially executed (for partial fills)
4. **`filled`** - Order completely executed
5. **`cancelled`** - Order cancelled by maker
6. **`expired`** - Order expired (if expiry time set)

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Database
```bash
# Run migrations
npm run db:setup

# Or reset and setup fresh database
npm run db:reset
```

### 3. Start Server
```bash
# Development mode
npm run dev

# Production mode
npm run build && npm start
```

The server will start on port 3002 by default.

## API Endpoints

### Health Check
```
GET /health
```

### Orders

#### Create Order
```
POST /api/orders
Content-Type: application/json

{
  "order_hash": "0x123...",
  "chain_id": 1,
  "maker": "0xabc...",
  "maker_asset": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  "taker_asset": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  "making_amount": "1000000000",
  "taking_amount": "1000000000000000000",
  "salt": "123456789",
  "maker_traits": "0x0",
  "signature": "0x456...",
  "alert_id": "0x789...",
  "webhook_id": "abc-def-ghi"
}
```

#### Get Orders (with filtering)
```
GET /api/orders?status=pending&token_pair=USDC-WETH&limit=50
```

**Query Parameters:**
- `status` - Order status (pending, triggered, partially_filled, filled, cancelled, expired)
- `maker` - Maker address
- `maker_asset` - Maker asset address  
- `taker_asset` - Taker asset address
- `token_pair` - Token pair (e.g., "USDC-WETH")
- `limit` - Results limit (max 1000)
- `offset` - Results offset
- `order_by` - Sort by (created_at, expires_at)
- `order_direction` - Sort direction (ASC, DESC)

#### Get Order by ID/Hash
```
GET /api/orders/:id
GET /api/orders/hash/:orderHash
```

#### Update Order
```
PATCH /api/orders/hash/:orderHash
Content-Type: application/json

{
  "status": "filled",
  "filled_amount": "1000000000",
  "remaining_amount": "0"
}
```

#### Get Orders by Alert ID
```
GET /api/orders/alert/:alertId
```

#### Trigger Orders (Mark as Triggered)
```
POST /api/orders/alert/:alertId/trigger
```
Marks all pending orders with the given alert ID as "triggered" when the TradingView alert fires.

### Order Fills

#### Record Order Fill
```
POST /api/orders/hash/:orderHash/fills
Content-Type: application/json

{
  "taker": "0xdef...",
  "filled_amount": "500000000",
  "transaction_hash": "0x789...",
  "block_number": 12345678,
  "gas_used": 150000
}
```

#### Get Order Fills
```
GET /api/orders/hash/:orderHash/fills
```

### Statistics
```
GET /api/stats
```

## Database Management

### Migrations
```bash
# Check migration status
npm run migrate:status

# Run pending migrations
npm run migrate

# Reset database (destructive!)
npm run migrate:reset

# Full reset and setup
npm run db:reset
```

### Database Schema

**Orders Table:**
- Stores all limit orders with full order data
- Indexed for efficient querying by status, tokens, price ratio
- Tracks order lifecycle (pending → filled/cancelled/expired)

**Order Fills Table:**
- Records individual fills for each order
- Tracks taker, amount, transaction details
- Enables partial fill history

**Migrations Table:**
- Tracks applied database migrations
- Enables safe schema evolution

## Configuration

Create `.env` file:
```bash
PORT=3002
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
DATABASE_PATH=./data/orderbook.db
```

## Integration with Yeti SDK

### Storing Orders (Frontend/Backend)
```typescript
// After signing order in frontend
const orderData = {
  order_hash: signedOrder.orderHash,
  chain_id: 1,
  maker: maker.address,
  // ... other order fields
  signature: signature
};

const response = await fetch('http://localhost:3002/api/orders', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(orderData)
});
```

### Discovering Orders (Taker Bots)
```typescript
// Get profitable orders
const response = await fetch(
  'http://localhost:3002/api/orders?status=pending&token_pair=USDC-WETH&limit=10'
);
const { data: orders } = await response.json();

// Fill profitable orders using Yeti SDK
for (const order of orders) {
  await yeti.filler.fillOrder({
    order: reconstructLimitOrder(order),
    signature: order.signature
  });
}
```

## Production Deployment

1. Use environment variables for configuration
2. Set up proper logging (consider adding winston)
3. Use a process manager (PM2, systemd)
4. Set up regular database backups
5. Monitor disk space (SQLite database will grow)
6. Consider connection pooling for high load

## Development

### Adding New Migrations
```bash
# Create new migration file
touch src/database/migrations/002_add_new_feature.sql
```

Migration file format:
```sql
-- Migration: 002_add_new_feature.sql
-- Description: Add new feature X
-- Date: 2025-01-30

CREATE TABLE new_table (
    id INTEGER PRIMARY KEY,
    ...
);
```

### Testing
```bash
npm test
```