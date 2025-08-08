import os
import json
import logging
from web3 import Web3, exceptions
from dotenv import load_dotenv
from typing import Tuple, Optional, Dict, Any

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(levelname)s | %(name)s | %(message)s'
)
logger = logging.getLogger("ProofAnchor")

# Type aliases
Web3Instance = Web3
Account = Any  # Would use web3.eth.Account if not for circular import

def init_blockchain() -> Tuple[Web3Instance, Optional[Any]]:
    """
    Secure blockchain initialization with enhanced error handling
    Returns:
        Tuple: (Web3 instance, Contract object or None)
    """
    load_dotenv()
    
    # Validate critical env vars with descriptive errors
    required_vars = {
        'WEB3_PROVIDER_URL': 'Ethereum node RPC URL',
        'CONTRACT_ADDRESS': 'Deployed contract address',
        'PRIVATE_KEY': 'Wallet private key (optional in read-only mode)'
    }
    
    missing = [var for var in required_vars if not os.getenv(var)]
    if missing:
        error_msg = f"Missing blockchain config: {', '.join(missing)}"
        logger.error(error_msg)
        raise EnvironmentError(error_msg)

    try:
        # Initialize Web3 with timeout (removed retries for newer web3.py)
        w3 = Web3(Web3.HTTPProvider(
            os.getenv('WEB3_PROVIDER_URL'),
            request_kwargs={
                'timeout': 30,  # Increased timeout for Railway
            }
        ))
        
        if not w3.is_connected():
            raise ConnectionError("Web3 provider unreachable - check RPC URL")
        
        # Get contract instance
        contract = get_contract(w3)
        
        # Secure account initialization with validation
        account = None
        if 'PRIVATE_KEY' in os.environ:
            private_key = os.getenv('PRIVATE_KEY')
            if not private_key.startswith('0x'):
                private_key = '0x' + private_key
            
            account = w3.eth.account.from_key(private_key)
            logger.info(f"🔐 Account loaded: {account.address}")
        
        chain_id = w3.eth.chain_id
        logger.info(f"✅ Connected to chain {chain_id} (Network ID: {chain_id})")
        return w3, contract
        
    except ValueError as e:
        logger.error(f"Invalid private key format: {str(e)}")
        raise
    except Exception as e:
        logger.error(f"Blockchain init failed: {str(e)}")
        raise

def get_contract(w3: Web3Instance):
    """Load contract with enhanced ABI handling and validation"""
    contract_address = os.getenv('CONTRACT_ADDRESS')
    
    if not Web3.is_address(contract_address):
        raise ValueError(f"Invalid contract address: {contract_address}")
    
    # ABI loading with multiple fallback options
    abi = None
    abi_paths = [
        'contracts/ProofAnchor.json',  # Project-specific
        '/app/contracts/ProofAnchor.json',  # Railway absolute path
        'assets/contracts/ProofAnchor.json'  # Alternative location
    ]
    
    for path in abi_paths:
        try:
            with open(path) as f:
                abi = json.load(f)
                if not isinstance(abi, list):
                    raise ValueError("ABI must be a JSON array")
                logger.info(f"📜 Loaded ABI from {path}")
                break
        except (FileNotFoundError, json.JSONDecodeError, ValueError) as e:
            continue
    
    if abi is None:
        logger.warning("Using embedded fallback ABI")
        abi = [
            {
                "inputs": [{"internalType": "bytes32", "name": "hash", "type": "bytes32"}],
                "name": "anchorHash",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [{"internalType": "bytes32", "name": "hash", "type": "bytes32"}],
                "name": "verifyHash",
                "outputs": [
                    {"internalType": "bool", "name": "", "type": "bool"},
                    {"internalType": "uint256", "name": "", "type": "uint256"}
                ],
                "stateMutability": "view",
                "type": "function"
            }
        ]
    
    return w3.eth.contract(address=contract_address, abi=abi)

