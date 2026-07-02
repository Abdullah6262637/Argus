"""Blockchain & Crypto Tools - FAZ 4
Blockchain, kripto para ve Web3 işlemleri için tool'lar.
Ethereum, Bitcoin, NFT, DeFi ve IPFS entegrasyonları.
"""
from __future__ import annotations

import logging
from typing import Any, Dict

from app.services.tools.base import BaseTool, PermissionKey, ToolContext, ToolResult

logger = logging.getLogger(__name__)


class EthereumBalanceTool(BaseTool):
    """Ethereum adresi bakiyesi sorgulama."""
    
    name = "ethereum_balance"
    description = "Ethereum adresinin ETH bakiyesini sorgular."
    permission: PermissionKey = "web_search"
    
    parameters = {
        "type": "object",
        "properties": {
            "address": {
                "type": "string",
                "description": "Ethereum adresi (0x ile başlayan)"
            },
            "network": {
                "type": "string",
                "description": "Ağ adı (mainnet, sepolia, goerli)",
                "enum": ["mainnet", "sepolia", "goerli"],
                "default": "mainnet"
            }
        },
        "required": ["address"]
    }
    
    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        try:
            address = args.get("address")
            network = args.get("network", "mainnet")
            
            if not address:
                return ToolResult(ok=False, error="address parametresi gerekli")
            
            # Web3.py kullanarak bakiye sorgula
            try:
                from web3 import Web3
                import os
                
                if network == "mainnet":
                    rpc_url = os.getenv("INFURA_MAINNET_URL") or "https://mainnet.infura.io/v3/YOUR_PROJECT_ID"
                elif network == "sepolia":
                    rpc_url = os.getenv("INFURA_SEPOLIA_URL") or "https://sepolia.infura.io/v3/YOUR_PROJECT_ID"
                else:
                    rpc_url = os.getenv("INFURA_GOERLI_URL") or "https://goerli.infura.io/v3/YOUR_PROJECT_ID"
                
                w3 = Web3(Web3.HTTPProvider(rpc_url))
                
                if not w3.is_connected():
                    return ToolResult(ok=False, error="Blockchain bağlantısı başarısız")
                
                balance_wei = w3.eth.get_balance(address)
                balance_eth = w3.from_wei(balance_wei, 'ether')
                
                return ToolResult(
                    ok=True,
                    output=f"Ethereum Adresi: {address}\nBakiye: {balance_eth} ETH\nAğ: {network}",
                    data={"address": address, "balance_wei": str(balance_wei), "balance_eth": str(balance_eth), "network": network}
                )
                
            except ImportError:
                return ToolResult(ok=False, error="web3 paketi yüklü değil: pip install web3")
            except Exception as e:
                return ToolResult(ok=False, error=f"Blockchain sorgu hatası: {str(e)}")
                
        except Exception as e:
            logger.exception("Ethereum balance hatası")
            return ToolResult(ok=False, error=str(e))


class EthereumTransactionTool(BaseTool):
    """Ethereum transaction detayları sorgulama."""
    
    name = "ethereum_transaction"
    description = "Ethereum transaction hash'i ile detayları sorgular."
    permission: PermissionKey = "web_search"
    
    parameters = {
        "type": "object",
        "properties": {
            "tx_hash": {
                "type": "string",
                "description": "Transaction hash (0x ile başlayan)"
            },
            "network": {
                "type": "string",
                "description": "Ağ adı (mainnet, sepolia, goerli)",
                "enum": ["mainnet", "sepolia", "goerli"],
                "default": "mainnet"
            }
        },
        "required": ["tx_hash"]
    }
    
    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        try:
            tx_hash = args.get("tx_hash")
            network = args.get("network", "mainnet")
            
            if not tx_hash:
                return ToolResult(ok=False, error="tx_hash parametresi gerekli")
            
            try:
                from web3 import Web3
                import os
                
                if network == "mainnet":
                    rpc_url = os.getenv("INFURA_MAINNET_URL") or "https://mainnet.infura.io/v3/YOUR_PROJECT_ID"
                elif network == "sepolia":
                    rpc_url = os.getenv("INFURA_SEPOLIA_URL") or "https://sepolia.infura.io/v3/YOUR_PROJECT_ID"
                else:
                    rpc_url = os.getenv("INFURA_GOERLI_URL") or "https://goerli.infura.io/v3/YOUR_PROJECT_ID"
                
                w3 = Web3(Web3.HTTPProvider(rpc_url))
                
                if not w3.is_connected():
                    return ToolResult(ok=False, error="Blockchain bağlantısı başarısız")
                
                tx = w3.eth.get_transaction(tx_hash)
                receipt = w3.eth.get_transaction_receipt(tx_hash)
                
                output = f"Transaction Hash: {tx_hash}\n"
                output += f"From: {tx['from']}\n"
                output += f"To: {tx['to']}\n"
                output += f"Value: {w3.from_wei(tx['value'], 'ether')} ETH\n"
                output += f"Gas Price: {w3.from_wei(tx['gasPrice'], 'gwei')} Gwei\n"
                output += f"Gas Limit: {tx['gas']}\n"
                output += f"Status: {'Başarılı' if receipt['status'] == 1 else 'Başarısız'}\n"
                output += f"Block: {receipt['blockNumber']}\n"
                output += f"Ağ: {network}"
                
                return ToolResult(
                    ok=True,
                    output=output,
                    data={"tx_hash": tx_hash, "transaction": dict(tx), "receipt": dict(receipt), "network": network}
                )
                
            except ImportError:
                return ToolResult(ok=False, error="web3 paketi yüklü değil: pip install web3")
            except Exception as e:
                return ToolResult(ok=False, error=f"Transaction sorgu hatası: {str(e)}")
                
        except Exception as e:
            logger.exception("Ethereum transaction hatası")
            return ToolResult(ok=False, error=str(e))


class EthereumGasPriceTool(BaseTool):
    """Ethereum gas fiyatı sorgulama."""
    
    name = "ethereum_gas_price"
    description = "Ethereum ağında mevcut gas fiyatlarını sorgular."
    permission: PermissionKey = "web_search"
    
    parameters = {
        "type": "object",
        "properties": {
            "network": {
                "type": "string",
                "description": "Ağ adı (mainnet, sepolia, goerli)",
                "enum": ["mainnet", "sepolia", "goerli"],
                "default": "mainnet"
            }
        }
    }
    
    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        try:
            network = args.get("network", "mainnet")
            
            try:
                from web3 import Web3
                import os
                
                if network == "mainnet":
                    rpc_url = os.getenv("INFURA_MAINNET_URL") or "https://mainnet.infura.io/v3/YOUR_PROJECT_ID"
                elif network == "sepolia":
                    rpc_url = os.getenv("INFURA_SEPOLIA_URL") or "https://sepolia.infura.io/v3/YOUR_PROJECT_ID"
                else:
                    rpc_url = os.getenv("INFURA_GOERLI_URL") or "https://goerli.infura.io/v3/YOUR_PROJECT_ID"
                
                w3 = Web3(Web3.HTTPProvider(rpc_url))
                
                if not w3.is_connected():
                    return ToolResult(ok=False, error="Blockchain bağlantısı başarısız")
                
                gas_price_wei = w3.eth.gas_price
                gas_price_gwei = w3.from_wei(gas_price_wei, 'gwei')
                
                # EIP-1559 gas fees
                try:
                    fee_data = w3.eth.fee_history(1, 'latest', [10, 50, 90])
                    base_fee = w3.from_wei(fee_data['baseFeePerGas'][-1], 'gwei')
                    priority_fees = [w3.from_wei(fee, 'gwei') for fee in fee_data['reward'][-1]]
                    
                    output = f"Ethereum Gas Fiyatları (Ağ: {network})\n\n"
                    output += f"Gas Price: {gas_price_gwei:.2f} Gwei\n"
                    output += f"Base Fee: {base_fee:.2f} Gwei\n"
                    output += f"Priority Fee (10%): {priority_fees[0]:.2f} Gwei\n"
                    output += f"Priority Fee (50%): {priority_fees[1]:.2f} Gwei\n"
                    output += f"Priority Fee (90%): {priority_fees[2]:.2f} Gwei\n"
                    
                except:
                    output = f"Ethereum Gas Fiyatı (Ağ: {network})\n\n"
                    output += f"Gas Price: {gas_price_gwei:.2f} Gwei\n"
                
                return ToolResult(
                    ok=True,
                    output=output,
                    data={"gas_price_wei": str(gas_price_wei), "gas_price_gwei": str(gas_price_gwei), "network": network}
                )
                
            except ImportError:
                return ToolResult(ok=False, error="web3 paketi yüklü değil: pip install web3")
            except Exception as e:
                return ToolResult(ok=False, error=f"Gas fiyatı sorgu hatası: {str(e)}")
                
        except Exception as e:
            logger.exception("Ethereum gas price hatası")
            return ToolResult(ok=False, error=str(e))


