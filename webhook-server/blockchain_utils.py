import uuid
import logging
from web3 import Web3
from eth_account import Account
from contract_config import (
    WEBHOOK_ORACLE_ABI, 
    CONTRACT_ADDRESS, 
    RPC_URL,
    Action,
    ACTION_MAPPING
)

logger = logging.getLogger(__name__)

class BlockchainManager:
    def __init__(self, private_key: str = None):
        if not CONTRACT_ADDRESS or CONTRACT_ADDRESS == "0x0000000000000000000000000000000000000000":
            raise ValueError("CONTRACT_ADDRESS not set")
        
        self.w3 = Web3(Web3.HTTPProvider(RPC_URL))
        if not self.w3.is_connected():
            raise ConnectionError(f"Failed to connect to blockchain at {RPC_URL}")
        
        self.private_key = private_key
        self.account = None
        if private_key:
            self.account = Account.from_key(private_key)
            logger.info(f"Account initialized: {self.account.address}")
        
        self.contract = self.w3.eth.contract(
            address=CONTRACT_ADDRESS,
            abi=WEBHOOK_ORACLE_ABI
        )
    
    def get_account_balance(self) -> dict:
        try:
            if not self.account:
                return {"error": "Account not initialized"}
            
            balance_wei = self.w3.eth.get_balance(self.account.address)
            balance_eth = self.w3.from_wei(balance_wei, 'ether')
            
            return {
                "address": self.account.address,
                "balance_eth": str(balance_eth),
                "connected": self.w3.is_connected(),
                "chain_id": self.w3.eth.chain_id,
                "latest_block": self.w3.eth.block_number
            }
        except Exception as e:
            return {"error": str(e)}

    def uuid_to_bytes16(self, uuid_str: str) -> bytes:
        return uuid.UUID(uuid_str).bytes

    def action_from_payload(self, payload: dict) -> int:
        action_str = (
            payload.get("action", "") or 
            payload.get("side", "") or 
            payload.get("signal", "") or
            payload.get("order", "")
        ).lower()
        return ACTION_MAPPING.get(action_str, Action.NONE)

    async def submit_alert_on_chain(self, webhook_id: str, payload: dict) -> dict:
        if not self.account or not self.private_key:
            return {"success": False, "error": "Account not initialized", "alert_id": webhook_id}
        
        try:
            alert_id_bytes = self.uuid_to_bytes16(webhook_id)
            action = self.action_from_payload(payload)
            
            logger.info(f"Submitting alert: {self._action_to_name(action)} for {webhook_id}")
            
            transaction = self.contract.functions.submitAlert(
                alert_id_bytes, action
            ).build_transaction({
                'from': self.account.address,
                'nonce': self.w3.eth.get_transaction_count(self.account.address),
            })
            
            signed_txn = self.w3.eth.account.sign_transaction(transaction, self.private_key)
            tx_hash = self.w3.eth.send_raw_transaction(signed_txn.raw_transaction)
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=60)
            
            if receipt.status != 1:
                raise Exception(f"Transaction failed: {tx_hash.hex()}")
            
            logger.info(f"Alert submitted: {tx_hash.hex()}")
            
            return {
                "success": True,
                "tx_hash": tx_hash.hex(),
                "block_number": receipt.blockNumber,
                "gas_used": receipt.gasUsed,
                "alert_id": webhook_id,
                "action": action,
                "action_name": self._action_to_name(action)
            }
            
        except Exception as e:
            logger.error(f"Failed to submit alert for webhook_id {webhook_id}: {e}")
            return {
                "success": False,
                "error": str(e),
                "alert_id": webhook_id
            }

    def _action_to_name(self, action: int) -> str:
        return {Action.NONE: "NONE", Action.SHORT: "SHORT", Action.LONG: "LONG"}.get(action, "UNKNOWN")

    async def get_alert_from_chain(self, webhook_id: str) -> dict:
        """Retrieve alert data from smart contract"""
        logger.info(f"Retrieving alert from blockchain for webhook_id: {webhook_id}")
        
        try:
            alert_id_bytes = self.uuid_to_bytes16(webhook_id)
            
            # Call contract view function
            result = self.contract.functions.getAlert(alert_id_bytes).call()
            
            # Parse result tuple (alertId, timestamp, action, nonce)
            _, timestamp, action, nonce = result
            
            exists = timestamp > 0
            logger.info(f"Alert retrieved: exists={exists}, timestamp={timestamp}, action={self._action_to_name(action)}")
            
            return {
                "success": True,
                "alert_id": webhook_id,
                "timestamp": timestamp,
                "action": action,
                "action_name": self._action_to_name(action),
                "nonce": nonce,
                "exists": exists
            }
            
        except Exception as e:
            logger.error(f"Failed to retrieve alert for webhook_id {webhook_id}: {e}")
            return {
                "success": False,
                "error": str(e),
                "alert_id": webhook_id
            }