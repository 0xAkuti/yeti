# YETI - TradingView to DeFi Bridge

Built with ❄️ by the YETI team for EthGlobal Unite DeFi Hackathon 2025

<div align="center">
  <img src="yeti-frontend2/public/hero-yeti.png" alt="YETI - TradingView to 1inch" height="512" />
</div>

YETI is a DeFi trading app that bridges TradingView alerts to automated on-chain limit orders using the 1inch Limit Order Protocol. Built for the EthGlobal Unite DeFi Hackathon, YETI transforms your existing TradingView strategies into secure, non-custodial, automated trading systems.

## Architecture Overview

YETI consists of six interconnected components that work together to provide a complete TradingView-to-DeFi trading solution:

```
TradingView Alert → Webhook Server → Smart Contracts → Order Execution
                         ↓               ↓
                   Frontend UI ← → Orderbook Server ← → Order Watcher
```

### Core Components

1. **Webhook Server** (Python/FastAPI) - Receives and validates TradingView webhooks; Running in a TEE
2. **Smart Contracts** (Solidity) - On-chain oracle and predicate validation
3. **Frontend Application** (Next.js/React) - User interface for order management
4. **Yeti SDK** (TypeScript) - Core library for order creation and management
5. **Orderbook Server** (Node.js/Express) - Order storage and discovery service
6. **Order Watcher** (Node.js) - Automated order execution service

## Key Features

- **Non-Custodial Security**: Funds never leave your wallet
- **TradingView Integration**: Use your existing strategies and indicators
- **Automated Execution**: Orders execute automatically when alerts trigger
- **Open & Verifiable**: All trades recorded on-chain with full transparency
- **TEE Security**: Trusted Execution Environment for webhook authentication and oracle

## Technology Stack

- **Smart Contracts**: Solidity, Foundry, 1inch Limit Order Protocol, Solady
- **Backend**: Python (FastAPI), Node.js (Express), TypeScript
- **Frontend**: Next.js, React, TailwindCSS, Framer Motion
- **Database**: SQLite with better-sqlite3
- **Blockchain**: Base for now but EVM compatible
- **Security**: Chainlink oracles, HMAC webhook validation, TEE integration

## Usage

### 1. Create a Conditional Order

1. Connect your wallet
2. Select trading pair and amounts
3. Sign the order (no funds transferred)
4. Copy the generated webhook URL and secret

### 2. Setup TradingView Alert

1. Create a new alert in TradingView
2. Set the webhook URL from step 1
3. Set the message to: `buy_[secret]` or `sell_[secret]`
4. Configure your trading conditions
5. Save the alert

### 3. Order Execution

When your TradingView alert triggers:

1. Webhook server receives and validates the alert
2. Alert data is stored on-chain via WebhookOracle
3. Order watcher detects the alert
4. Takers can execute the 1inch limit order
5. Order status updates in the orderbook

You can check pending and filled ordered in the Dashboard.

## Quick Start

### Prerequisites

- Node.js 18+ and npm/yarn
- Python 3.9+ and uv
- Git
- A Web3 wallet (MetaMask recommended)
- TradingView Pro account (for webhook alerts)

### 1. Clone the Repository

```bash
git clone https://github.com/0xAkuti/yeti.git
cd yeti
```

### 2. Setup Smart Contracts

```bash
cd contracts
forge install
forge build
forge test

# Deploy to local network (anvil)
anvil &
forge script script/SetupAnvilEnvironment.s.sol --broadcast --rpc-url http://localhost:8545
```

### 3. Setup Webhook Server

```bash
cd webhook-server
cp .env.example .env
# Edit .env with your configuration
uv sync
uv run main.py
```

### 4. Setup Orderbook Server

```bash
cd orderbook-server
npm install
cp .env.example .env
# Edit .env with contract addresses
npm run db:setup
npm run dev
```

### 5. Setup Order Watcher

```bash
cd yeti-order-manager
npm install
cp .env.sample .env
# Edit .env with your private key and contract addresses
npm run watch-orders
```

### 6. Setup Frontend

```bash
cd yeti-frontend2
npm install
cp .env.example .env.local
# Edit .env.local with your configuration
npm run dev
```

## Configuration

### Environment Variables

#### Webhook Server (.env)
```bash
CONTRACT_ADDRESS=0x...              # WebhookOracle contract address
RPC_URL=http://localhost:8545       # Blockchain RPC endpoint
DSTACK_SIMULATOR_ENDPOINT=...       # TEE endpoint
TEE_SECRET=123                      # TEE secret key
NGROK_AUTHTOKEN=...                 # Ngrok auth token for public webhooks
```

#### Order Manager (.env)
```bash
RPC_URL=http://localhost:8545                              # Blockchain RPC
PRIVATE_KEY=0x...                                          # Trading wallet private key
ORDERBOOK_URL=http://localhost:3002                        # Orderbook server URL
WEBHOOK_SERVER_URL=http://localhost:3001                   # Webhook server URL
LIMIT_ORDER_PROTOCOL_ADDRESS=0x111111125421cA6dc452d289... # 1inch contract
WEBHOOK_ORACLE_ADDRESS=0x...                               # Oracle contract
WEBHOOK_PREDICATE_ADDRESS=0x...                            # Predicate contract
```