class EthereumBlockInfoTool(BaseTool):
    """Ethereum block bilgisi sorgulama."""
    
    name = "ethereum_block_info"
    description = "Ethereum block numarası veya hash ile block bilgilerini sorgular."
    permission: PermissionKey = "web_search"
    
    parameters = {
        "type": "object",
        "properties": {
            "block_identifier": {
                "type": "string",
                "description": "Block numarası (sayı) veya hash (0x ile başlayan)"
            },
            "network": {
                "type": "string",
                "description": "Ağ adı (mainnet, sepolia, goerli)",
                "enum": ["mainnet", "sepolia", "goerli"],
                "default": "mainnet"
            }
        },
        "required": ["block_identifier"]
    }
    
    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        try:
            block_identifier = args.get("block_identifier")
            network = args.get("network", "mainnet")
            
            if not block_identifier:
                return ToolResult(ok=False, error="block_identifier parametresi gerekli")
            
            try:
                from web3 import Web3
                import os
                from datetime import datetime
                
                if network == "mainnet":
                    rpc_url = os.getenv("INFURA_MAINNET_URL") or "https://mainnet.infura.io/v3/YOUR_PROJECT_ID"
                elif network == "sepolia":
                    rpc_url = os.getenv("INFURA_SEPOLIA_URL") or "https://sepolia.infura.io/v3/YOUR_PROJECT_ID"
                else:
                    rpc_url = os.getenv("INFURA_GOERLI_URL") or "https://goerli.infura.io/v3/YOUR_PROJECT_ID"
                
                w3 = Web3(Web3.HTTPProvider(rpc_url))
                
                if not w3.is_connected():
                    return ToolResult(ok=False, error="Blockchain bağlantısı başarısız")
                
                # Block numarası ise integer'a çevir
                if block_identifier.isdigit():
                    block_identifier = int(block_identifier)
                
                block = w3.eth.get_block(block_identifier, full_transactions=False)
                
                timestamp = datetime.fromtimestamp(block['timestamp'])
                
                output = f"Ethereum Block Bilgisi (Ağ: {network})\n\n"
                output += f"Block Number: {block['number']}\n"
                output += f"Block Hash: {block['hash'].hex()}\n"
                output += f"Parent Hash: {block['parentHash'].hex()}\n"
                output += f"Miner: {block['miner']}\n"
                output += f"Timestamp: {timestamp.strftime('%Y-%m-%d %H:%M:%S UTC')}\n"
                output += f"Transactions: {len(block['transactions'])}\n"
                output += f"Gas Used: {block['gasUsed']}\n"
                output += f"Gas Limit: {block['gasLimit']}\n"
                
                return ToolResult(
                    ok=True,
                    output=output,
                    data={"block": dict(block), "network": network}
                )
                
            except ImportError:
                return ToolResult(ok=False, error="web3 paketi yüklü değil: pip install web3")
            except Exception as e:
                return ToolResult(ok=False, error=f"Block sorgu hatası: {str(e)}")
                
        except Exception as e:
            logger.exception("Ethereum block info hatası")
            return ToolResult(ok=False, error=str(e))


class EthereumSmartContractCallTool(BaseTool):
    """Ethereum smart contract çağrısı."""
    
    name = "ethereum_smart_contract_call"
    description = "Ethereum smart contract fonksiyonunu çağırır (read-only)."
    permission: PermissionKey = "web_search"
    
    parameters = {
        "type": "object",
        "properties": {
            "contract_address": {
                "type": "string",
                "description": "Smart contract adresi (0x ile başlayan)"
            },
            "function_name": {
                "type": "string",
                "description": "Çağrılacak fonksiyon adı"
            },
            "function_args": {
                "type": "array",
                "description": "Fonksiyon parametreleri (array olarak)",
                "items": {"type": "string"}
            },
            "abi": {
                "type": "string",
                "description": "Contract ABI'si (JSON string)"
            },
            "network": {
                "type": "string",
                "description": "Ağ adı (mainnet, sepolia, goerli)",
                "enum": ["mainnet", "sepolia", "goerli"],
                "default": "mainnet"
            }
        },
        "required": ["contract_address", "function_name", "abi"]
    }
    
    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        try:
            contract_address = args.get("contract_address")
            function_name = args.get("function_name")
            function_args = args.get("function_args", [])
            abi_str = args.get("abi")
            network = args.get("network", "mainnet")
            
            if not contract_address or not function_name or not abi_str:
                return ToolResult(ok=False, error="contract_address, function_name ve abi parametreleri gerekli")
            
            try:
                from web3 import Web3
                import json
                import os
                
                if network == "mainnet":
                    rpc_url = os.getenv("INFURA_MAINNET_URL") or "https://mainnet.infura.io/v3/YOUR_PROJECT_ID"
                elif network == "sepolia":
                    rpc_url = os.getenv("INFURA_SEPOLIA_URL") or "https://sepolia.infura.io/v3/YOUR_PROJECT_ID"
                else:
                    rpc_url = os.getenv("INFURA_GOERLI_URL") or "https://goerli.infura.io/v3/YOUR_PROJECT_ID"
                
                w3 = Web3(Web3.HTTPProvider(rpc_url))
                
                if not w3.is_connected():
                    return ToolResult(ok=False, error="Blockchain bağlantısı başarısız")
                
                abi = json.loads(abi_str)
                contract = w3.eth.contract(address=contract_address, abi=abi)
                
                # Fonksiyonu çağır
                func = getattr(contract.functions, function_name)
                result = func(*function_args).call()
                
                output = f"Smart Contract Çağrısı (Ağ: {network})\n\n"
                output += f"Contract: {contract_address}\n"
                output += f"Function: {function_name}\n"
                output += f"Args: {function_args}\n"
                output += f"Result: {result}\n"
                
                return ToolResult(
                    ok=True,
                    output=output,
                    data={"contract_address": contract_address, "function_name": function_name, "result": result, "network": network}
                )
                
            except ImportError:
                return ToolResult(ok=False, error="web3 paketi yüklü değil: pip install web3")
            except json.JSONDecodeError:
                return ToolResult(ok=False, error="ABI geçersiz JSON formatı")
            except Exception as e:
                return ToolResult(ok=False, error=f"Smart contract çağrı hatası: {str(e)}")
                
        except Exception as e:
            logger.exception("Ethereum smart contract call hatası")
            return ToolResult(ok=False, error=str(e))


