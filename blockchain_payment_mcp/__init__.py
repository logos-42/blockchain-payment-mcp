"""
区块链货币支付MCP服务器

提供区块链货币支付、查询余额、转账等功能的MCP服务器
支持多种网络和代币类型
"""

__version__ = "0.1.10"

# 导出主要功能函数，方便用户直接从包导入使用
from .server import (
    handle_get_balance,
    handle_send_transaction,
    handle_get_transaction_status,
    handle_estimate_gas_fees,
    handle_create_wallet,
    handle_get_network_info,
    handle_get_supported_tokens,
    handle_validate_address,
    handle_set_user_wallet,
    handle_list_wallets,
    handle_switch_wallet,
    handle_remove_wallet,
    handle_get_wallet_address,
    # Prompt functions
    balance_query_prompt,
    transaction_send_prompt,
    wallet_management_prompt,
    network_info_prompt,
    security_prompt
)

# 导出配置对象
from .config import config

# 定义公共API
__all__ = [
    "handle_get_balance",
    "handle_send_transaction", 
    "handle_get_transaction_status",
    "handle_estimate_gas_fees",
    "handle_create_wallet",
    "handle_get_network_info",
    "handle_get_supported_tokens",
    "handle_validate_address",
    "handle_set_user_wallet",
    "handle_list_wallets",
    "handle_switch_wallet",
    "handle_remove_wallet",
    "handle_get_wallet_address",
    # Prompt functions
    "balance_query_prompt",
    "transaction_send_prompt", 
    "wallet_management_prompt",
    "network_info_prompt",
    "security_prompt",
    "config"
]