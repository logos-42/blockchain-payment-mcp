"""
区块链支付MCP服务器

提供基于Base网络的区块链支付功能，包括：
- 余额查询
- 代币转账
- 交易状态查询
- Gas费用估算
- 钱包管理
"""

import asyncio
import logging
from typing import Optional, Union, Dict, Any, List
from decimal import Decimal

from mcp.server import Server
from mcp.types import Tool, TextContent, Prompt
import mcp.server.stdio

from .blockchain import BlockchainInterface
from .wallet import WalletSigner, MetaMaskConnector
from .config import config

# 配置日志 - 使用stderr避免干扰stdio通信
import sys
logging.basicConfig(
    level=logging.INFO if config.debug else logging.ERROR,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    stream=sys.stderr
)
logger = logging.getLogger(__name__)

# 创建MCP服务器
server = Server("blockchain-payment")

# 全局区块链接口实例
blockchain: Optional[BlockchainInterface] = None

# 用户钱包管理器
class WalletManager:
    """钱包管理器 - 管理多个用户钱包"""
    
    def __init__(self):
        self.wallets: Dict[str, WalletSigner] = {}  # 标签 -> 钱包实例
        self.current_wallet_label: Optional[str] = None
    
    def add_wallet(self, label: str, private_key: str) -> bool:
        """添加钱包"""
        if WalletSigner.validate_private_key(private_key):
            self.wallets[label] = WalletSigner(private_key)
            # 如果这是第一个钱包，设置为当前钱包
            if self.current_wallet_label is None:
                self.current_wallet_label = label
            return True
        return False
    
    def set_current_wallet(self, label: str) -> bool:
        """设置当前使用的钱包"""
        if label in self.wallets:
            self.current_wallet_label = label
            return True
        return False
    
    def get_current_wallet(self) -> Optional[WalletSigner]:
        """获取当前钱包"""
        if self.current_wallet_label and self.current_wallet_label in self.wallets:
            return self.wallets[self.current_wallet_label]
        return None
    
    def get_wallet(self, label: str) -> Optional[WalletSigner]:
        """根据标签获取钱包"""
        return self.wallets.get(label)
    
    def remove_wallet(self, label: str) -> bool:
        """移除钱包"""
        if label in self.wallets:
            del self.wallets[label]
            # 如果删除的是当前钱包，重置当前钱包
            if self.current_wallet_label == label:
                self.current_wallet_label = next(iter(self.wallets), None) if self.wallets else None
            return True
        return False
    
    def list_wallets(self) -> List[Dict[str, str]]:
        """列出所有钱包（只显示地址，不显示私钥）"""
        result = []
        for label, wallet in self.wallets.items():
            result.append({
                "label": label,
                "address": wallet.address,
                "is_current": label == self.current_wallet_label
            })
        return result

# 全局钱包管理器实例
wallet_manager = WalletManager()

def get_blockchain(network_id: Optional[str] = None) -> BlockchainInterface:
    """获取区块链接口实例"""
    global blockchain
    current_network = network_id or config.default_network
    
    # 确保网络ID有效
    if current_network not in config.get_supported_networks():
        raise ValueError(f"不支持的网络: {current_network}")
    
    if blockchain is None or blockchain.network_config.name != config.get_network(current_network).name:
        blockchain = BlockchainInterface(current_network)
    
    return blockchain

def get_wallet(private_key: Optional[str] = None) -> WalletSigner:
    """获取钱包实例"""
    # 如果提供了私钥，使用提供的私钥
    if private_key:
        return WalletSigner(private_key)
    
    # 如果有当前用户钱包，返回它
    current_wallet = wallet_manager.get_current_wallet()
    if current_wallet:
        return current_wallet
    
    # 如果配置中有私钥，使用配置的私钥
    if config.private_key:
        return WalletSigner(config.private_key)
    
    # 如果都没有，返回一个没有私钥的钱包实例
    return WalletSigner()

