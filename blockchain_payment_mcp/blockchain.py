"""
区块链交互层
"""
import asyncio
import logging
from typing import Optional, Dict, Any, List, Union
from decimal import Decimal
from web3 import Web3
from web3.types import TxParams, HexBytes, TxReceipt
from web3.exceptions import TransactionNotFound, TimeExhausted
import json

from .config import config, NetworkConfig, TokenConfig
from .wallet import WalletSigner
from .multi_chain import multi_chain_manager

logger = logging.getLogger(__name__)

class BlockchainInterface:
    """区块链交互接口"""
    
    def __init__(self, network_id: Optional[str] = None):
        self.network_config = config.get_network(network_id)
        # 使用多链管理器获取对应的链接口实例
        self.chain_interface = multi_chain_manager.get_chain_interface(network_id or config.default_network)
    
    async def get_balance(self, address: str, token_symbol: Optional[str] = None) -> Dict[str, Any]:
        """获取地址余额"""
        try:
            return await self.chain_interface.get_balance(address, token_symbol)
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
            return await self.chain_interface.estimate_gas_fees(transaction)
        except Exception as e:
            logger.error(f"估算Gas费用失败: {e}")
            return {"error": str(e)}
    
    async def send_transaction(self, to_address: str, amount: Union[str, float], 
                              token_symbol: Optional[str] = None, 
                              wallet: Optional[WalletSigner] = None) -> Dict[str, Any]:
        """发送交易"""
        try:
            return await self.chain_interface.send_transaction(to_address, amount, token_symbol, wallet)
        except Exception as e:
            logger.error(f"发送交易失败: {e}")
            return {"error": str(e)}
    
    async def _send_eth_transaction(self, wallet: WalletSigner, to_address: str, 
                                   amount: Decimal) -> Dict[str, Any]:
        """发送ETH交易"""
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
            "symbol": "ETH",
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
            return await self.chain_interface.get_transaction_status(tx_hash)
        except Exception as e:
            logger.error(f"获取交易状态失败: {e}")
            return {"error": str(e), "transaction_hash": tx_hash}
    
    # 以下方法已移至多链接口实现中
    async def _get_token_balance(self, address: str, token_config: TokenConfig) -> Dict[str, Any]:
        """获取ERC20代币余额 - 仅在EVM链中使用"""
        raise NotImplementedError("此方法已在多链接口中重新实现")
    
    async def _send_eth_transaction(self, wallet: WalletSigner, to_address: str, 
                                   amount: Decimal) -> Dict[str, Any]:
        """发送ETH交易 - 仅在EVM链中使用"""
        raise NotImplementedError("此方法已在多链接口中重新实现")
    
    async def _send_token_transaction(self, wallet: WalletSigner, to_address: str,
                                     amount: Decimal, token_symbol: str) -> Dict[str, Any]:
        """发送ERC20代币交易 - 仅在EVM链中使用"""
        raise NotImplementedError("此方法已在多链接口中重新实现")
    
    async def _wait_for_transaction_receipt(self, tx_hash: HexBytes, timeout: int = 120) -> TxReceipt:
        """等待交易确认 - 仅在EVM链中使用"""
        # 这个方法现在只在EVMChainInterface中使用，这里保留是为了兼容性
        raise NotImplementedError("此方法已在多链接口中重新实现")
    
    def _build_transaction_params(self, transaction: Dict[str, Any]) -> TxParams:
        """构建交易参数 - 仅在EVM链中使用"""
        # 这个方法现在只在EVMChainInterface中使用，这里保留是为了兼容性
        raise NotImplementedError("此方法已在多链接口中重新实现")