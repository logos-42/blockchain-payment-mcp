"""多链支持模块

为各种主流区块链提供统一的接口支持，包括：
- EVM兼容链（以太坊、BSC、Polygon等）
- Solana
- Cosmos生态链
"""

import asyncio
import logging
from typing import Optional, Dict, Any, List, Union
from decimal import Decimal
from abc import ABC, abstractmethod

# EVM兼容链支持
from web3 import Web3
from web3.types import TxParams, HexBytes, TxReceipt
from web3.exceptions import TransactionNotFound, TimeExhausted

# Solana支持
try:
    from solana.rpc.api import Client as SolanaClient
    from solana.rpc.types import TxOpts
    from solana.transaction import Transaction as SolanaTransaction
    from solana.account import Account as SolanaAccount
    from solana.publickey import PublicKey
    from solana.system_program import TransferParams, transfer
    import base58
    HAS_SOLANA = True
except ImportError:
    HAS_SOLANA = False
    SolanaClient = None
    SolanaTransaction = None
    SolanaAccount = None
    PublicKey = None

# Cosmos支持
try:
    from cosmospy import CosmosClient, Transaction as CosmosTransaction
    HAS_COSMOS = True
except ImportError:
    HAS_COSMOS = False
    CosmosClient = None
    CosmosTransaction = None

from .config import config, NetworkConfig, TokenConfig
from .wallet import WalletSigner

logger = logging.getLogger(__name__)

