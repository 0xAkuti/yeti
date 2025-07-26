# TradingView Webhook Server with Phala TEE

A FastAPI server that receives TradingView webhooks with signature verification and Phala TEE integration.

## Features

- **Unique webhook URLs**: Each user gets a unique UUID-based webhook endpoint
- **TradingView verification**: IP whitelisting using official TradingView webhook IPs
- **Phala TEE integration**: Derives unique keys for each user using TEE
- **Simple and productive**: Minimal setup, maximum functionality

## Setup

1. **Install dependencies**:
```bash
uv sync
```

2. **Set environment variables**:
```bash
export DSTACK_SIMULATOR_ENDPOINT="http://localhost:8090"
```

3. **Start TEE simulator** (in another terminal):
```bash
docker run --rm -p 8090:8090 phalanetwork/tappd-simulator:latest
```

4. **Run the server**:
```bash
uv run python main.py
```

## Usage

### 1. Create a webhook
```bash
curl -X POST http://localhost:3001/create-webhook
```

Response:
```json
{
  "webhook_id": "123e4567-e89b-12d3-a456-426614174000",
  "webhook_url": "/webhook/123e4567-e89b-12d3-a456-426614174000",
  "user": "user-1"
}
```

### 2. Send webhook (TradingView format)
```bash
curl -X POST http://localhost:3001/webhook/123e4567-e89b-12d3-a456-426614174000 \
  -H "Content-Type: application/json" \
  -d '{"symbol": "BTCUSD", "action": "buy", "price": 50000}'
```

### 3. List all webhooks
```bash
curl http://localhost:3001/webhooks
```

## TradingView Configuration

1. Go to TradingView � Alerts
2. Set webhook URL to: `http://your-server:3001/webhook/{webhook_id}`
3. No additional authentication needed - requests are verified by IP whitelist

## Security

- **IP Whitelisting**: Only accepts requests from official TradingView IPs:
  - 52.89.214.238
  - 34.212.75.30
  - 54.218.53.128
  - 52.32.178.7
- Invalid IPs are rejected with 403 status
- Each user gets a unique TEE-derived key for additional security