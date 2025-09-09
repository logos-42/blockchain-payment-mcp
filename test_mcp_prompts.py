#!/usr/bin/env python3
"""
测试官方标准MCP Prompt功能
"""

import asyncio
import sys
import os

# 添加项目路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from blockchain_payment_mcp.server import (
    balance_query_prompt,
    transaction_send_prompt,
    wallet_management_prompt,
    network_info_prompt,
    security_prompt
)

async def test_mcp_prompts():
    """测试官方标准MCP Prompt功能"""
    
    print("=== 测试官方标准MCP Prompt功能 ===\n")
    
    # 测试1: 余额查询prompt
    print("1. 测试余额查询prompt:")
    result1 = await balance_query_prompt(
        address="0x742d35cc6585c5d74b3c9e5c29ae4eeaae27b76d",
        network="base_sepolia",
        token_symbol="ETH"
    )
    print(f"生成的prompt:\n{result1}\n")
    
    # 测试2: 交易发送prompt
    print("2. 测试交易发送prompt:")
    result2 = await transaction_send_prompt(
        from_address="0x742d35cc6585c5d74b3c9e5c29ae4eeaae27b76d",
        to_address="0x1234567890123456789012345678901234567890",
        amount="0.01",
        token_symbol="ETH",
        network="base_sepolia"
    )
    print(f"生成的prompt:\n{result2}\n")
    
    # 测试3: 钱包管理prompt
    print("3. 测试钱包管理prompt:")
    result3 = await wallet_management_prompt(
        wallet_count=3,
        current_wallet="main_wallet"
    )
    print(f"生成的prompt:\n{result3}\n")
    
    # 测试4: 网络信息prompt
    print("4. 测试网络信息prompt:")
    result4 = await network_info_prompt(
        network="base_sepolia",
        chain_id="84532",
        rpc_url="https://base-sepolia-rpc.publicnode.com",
        explorer_url="https://sepolia.basescan.org",
        native_token="ETH"
    )
    print(f"生成的prompt:\n{result4}\n")
    
    # 测试5: 安全prompt - 通用
    print("5. 测试安全prompt - 通用:")
    result5 = await security_prompt(operation_type="general")
    print(f"生成的prompt:\n{result5}\n")
    
    # 测试6: 安全prompt - 交易
    print("6. 测试安全prompt - 交易:")
    result6 = await security_prompt(operation_type="transaction")
    print(f"生成的prompt:\n{result6}\n")
    
    # 测试7: 安全prompt - 钱包
    print("7. 测试安全prompt - 钱包:")
    result7 = await security_prompt(operation_type="wallet")
    print(f"生成的prompt:\n{result7}\n")
    
    # 测试8: 安全prompt - 密钥管理
    print("8. 测试安全prompt - 密钥管理:")
    result8 = await security_prompt(operation_type="key_management")
    print(f"生成的prompt:\n{result8}\n")
    
    # 测试9: 使用默认参数
    print("9. 测试使用默认参数:")
    result9 = await balance_query_prompt(
        address="0x742d35cc6585c5d74b3c9e5c29ae4eeaae27b76d"
    )
    print(f"使用默认参数的prompt:\n{result9}\n")
    
    print("=== 所有测试完成 ===")

if __name__ == "__main__":
    asyncio.run(test_mcp_prompts())