class BitcoinBalanceTool(BaseTool):
    """Bitcoin adresi bakiyesi sorgulama."""
    
    name = "bitcoin_balance"
    description = "Bitcoin adresinin BTC bakiyesini sorgular."
    permission: PermissionKey = "web_search"
    
    parameters = {
        "type": "object",
        "properties": {
            "address": {
                "type": "string",
                "description": "Bitcoin adresi"
            },
            "network": {
                "type": "string",
                "description": "Ağ adı (mainnet, testnet)",
                "enum": ["mainnet", "testnet"],
                "default": "mainnet"
            }
        },
        "required": ["address"]
    }
    
    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        try:
            address = args.get("address")
            network = args.get("network", "mainnet")
            
            if not address:
                return ToolResult(ok=False, error="address parametresi gerekli")
            
            try:
                import httpx
                
                if network == "mainnet":
                    api_url = f"https://blockchain.info/q/addressbalance/{address}"
                else:
                    api_url = f"https://testnet.blockchain.info/q/addressbalance/{address}"
                
                async with httpx.AsyncClient(timeout=10.0) as client:
                    response = await client.get(api_url)
                    response.raise_for_status()
                    balance_satoshi = int(response.text)
                    balance_btc = balance_satoshi / 100000000
                
                return ToolResult(
                    ok=True,
                    output=f"Bitcoin Adresi: {address}\nBakiye: {balance_btc} BTC\nAğ: {network}",
                    data={"address": address, "balance_satoshi": balance_satoshi, "balance_btc": balance_btc, "network": network}
                )
                
            except ImportError:
                return ToolResult(ok=False, error="httpx paketi yüklü değil: pip install httpx")
            except Exception as e:
                return ToolResult(ok=False, error=f"Bitcoin sorgu hatası: {str(e)}")
                
        except Exception as e:
            logger.exception("Bitcoin balance hatası")
            return ToolResult(ok=False, error=str(e))


class BitcoinTransactionTool(BaseTool):
    """Bitcoin transaction detayları sorgulama."""
    
    name = "bitcoin_transaction"
    description = "Bitcoin transaction hash'i ile detayları sorgular."
    permission: PermissionKey = "web_search"
    
    parameters = {
        "type": "object",
        "properties": {
            "tx_hash": {
                "type": "string",
                "description": "Transaction hash"
            },
            "network": {
                "type": "string",
                "description": "Ağ adı (mainnet, testnet)",
                "enum": ["mainnet", "testnet"],
                "default": "mainnet"
            }
        },
        "required": ["tx_hash"]
    }
    
    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        try:
            tx_hash = args.get("tx_hash")
            network = args.get("network", "mainnet")
            
            if not tx_hash:
                return ToolResult(ok=False, error="tx_hash parametresi gerekli")
            
            try:
                import httpx
                
                if network == "mainnet":
                    api_url = f"https://blockchain.info/rawtx/{tx_hash}"
                else:
                    api_url = f"https://testnet.blockchain.info/rawtx/{tx_hash}"
                
                async with httpx.AsyncClient(timeout=10.0) as client:
                    response = await client.get(api_url)
                    response.raise_for_status()
                    tx_data = response.json()
                
                output = f"Bitcoin Transaction: {tx_hash}\n"
                output += f"Block Height: {tx_data.get('block_height', 'Unconfirmed')}\n"
                output += f"Size: {tx_data.get('size')} bytes\n"
                output += f"Fee: {tx_data.get('fee', 0) / 100000000} BTC\n"
                output += f"Inputs: {len(tx_data.get('inputs', []))}\n"
                output += f"Outputs: {len(tx_data.get('outputs', []))}\n"
                
                total_input = sum(inp['prev_out']['value'] for inp in tx_data.get('inputs', []) if 'prev_out' in inp)
                total_output = sum(out['value'] for out in tx_data.get('outputs', []))
                output += f"Total Input: {total_input / 100000000} BTC\n"
                output += f"Total Output: {total_output / 100000000} BTC\n"
                output += f"Ağ: {network}"
                
                return ToolResult(
                    ok=True,
                    output=output,
                    data={"tx_hash": tx_hash, "transaction": tx_data, "network": network}
                )
                
            except ImportError:
                return ToolResult(ok=False, error="httpx paketi yüklü değil: pip install httpx")
            except Exception as e:
                return ToolResult(ok=False, error=f"Bitcoin transaction sorgu hatası: {str(e)}")
                
        except Exception as e:
            logger.exception("Bitcoin transaction hatası")
            return ToolResult(ok=False, error=str(e))


class BitcoinBlockHeightTool(BaseTool):
    """Bitcoin block yüksekliği sorgulama."""
    
    name = "bitcoin_block_height"
    description = "Bitcoin ağında mevcut block yüksekliğini sorgular."
    permission: PermissionKey = "web_search"
    
    parameters = {
        "type": "object",
        "properties": {
            "network": {
                "type": "string",
                "description": "Ağ adı (mainnet, testnet)",
                "enum": ["mainnet", "testnet"],
                "default": "mainnet"
            }
        }
    }
    
    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        try:
            network = args.get("network", "mainnet")
            
            try:
                import httpx
                
                if network == "mainnet":
                    api_url = "https://blockchain.info/q/getblockcount"
                else:
                    api_url = "https://testnet.blockchain.info/q/getblockcount"
                
                async with httpx.AsyncClient(timeout=10.0) as client:
                    response = await client.get(api_url)
                    response.raise_for_status()
                    block_height = int(response.text)
                
                return ToolResult(
                    ok=True,
                    output=f"Bitcoin Block Yüksekliği: {block_height}\nAğ: {network}",
                    data={"block_height": block_height, "network": network}
                )
                
            except ImportError:
                return ToolResult(ok=False, error="httpx paketi yüklü değil: pip install httpx")
            except Exception as e:
                return ToolResult(ok=False, error=f"Block height sorgu hatası: {str(e)}")
                
        except Exception as e:
            logger.exception("Bitcoin block height hatası")
            return ToolResult(ok=False, error=str(e))


class CryptoPriceTool(BaseTool):
    """Kripto para fiyatı sorgulama."""
    
    name = "crypto_price"
    description = "CoinGecko API kullanarak kripto para fiyatlarını sorgular."
    permission: PermissionKey = "web_search"
    
    parameters = {
        "type": "object",
        "properties": {
            "symbol": {
                "type": "string",
                "description": "Kripto para sembolü (örn: bitcoin, ethereum)"
            },
            "currency": {
                "type": "string",
                "description": "Fiyat birimi (usd, eur, try)",
                "default": "usd"
            }
        },
        "required": ["symbol"]
    }
    
    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        try:
            symbol = args.get("symbol")
            currency = args.get("currency", "usd")
            
            if not symbol:
                return ToolResult(ok=False, error="symbol parametresi gerekli")
            
            try:
                import httpx
                
                api_url = f"https://api.coingecko.com/api/v3/simple/price?ids={symbol}&vs_currencies={currency}&include_24hr_change=true"
                
                async with httpx.AsyncClient(timeout=10.0) as client:
                    response = await client.get(api_url)
                    response.raise_for_status()
                    data = response.json()
                
                if symbol not in data:
                    return ToolResult(ok=False, error=f"{symbol} sembolü bulunamadı")
                
                price_data = data[symbol]
                price = price_data.get(currency, 0)
                change_24h = price_data.get(f"{currency}_24h_change", 0)
                
                output = f"{symbol.upper()} Fiyatı\n"
                output += f"Fiyat: ${price:,.2f} {currency.upper()}\n"
                output += f"24s Değişim: {change_24h:.2f}%\n"
                
                return ToolResult(
                    ok=True,
                    output=output,
                    data={"symbol": symbol, "price": price, "change_24h": change_24h, "currency": currency}
                )
                
            except ImportError:
                return ToolResult(ok=False, error="httpx paketi yüklü değil: pip install httpx")
            except Exception as e:
                return ToolResult(ok=False, error=f"Kripto fiyat sorgu hatası: {str(e)}")
                
        except Exception as e:
            logger.exception("Crypto price hatası")
            return ToolResult(ok=False, error=str(e))


