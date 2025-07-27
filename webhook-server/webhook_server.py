import logging
import json
import uuid
from typing import Dict, Any, Optional
from fastapi import FastAPI, Request, HTTPException
from dstack_sdk import AsyncTappdClient, DeriveKeyResponse
from blockchain_utils import BlockchainManager

logger = logging.getLogger(__name__)

class TradingViewIPValidator:
    """Handles TradingView IP whitelist validation"""
    
    TRADINGVIEW_IPS = {
        "52.89.214.238",
        "34.212.75.30", 
        "54.218.53.128",
        "52.32.178.7"
    }
    
    @classmethod
    def verify_ip(cls, client_ip: str) -> bool:
        """Verify request comes from TradingView IP addresses"""
        return client_ip in cls.TRADINGVIEW_IPS

class WebhookManager:
    """Manages webhook creation and user mapping"""
    
    def __init__(self):
        self.webhook_users: Dict[str, str] = {}
        
    def create_webhook(self) -> dict:
        """Create a unique webhook URL for a user"""
        webhook_id = str(uuid.uuid4())
        user_id = f"user-{len(self.webhook_users) + 1}"
        self.webhook_users[webhook_id] = user_id
        
        logger.info(f"Created webhook for user {user_id}: {webhook_id}")
        
        return {
            "webhook_id": webhook_id,
            "webhook_url": f"/webhook/{webhook_id}",
            "user": user_id
        }
    
    def get_user(self, webhook_id: str) -> Optional[str]:
        """Get user for webhook ID"""
        return self.webhook_users.get(webhook_id)
    
    def webhook_exists(self, webhook_id: str) -> bool:
        """Check if webhook exists"""
        return webhook_id in self.webhook_users
    
    def list_webhooks(self) -> list:
        """List all created webhooks"""
        return [
            {
                "webhook_id": wid,
                "user": user,
                "webhook_url": f"/webhook/{wid}"
            }
            for wid, user in self.webhook_users.items()
        ]

class TEEProcessor:
    """Handles Phala TEE integration"""
    
    @staticmethod
    async def derive_user_key(webhook_id: str, user_id: str) -> Optional[str]:
        """Derive unique key for user via TEE"""
        try:
            client = AsyncTappdClient()
            derive_key = await client.derive_key(f'/webhook/{webhook_id}', user_id)
            assert isinstance(derive_key, DeriveKeyResponse)
            user_key = derive_key.toBytes(32).hex()
            
            logger.info(f"TEE key derived for user {user_id}")
            return user_key
            
        except Exception as e:
            logger.warning(f"TEE key derivation failed for user {user_id}: {e}")
            return None

class WebhookServer:
    """Main webhook server application"""
    
    def __init__(self):
        self.app = FastAPI(title="TradingView Webhook Server")
        self.webhook_manager = WebhookManager()
        self.blockchain_manager = None
        self.tee_processor = TEEProcessor()
        
        # Setup routes
        self._setup_routes()
        
        # Setup startup event
        @self.app.on_event("startup")
        async def startup_event():
            await self._initialize_blockchain()
    
    def _setup_routes(self):
        """Setup FastAPI routes"""
        
        @self.app.get("/")
        async def root():
            return {"message": "TradingView Webhook Server with Blockchain Integration"}

        @self.app.post("/create-webhook")
        async def create_webhook():
            return self.webhook_manager.create_webhook()

        @self.app.post("/webhook/{webhook_id}")
        async def receive_webhook(webhook_id: str, request: Request):
            return await self._handle_webhook(webhook_id, request)

        @self.app.get("/webhooks")
        async def list_webhooks():
            return {"webhooks": self.webhook_manager.list_webhooks()}

        @self.app.get("/alert/{webhook_id}")
        async def get_alert(webhook_id: str):
            return await self._get_alert(webhook_id)
    
    async def _initialize_blockchain(self):
        """Initialize blockchain connection - required for operation"""
        try:
            logger.info("Initializing blockchain connection")
            self.blockchain_manager = BlockchainManager()
            logger.info("Blockchain connection established successfully")
        except Exception as e:
            logger.critical(f"Failed to initialize blockchain connection: {e}")
            raise SystemExit(f"Blockchain connection required but failed: {e}")
    
    async def _handle_webhook(self, webhook_id: str, request: Request) -> dict:
        """Handle incoming webhook requests"""
        logger.info(f"Received webhook request for ID: {webhook_id}")
        
        # Verify IP
        client_ip = self._extract_client_ip(request)
        if not TradingViewIPValidator.verify_ip(client_ip):
            logger.warning(f"Rejected request from unauthorized IP: {client_ip}")
            raise HTTPException(status_code=403, detail="Request not from TradingView IP")

        # Check webhook exists
        if not self.webhook_manager.webhook_exists(webhook_id):
            logger.warning(f"Webhook not found: {webhook_id}")
            raise HTTPException(status_code=404, detail="Webhook not found")

        # Parse payload
        payload = await self._parse_payload(request)
        user_id = self.webhook_manager.get_user(webhook_id)
        
        logger.info(f"Processing webhook for user {user_id} from IP {client_ip}")
        logger.debug(f"Payload: {json.dumps(payload, indent=2)}")
        
        # Process with TEE
        await self.tee_processor.derive_user_key(webhook_id, user_id)
        
        # Submit to blockchain (required)
        blockchain_result = await self.blockchain_manager.submit_alert_on_chain(webhook_id, payload)
        
        if blockchain_result["success"]:
            logger.info(f"Alert submitted successfully: TX {blockchain_result['tx_hash']}")
        else:
            logger.error(f"Blockchain submission failed: {blockchain_result['error']}")
            raise HTTPException(
                status_code=500, 
                detail="Failed to process webhook"
            )
        
        return {"status": "received"}
    
    async def _get_alert(self, webhook_id: str) -> dict:
        """Retrieve alert data from blockchain"""
        if not self.webhook_manager.webhook_exists(webhook_id):
            raise HTTPException(status_code=404, detail="Webhook not found")
        
        try:
            result = await self.blockchain_manager.get_alert_from_chain(webhook_id)
            if not result["success"]:
                raise HTTPException(status_code=500, detail=result["error"])
            return result
        except Exception as e:
            logger.error(f"Failed to retrieve alert {webhook_id}: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to retrieve alert: {e}")
    
    def _extract_client_ip(self, request: Request) -> str:
        """Extract client IP from request headers"""
        client_ip = request.client.host
        
        # Handle reverse proxy scenarios (ngrok, etc.)
        if client_ip.startswith('172') or client_ip.startswith('10.'):
            forwarded_for = request.headers.get('x-forwarded-for')
            if forwarded_for:
                client_ip = forwarded_for.split(',')[0].strip()
        
        return client_ip
    
    async def _parse_payload(self, request: Request) -> dict:
        """Parse request payload"""
        body = await request.body()
        
        if body.startswith(b'{'):
            try:
                return json.loads(body.decode('utf-8'))
            except json.JSONDecodeError:
                raise HTTPException(status_code=400, detail="Invalid JSON")
        else:
            return {'message': body.decode('utf-8')}

def create_app() -> FastAPI:
    """Factory function to create FastAPI app"""
    server = WebhookServer()
    return server.app