@server.list_tools()
async def list_tools() -> list[Tool]:
    """列出所有可用的工具"""
    # 获取支持的网络和代币列表
    supported_networks = config.get_supported_networks()
    supported_tokens = config.get_supported_tokens() + ["ETH"]
    
    return [
        Tool(
            name="get_balance",
            description="查询指定地址的余额（ETH和代币）",
            inputSchema={
                "type": "object",
                "properties": {
                    "address": {
                        "type": "string",
                        "description": "要查询的钱包地址"
                    },
                    "token_symbol": {
                        "type": "string",
                        "description": "指定代币符号(可选)，如USDC、DAI等",
                        "enum": supported_tokens
                    },
                    "network": {
                        "type": "string", 
                        "description": "网络名称(可选)",
                        "enum": supported_networks,
                        "default": config.default_network
                    }
                },
                "required": ["address"]
            }
        ),
        Tool(
            name="send_transaction", 
            description="发送代币转账交易",
            inputSchema={
                "type": "object",
                "properties": {
                    "to_address": {
                        "type": "string",
                        "description": "接收方地址"
                    },
                    "amount": {
                        "type": "string",
                        "description": "转账金额（以代币单位为准）"
                    },
                    "token_symbol": {
                        "type": "string",
                        "description": "代币符号，默认为ETH",
                        "enum": supported_tokens,
                        "default": "ETH"
                    },
                    "network": {
                        "type": "string",
                        "description": "网络名称(可选)",
                        "enum": supported_networks,
                        "default": config.default_network
                    },
                    "from_wallet_label": {
                        "type": "string",
                        "description": "发送方钱包标签(可选)，如未提供则使用当前钱包"
                    },
                    "private_key": {
                        "type": "string",
                        "description": "发送方私钥(可选，如未提供则使用当前钱包或环境变量中的私钥)"
                    }
                },
                "required": ["to_address", "amount"]
            }
        ),
        Tool(
            name="get_transaction_status",
            description="查询交易状态和详情",
            inputSchema={
                "type": "object", 
                "properties": {
                    "tx_hash": {
                        "type": "string",
                        "description": "交易哈希值"
                    },
                    "network": {
                        "type": "string",
                        "description": "网络名称(可选)",
                        "enum": supported_networks,
                        "default": config.default_network
                    }
                },
                "required": ["tx_hash"]
            }
        ),
        Tool(
            name="estimate_gas_fees",
            description="估算Gas费用",
            inputSchema={
                "type": "object",
                "properties": {
                    "to_address": {
                        "type": "string",
                        "description": "接收方地址(可选)"
                    },
                    "amount": {
                        "type": "string", 
                        "description": "转账金额(可选)"
                    },
                    "token_symbol": {
                        "type": "string",
                        "description": "代币符号(可选)",
                        "enum": supported_tokens
                    },
                    "network": {
                        "type": "string",
                        "description": "网络名称(可选)",
                        "enum": supported_networks,
                        "default": config.default_network
                    }
                },
                "required": []
            }
        ),
        Tool(
            name="create_wallet",
            description="创建新的钱包地址和私钥",
            inputSchema={
                "type": "object",
                "properties": {
                    "label": {
                        "type": "string",
                        "description": "钱包标签(可选)，用于标识钱包"
                    }
                },
                "required": []
            }
        ),
        Tool(
            name="get_network_info",
            description="获取当前网络信息",
            inputSchema={
                "type": "object",
                "properties": {
                    "network": {
                        "type": "string",
                        "description": "网络名称(可选)",
                        "enum": supported_networks,
                        "default": config.default_network
                    }
                },
                "required": []
            }
        ),
        Tool(
            name="get_supported_tokens",
            description="获取支持的代币列表",
            inputSchema={
                "type": "object",
                "properties": {},
                "required": []
            }
        ),
        Tool(
            name="validate_address",
            description="验证以太坊地址格式",
            inputSchema={
                "type": "object",
                "properties": {
                    "address": {
                        "type": "string",
                        "description": "要验证的地址"
                    }
                },
                "required": ["address"]
            }
        ),
        Tool(
            name="set_user_wallet",
            description="设置用户钱包私钥",
            inputSchema={
                "type": "object",
                "properties": {
                    "private_key": {
                        "type": "string",
                        "description": "用户的私钥"
                    },
                    "label": {
                        "type": "string",
                        "description": "钱包标签(可选)，用于标识钱包"
                    }
                },
                "required": ["private_key"]
            }
        ),
        Tool(
            name="list_wallets",
            description="列出所有已添加的钱包",
            inputSchema={
                "type": "object",
                "properties": {},
                "required": []
            }
        ),
        Tool(
            name="switch_wallet",
            description="切换当前使用的钱包",
            inputSchema={
                "type": "object",
                "properties": {
                    "label": {
                        "type": "string",
                        "description": "要切换到的钱包标签"
                    }
                },
                "required": ["label"]
            }
        ),
        Tool(
            name="remove_wallet",
            description="移除指定标签的钱包",
            inputSchema={
                "type": "object",
                "properties": {
                    "label": {
                        "type": "string",
                        "description": "要移除的钱包标签"
                    }
                },
                "required": ["label"]
            }
        )
    ]