class CryptoMarketCapTool(BaseTool):
    """Kripto para market cap sorgulama."""
    
    name = "crypto_market_cap"
    description = "CoinGecko API kullanarak kripto para market capitalization bilgilerini sorgular."
    permission: PermissionKey = "web_search"
    
    parameters = {
        "type": "object",
        "properties": {
            "symbol": {
                "type": "string",
                "description": "Kripto para sembolü (örn: bitcoin, ethereum)"
            },
            "currency": {
                "type": "string",
                "description": "Fiyat birimi (usd, eur, try)",
                "default": "usd"
            }
        },
        "required": ["symbol"]
    }
    
    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        try:
            symbol = args.get("symbol")
            currency = args.get("currency", "usd")
            
            if not symbol:
                return ToolResult(ok=False, error="symbol parametresi gerekli")
            
            try:
                import httpx
                
                api_url = f"https://api.coingecko.com/api/v3/coins/{symbol}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false"
                
                async with httpx.AsyncClient(timeout=10.0) as client:
                    response = await client.get(api_url)
                    response.raise_for_status()
                    data = response.json()
                
                market_data = data.get("market_data", {})
                market_cap = market_data.get("market_cap", {}).get(currency, 0)
                volume_24h = market_data.get("total_volume", {}).get(currency, 0)
                circulating_supply = market_data.get("circulating_supply", 0)
                max_supply = market_data.get("max_supply")
                
                output = f"{data.get('name', symbol.upper())} Market Bilgileri\n"
                output += f"Market Cap: ${market_cap:,.0f} {currency.upper()}\n"
                output += f"24s Volume: ${volume_24h:,.0f} {currency.upper()}\n"
                output += f"Dolaşımdaki Arz: {circulating_supply:,.0f}\n"
                if max_supply:
                    output += f"Max Arz: {max_supply:,.0f}\n"
                
                return ToolResult(
                    ok=True,
                    output=output,
                    data={"symbol": symbol, "market_cap": market_cap, "volume_24h": volume_24h, "circulating_supply": circulating_supply, "currency": currency}
                )
                
            except ImportError:
                return ToolResult(ok=False, error="httpx paketi yüklü değil: pip install httpx")
            except Exception as e:
                return ToolResult(ok=False, error=f"Market cap sorgu hatası: {str(e)}")
                
        except Exception as e:
            logger.exception("Crypto market cap hatası")
            return ToolResult(ok=False, error=str(e))


class CryptoHistoricalDataTool(BaseTool):
    """Kripto para geçmiş verileri."""
    
    name = "crypto_historical_data"
    description = "CoinGecko API kullanarak kripto para geçmiş fiyat verilerini sorgular."
    permission: PermissionKey = "web_search"
    
    parameters = {
        "type": "object",
        "properties": {
            "symbol": {
                "type": "string",
                "description": "Kripto para sembolü (örn: bitcoin, ethereum)"
            },
            "days": {
                "type": "integer",
                "description": "Geçmiş gün sayısı (1, 7, 30, 90, 365)",
                "enum": [1, 7, 30, 90, 365],
                "default": 7
            },
            "currency": {
                "type": "string",
                "description": "Fiyat birimi (usd, eur, try)",
                "default": "usd"
            }
        },
        "required": ["symbol"]
    }
    
    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        try:
            symbol = args.get("symbol")
            days = args.get("days", 7)
            currency = args.get("currency", "usd")
            
            if not symbol:
                return ToolResult(ok=False, error="symbol parametresi gerekli")
            
            try:
                import httpx
                from datetime import datetime
                
                api_url = f"https://api.coingecko.com/api/v3/coins/{symbol}/market_chart?vs_currency={currency}&days={days}&interval=daily"
                
                async with httpx.AsyncClient(timeout=10.0) as client:
                    response = await client.get(api_url)
                    response.raise_for_status()
                    data = response.json()
                
                prices = data.get("prices", [])
                if not prices:
                    return ToolResult(ok=False, error="Geçmiş veri bulunamadı")
                
                # Son 5 fiyat noktasını göster
                recent_prices = prices[-5:]
                output = f"{symbol.upper()} Geçmiş Fiyatları (Son {days} gün)\n\n"
                
                for price_data in recent_prices:
                    timestamp = price_data[0] / 1000
                    price = price_data[1]
                    date = datetime.fromtimestamp(timestamp).strftime("%Y-%m-%d")
                    output += f"{date}: ${price:.2f} {currency.upper()}\n"
                
                return ToolResult(
                    ok=True,
                    output=output,
                    data={"symbol": symbol, "prices": prices, "days": days, "currency": currency}
                )
                
            except ImportError:
                return ToolResult(ok=False, error="httpx paketi yüklü değil: pip install httpx")
            except Exception as e:
                return ToolResult(ok=False, error=f"Geçmiş veri sorgu hatası: {str(e)}")
                
        except Exception as e:
            logger.exception("Crypto historical data hatası")
            return ToolResult(ok=False, error=str(e))


class NFTMetadataTool(BaseTool):
    """NFT metadata sorgulama."""
    
    name = "nft_metadata"
    description = "NFT contract adresi ve token ID ile metadata bilgilerini sorgular."
    permission: PermissionKey = "web_search"
    
    parameters = {
        "type": "object",
        "properties": {
            "contract_address": {
                "type": "string",
                "description": "NFT contract adresi (0x ile başlayan)"
            },
            "token_id": {
                "type": "string",
                "description": "Token ID"
            },
            "network": {
                "type": "string",
                "description": "Ağ adı (mainnet, sepolia, goerli)",
                "enum": ["mainnet", "sepolia", "goerli"],
                "default": "mainnet"
            }
        },
        "required": ["contract_address", "token_id"]
    }
    
    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        try:
            contract_address = args.get("contract_address")
            token_id = args.get("token_id")
            network = args.get("network", "mainnet")
            
            if not contract_address or not token_id:
                return ToolResult(ok=False, error="contract_address ve token_id parametreleri gerekli")
            
            try:
                import httpx
                import json
                
                # ERC721 tokenURI fonksiyonunu simüle et
                # Gerçek implementasyon için web3 kullanmak daha iyi olur
                
                if network == "mainnet":
                    api_url = f"https://api.opensea.io/api/v1/asset/{contract_address}/{token_id}/"
                else:
                    return ToolResult(ok=False, error=f"{network} ağı için NFT metadata API'si desteklenmiyor")
                
                headers = {
                    "User-Agent": "Mozilla/5.0 (compatible; UmtalAgent/1.0)"
                }
                
                async with httpx.AsyncClient(timeout=10.0, headers=headers) as client:
                    response = await client.get(api_url)
                    if response.status_code == 200:
                        data = response.json()
                        
                        output = f"NFT Metadata\n"
                        output += f"Contract: {contract_address}\n"
                        output += f"Token ID: {token_id}\n"
                        output += f"Name: {data.get('name', 'N/A')}\n"
                        output += f"Description: {data.get('description', 'N/A')[:100]}...\n"
                        output += f"Image: {data.get('image_url', 'N/A')}\n"
                        output += f"Owner: {data.get('owner', {}).get('address', 'N/A')}\n"
                        
                        return ToolResult(
                            ok=True,
                            output=output,
                            data={"contract_address": contract_address, "token_id": token_id, "metadata": data, "network": network}
                        )
                    else:
                        return ToolResult(ok=False, error=f"NFT metadata bulunamadı: {response.status_code}")
                
            except ImportError:
                return ToolResult(ok=False, error="httpx paketi yüklü değil: pip install httpx")
            except Exception as e:
                return ToolResult(ok=False, error=f"NFT metadata sorgu hatası: {str(e)}")
                
        except Exception as e:
            logger.exception("NFT metadata hatası")
            return ToolResult(ok=False, error=str(e))


