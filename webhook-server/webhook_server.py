import logging
import json
import uuid
from typing import Dict, Optional
from fastapi import FastAPI, Request, HTTPException
from dstack_sdk import AsyncTappdClient, DeriveKeyResponse
from blockchain_utils import BlockchainManager

logger = logging.getLogger(__name__)

class TradingViewIPValidator:
    TRADINGVIEW_IPS = {
        "52.89.214.238", "34.212.75.30", 
        "54.218.53.128", "52.32.178.7"
    }
    
    @classmethod
    def verify_ip(cls, client_ip: str) -> bool:
        return client_ip in cls.TRADINGVIEW_IPS

class WebhookManager:
    def __init__(self):
        self.webhook_users: Dict[str, str] = {}
        
    def create_webhook(self) -> dict:
        webhook_id = str(uuid.uuid4())
        user_id = f"user-{len(self.webhook_users) + 1}"
        self.webhook_users[webhook_id] = user_id
        
        logger.info(f"Created webhook {webhook_id} for {user_id}")
        
        return {
            "webhook_id": webhook_id,
            "webhook_url": f"/webhook/{webhook_id}",
            "user": user_id
        }
    
    def get_user(self, webhook_id: str) -> Optional[str]:
        return self.webhook_users.get(webhook_id)
    
    def webhook_exists(self, webhook_id: str) -> bool:
        return webhook_id in self.webhook_users
    
    def list_webhooks(self) -> list:
        return [
            {"webhook_id": wid, "user": user, "webhook_url": f"/webhook/{wid}"}
            for wid, user in self.webhook_users.items()
        ]

class TEEProcessor:
    @staticmethod
    async def derive_user_key(webhook_id: str, user_id: str) -> Optional[str]:
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
    
    @staticmethod
    async def derive_private_key() -> str:
        try:
            client = AsyncTappdClient()
            derive_key = await client.derive_key('/blockchain/master', 'wallet')
            assert isinstance(derive_key, DeriveKeyResponse)
            
            private_key = derive_key.toBytes(32).hex()
            if not private_key.startswith('0x'):
                private_key = '0x' + private_key
            
            logger.info("TEE master private key derived")
            return private_key
        except Exception as e:
            logger.error(f"TEE private key derivation failed: {e}")
            raise
    

class WebhookServer:
    def __init__(self):
        self.app = FastAPI(title="TradingView Webhook Server")
        self.webhook_manager = WebhookManager()
        self.blockchain_manager = None
        self.tee_processor = TEEProcessor()
        self._setup_routes()
        
        @self.app.on_event("startup")
        async def startup_event():
            await self._initialize_blockchain()
    
    def _setup_routes(self):
        
        @self.app.get("/")
        async def root():
            return {"message": "ok"}

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

        @self.app.get("/health")
        async def health_check():
            return await self._health_check()

        @self.app.get("/status")
        async def server_status():
            return await self._get_server_status()
    
    async def _initialize_blockchain(self):
        try:
            logger.info("Initializing blockchain connection")
            private_key = await self.tee_processor.derive_private_key()
            self.blockchain_manager = BlockchainManager(private_key)
            logger.info("Blockchain connection established")
        except Exception as e:
            logger.critical(f"Blockchain initialization failed: {e}")
            raise SystemExit(f"Blockchain connection required but failed: {e}")
    
    async def _handle_webhook(self, webhook_id: str, request: Request) -> dict:
        logger.info(f"Received webhook: {webhook_id}")
        
        client_ip = self._extract_client_ip(request)
        if not TradingViewIPValidator.verify_ip(client_ip):
            logger.warning(f"Unauthorized IP: {client_ip}")
            raise HTTPException(status_code=403, detail="Request not from TradingView IP")

        if not self.webhook_manager.webhook_exists(webhook_id):
            raise HTTPException(status_code=404, detail="Webhook not found")

        payload = await self._parse_payload(request)
        user_id = self.webhook_manager.get_user(webhook_id)
        
        logger.info(f"Processing webhook for {user_id} from {client_ip}")
        logger.debug(f"Payload: {json.dumps(payload, indent=2)}")
        
        blockchain_result = await self.blockchain_manager.submit_alert_on_chain(webhook_id, payload)
        
        if blockchain_result["success"]:
            logger.info(f"Alert submitted: TX {blockchain_result['tx_hash']}")
        else:
            logger.error(f"Blockchain submission failed: {blockchain_result['error']}")
            raise HTTPException(status_code=500, detail="Failed to process webhook")
        
        return {"status": "received"}
    
    async def _get_alert(self, webhook_id: str) -> dict:
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
    
    async def _health_check(self) -> dict:
        try:
            blockchain_healthy = (
                self.blockchain_manager is not None and 
                self.blockchain_manager.account is not None and
                self.blockchain_manager.w3.is_connected()
            )
            
            tee_healthy = True
            try:
                await self.tee_processor.derive_user_key("health-check", "test")
            except Exception:
                tee_healthy = False
            
            all_healthy = blockchain_healthy and tee_healthy
            
            response = {
                "status": "pass" if all_healthy else "fail",
                "version": "1.0.0",
                "serviceId": "webhook-server"
            }
            
            if not all_healthy:
                response["checks"] = {}
                if not blockchain_healthy:
                    response["checks"]["blockchain"] = [{"status": "fail"}]
                if not tee_healthy:
                    response["checks"]["tee"] = [{"status": "fail"}]
            
            return response
            
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return {"status": "fail", "version": "1.0.0", "serviceId": "webhook-server"}
    
    async def _get_server_status(self) -> dict:
        """Detailed server status endpoint"""
        try:
            # Get blockchain info (filtered for security)
            blockchain_info = {}
            if self.blockchain_manager:
                full_info = self.blockchain_manager.get_account_balance()
                blockchain_info = {
                    "address": full_info.get("address"),
                    "balance_eth": full_info.get("balance_eth"), 
                    "connected": full_info.get("connected"),
                    "chain_id": full_info.get("chain_id"),
                    "latest_block": full_info.get("latest_block")
                }
            
            # Get webhook stats (no sensitive data)
            webhook_stats = {
                "total_webhooks": len(self.webhook_manager.webhook_users)
            }
            
            # TEE status (no sensitive data)
            tee_status = {"available": False}
            try:
                test_key = await self.tee_processor.derive_user_key("status-check", "test")
                tee_status = {
                    "available": test_key is not None,
                    "status": "connected"
                }
            except Exception as e:
                tee_status = {
                    "available": False,
                    "status": "disconnected"
                }
            
            return {
                "server": {
                    "status": "running",
                    "timestamp": self._get_current_timestamp()
                },
                "blockchain": blockchain_info,
                "tee": tee_status,
                "webhooks": webhook_stats
            }
        except Exception as e:
            logger.error(f"Status check failed: {e}")
            return {
                "server": {
                    "status": "error",
                    "error": str(e),
                    "timestamp": self._get_current_timestamp()
                }
            }
    
    def _get_current_timestamp(self) -> str:
        """Get current timestamp in ISO format"""
        from datetime import datetime, timezone
        return datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')
    
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