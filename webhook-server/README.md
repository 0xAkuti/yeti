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
# For ngrok (get from https://dashboard.ngrok.com/get-started/your-authtoken)
export NGROK_AUTHTOKEN="your-ngrok-authtoken"
```

3. **Start TEE simulator** (in another terminal):
```bash
docker run --rm -p 8090:8090 phalanetwork/tappd-simulator:latest
```

4. **Run the server**:

**Option A: Local development**
```bash
uv run python main.py
```

**Option B: Docker with ngrok (recommended for TradingView)**
```bash
# Set your ngrok authtoken first
export NGROK_AUTHTOKEN="your-token-here"

# Build and run everything (webhook server, TEE simulator, ngrok)
docker compose up --build

# Access ngrok dashboard at http://localhost:4040
# Your public webhook URLs will be shown there
```

**Option C: Docker without ngrok**
```bash
# Build and run with docker-compose (includes TEE simulator)
docker compose up --build webhook-server tee-simulator

# Or build and run manually
docker build -t webhook-server .
docker run --rm -p 3001:3001 -e DSTACK_SIMULATOR_ENDPOINT="http://host.docker.internal:8090" webhook-server
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
2. Set webhook URL to: `https://your-ngrok-url.ngrok.io/webhook/{webhook_id}`
   - Get your ngrok URL from http://localhost:4040 (ngrok dashboard)
   - Use the HTTPS URL for better security
3. No additional authentication needed - requests are verified by IP whitelist

**Note**: When using ngrok, TradingView's IP whitelist won't work since requests come through ngrok's servers. For production, consider using ngrok's authentication features or deploy to a server with a static IP.

## Security

- **IP Whitelisting**: Only accepts requests from official TradingView IPs:
  - 52.89.214.238
  - 34.212.75.30
  - 54.218.53.128
  - 52.32.178.7
- Invalid IPs are rejected with 403 status
- Each user gets a unique TEE-derived key for additional security