class NFTOwnershipTool(BaseTool):
    """NFT sahipliği sorgulama."""
    
    name = "nft_ownership"
    description = "Bir adresin sahip olduğu NFT'leri sorgular."
    permission: PermissionKey = "web_search"
    
    parameters = {
        "type": "object",
        "properties": {
            "owner_address": {
                "type": "string",
                "description": "NFT sahibi adresi (0x ile başlayan)"
            },
            "limit": {
                "type": "integer",
                "description": "Maksimum sonuç sayısı",
                "default": 10
            },
            "network": {
                "type": "string",
                "description": "Ağ adı (mainnet, sepolia, goerli)",
                "enum": ["mainnet", "sepolia", "goerli"],
                "default": "mainnet"
            }
        },
        "required": ["owner_address"]
    }
    
    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        try:
            owner_address = args.get("owner_address")
            limit = args.get("limit", 10)
            network = args.get("network", "mainnet")
            
            if not owner_address:
                return ToolResult(ok=False, error="owner_address parametresi gerekli")
            
            try:
                import httpx
                
                if network == "mainnet":
                    api_url = f"https://api.opensea.io/api/v1/assets?owner={owner_address}&limit={limit}"
                else:
                    return ToolResult(ok=False, error=f"{network} ağı için NFT sahiplik API'si desteklenmiyor")
                
                headers = {
                    "User-Agent": "Mozilla/5.0 (compatible; UmtalAgent/1.0)"
                }
                
                async with httpx.AsyncClient(timeout=10.0, headers=headers) as client:
                    response = await client.get(api_url)
                    if response.status_code == 200:
                        data = response.json()
                        assets = data.get("assets", [])
                        
                        output = f"NFT Sahipliği - {owner_address}\n\n"
                        output += f"Toplam NFT: {len(assets)}\n\n"
                        
                        for i, asset in enumerate(assets[:5]):  # İlk 5'i göster
                            output += f"{i+1}. {asset.get('name', 'Unnamed')} ({asset.get('collection', {}).get('name', 'Unknown Collection')})\n"
                            output += f"   Contract: {asset.get('asset_contract', {}).get('address')}\n"
                            output += f"   Token ID: {asset.get('token_id')}\n\n"
                        
                        return ToolResult(
                            ok=True,
                            output=output,
                            data={"owner_address": owner_address, "assets": assets, "network": network}
                        )
                    else:
                        return ToolResult(ok=False, error=f"NFT sahiplik verisi alınamadı: {response.status_code}")
                
            except ImportError:
                return ToolResult(ok=False, error="httpx paketi yüklü değil: pip install httpx")
            except Exception as e:
                return ToolResult(ok=False, error=f"NFT sahiplik sorgu hatası: {str(e)}")
                
        except Exception as e:
            logger.exception("NFT ownership hatası")
            return ToolResult(ok=False, error=str(e))


class WalletCreateTool(BaseTool):
    """Kripto cüzdan oluşturma."""
    
    name = "wallet_create"
    description = "Yeni bir Ethereum cüzdanı oluşturur."
    permission: PermissionKey = "none"
    
    parameters = {
        "type": "object",
        "properties": {
            "save_to_file": {
                "type": "boolean",
                "description": "Private key'i dosyaya kaydet",
                "default": False
            }
        }
    }
    
    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        try:
            save_to_file = args.get("save_to_file", False)
            
            try:
                from eth_account import Account
                import secrets
                
                # Yeni hesap oluştur
                private_key = "0x" + secrets.token_hex(32)
                account = Account.from_key(private_key)
                
                output = "Yeni Ethereum Cüzdanı Oluşturuldu\n\n"
                output += f"Adres: {account.address}\n"
                output += f"Private Key: {private_key}\n\n"
                output += "⚠️  UYARI: Private key'inizi güvenli bir yerde saklayın!\n"
                output += "Bu key ile cüzdanınıza erişim sağlayabilirsiniz."
                
                data = {
                    "address": account.address,
                    "private_key": private_key if not save_to_file else "[SAVED_TO_FILE]"
                }
                
                if save_to_file:
                    # Güvenlik için dosyaya kaydetme (gerçek implementasyonda şifreleme gerekli)
                    wallet_file = f"wallet_{account.address[:10]}.txt"
                    with open(wallet_file, "w") as f:
                        f.write(f"Address: {account.address}\n")
                        f.write(f"Private Key: {private_key}\n")
                    output += f"\nCüzdan bilgileri {wallet_file} dosyasına kaydedildi."
                
                return ToolResult(
                    ok=True,
                    output=output,
                    data=data
                )
                
            except ImportError:
                return ToolResult(ok=False, error="eth-account paketi yüklü değil: pip install eth-account")
            except Exception as e:
                return ToolResult(ok=False, error=f"Cüzdan oluşturma hatası: {str(e)}")
                
        except Exception as e:
            logger.exception("Wallet create hatası")
            return ToolResult(ok=False, error=str(e))


class WalletImportTool(BaseTool):
    """Kripto cüzdan import etme."""
    
    name = "wallet_import"
    description = "Private key ile Ethereum cüzdanını import eder."
    permission: PermissionKey = "none"
    
    parameters = {
        "type": "object",
        "properties": {
            "private_key": {
                "type": "string",
                "description": "Ethereum private key (0x ile başlayan)"
            }
        },
        "required": ["private_key"]
    }
    
    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        try:
            private_key = args.get("private_key")
            
            if not private_key:
                return ToolResult(ok=False, error="private_key parametresi gerekli")
            
            try:
                from eth_account import Account
                
                account = Account.from_key(private_key)
                
                output = "Ethereum Cüzdanı Import Edildi\n\n"
                output += f"Adres: {account.address}\n"
                output += "Private key doğrulandı."
                
                return ToolResult(
                    ok=True,
                    output=output,
                    data={"address": account.address, "private_key_valid": True}
                )
                
            except ImportError:
                return ToolResult(ok=False, error="eth-account paketi yüklü değil: pip install eth-account")
            except Exception as e:
                return ToolResult(ok=False, error=f"Cüzdan import hatası: {str(e)}")
                
        except Exception as e:
            logger.exception("Wallet import hatası")
            return ToolResult(ok=False, error=str(e))


class TokenBalanceTool(BaseTool):
    """ERC20 token bakiyesi sorgulama."""
    
    name = "token_balance"
    description = "ERC20 token contract'ında bir adresin bakiyesini sorgular."
    permission: PermissionKey = "web_search"
    
    parameters = {
        "type": "object",
        "properties": {
            "token_address": {
                "type": "string",
                "description": "ERC20 token contract adresi (0x ile başlayan)"
            },
            "owner_address": {
                "type": "string",
                "description": "Token sahibi adresi (0x ile başlayan)"
            },
            "network": {
                "type": "string",
                "description": "Ağ adı (mainnet, sepolia, goerli)",
                "enum": ["mainnet", "sepolia", "goerli"],
                "default": "mainnet"
            }
        },
        "required": ["token_address", "owner_address"]
    }
    
    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        try:
            token_address = args.get("token_address")
            owner_address = args.get("owner_address")
            network = args.get("network", "mainnet")
            
            if not token_address or not owner_address:
                return ToolResult(ok=False, error="token_address ve owner_address parametreleri gerekli")
            
            try:
                from web3 import Web3
                import os
                
                if network == "mainnet":
                    rpc_url = os.getenv("INFURA_MAINNET_URL") or "https://mainnet.infura.io/v3/YOUR_PROJECT_ID"
                elif network == "sepolia":
                    rpc_url = os.getenv("INFURA_SEPOLIA_URL") or "https://sepolia.infura.io/v3/YOUR_PROJECT_ID"
                else:
                    rpc_url = os.getenv("INFURA_GOERLI_URL") or "https://goerli.infura.io/v3/YOUR_PROJECT_ID"
                
                w3 = Web3(Web3.HTTPProvider(rpc_url))
                
                if not w3.is_connected():
                    return ToolResult(ok=False, error="Blockchain bağlantısı başarısız")
                
                # ERC20 ABI
                erc20_abi = [
                    {
                        "constant": True,
                        "inputs": [{"name": "_owner", "type": "address"}],
                        "name": "balanceOf",
                        "outputs": [{"name": "balance", "type": "uint256"}],
                        "type": "function"
                    },
                    {
                        "constant": True,
                        "inputs": [],
                        "name": "decimals",
                        "outputs": [{"name": "", "type": "uint8"}],
                        "type": "function"
                    },
                    {
                        "constant": True,
                        "inputs": [],
                        "name": "symbol",
                        "outputs": [{"name": "", "type": "string"}],
                        "type": "function"
                    }
                ]
                
                token_contract = w3.eth.contract(address=token_address, abi=erc20_abi)
                
                balance_raw = token_contract.functions.balanceOf(owner_address).call()
                decimals = token_contract.functions.decimals().call()
                symbol = token_contract.functions.symbol().call()
                
                balance = balance_raw / (10 ** decimals)
                
                output = f"ERC20 Token Bakiyesi\n"
                output += f"Token: {symbol} ({token_address})\n"
                output += f"Sahip: {owner_address}\n"
                output += f"Bakiye: {balance:.6f} {symbol}\n"
                output += f"Ağ: {network}"
                
                return ToolResult(
                    ok=True,
                    output=output,
                    data={"token_address": token_address, "owner_address": owner_address, "balance": balance, "symbol": symbol, "network": network}
                )
                
            except ImportError:
                return ToolResult(ok=False, error="web3 paketi yüklü değil: pip install web3")
            except Exception as e:
                return ToolResult(ok=False, error=f"Token bakiye sorgu hatası: {str(e)}")
                
        except Exception as e:
            logger.exception("Token balance hatası")
            return ToolResult(ok=False, error=str(e))


