import os
import uuid
import json
from typing import Dict, Any
from fastapi import FastAPI, Request, HTTPException
from dstack_sdk import AsyncTappdClient, DeriveKeyResponse

app = FastAPI(title="TradingView Webhook Server")

# Store user webhook IDs (in production, use a database)
webhook_users: Dict[str, str] = {}

# TradingView official webhook IP addresses for whitelisting
TRADINGVIEW_IPS = {
    "52.89.214.238",
    "34.212.75.30", 
    "54.218.53.128",
    "52.32.178.7"
}

def verify_tradingview_ip(client_ip: str) -> bool:
    """Verify request comes from TradingView IP addresses"""
    return client_ip in TRADINGVIEW_IPS

@app.get("/")
async def root():
    return {"message": "TradingView Webhook Server with Phala TEE"}

@app.post("/create-webhook")
async def create_webhook():
    """Create a unique webhook URL for a user"""
    webhook_id = str(uuid.uuid4())
    webhook_users[webhook_id] = f"user-{len(webhook_users) + 1}"
    
    return {
        "webhook_id": webhook_id,
        "webhook_url": f"/webhook/{webhook_id}",
        "user": webhook_users[webhook_id]
    }

@app.post("/webhook/{webhook_id}")
async def receive_webhook(
    webhook_id: str,
    request: Request
):
    """Receive and process TradingView webhook"""
    
    # Verify request comes from TradingView IP
    client_ip = request.client.host
    if client_ip.startswith('172'): # using ngrok, so get the real ip
        client_ip = request.headers['x-forwarded-for']

    if not verify_tradingview_ip(client_ip):
        print(f'POST request from {client_ip} rejected')
        raise HTTPException(status_code=403, detail="Request not from TradingView IP")

    # Check if webhook_id exists
    if webhook_id not in webhook_users:
        raise HTTPException(status_code=404, detail="Webhook not found")

    # Get request body
    body = await request.body()
    
    # Parse JSON payload
    if body.startswith(b'{'):
        try:
            payload = json.loads(body.decode('utf-8'))
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid JSON")
    else:
        payload = {'message': body.decode('utf-8')}
    
    user = webhook_users[webhook_id]
    
    print(f"=== WEBHOOK RECEIVED ===")
    print(f"User: {user}")
    print(f"Webhook ID: {webhook_id}")
    print(f"Client IP: {client_ip}")
    print(f"Payload: {json.dumps(payload, indent=2)}")
    print("========================")
    
    # Process with Phala TEE (derive a key for this user/webhook)
    try:
        client = AsyncTappdClient()
        derive_key = await client.derive_key(f'/webhook/{webhook_id}', user)
        assert isinstance(derive_key, DeriveKeyResponse)
        user_key = derive_key.toBytes(32).hex()
        
        print(f"User TEE Key: {user_key}")
        
    except Exception as e:
        print(f"TEE processing error: {e}")
        # Continue without TEE if simulator not available
    
    return {
        "status": "success",
        "user": user,
        "webhook_id": webhook_id,
        "message": "Webhook processed successfully"
    }

@app.get("/webhooks")
async def list_webhooks():
    """List all created webhooks"""
    return {
        "webhooks": [
            {
                "webhook_id": wid,
                "user": user,
                "webhook_url": f"/webhook/{wid}"
            }
            for wid, user in webhook_users.items()
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3001)
