import uuid
import logging
from web3 import Web3
from eth_account import Account
from contract_config import (
    WEBHOOK_ORACLE_ABI, 
    CONTRACT_ADDRESS, 
    RPC_URL, 
    PRIVATE_KEY,
    Action,
    ACTION_MAPPING
)

logger = logging.getLogger(__name__)

class BlockchainManager:
    def __init__(self):
        logger.info("Initializing blockchain connection")
        
        if not PRIVATE_KEY:
            raise ValueError("PRIVATE_KEY environment variable not set")
            
        if not CONTRACT_ADDRESS or CONTRACT_ADDRESS == "0x0000000000000000000000000000000000000000":
            raise ValueError("CONTRACT_ADDRESS environment variable not set")
            
        self.w3 = Web3(Web3.HTTPProvider(RPC_URL))
        
        if not self.w3.is_connected():
            raise ConnectionError(f"Failed to connect to blockchain at {RPC_URL}")
            
        self.account = Account.from_key(PRIVATE_KEY)
        self.contract = self.w3.eth.contract(
            address=CONTRACT_ADDRESS,
            abi=WEBHOOK_ORACLE_ABI
        )
        
        logger.info(f"Connected to blockchain: {RPC_URL}")
        logger.info(f"Using account: {self.account.address}")
        logger.info(f"Contract address: {CONTRACT_ADDRESS}")

    def uuid_to_bytes16(self, uuid_str: str) -> bytes:
        """Convert UUID string to bytes16 for contract calls"""
        try:
            # Parse UUID and convert to bytes16
            uuid_obj = uuid.UUID(uuid_str)
            return uuid_obj.bytes
        except Exception as e:
            raise ValueError(f"Invalid UUID format: {uuid_str}") from e

    def action_from_payload(self, payload: dict) -> int:
        """Extract and map action from TradingView payload to contract enum"""
        # Try different common fields for action
        action_str = (
            payload.get("action", "") or 
            payload.get("side", "") or 
            payload.get("signal", "") or
            payload.get("order", "")
        ).lower()
        
        return ACTION_MAPPING.get(action_str, Action.NONE)

    async def submit_alert_on_chain(self, webhook_id: str, payload: dict) -> dict:
        """Submit alert to smart contract using current web3.py best practices"""
        logger.info(f"Submitting alert to blockchain for webhook_id: {webhook_id}")
        
        try:
            # Convert UUID to bytes16
            alert_id_bytes = self.uuid_to_bytes16(webhook_id)
            
            # Map payload to action enum
            action = self.action_from_payload(payload)
            action_name = self._action_to_name(action)
            
            logger.info(f"Mapped action: {action_name} ({action}) for payload: {payload}")
            
            # Build transaction with automatic nonce and gas estimation
            transaction = self.contract.functions.submitAlert(
                alert_id_bytes, action
            ).build_transaction({
                'from': self.account.address,
                'nonce': self.w3.eth.get_transaction_count(self.account.address),
            })
            
            # Sign transaction
            signed_txn = self.w3.eth.account.sign_transaction(transaction, PRIVATE_KEY)
            
            # Send transaction
            tx_hash = self.w3.eth.send_raw_transaction(signed_txn.raw_transaction)
            
            logger.info(f"Transaction submitted: {tx_hash.hex()}")
            
            # Wait for confirmation
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=60)
            
            # Check if transaction was successful
            if receipt.status != 1:
                logger.error(f"Transaction failed: {tx_hash.hex()}")
                raise Exception(f"Transaction failed: {tx_hash.hex()}")
            
            logger.info(f"Transaction confirmed in block {receipt.blockNumber}, gas used: {receipt.gasUsed}")
            
            return {
                "success": True,
                "tx_hash": tx_hash.hex(),
                "block_number": receipt.blockNumber,
                "gas_used": receipt.gasUsed,
                "alert_id": webhook_id,
                "action": action,
                "action_name": action_name
            }
            
        except Exception as e:
            logger.error(f"Failed to submit alert for webhook_id {webhook_id}: {e}")
            return {
                "success": False,
                "error": str(e),
                "alert_id": webhook_id
            }

    def _action_to_name(self, action: int) -> str:
        """Convert action enum to readable name"""
        action_names = {
            Action.NONE: "NONE",
            Action.SHORT: "SHORT", 
            Action.LONG: "LONG"
        }
        return action_names.get(action, "UNKNOWN")

    async def get_alert_from_chain(self, webhook_id: str) -> dict:
        """Retrieve alert data from smart contract"""
        logger.info(f"Retrieving alert from blockchain for webhook_id: {webhook_id}")
        
        try:
            alert_id_bytes = self.uuid_to_bytes16(webhook_id)
            
            # Call contract view function
            result = self.contract.functions.getAlert(alert_id_bytes).call()
            
            # Parse result tuple (alertId, timestamp, action)
            _, timestamp, action = result
            
            exists = timestamp > 0
            logger.info(f"Alert retrieved: exists={exists}, timestamp={timestamp}, action={self._action_to_name(action)}")
            
            return {
                "success": True,
                "alert_id": webhook_id,
                "timestamp": timestamp,
                "action": action,
                "action_name": self._action_to_name(action),
                "exists": exists
            }
            
        except Exception as e:
            logger.error(f"Failed to retrieve alert for webhook_id {webhook_id}: {e}")
            return {
                "success": False,
                "error": str(e),
                "alert_id": webhook_id
            }