class TokenTransferTool(BaseTool):
    """ERC20 token transfer."""
    
    name = "token_transfer"
    description = "ERC20 token transfer işlemi gerçekleştirir."
    permission: PermissionKey = "system_admin"
    requires_confirmation: bool = True
    
    parameters = {
        "type": "object",
        "properties": {
            "token_address": {
                "type": "string",
                "description": "ERC20 token contract adresi (0x ile başlayan)"
            },
            "to_address": {
                "type": "string",
                "description": "Alıcı adresi (0x ile başlayan)"
            },
            "amount": {
                "type": "number",
                "description": "Transfer edilecek miktar"
            },
            "private_key": {
                "type": "string",
                "description": "Gönderici private key (0x ile başlayan)"
            },
            "network": {
                "type": "string",
                "description": "Ağ adı (mainnet, sepolia, goerli)",
                "enum": ["mainnet", "sepolia", "goerli"],
                "default": "mainnet"
            }
        },
        "required": ["token_address", "to_address", "amount", "private_key"]
    }
    
    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        try:
            token_address = args.get("token_address")
            to_address = args.get("to_address")
            amount = args.get("amount")
            private_key = args.get("private_key")
            network = args.get("network", "mainnet")
            
            if not all([token_address, to_address, amount, private_key]):
                return ToolResult(ok=False, error="Tüm parametreler gerekli")
            
            try:
                from web3 import Web3
                from eth_account import Account
                import os
                
                if network == "mainnet":
                    rpc_url = os.getenv("INFURA_MAINNET_URL") or "https://mainnet.infura.io/v3/YOUR_PROJECT_ID"
                elif network == "sepolia":
                    rpc_url = os.getenv("INFURA_SEPOLIA_URL") or "https://sepolia.infura.io/v3/YOUR_PROJECT_ID"
                else:
                    rpc_url = os.getenv("INFURA_GOERLI_URL") or "https://goerli.infura.io/v3/YOUR_PROJECT_ID"
                
                w3 = Web3(Web3.HTTPProvider(rpc_url))
                
                if not w3.is_connected():
                    return ToolResult(ok=False, error="Blockchain bağlantısı başarısız")
                
                account = Account.from_key(private_key)
                
                # ERC20 ABI
                erc20_abi = [
                    {
                        "constant": False,
                        "inputs": [
                            {"name": "_to", "type": "address"},
                            {"name": "_value", "type": "uint256"}
                        ],
                        "name": "transfer",
                        "outputs": [{"name": "", "type": "bool"}],
                        "type": "function"
                    },
                    {
                        "constant": True,
                        "inputs": [],
                        "name": "decimals",
                        "outputs": [{"name": "", "type": "uint8"}],
                        "type": "function"
                    },
                    {
                        "constant": True,
                        "inputs": [],
                        "name": "symbol",
                        "outputs": [{"name": "", "type": "string"}],
                        "type": "function"
                    }
                ]
                
                token_contract = w3.eth.contract(address=token_address, abi=erc20_abi)
                
                decimals = token_contract.functions.decimals().call()
                symbol = token_contract.functions.symbol().call()
                
                amount_raw = int(amount * (10 ** decimals))
                
                # Transaction oluştur
                tx = token_contract.functions.transfer(to_address, amount_raw).build_transaction({
                    'from': account.address,
                    'nonce': w3.eth.get_transaction_count(account.address),
                    'gas': 100000,
                    'gasPrice': w3.eth.gas_price,
                })
                
                # Transaction'ı imzala ve gönder
                signed_tx = w3.eth.account.sign_transaction(tx, private_key)
                tx_hash = w3.eth.send_raw_transaction(signed_tx.rawTransaction)
                
                output = f"ERC20 Token Transfer\n"
                output += f"Token: {symbol} ({token_address})\n"
                output += f"Gönderen: {account.address}\n"
                output += f"Alıcı: {to_address}\n"
                output += f"Miktar: {amount} {symbol}\n"
                output += f"Transaction Hash: {tx_hash.hex()}\n"
                output += f"Ağ: {network}"
                
                return ToolResult(
                    ok=True,
                    output=output,
                    data={"tx_hash": tx_hash.hex(), "token_address": token_address, "to_address": to_address, "amount": amount, "network": network}
                )
                
            except ImportError:
                return ToolResult(ok=False, error="web3 veya eth-account paketleri yüklü değil")
            except Exception as e:
                return ToolResult(ok=False, error=f"Token transfer hatası: {str(e)}")
                
        except Exception as e:
            logger.exception("Token transfer hatası")
            return ToolResult(ok=False, error=str(e))


class DeFiPoolInfoTool(BaseTool):
    """DeFi pool bilgisi sorgulama."""
    
    name = "defi_pool_info"
    description = "Uniswap V3 gibi DeFi protokollerindeki pool bilgilerini sorgular."
    permission: PermissionKey = "web_search"
    
    parameters = {
        "type": "object",
        "properties": {
            "pool_address": {
                "type": "string",
                "description": "Pool contract adresi (0x ile başlayan)"
            },
            "network": {
                "type": "string",
                "description": "Ağ adı (mainnet, sepolia, goerli)",
                "enum": ["mainnet", "sepolia", "goerli"],
                "default": "mainnet"
            }
        },
        "required": ["pool_address"]
    }
    
    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        try:
            pool_address = args.get("pool_address")
            network = args.get("network", "mainnet")
            
            if not pool_address:
                return ToolResult(ok=False, error="pool_address parametresi gerekli")
            
            try:
                import httpx
                
                # The Graph API kullanarak Uniswap pool verisi
                query = """
                {
                  pool(id: "%s") {
                    token0 {
                      symbol
                      name
                    }
                    token1 {
                      symbol
                      name
                    }
                    feeTier
                    liquidity
                    volumeUSD
                    totalValueLockedUSD
                  }
                }
                """ % pool_address.lower()
                
                api_url = "https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3"
                
                async with httpx.AsyncClient(timeout=10.0) as client:
                    response = await client.post(api_url, json={"query": query})
                    response.raise_for_status()
                    data = response.json()
                
                pool_data = data.get("data", {}).get("pool")
                if not pool_data:
                    return ToolResult(ok=False, error="Pool bulunamadı")
                
                output = f"DeFi Pool Bilgisi\n"
                output += f"Pool: {pool_address}\n"
                output += f"Token 0: {pool_data['token0']['name']} ({pool_data['token0']['symbol']})\n"
                output += f"Token 1: {pool_data['token1']['name']} ({pool_data['token1']['symbol']})\n"
                output += f"Fee Tier: {pool_data['feeTier'] / 10000}%\n"
                output += f"Liquidity: {float(pool_data['liquidity']):,.0f}\n"
                output += f"Volume (24h): ${float(pool_data['volumeUSD']):,.2f}\n"
                output += f"TVL: ${float(pool_data['totalValueLockedUSD']):,.2f}\n"
                output += f"Ağ: {network}"
                
                return ToolResult(
                    ok=True,
                    output=output,
                    data={"pool_address": pool_address, "pool_data": pool_data, "network": network}
                )
                
            except ImportError:
                return ToolResult(ok=False, error="httpx paketi yüklü değil: pip install httpx")
            except Exception as e:
                return ToolResult(ok=False, error=f"DeFi pool sorgu hatası: {str(e)}")
                
        except Exception as e:
            logger.exception("DeFi pool info hatası")
            return ToolResult(ok=False, error=str(e))