#### Orderbook Server (.env)
```bash
PORT=3002                           # Server port
RPC_URL=http://localhost:8545       # Blockchain RPC
WEBHOOK_ORACLE_ADDRESS=0x...        # Oracle contract
WEBHOOK_PREDICATE_ADDRESS=0x...     # Predicate contract
ALERT_MONITOR_ENABLED=true          # Enable blockchain monitoring
```

### Contract Addresses

Deploy contracts using the provided Foundry scripts or use existing deployments:

- **Ethereum Mainnet**: See [1inch documentation](https://docs.1inch.io/docs/limit-order-protocol/smart-contract)
- **Base**: Custom deployment required
- **Local Development**: Use `SetupAnvilEnvironment.s.sol` script

## API Reference

### Webhook Server

```bash
POST /create-webhook              # Create new webhook
POST /webhook/{id}               # Receive TradingView alert
GET  /alert/{id}                 # Get alert status
GET  /health                     # Health check
GET  /status                     # Server status
```

### Orderbook Server

```bash
GET    /api/orders               # List orders
POST   /api/orders               # Create order
GET    /api/orders/{id}          # Get order details
PATCH  /api/orders/{id}          # Update order
DELETE /api/orders/{id}          # Cancel order
GET    /api/stats                # Order statistics
```

## SDK Usage

```typescript
import { YetiSDK } from 'yeti-order-manager';
import { JsonRpcProvider, Wallet } from 'ethers';

// Initialize SDK
const provider = new JsonRpcProvider('http://localhost:8545');
const signer = new Wallet('0x...', provider);

const sdk = new YetiSDK({
    provider,
    signer,
    webhookServerUrl: 'http://localhost:3001',
    orderbookServerUrl: 'http://localhost:3002',
    contracts: {
        limitOrderProtocol: '0x...',
        webhookOracle: '0x...',
        webhookPredicate: '0x...',
        chainlinkCalculator: '0x...'
    }
});

// Create conditional order
const { webhook, orderData, tradingViewSetup } = await sdk.createConditionalOrder({
    makerAsset: '0x...', // USDC
    takerAsset: '0x...', // WETH
    makingAmount: '1000000000', // 1000 USDC
    takingAmount: '300000000000000000', // 0.3 WETH
    action: 'LONG'
}, '0x...'); // maker address

console.log('TradingView Setup:', tradingViewSetup);

// Sign and submit order
const orderForSigning = sdk.getOrderForSigning(orderData, 1); // chainId
const signature = await signer.signTypedData(
    orderForSigning.domain,
    orderForSigning.types,
    orderForSigning.values
);

// Store in orderbook
await sdk.orderbook.createOrder({
    ...orderData,
    signature
});

// Watch and auto-fill (for backend services)
await sdk.watchAndFillOrder(orderData, signature);
```

## Security

### Webhook Validation

- HMAC-based webhook authentication using TEE-derived secrets
- IP address validation for TradingView webhooks
- Nonce-based replay attack prevention
- Constant-time comparison for timing attack prevention
- Only the webhook server running in TEE is authorized to submit to oracle

### Smart Contract Security

- Role-based access control for oracle submissions
- Time-based alert validation (configurable max age) and oralce staleness
- Immutable predicate validation logic
- Integration with audited 1inch protocol

### Non-Custodial Design

- Orders signed client-side, funds never transferred to contracts
- Private keys remain in user control
- On-chain execution through established 1inch infrastructure
- Full transaction transparency and auditability

## Development

### Running Tests

```bash
# Smart contracts
cd contracts && forge test

# Order manager
cd yeti-order-manager && npm test

# Orderbook server
cd orderbook-server && npm test
```

### Local Development Setup

1. Start local blockchain: `anvil`
2. Deploy contracts: `forge script script/SetupAnvilEnvironment.s.sol --broadcast`
3. Start all services in separate terminals:
   - `cd webhook-server && uv run main.py`
   - `cd orderbook-server && npm run dev`
   - `cd yeti-order-manager && npm run watch-orders`
   - `cd yeti-frontend2 && npm run dev`

### Docker Deployment

```bash
# Webhook server
cd webhook-server
docker build -t yeti-webhook-server .
docker run -p 3001:3001 --env-file .env yeti-webhook-server

# Or use docker-compose
docker-compose up
```

## Production Deployment

### Infrastructure Requirements

- **Webhook Server**: Python 3.9+, 1GB RAM, public endpoint
- **Orderbook Server**: Node.js 18+, 2GB RAM, SQLite storage
- **Order Watcher**: Node.js 18+, 1GB RAM, private key access
- **Frontend**: Static hosting (Vercel, Netlify)

### Security Considerations

1. Use environment-specific private keys
2. Enable HTTPS for all endpoints
3. Configure proper CORS policies
4. Monitor webhook endpoints for abuse
5. Implement rate limiting and DDoS protection
6. Use hardware wallets for high-value operations

### Monitoring

- Health endpoints for all services
- Blockchain connection monitoring
- Order execution tracking
- Alert delivery verification
- Gas price optimization

## Contributing

This project was built for the EthGlobal Unite DeFi Hackathon. Contributions are welcome:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Acknowledgments

- **1inch**: For the robust Limit Order Protocol
- **EthGlobal**: For hosting the Unite DeFi Hackathon
- **TradingView**: For powerful charting and alert capabilities
- **Chainlink**: For reliable price oracle infrastructure