@server.call_tool()
async def call_tool(name: str, arguments: dict) -> list[TextContent]:
    """处理工具调用"""
    try:
        if name == "get_balance":
            result = await handle_get_balance(arguments)
        elif name == "send_transaction":
            result = await handle_send_transaction(arguments)
        elif name == "get_transaction_status":
            result = await handle_get_transaction_status(arguments)
        elif name == "estimate_gas_fees":
            result = await handle_estimate_gas_fees(arguments)
        elif name == "create_wallet":
            result = await handle_create_wallet(arguments)
        elif name == "get_network_info":
            result = await handle_get_network_info(arguments)
        elif name == "get_supported_tokens":
            result = await handle_get_supported_tokens(arguments)
        elif name == "validate_address":
            result = await handle_validate_address(arguments)
        elif name == "set_user_wallet":
            result = await handle_set_user_wallet(arguments)
        elif name == "list_wallets":
            result = await handle_list_wallets(arguments)
        elif name == "switch_wallet":
            result = await handle_switch_wallet(arguments)
        elif name == "remove_wallet":
            result = await handle_remove_wallet(arguments)
        else:
            result = {"error": f"未知工具: {name}"}
        
        return [TextContent(type="text", text=str(result))]
        
    except Exception as e:
        logger.error(f"工具调用失败 {name}: {e}")
        error_result = {"error": f"工具执行失败: {str(e)}"}
        return [TextContent(type="text", text=str(error_result))]

async def handle_get_balance(args: dict) -> dict:
    """处理余额查询"""
    address = args["address"]
    token_symbol = args.get("token_symbol")
    network = args.get("network", config.default_network)
    
    bc = get_blockchain(network)
    result = await bc.get_balance(address, token_symbol)
    return result

async def handle_send_transaction(args: dict) -> dict:
    """处理发送交易"""
    to_address = args["to_address"]
    amount = args["amount"]
    token_symbol = args.get("token_symbol", "ETH")
    network = args.get("network", config.default_network)
    private_key = args.get("private_key")
    from_wallet_label = args.get("from_wallet_label")
    
    # 获取钱包实例
    wallet = None
    if private_key:
        # 使用直接提供的私钥
        wallet = WalletSigner(private_key)
    elif from_wallet_label:
        # 使用指定标签的钱包
        wallet = wallet_manager.get_wallet(from_wallet_label)
        if not wallet:
            return {
                "error": f"未找到标签为 '{from_wallet_label}' 的钱包",
                "suggestion": "请检查钱包标签或使用list_wallets查看可用钱包"
            }
    else:
        # 使用当前钱包或其他默认方式
        wallet = get_wallet()
    
    # 检查钱包是否有私钥
    if not wallet.has_private_key():
        return {
            "error": "未设置私钥，无法发送交易。",
            "instructions": [
                "1. 使用set_user_wallet工具设置私钥",
                "2. 使用create_wallet工具创建新钱包",
                "3. 在环境变量中配置PRIVATE_KEY",
                "4. 使用list_wallets查看已添加的钱包并用switch_wallet切换"
            ]
        }
    
    bc = get_blockchain(network)
    result = await bc.send_transaction(to_address, amount, token_symbol, wallet)
    return result

async def handle_get_transaction_status(args: dict) -> dict:
    """处理交易状态查询"""
    tx_hash = args["tx_hash"]
    network = args.get("network", config.default_network)
    
    bc = get_blockchain(network)
    result = await bc.get_transaction_status(tx_hash)
    return result

async def handle_estimate_gas_fees(args: dict) -> dict:
    """处理Gas费用估算"""
    network = args.get("network", config.default_network)
    
    # 构建交易参数用于估算
    transaction = None
    if args.get("to_address") and args.get("amount"):
        transaction = {
            "to": args["to_address"],
            "value": args["amount"]
        }
    
    bc = get_blockchain(network)
    result = await bc.estimate_gas_fees(transaction)
    return result

async def handle_create_wallet(args: dict) -> dict:
    """处理创建钱包"""
    label = args.get("label")
    wallet = WalletSigner()
    result = wallet.create_account()
    
    # 如果提供了标签，添加到钱包管理器
    if label:
        address = result["address"]
        private_key = result["private_key"]
        if wallet_manager.add_wallet(label, private_key):
            result["label"] = label
            result["message"] = f"钱包已创建并添加到钱包管理器，标签: {label}"
        else:
            result["warning"] = f"钱包创建成功，但添加到钱包管理器失败（标签: {label}）"
    
    return result