class DeFiSwapQuoteTool(BaseTool):
    """DeFi swap fiyat teklifi."""
    
    name = "defi_swap_quote"
    description = "Uniswap gibi DeFi protokollerinde swap fiyat teklifi alır."
    permission: PermissionKey = "web_search"
    
    parameters = {
        "type": "object",
        "properties": {
            "token_in": {
                "type": "string",
                "description": "Giriş token adresi (0x ile başlayan)"
            },
            "token_out": {
                "type": "string",
                "description": "Çıkış token adresi (0x ile başlayan)"
            },
            "amount_in": {
                "type": "number",
                "description": "Giriş miktarı"
            },
            "network": {
                "type": "string",
                "description": "Ağ adı (mainnet, sepolia, goerli)",
                "enum": ["mainnet", "sepolia", "goerli"],
                "default": "mainnet"
            }
        },
        "required": ["token_in", "token_out", "amount_in"]
    }
    
    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        try:
            token_in = args.get("token_in")
            token_out = args.get("token_out")
            amount_in = args.get("amount_in")
            network = args.get("network", "mainnet")
            
            if not all([token_in, token_out, amount_in]):
                return ToolResult(ok=False, error="token_in, token_out ve amount_in parametreleri gerekli")
            
            try:
                import httpx
                
                # 1inch API kullanarak quote al
                api_url = f"https://api.1inch.io/v5.0/{1 if network == 'mainnet' else 11155111}/quote"
                params = {
                    "fromTokenAddress": token_in,
                    "toTokenAddress": token_out,
                    "amount": str(int(amount_in * 10**18))  # Assuming 18 decimals
                }
                
                async with httpx.AsyncClient(timeout=10.0) as client:
                    response = await client.get(api_url, params=params)
                    response.raise_for_status()
                    data = response.json()
                
                output = f"DeFi Swap Quote\n"
                output += f"From: {token_in}\n"
                output += f"To: {token_out}\n"
                output += f"Amount In: {amount_in}\n"
                output += f"Amount Out: {int(data['toTokenAmount']) / 10**18}\n"
                output += f"Estimated Gas: {data.get('estimatedGas', 'N/A')}\n"
                output += f"Ağ: {network}"
                
                return ToolResult(
                    ok=True,
                    output=output,
                    data={"quote": data, "network": network}
                )
                
            except ImportError:
                return ToolResult(ok=False, error="httpx paketi yüklü değil: pip install httpx")
            except Exception as e:
                return ToolResult(ok=False, error=f"DeFi swap quote hatası: {str(e)}")
                
        except Exception as e:
            logger.exception("DeFi swap quote hatası")
            return ToolResult(ok=False, error=str(e))


class IPFSUploadTool(BaseTool):
    """IPFS'e dosya yükleme."""
    
    name = "ipfs_upload"
    description = "Dosyayı IPFS ağına yükler ve CID döndürür."
    permission: PermissionKey = "file_system"
    
    parameters = {
        "type": "object",
        "properties": {
            "file_path": {
                "type": "string",
                "description": "Yüklenecek dosya yolu"
            }
        },
        "required": ["file_path"]
    }
    
    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        try:
            file_path = args.get("file_path")
            
            if not file_path:
                return ToolResult(ok=False, error="file_path parametresi gerekli")
            
            try:
                import httpx
                import os
                
                if not os.path.exists(file_path):
                    return ToolResult(ok=False, error=f"Dosya bulunamadı: {file_path}")
                
                # IPFS HTTP API kullanarak yükle
                api_url = "https://ipfs.infura.io:5001/api/v0/add"
                
                with open(file_path, "rb") as f:
                    files = {"file": f}
                    auth = (os.getenv("INFURA_IPFS_PROJECT_ID"), os.getenv("INFURA_IPFS_PROJECT_SECRET"))
                    
                    async with httpx.AsyncClient(timeout=30.0, auth=auth) as client:
                        response = await client.post(api_url, files=files)
                        response.raise_for_status()
                        data = response.json()
                
                cid = data["Hash"]
                ipfs_url = f"https://ipfs.io/ipfs/{cid}"
                
                output = f"IPFS Upload Başarılı\n"
                output += f"Dosya: {file_path}\n"
                output += f"CID: {cid}\n"
                output += f"IPFS URL: {ipfs_url}"
                
                return ToolResult(
                    ok=True,
                    output=output,
                    data={"file_path": file_path, "cid": cid, "ipfs_url": ipfs_url}
                )
                
            except ImportError:
                return ToolResult(ok=False, error="httpx paketi yüklü değil: pip install httpx")
            except Exception as e:
                return ToolResult(ok=False, error=f"IPFS upload hatası: {str(e)}")
                
        except Exception as e:
            logger.exception("IPFS upload hatası")
            return ToolResult(ok=False, error=str(e))


class IPFSDownloadTool(BaseTool):
    """IPFS'ten dosya indirme."""
    
    name = "ipfs_download"
    description = "IPFS CID'si ile dosyayı indirir."
    permission: PermissionKey = "file_system"
    
    parameters = {
        "type": "object",
        "properties": {
            "cid": {
                "type": "string",
                "description": "IPFS Content Identifier"
            },
            "output_path": {
                "type": "string",
                "description": "İndirilecek dosya yolu"
            }
        },
        "required": ["cid", "output_path"]
    }
    
    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        try:
            cid = args.get("cid")
            output_path = args.get("output_path")
            
            if not cid or not output_path:
                return ToolResult(ok=False, error="cid ve output_path parametreleri gerekli")
            
            try:
                import httpx
                
                ipfs_url = f"https://ipfs.io/ipfs/{cid}"
                
                async with httpx.AsyncClient(timeout=30.0) as client:
                    response = await client.get(ipfs_url)
                    response.raise_for_status()
                    
                    with open(output_path, "wb") as f:
                        f.write(response.content)
                
                output = f"IPFS Download Başarılı\n"
                output += f"CID: {cid}\n"
                output += f"Kaydedildi: {output_path}\n"
                output += f"Boyut: {len(response.content)} bytes"
                
                return ToolResult(
                    ok=True,
                    output=output,
                    data={"cid": cid, "output_path": output_path, "size": len(response.content)}
                )
                
            except ImportError:
                return ToolResult(ok=False, error="httpx paketi yüklü değil: pip install httpx")
            except Exception as e:
                return ToolResult(ok=False, error=f"IPFS download hatası: {str(e)}")
                
        except Exception as e:
            logger.exception("IPFS download hatası")
            return ToolResult(ok=False, error=str(e))


