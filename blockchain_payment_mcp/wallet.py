"""
钱包和签名器模块
"""
import os
from typing import Optional, Dict, Any
from web3 import Web3
from web3.types import TxParams, HexBytes
from eth_account import Account
from eth_account.signers.local import LocalAccount
import logging

logger = logging.getLogger(__name__)

class WalletSigner:
    """钱包签名器 - 管理私钥和交易签名"""
    
    def __init__(self, private_key: Optional[str] = None):
        self.private_key = private_key
        self.account: Optional[LocalAccount] = None
        
        if self.private_key:
            try:
                self.account = Account.from_key(self.private_key)
                logger.info(f"钱包初始化成功，地址: {self.account.address}")
            except Exception as e:
                logger.error(f"私钥无效: {e}")
                self.account = None
    
    @property
    def address(self) -> Optional[str]:
        """获取钱包地址"""
        return self.account.address if self.account else None
    
    def has_private_key(self) -> bool:
        """检查是否有私钥"""
        return self.account is not None
    
    def sign_transaction(self, transaction: TxParams) -> HexBytes:
        """签名交易"""
        if not self.account:
            raise ValueError("没有可用的私钥进行签名")
        
        signed_txn = self.account.sign_transaction(transaction)
        # 兼容不同版本的web3.py
        if hasattr(signed_txn, 'rawTransaction'):
            return signed_txn.rawTransaction
        elif hasattr(signed_txn, 'raw_transaction'):
            return signed_txn.raw_transaction
        else:
            return signed_txn
    
    def create_account(self) -> Dict[str, str]:
        """创建新的钱包账户"""
        new_account = Account.create()
        return {
            "address": new_account.address,
            "private_key": new_account.key.hex(),
            "warning": "请安全保存私钥，丢失将无法找回资产！"
        }
    
    @staticmethod
    def validate_address(address: str) -> bool:
        """验证以太坊地址格式"""
        try:
            return Web3.is_address(address)
        except Exception:
            return False
    
    @staticmethod
    def validate_private_key(private_key: str) -> bool:
        """验证私钥格式"""
        try:
            Account.from_key(private_key)
            return True
        except Exception:
            return False

class MetaMaskConnector:
    """MetaMask连接器 - 用于浏览器环境的钱包交互"""
    
    def __init__(self):
        self.connected_account: Optional[str] = None
    
    def get_connection_instructions(self) -> Dict[str, Any]:
        """获取MetaMask连接说明"""
        return {
            "type": "metamask_connection",
            "instructions": [
                "1. 确保已安装MetaMask浏览器插件",
                "2. 在浏览器中打开应用页面",
                "3. 点击'连接钱包'按钮",
                "4. 在MetaMask中确认连接请求",
                "5. 选择要使用的账户"
            ],
            "javascript_code": '''
// 连接MetaMask的JavaScript代码示例
async function connectWallet() {
    if (typeof window.ethereum !== 'undefined') {
        try {
            const accounts = await window.ethereum.request({ 
                method: 'eth_requestAccounts' 
            });
            console.log('连接的账户:', accounts[0]);
            return accounts[0];
        } catch (error) {
            console.error('连接失败:', error);
        }
    } else {
        alert('请安装MetaMask!');
    }
}

// 发送交易
async function sendTransaction(to, value, data = '0x') {
    const txParams = {
        to: to,
        value: Web3.utils.toHex(Web3.utils.toWei(value, 'ether')),
        data: data,
        gasLimit: '0x5208',
    };
    
    const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [txParams],
    });
    
    return txHash;
}
            ''',
            "warning": "MetaMask集成需要在浏览器环境中运行"
        }
    
    def set_connected_account(self, account: str) -> None:
        """设置已连接的账户"""
        if WalletSigner.validate_address(account):
            self.connected_account = account
        else:
            raise ValueError("无效的账户地址")
    
    def get_connected_account(self) -> Optional[str]:
        """获取已连接的账户"""
        return self.connected_account