async def handle_get_network_info(args: dict) -> dict:
    """处理获取网络信息"""
    network = args.get("network", config.default_network)
    
    bc = get_blockchain(network)
    network_config = bc.network_config
    
    try:
        latest_block = bc.w3.eth.block_number
        is_connected = bc.w3.is_connected()
    except Exception as e:
        latest_block = None
        is_connected = False
        logger.warning(f"获取网络状态失败: {e}")
    
    return {
        "network": network_config.name,
        "chain_id": network_config.chain_id,
        "rpc_url": network_config.rpc_url,
        "native_token": network_config.native_token,
        "explorer_url": network_config.explorer_url,
        "latest_block": latest_block,
        "is_connected": is_connected,
        "supported_tokens": config.get_supported_tokens()
    }

async def handle_get_supported_tokens(args: dict) -> dict:
    """处理获取支持代币列表"""
    tokens_info = {}
    for symbol, token_config in config.tokens.items():
        tokens_info[symbol] = {
            "symbol": token_config.symbol,
            "name": token_config.name,
            "address": token_config.address,
            "decimals": token_config.decimals
        }
    
    return {
        "native_token": "ETH", 
        "supported_tokens": tokens_info,
        "total_count": len(tokens_info)
    }

async def handle_validate_address(args: dict) -> dict:
    """处理地址验证"""
    address = args["address"]
    is_valid = WalletSigner.validate_address(address)
    
    return {
        "address": address,
        "is_valid": is_valid,
        "format": "ethereum_compatible" if is_valid else "invalid"
    }

async def handle_set_user_wallet(args: dict) -> dict:
    """处理设置用户钱包"""
    private_key = args["private_key"]
    label = args.get("label", "default")
    
    # 验证私钥格式
    if not WalletSigner.validate_private_key(private_key):
        return {
            "success": False,
            "error": "无效的私钥格式"
        }
    
    # 添加到钱包管理器
    if wallet_manager.add_wallet(label, private_key):
        wallet_manager.set_current_wallet(label)
        
        return {
            "success": True,
            "message": f"用户钱包设置成功，标签: {label}，地址: {wallet_manager.get_wallet(label).address}",
            "label": label,
            "address": wallet_manager.get_wallet(label).address
        }
    else:
        return {
            "success": False,
            "error": "钱包设置失败"
        }

async def handle_list_wallets(args: dict) -> dict:
    """处理列出钱包"""
    wallets = wallet_manager.list_wallets()
    
    return {
        "wallets": wallets,
        "count": len(wallets),
        "current_wallet": wallet_manager.current_wallet_label
    }

async def handle_switch_wallet(args: dict) -> dict:
    """处理切换钱包"""
    label = args["label"]
    
    if wallet_manager.set_current_wallet(label):
        current_wallet = wallet_manager.get_wallet(label)
        return {
            "success": True,
            "message": f"已切换到钱包: {label}",
            "label": label,
            "address": current_wallet.address if current_wallet else None
        }
    else:
        return {
            "success": False,
            "error": f"未找到标签为 '{label}' 的钱包",
            "suggestion": "使用list_wallets查看可用钱包"
        }

async def handle_remove_wallet(args: dict) -> dict:
    """处理移除钱包"""
    label = args["label"]
    
    if wallet_manager.remove_wallet(label):
        return {
            "success": True,
            "message": f"已移除钱包: {label}"
        }
    else:
        return {
            "success": False,
            "error": f"未找到标签为 '{label}' 的钱包"
        }

async def main():
    """主函数"""
    # 设置更简洁的日志格式，避免干扰stdio通信
    if config.debug:
        logger.info(f"启动区块链支付MCP服务器")
        logger.info(f"默认网络: {config.default_network}")
        
        # 验证配置
        if not config.private_key:
            logger.warning("未设置PRIVATE_KEY环境变量，发送交易功能将需要用户手动提供私钥")
        else:
            logger.info("已配置PRIVATE_KEY环境变量")
        
        # 测试网络连接
        try:
            bc = get_blockchain()
            logger.info(f"网络连接测试成功: {bc.network_config.name}")
        except Exception as e:
            logger.error(f"网络连接测试失败: {e}")
    
    # 启动服务器
    async with mcp.server.stdio.stdio_server() as (read_stream, write_stream):
        await server.run(
            read_stream,
            write_stream,
            server.create_initialization_options()
        )

if __name__ == "__main__":
    asyncio.run(main())