class MultiChainInterface(ABC):
    """多链接口抽象基类"""
    
    @abstractmethod
    async def get_balance(self, address: str, token_symbol: Optional[str] = None) -> Dict[str, Any]:
        """获取地址余额"""
        pass
    
    @abstractmethod
    async def estimate_gas_fees(self, transaction: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """估算Gas费用"""
        pass
    
    @abstractmethod
    async def send_transaction(self, to_address: str, amount: Union[str, float], 
                              token_symbol: Optional[str] = None, 
                              wallet: Optional[WalletSigner] = None) -> Dict[str, Any]:
        """发送交易"""
        pass
    
    @abstractmethod
    async def get_transaction_status(self, tx_hash: str) -> Dict[str, Any]:
        """获取交易状态"""
        pass

class EVMChainInterface(MultiChainInterface):
    """EVM兼容链接口实现"""
    
    def __init__(self, network_config: NetworkConfig):
        self.network_config = network_config
        self.w3 = Web3(Web3.HTTPProvider(network_config.rpc_url))
        
        # 验证连接
        try:
            self.w3.is_connected()
            logger.info(f"EVM链连接成功: {network_config.name} (Chain ID: {network_config.chain_id})")
        except Exception as e:
            logger.warning(f"EVM链连接警告 {network_config.name}: {e}")
    
    async def get_balance(self, address: str, token_symbol: Optional[str] = None) -> Dict[str, Any]:
        """获取地址余额"""
        try:
            if not WalletSigner.validate_address(address):
                raise ValueError("无效的地址格式")
            
            # 转换为checksum地址
            address = self.w3.to_checksum_address(address)
            
            result = {
                "address": address,
                "network": self.network_config.name,
                "balances": {}
            }
            
            # 获取原生代币余额
            native_balance_wei = self.w3.eth.get_balance(address)
            native_balance = self.w3.from_wei(native_balance_wei, 'ether')
            result["balances"][self.network_config.native_token] = {
                "balance": str(native_balance),
                "symbol": self.network_config.native_token,
                "decimals": 18,
                "wei": str(native_balance_wei)
            }
            
            # 获取指定代币余额
            if token_symbol:
                token_config = config.get_token(token_symbol)
                if token_config:
                    token_balance = await self._get_token_balance(address, token_config)
                    result["balances"][token_symbol] = token_balance
                else:
                    result["error"] = f"未知代币: {token_symbol}"
            else:
                # 获取所有已配置代币的余额
                for symbol, token_config in config.tokens.items():
                    try:
                        token_balance = await self._get_token_balance(address, token_config)
                        result["balances"][symbol] = token_balance
                    except Exception as e:
                        logger.warning(f"获取代币 {symbol} 余额失败: {e}")
            
            return result
            
        except Exception as e:
            logger.error(f"获取余额失败: {e}")
            return {"error": str(e), "address": address}
    
    async def _get_token_balance(self, address: str, token_config: TokenConfig) -> Dict[str, Any]:
        """获取ERC20代币余额"""
        # ERC20 balanceOf 函数的ABI
        balance_abi = [
            {
                "constant": True,
                "inputs": [{"name": "_owner", "type": "address"}],
                "name": "balanceOf",
                "outputs": [{"name": "balance", "type": "uint256"}],
                "type": "function"
            }
        ]
        
        contract = self.w3.eth.contract(
            address=self.w3.to_checksum_address(token_config.address),
            abi=balance_abi
        )
        
        balance_wei = contract.functions.balanceOf(address).call()
        balance = balance_wei / (10 ** token_config.decimals)
        
        return {
            "balance": str(balance),
            "symbol": token_config.symbol,
            "decimals": token_config.decimals,
            "wei": str(balance_wei),
            "contract_address": token_config.address
        }
    
    async def estimate_gas_fees(self, transaction: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """估算Gas费用"""
        try:
            # 获取当前gas价格
            gas_price = self.w3.eth.gas_price
            
            # 默认gas限制
            gas_limit = 21000
            
            # 如果提供了交易，估算实际gas使用量
            if transaction:
                try:
                    tx_params = self._build_transaction_params(transaction)
                    gas_limit = self.w3.eth.estimate_gas(tx_params)
                except Exception as e:
                    logger.warning(f"Gas估算失败，使用默认值: {e}")
                    gas_limit = 21000
            
            # 计算费用
            estimated_fee_wei = gas_price * gas_limit
            estimated_fee_eth = self.w3.from_wei(estimated_fee_wei, 'ether')
            
            return {
                "gas_price": str(gas_price),
                "gas_price_gwei": str(self.w3.from_wei(gas_price, 'gwei')),
                "gas_limit": gas_limit,
                "estimated_fee_wei": str(estimated_fee_wei),
                "estimated_fee_eth": str(estimated_fee_eth),
                "network": self.network_config.name
            }
            
        except Exception as e:
            logger.error(f"估算Gas费用失败: {e}")
            return {"error": str(e)}
    
    async def send_transaction(self, to_address: str, amount: Union[str, float], 
                              token_symbol: Optional[str] = None, 
                              wallet: Optional[WalletSigner] = None) -> Dict[str, Any]:
        """发送交易"""
        try:
            # 验证地址
            if not WalletSigner.validate_address(to_address):
                raise ValueError("无效的接收地址")
            
            # 转换为checksum地址
            to_address = self.w3.to_checksum_address(to_address)
            
            # 使用提供的钱包或创建临时钱包
            if wallet:
                sender_wallet = wallet
            else:
                sender_wallet = WalletSigner(config.private_key)
            
            if not sender_wallet.has_private_key():
                return {
                    "error": "需要私钥进行交易签名",
                    "suggestion": "请提供私钥或使用MetaMask等钱包"
                }
            
            # 转换金额
            amount_decimal = Decimal(str(amount))
            
            # 安全检查
            if amount_decimal > config.max_transaction_value:
                raise ValueError(f"交易金额超过限制 {config.max_transaction_value} ETH")
            
            # 构建交易
            if token_symbol and token_symbol.upper() != "ETH":
                # ERC20代币转账
                return await self._send_token_transaction(
                    sender_wallet, to_address, amount_decimal, token_symbol
                )
            else:
                # 原生代币转账
                return await self._send_native_transaction(
                    sender_wallet, to_address, amount_decimal
                )
                
        except Exception as e:
            logger.error(f"发送交易失败: {e}")
            return {"error": str(e)}
    
    async def _send_native_transaction(self, wallet: WalletSigner, to_address: str, 
                                      amount: Decimal) -> Dict[str, Any]:
        """发送原生代币交易"""
        # 获取nonce
        nonce = self.w3.eth.get_transaction_count(wallet.address)
        
        # 估算gas
        gas_estimate = await self.estimate_gas_fees()
        gas_price = int(gas_estimate.get("gas_price", self.network_config.gas_price))
        gas_limit = gas_estimate.get("gas_limit", 21000)
        
        # 构建交易参数
        transaction = {
            'to': self.w3.to_checksum_address(to_address),
            'value': self.w3.to_wei(amount, 'ether'),
            'gas': gas_limit,
            'gasPrice': gas_price,
            'nonce': nonce,
            'chainId': self.network_config.chain_id
        }
        
        # 签名并发送交易
        signed_txn = wallet.sign_transaction(transaction)
        tx_hash = self.w3.eth.send_raw_transaction(signed_txn)
        
        # 等待交易确认
        receipt = await self._wait_for_transaction_receipt(tx_hash)
        
        return {
            "transaction_hash": tx_hash.hex(),
            "from_address": wallet.address,
            "to_address": to_address,
            "amount": str(amount),
            "symbol": self.network_config.native_token,
            "status": "success" if receipt.status == 1 else "failed",
            "gas_used": receipt.gasUsed,
            "block_number": receipt.blockNumber,
            "network": self.network_config.name
        }
    
    async def _send_token_transaction(self, wallet: WalletSigner, to_address: str,
                                     amount: Decimal, token_symbol: str) -> Dict[str, Any]:
        """发送ERC20代币交易"""
        token_config = config.get_token(token_symbol)
        if not token_config:
            raise ValueError(f"未知代币: {token_symbol}")
        
        # ERC20 transfer 函数的ABI
        transfer_abi = [
            {
                "constant": False,
                "inputs": [
                    {"name": "_to", "type": "address"},
                    {"name": "_value", "type": "uint256"}
                ],
                "name": "transfer",
                "outputs": [{"name": "", "type": "bool"}],
                "type": "function"
            }
        ]
        
        contract = self.w3.eth.contract(
            address=self.w3.to_checksum_address(token_config.address),
            abi=transfer_abi
        )
        
        # 转换金额到wei单位
        amount_wei = int(amount * (10 ** token_config.decimals))
        
        # 获取nonce
        nonce = self.w3.eth.get_transaction_count(wallet.address)
        
        # 构建交易
        transaction = contract.functions.transfer(
            self.w3.to_checksum_address(to_address),
            amount_wei
        ).build_transaction({
            'chainId': self.network_config.chain_id,
            'gas': 60000,  # ERC20 转账通常需要更多gas
            'gasPrice': self.network_config.gas_price,
            'nonce': nonce,
        })
        
        # 签名并发送交易
        signed_txn = wallet.sign_transaction(transaction)
        tx_hash = self.w3.eth.send_raw_transaction(signed_txn)
        
        # 等待交易确认
        receipt = await self._wait_for_transaction_receipt(tx_hash)
        
        return {
            "transaction_hash": tx_hash.hex(),
            "from_address": wallet.address,
            "to_address": to_address,
            "amount": str(amount),
            "symbol": token_symbol,
            "contract_address": token_config.address,
            "status": "success" if receipt.status == 1 else "failed",
            "gas_used": receipt.gasUsed,
            "block_number": receipt.blockNumber,
            "network": self.network_config.name
        }
    
    async def _wait_for_transaction_receipt(self, tx_hash: HexBytes, timeout: int = 120) -> TxReceipt:
        """等待交易确认"""
        try:
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=timeout)
            return receipt
        except TimeExhausted:
            raise TimeoutError(f"交易 {tx_hash.hex()} 确认超时")
    
    async def get_transaction_status(self, tx_hash: str) -> Dict[str, Any]:
        """获取交易状态"""
        try:
            tx_hash_bytes = HexBytes(tx_hash)
            
            # 获取交易信息
            try:
                transaction = self.w3.eth.get_transaction(tx_hash_bytes)
                receipt = self.w3.eth.get_transaction_receipt(tx_hash_bytes)
                
                status = "success" if receipt.status == 1 else "failed"
                confirmations = self.w3.eth.block_number - receipt.blockNumber
                
            except TransactionNotFound:
                # 交易还在pending状态
                return {
                    "transaction_hash": tx_hash,
                    "status": "pending",
                    "confirmations": 0,
                    "message": "交易正在处理中..."
                }
            
            return {
                "transaction_hash": tx_hash,
                "status": status,
                "block_number": receipt.blockNumber,
                "confirmations": confirmations,
                "gas_used": receipt.gasUsed,
                "from_address": transaction['from'],
                "to_address": transaction['to'],
                "value_wei": str(transaction['value']),
                "value_eth": str(self.w3.from_wei(transaction['value'], 'ether')),
                "network": self.network_config.name
            }
            
        except Exception as e:
            logger.error(f"获取交易状态失败: {e}")
            return {"error": str(e), "transaction_hash": tx_hash}
    
    def _build_transaction_params(self, transaction: Dict[str, Any]) -> TxParams:
        """构建交易参数"""
        params = {}
        
        if 'to' in transaction:
            params['to'] = self.w3.to_checksum_address(transaction['to'])
        if 'value' in transaction:
            params['value'] = self.w3.to_wei(transaction['value'], 'ether')
        if 'data' in transaction:
            params['data'] = transaction['data']
            
        return params

class SolanaChainInterface(MultiChainInterface):
    """Solana链接口实现"""
    
    def __init__(self, network_config: NetworkConfig):
        if not HAS_SOLANA:
            raise ImportError("Solana支持需要安装solana库: pip install solana")
        
        self.network_config = network_config
        self.client = SolanaClient(network_config.rpc_url)
        
        # 验证连接
        try:
            self.client.get_health()
            logger.info(f"Solana链连接成功: {network_config.name}")
        except Exception as e:
            logger.warning(f"Solana链连接警告 {network_config.name}: {e}")
    
    async def get_balance(self, address: str, token_symbol: Optional[str] = None) -> Dict[str, Any]:
        """获取地址余额"""
        try:
            # 验证地址格式
            try:
                PublicKey(address)
            except Exception:
                raise ValueError("无效的Solana地址格式")
            
            result = {
                "address": address,
                "network": self.network_config.name,
                "balances": {}
            }
            
            # 获取SOL余额
            balance_response = self.client.get_balance(PublicKey(address))
            sol_balance_lamports = balance_response.value
            sol_balance = sol_balance_lamports / 10**9  # 1 SOL = 10^9 lamports
            
            result["balances"]["SOL"] = {
                "balance": str(sol_balance),
                "symbol": "SOL",
                "decimals": 9,
                "lamports": str(sol_balance_lamports)
            }
            
            # TODO: 支持SPL代币余额查询
            
            return result
            
        except Exception as e:
            logger.error(f"获取Solana余额失败: {e}")
            return {"error": str(e), "address": address}
    
    async def estimate_gas_fees(self, transaction: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """估算Gas费用（Solana中称为优先费用）"""
        try:
            # 获取最近区块的优先费用中位数
            fees_response = self.client.get_recent_prioritization_fees()
            fees = [fee.prioritization_fee for fee in fees_response.value]
            
            if fees:
                # 计算中位数
                fees.sort()
                median_fee = fees[len(fees) // 2]
            else:
                median_fee = 0
            
            return {
                "priority_fee": str(median_fee),
                "priority_fee_unit": "micro_lamports",
                "network": self.network_config.name
            }
            
        except Exception as e:
            logger.error(f"估算Solana费用失败: {e}")
            return {"error": str(e)}
    
    async def send_transaction(self, to_address: str, amount: Union[str, float], 
                              token_symbol: Optional[str] = None, 
                              wallet: Optional[WalletSigner] = None) -> Dict[str, Any]:
        """发送交易"""
        try:
            # 验证地址格式
            try:
                PublicKey(to_address)
            except Exception:
                raise ValueError("无效的Solana地址格式")
            
            # Solana中只需要发送方的私钥
            if not wallet or not wallet.has_private_key():
                return {
                    "error": "需要私钥进行交易签名",
                    "suggestion": "请提供包含私钥的钱包"
                }
            
            # 转换金额
            amount_decimal = Decimal(str(amount))
            
            # 安全检查
            if amount_decimal > config.max_transaction_value:
                raise ValueError(f"交易金额超过限制 {config.max_transaction_value} SOL")
            
            # 创建发送账户（需要私钥）
            sender_private_key = bytes.fromhex(wallet.private_key)
            sender_account = SolanaAccount(sender_private_key)
            
            # 构建转账交易
            transaction = SolanaTransaction()
            transaction.add(
                transfer(
                    TransferParams(
                        from_pubkey=sender_account.public_key(),
                        to_pubkey=PublicKey(to_address),
                        lamports=int(amount_decimal * 10**9)  # 转换为lamports
                    )
                )
            )
            
            # 发送交易
            response = self.client.send_transaction(
                transaction,
                sender_account,
                opts=TxOpts(skip_preflight=True)
            )
            
            tx_hash = response.value
            
            return {
                "transaction_hash": str(tx_hash),
                "from_address": str(sender_account.public_key()),
                "to_address": to_address,
                "amount": str(amount_decimal),
                "symbol": "SOL",
                "status": "submitted",
                "network": self.network_config.name
            }
                
        except Exception as e:
            logger.error(f"发送Solana交易失败: {e}")
            return {"error": str(e)}
    
    async def get_transaction_status(self, tx_hash: str) -> Dict[str, Any]:
        """获取交易状态"""
        try:
            # Solana的交易哈希是base58编码的
            tx_signature = tx_hash
            
            # 获取交易详情
            response = self.client.get_transaction(
                tx_signature,
                encoding="jsonParsed"
            )
            
            if not response.value:
                return {
                    "transaction_hash": tx_hash,
                    "status": "not_found",
                    "message": "交易未找到"
                }
            
            transaction = response.value
            meta = transaction.meta
            
            status = "success" if (meta and not meta.err) else "failed"
            
            # 获取转账详情
            from_address = None
            to_address = None
            amount = None
            
            if transaction.transaction.message.instructions:
                instruction = transaction.transaction.message.instructions[0]
                if hasattr(instruction, 'parsed') and instruction.parsed:
                    info = instruction.parsed.get('info', {})
                    from_address = info.get('source')
                    to_address = info.get('destination')
                    amount_lamports = info.get('lamports')
                    if amount_lamports:
                        amount = str(int(amount_lamports) / 10**9)
            
            return {
                "transaction_hash": tx_hash,
                "status": status,
                "block_time": transaction.block_time,
                "slot": transaction.slot,
                "from_address": from_address,
                "to_address": to_address,
                "amount": amount,
                "symbol": "SOL",
                "network": self.network_config.name
            }
            
        except Exception as e:
            logger.error(f"获取Solana交易状态失败: {e}")
            return {"error": str(e), "transaction_hash": tx_hash}

class CosmosChainInterface(MultiChainInterface):
    """Cosmos链接口实现"""
    
    def __init__(self, network_config: NetworkConfig):
        if not HAS_COSMOS:
            raise ImportError("Cosmos支持需要安装cosmospy库: pip install cosmospy")
        
        self.network_config = network_config
        # CosmosClient需要不同的初始化方式，这里简化处理
        self.client = None  # 实际项目中需要正确初始化
        
        logger.info(f"Cosmos链接口初始化: {network_config.name}")
    
    async def get_balance(self, address: str, token_symbol: Optional[str] = None) -> Dict[str, Any]:
        """获取地址余额"""
        # 这里需要根据实际的Cosmos SDK实现
        return {
            "address": address,
            "network": self.network_config.name,
            "error": "Cosmos链支持正在开发中"
        }
    
    async def estimate_gas_fees(self, transaction: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """估算Gas费用"""
        return {
            "network": self.network_config.name,
            "error": "Cosmos链支持正在开发中"
        }
    
    async def send_transaction(self, to_address: str, amount: Union[str, float], 
                              token_symbol: Optional[str] = None, 
                              wallet: Optional[WalletSigner] = None) -> Dict[str, Any]:
        """发送交易"""
        return {
            "network": self.network_config.name,
            "error": "Cosmos链支持正在开发中"
        }
    
    async def get_transaction_status(self, tx_hash: str) -> Dict[str, Any]:
        """获取交易状态"""
        return {
            "transaction_hash": tx_hash,
            "network": self.network_config.name,
            "error": "Cosmos链支持正在开发中"
        }

# 多链工厂类
class MultiChainFactory:
    """多链接口工厂"""
    
    # 链类型映射
    CHAIN_TYPE_MAPPING = {
        "ethereum": "evm",
        "base": "evm",
        "bsc": "evm",
        "polygon": "evm",
        "avalanche": "evm",
        "fantom": "evm",
        "arbitrum": "evm",
        "optimism": "evm",
        "solana": "solana",
        "cosmos": "cosmos",
        "osmosis": "cosmos",
        "terra": "cosmos"
    }
    
    @staticmethod
    def create_chain_interface(network_config: NetworkConfig) -> MultiChainInterface:
        """根据网络配置创建对应的链接口实例"""
        # 根据网络名称判断链类型
        chain_type = None
        for chain, chain_type_key in MultiChainFactory.CHAIN_TYPE_MAPPING.items():
            if chain.lower() in network_config.name.lower():
                chain_type = chain_type_key
                break
        
        # 如果没有匹配，根据chain_id判断
        if not chain_type:
            evm_chain_ids = [1, 56, 137, 43114, 250, 42161, 10, 8453]  # 常见EVM链ID
            if network_config.chain_id in evm_chain_ids:
                chain_type = "evm"
        
        # 创建对应的接口实例
        if chain_type == "evm":
            return EVMChainInterface(network_config)
        elif chain_type == "solana":
            return SolanaChainInterface(network_config)
        elif chain_type == "cosmos":
            return CosmosChainInterface(network_config)
        else:
            # 默认使用EVM接口
            logger.warning(f"未知链类型，使用默认EVM接口: {network_config.name}")
            return EVMChainInterface(network_config)

# 全局多链接口管理器
class MultiChainManager:
    """多链接口管理器"""
    
    def __init__(self):
        self.chain_interfaces: Dict[str, MultiChainInterface] = {}
    
    def get_chain_interface(self, network_id: str) -> MultiChainInterface:
        """获取指定网络的链接口实例"""
        # 如果已经创建过，直接返回
        if network_id in self.chain_interfaces:
            return self.chain_interfaces[network_id]
        
        # 获取网络配置
        network_config = config.get_network(network_id)
        
        # 创建链接口实例
        chain_interface = MultiChainFactory.create_chain_interface(network_config)
        self.chain_interfaces[network_id] = chain_interface
        
        return chain_interface

# 全局多链管理器实例
multi_chain_manager = MultiChainManager()