def anchor_prompt_hash(prompt_hash: bytes, w3: Web3Instance, contract) -> Dict[str, Any]:
    """Secure hash anchoring with gas optimization"""
    try:
        # Get account from environment
        if 'PRIVATE_KEY' not in os.environ:
            raise ValueError("No signing account configured")
        
        private_key = os.getenv('PRIVATE_KEY')
        if not private_key.startswith('0x'):
            private_key = '0x' + private_key
        
        account = w3.eth.account.from_key(private_key)
        
        # Gas estimation with fallback
        try:
            gas_estimate = contract.functions.anchorHash(prompt_hash).estimate_gas({
                'from': account.address
            })
            gas_limit = int(gas_estimate * 1.2)  # 20% buffer
        except Exception as e:
            logger.warning(f"Gas estimation failed, using default: {str(e)}")
            gas_limit = 200000
        
        # Dynamic gas pricing
        base_fee = w3.eth.get_block('latest').baseFeePerGas
        max_priority = Web3.to_wei(os.getenv('MAX_PRIORITY_FEE_PER_GAS', '2'), 'gwei')
        max_fee = base_fee * 2 + max_priority if base_fee else Web3.to_wei('25', 'gwei')
        
        tx = {
            'chainId': w3.eth.chain_id,
            'nonce': w3.eth.get_transaction_count(account.address),
            'gas': gas_limit,
            'maxFeePerGas': max_fee,
            'maxPriorityFeePerGas': max_priority,
            'to': contract.address,
            'data': contract.functions.anchorHash(prompt_hash).build_transaction()['data']
        }
        
        signed_tx = account.sign_transaction(tx)
        tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
        
        logger.info(f"Transaction sent: {tx_hash.hex()}")
        
        # Wait for receipt with timeout
        try:
            receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=300, poll_latency=5)
            logger.info(f"Transaction receipt received: {receipt}")
            
            if receipt.status != 1:
                logger.error(f"Transaction failed with status {receipt.status}")
                raise ValueError(f"Transaction reverted: {tx_hash.hex()}")
            
            logger.info(f"✅ Anchored hash in block {receipt.blockNumber}")
            return receipt
            
        except Exception as e:
            logger.error(f"Error waiting for transaction receipt: {str(e)}")
            # Check if transaction exists on blockchain
            try:
                tx_info = w3.eth.get_transaction(tx_hash)
                if tx_info:
                    logger.error(f"Transaction exists but failed: {tx_info}")
                else:
                    logger.error("Transaction not found on blockchain")
            except Exception as check_error:
                logger.error(f"Could not check transaction status: {str(check_error)}")
            raise
        
    except exceptions.ContractLogicError as e:
        error_msg = f"Contract error: {e}"
        logger.error(error_msg)
        raise ValueError(error_msg)
    except ValueError as e:
        logger.error(f"Transaction error: {e}")
        raise
    except Exception as e:
        logger.exception("Blockchain anchoring failed")
        raise RuntimeError("Internal server error")

def verify_on_chain(prompt_hash: bytes) -> Dict[str, Any]:
    """Robust hash verification with enhanced error handling"""
    try:
        w3, contract = init_blockchain()
        
        # Call with timeout
        exists, timestamp = contract.functions.verifyHash(prompt_hash).call(
            block_identifier='latest',
            timeout=30
        )
        
        return {
            "exists": exists,
            "timestamp": timestamp,
            "status": "success"
        }
    except exceptions.ContractLogicError as e:
        return {"status": "failed", "error": f"Contract error: {e}"}
    except Exception as e:
        logger.error(f"Verification error: {str(e)}")
        return {"status": "failed", "error": "Verification service unavailable"}

# Railway-compatible test function
def test_blockchain_connection():
    """Test function for deployment verification"""
    try:
        w3, contract = init_blockchain()
        
        return {
            "status": "connected",
            "chain_id": w3.eth.chain_id,
            "contract_code": bool(w3.eth.get_code(contract.address)),
            "latest_block": w3.eth.block_number
        }
    except Exception as e:
        return {
            "status": "failed",
            "error": str(e)
        }

if __name__ == "__main__":
    import hashlib
    from pprint import pprint
    
    print("=== Blockchain Connection Test ===")
    pprint(test_blockchain_connection())
    
    print("\n=== Anchoring Test ===")
    test_hash = hashlib.sha256(b"test").digest()
    try:
        w3, contract = init_blockchain()
        result = anchor_prompt_hash(test_hash, w3, contract)
        pprint(result)
        
        print("\n=== Verification Test ===")
        pprint(verify_on_chain(test_hash))
    except Exception as e:
        print(f"Test failed: {e}")