-- Migration: 001_initial_schema.sql
-- Description: Create initial orderbook schema
-- Date: 2025-01-30

-- Create migration tracking table
CREATE TABLE IF NOT EXISTS migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    version TEXT UNIQUE NOT NULL,
    description TEXT NOT NULL,
    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create orders table
CREATE TABLE orders (
    id TEXT PRIMARY KEY,
    order_hash TEXT UNIQUE NOT NULL,
    chain_id INTEGER NOT NULL,
    
    -- Order data
    maker TEXT NOT NULL,
    maker_asset TEXT NOT NULL,
    taker_asset TEXT NOT NULL,
    making_amount TEXT NOT NULL,
    taking_amount TEXT NOT NULL,
    salt TEXT NOT NULL,
    maker_traits TEXT NOT NULL,
    extension TEXT NOT NULL DEFAULT '',
    receiver TEXT NOT NULL DEFAULT '',
    
    -- Execution data
    signature TEXT NOT NULL,
    alert_id TEXT NOT NULL,
    webhook_id TEXT NOT NULL,
    
    -- Status tracking
    status TEXT NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'triggered', 'partially_filled', 'filled', 'cancelled', 'expired')),
    filled_amount TEXT NOT NULL DEFAULT '0',
    remaining_amount TEXT NOT NULL,
    
    -- Metadata
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME,
    
    -- Indexing fields
    token_pair TEXT
);

-- Create indexes for efficient querying
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_maker ON orders(maker);
CREATE INDEX idx_orders_maker_asset ON orders(maker_asset);
CREATE INDEX idx_orders_taker_asset ON orders(taker_asset);
CREATE INDEX idx_orders_token_pair ON orders(token_pair);
CREATE INDEX idx_orders_alert_id ON orders(alert_id);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_orders_expires_at ON orders(expires_at);

-- Create compound indexes for common query patterns
CREATE INDEX idx_orders_status_token_pair ON orders(status, token_pair);

-- Create fills table for tracking partial fills
CREATE TABLE order_fills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_hash TEXT NOT NULL,
    taker TEXT NOT NULL,
    filled_amount TEXT NOT NULL,
    transaction_hash TEXT NOT NULL,
    block_number INTEGER NOT NULL,
    gas_used INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (order_hash) REFERENCES orders(order_hash)
);

CREATE INDEX idx_fills_order_hash ON order_fills(order_hash);
CREATE INDEX idx_fills_taker ON order_fills(taker);
CREATE INDEX idx_fills_transaction_hash ON order_fills(transaction_hash);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_orders_updated_at
    AFTER UPDATE ON orders
    FOR EACH ROW
BEGIN
    UPDATE orders SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;