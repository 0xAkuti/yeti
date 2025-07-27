# Smart Contract Configuration
import os

# Contract ABI - Essential functions only
WEBHOOK_ORACLE_ABI = [
    {
        "type": "function",
        "name": "submitAlert",
        "inputs": [
            {"name": "_alertId", "type": "bytes16"},
            {"name": "_action", "type": "uint8"}
        ],
        "outputs": [],
        "stateMutability": "nonpayable"
    },
    {
        "type": "function", 
        "name": "getAlert",
        "inputs": [{"name": "_alertId", "type": "bytes16"}],
        "outputs": [
            {
                "name": "",
                "type": "tuple",
                "components": [
                    {"name": "alertId", "type": "bytes16"},
                    {"name": "timestamp", "type": "uint32"},
                    {"name": "action", "type": "uint8"}
                ]
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "event",
        "name": "AlertSubmitted",
        "inputs": [
            {"name": "alertId", "type": "bytes16", "indexed": True},
            {"name": "action", "type": "uint8", "indexed": False},
            {"name": "timestamp", "type": "uint32", "indexed": False}
        ],
        "anonymous": False
    }
]

# Contract configuration
CONTRACT_ADDRESS = os.getenv("CONTRACT_ADDRESS", "0x0000000000000000000000000000000000000000")
RPC_URL = os.getenv("RPC_URL", "http://localhost:8545")  # Anvil default
PRIVATE_KEY = os.getenv("PRIVATE_KEY", "")

# Action enum mapping
class Action:
    NONE = 0
    SHORT = 1  
    LONG = 2

# Map TradingView actions to contract enum
ACTION_MAPPING = {
    "buy": Action.LONG,
    "sell": Action.SHORT,
    "long": Action.LONG,
    "short": Action.SHORT,
    "close": Action.NONE,
    "exit": Action.NONE
}