import os
import json
import logging
from web3 import Web3, exceptions
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ProofAnchor")

def init_blockchain():
    """Secure blockchain initialization with error handling"""
    load_dotenv()
    
    # Validate critical env vars
    required_vars = ['WEB3_PROVIDER_URL', 'CONTRACT_ADDRESS']
    missing = [var for var in required_vars if not os.getenv(var)]
    if missing:
        logger.error(f"Missing env vars: {', '.join(missing)}")
        raise EnvironmentError("Blockchain configuration incomplete")

    # Initialize Web3 with timeout
    w3 = Web3(Web3.HTTPProvider(
        os.getenv('WEB3_PROVIDER_URL'),
        request_kwargs={'timeout': 15}
    ))
    
    if not w3.is_connected():
        logger.error("Blockchain connection failed")
        raise ConnectionError("Web3 provider unreachable")
    
    # Secure account initialization
    account = None
    if 'PRIVATE_KEY' in os.environ:
        account = w3.eth.account.from_key(os.getenv('PRIVATE_KEY'))
        logger.info(f"🔐 Account loaded: {account.address[:6]}...")
    else:
        logger.warning("No private key - read-only mode")
    
    logger.info(f"✅ Connected to chain {w3.eth.chain_id}")
    return w3, account

def get_contract(w3):
    """Load contract with ABI validation"""
    contract_address = os.getenv('CONTRACT_ADDRESS')
    
    # Load ABI from external file with validation
    abi = None
    try:
        with open('contracts/ProofAnchor.json') as f:
            abi = json.load(f)
            if not isinstance(abi, list):  # Verify ABI is an array
                raise ValueError("ABI must be a JSON array")
    except (FileNotFoundError, json.JSONDecodeError, ValueError) as e:
        logger.warning(f"Using fallback ABI: {str(e)}")
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

def anchor_prompt_hash(prompt_hash: bytes):
    """Anchor prompt hash to blockchain"""
    try:
        w3, account = init_blockchain()
        if not account:
            raise ValueError("No signing account configured")
        
        contract = get_contract(w3)
        
        # Build transaction
        tx = contract.functions.anchorHash(prompt_hash).build_transaction({
            'chainId': w3.eth.chain_id,
            'nonce': w3.eth.get_transaction_count(account.address),
            'gas': 150000,
            'maxFeePerGas': w3.to_wei('25', 'gwei'),
            'maxPriorityFeePerGas': w3.to_wei('2', 'gwei'),
        })
        
        signed_tx = account.sign_transaction(tx)
        tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
        
        return {
            "status": "confirmed" if receipt.status == 1 else "failed",
            "tx_hash": tx_hash.hex(),
            "block_number": receipt.blockNumber,
            "gas_used": receipt.gasUsed
        }
        
    except exceptions.ContractLogicError as e:
        logger.error(f"Contract error: {e}")
        return {"error": "Contract execution reverted"}
    except ValueError as e:
        logger.error(f"Transaction error: {e}")
        return {"error": str(e)}
    except Exception as e:
        logger.exception("Blockchain anchoring failed")
        return {"error": "Internal server error"}

def verify_on_chain(prompt_hash: bytes):
    """Verify prompt hash on blockchain"""
    try:
        w3, _ = init_blockchain()
        contract = get_contract(w3)
        
        exists, timestamp = contract.functions.verifyHash(prompt_hash).call()
        return {
            "exists": exists,
            "timestamp": timestamp
        }
    except exceptions.ContractLogicError as e:
        return {"error": "Verification failed", "details": str(e)}
    except Exception as e:
        logger.error(f"Verification error: {str(e)}")
        return {"error": "Blockchain connection issue"}

if __name__ == "__main__":
    import hashlib
    try:
        # Test connection
        w3, acc = init_blockchain()
        print(f"💰 Balance: {w3.from_wei(w3.eth.get_balance(acc.address), 'ether')} ETH")
        
        # Test contract
        contract = get_contract(w3)
        print(f"📜 Contract code: {'exists' if w3.eth.get_code(contract.address) else 'MISSING'}")
        
        # Test anchoring
        test_hash = hashlib.sha256(b"test").digest()
        print(f"🔗 Anchoring hash: {test_hash.hex()}")
        result = anchor_prompt_hash(test_hash)
        print(f"✅ Success! TX: https://sepolia.etherscan.io/tx/{result['tx_hash']}")
    except Exception as e:
        print(f"❌ Test failed: {str(e)}")