class ENSResolveTool(BaseTool):
    """ENS domain çözümleme."""
    
    name = "ens_resolve"
    description = "Ethereum Name Service (ENS) domain'ini adres veya adresi domain'e çevirir."
    permission: PermissionKey = "web_search"
    
    parameters = {
        "type": "object",
        "properties": {
            "input": {
                "type": "string",
                "description": "ENS domain (örn: vitalik.eth) veya Ethereum adresi"
            }
        },
        "required": ["input"]
    }
    
    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        try:
            input_value = args.get("input")
            
            if not input_value:
                return ToolResult(ok=False, error="input parametresi gerekli")
            
            try:
                from web3 import Web3
                import os
                
                w3 = Web3(Web3.HTTPProvider(os.getenv("INFURA_MAINNET_URL") or "https://mainnet.infura.io/v3/YOUR_PROJECT_ID"))
                
                if not w3.is_connected():
                    return ToolResult(ok=False, error="Blockchain bağlantısı başarısız")
                
                if input_value.endswith(".eth"):
                    # Domain'den adres çözümle
                    address = w3.ens.address(input_value)
                    if address:
                        output = f"ENS Çözümleme\n"
                        output += f"Domain: {input_value}\n"
                        output += f"Adres: {address}"
                        data = {"domain": input_value, "address": address}
                    else:
                        return ToolResult(ok=False, error=f"ENS domain bulunamadı: {input_value}")
                else:
                    # Adres'den domain çözümle
                    try:
                        domain = w3.ens.name(input_value)
                        if domain:
                            output = f"ENS Reverse Çözümleme\n"
                            output += f"Adres: {input_value}\n"
                            output += f"Domain: {domain}"
                            data = {"address": input_value, "domain": domain}
                        else:
                            return ToolResult(ok=False, error=f"ENS domain bulunamadı: {input_value}")
                    except:
                        return ToolResult(ok=False, error=f"Geçersiz Ethereum adresi: {input_value}")
                
                return ToolResult(
                    ok=True,
                    output=output,
                    data=data
                )
                
            except ImportError:
                return ToolResult(ok=False, error="web3 paketi yüklü değil: pip install web3")
            except Exception as e:
                return ToolResult(ok=False, error=f"ENS çözümleme hatası: {str(e)}")
                
        except Exception as e:
            logger.exception("ENS resolve hatası")
            return ToolResult(ok=False, error=str(e))


class Web3SignMessageTool(BaseTool):
    """Web3 mesaj imzalama."""
    
    name = "web3_sign_message"
    description = "Ethereum private key ile mesajı imzalar."
    permission: PermissionKey = "none"
    
    parameters = {
        "type": "object",
        "properties": {
            "message": {
                "type": "string",
                "description": "İmzalanacak mesaj"
            },
            "private_key": {
                "type": "string",
                "description": "İmzalama için private key (0x ile başlayan)"
            }
        },
        "required": ["message", "private_key"]
    }
    
    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        try:
            message = args.get("message")
            private_key = args.get("private_key")
            
            if not message or not private_key:
                return ToolResult(ok=False, error="message ve private_key parametreleri gerekli")
            
            try:
                from eth_account import Account
                from eth_account.messages import encode_defunct
                
                account = Account.from_key(private_key)
                
                # Mesajı encode et ve imzala
                message_encoded = encode_defunct(text=message)
                signed_message = Account.sign_message(message_encoded, private_key)
                
                output = f"Web3 Mesaj İmzası\n"
                output += f"Mesaj: {message}\n"
                output += f"İmzalayan: {account.address}\n"
                output += f"İmza: {signed_message.signature.hex()}\n"
                output += f"Message Hash: {signed_message.messageHash.hex()}"
                
                return ToolResult(
                    ok=True,
                    output=output,
                    data={
                        "message": message,
                        "signer": account.address,
                        "signature": signed_message.signature.hex(),
                        "message_hash": signed_message.messageHash.hex()
                    }
                )
                
            except ImportError:
                return ToolResult(ok=False, error="eth-account paketi yüklü değil: pip install eth-account")
            except Exception as e:
                return ToolResult(ok=False, error=f"Mesaj imzalama hatası: {str(e)}")
                
        except Exception as e:
            logger.exception("Web3 sign message hatası")
            return ToolResult(ok=False, error=str(e))


class Web3VerifySignatureTool(BaseTool):
    """Web3 imza doğrulama."""
    
    name = "web3_verify_signature"
    description = "Ethereum mesaj imzasını doğrular."
    permission: PermissionKey = "none"
    
    parameters = {
        "type": "object",
        "properties": {
            "message": {
                "type": "string",
                "description": "Orijinal mesaj"
            },
            "signature": {
                "type": "string",
                "description": "İmza (0x ile başlayan)"
            },
            "expected_address": {
                "type": "string",
                "description": "Beklenen imzacı adresi (0x ile başlayan)"
            }
        },
        "required": ["message", "signature", "expected_address"]
    }
    
    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        try:
            message = args.get("message")
            signature = args.get("signature")
            expected_address = args.get("expected_address")
            
            if not all([message, signature, expected_address]):
                return ToolResult(ok=False, error="Tüm parametreler gerekli")
            
            try:
                from eth_account import Account
                from eth_account.messages import encode_defunct
                
                # Mesajı encode et
                message_encoded = encode_defunct(text=message)
                
                # İmzayı doğrula
                recovered_address = Account.recover_message(message_encoded, signature=signature)
                
                is_valid = recovered_address.lower() == expected_address.lower()
                
                output = f"Web3 İmza Doğrulama\n"
                output += f"Mesaj: {message}\n"
                output += f"İmza: {signature}\n"
                output += f"Beklenen Adres: {expected_address}\n"
                output += f"Kurtarılan Adres: {recovered_address}\n"
                output += f"Doğrulama: {'✅ Geçerli' if is_valid else '❌ Geçersiz'}"
                
                return ToolResult(
                    ok=True,
                    output=output,
                    data={
                        "message": message,
                        "signature": signature,
                        "expected_address": expected_address,
                        "recovered_address": recovered_address,
                        "is_valid": is_valid
                    }
                )
                
            except ImportError:
                return ToolResult(ok=False, error="eth-account paketi yüklü değil: pip install eth-account")
            except Exception as e:
                return ToolResult(ok=False, error=f"İmza doğrulama hatası: {str(e)}")
                
        except Exception as e:
            logger.exception("Web3 verify signature hatası")
            return ToolResult(ok=False, error=str(e))


class BlockchainExplorerLinkTool(BaseTool):
    """Blockchain explorer link oluşturma."""
    
    name = "blockchain_explorer_link"
    description = "Transaction, adres veya contract için blockchain explorer linki oluşturur."
    permission: PermissionKey = "none"
    
    parameters = {
        "type": "object",
        "properties": {
            "type": {
                "type": "string",
                "description": "Link tipi",
                "enum": ["transaction", "address", "contract", "block"]
            },
            "identifier": {
                "type": "string",
                "description": "Transaction hash, adres veya block numarası"
            },
            "network": {
                "type": "string",
                "description": "Ağ adı (mainnet, sepolia, goerli)",
                "enum": ["mainnet", "sepolia", "goerli"],
                "default": "mainnet"
            }
        },
        "required": ["type", "identifier"]
    }
    
    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        try:
            link_type = args.get("type")
            identifier = args.get("identifier")
            network = args.get("network", "mainnet")
            
            if not link_type or not identifier:
                return ToolResult(ok=False, error="type ve identifier parametreleri gerekli")
            
            # Explorer URL'leri
            explorers = {
                "mainnet": {
                    "transaction": "https://etherscan.io/tx/",
                    "address": "https://etherscan.io/address/",
                    "contract": "https://etherscan.io/address/",
                    "block": "https://etherscan.io/block/"
                },
                "sepolia": {
                    "transaction": "https://sepolia.etherscan.io/tx/",
                    "address": "https://sepolia.etherscan.io/address/",
                    "contract": "https://sepolia.etherscan.io/address/",
                    "block": "https://sepolia.etherscan.io/block/"
                },
                "goerli": {
                    "transaction": "https://goerli.etherscan.io/tx/",
                    "address": "https://goerli.etherscan.io/address/",
                    "contract": "https://goerli.etherscan.io/address/",
                    "block": "https://goerli.etherscan.io/block/"
                }
            }
            
            base_url = explorers.get(network, {}).get(link_type)
            if not base_url:
                return ToolResult(ok=False, error=f"Geçersiz ağ veya link tipi: {network}, {link_type}")
            
            explorer_link = f"{base_url}{identifier}"
            
            output = f"Blockchain Explorer Link\n"
            output += f"Tür: {link_type}\n"
            output += f"Identifier: {identifier}\n"
            output += f"Ağ: {network}\n"
            output += f"Link: {explorer_link}"
            
            return ToolResult(
                ok=True,
                output=output,
                data={"type": link_type, "identifier": identifier, "network": network, "explorer_link": explorer_link}
            )
                
        except Exception as e:
            logger.exception("Blockchain explorer link hatası")
            return ToolResult(ok=False, error=str(e))