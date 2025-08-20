#!/usr/bin/env python3
"""
测试脚本，用于验证 blockchain-payment-mcp 包是否能正确工作
包括在 Cherry Studio 环境中的使用
"""

import asyncio
import os
import sys

def test_imports():
    """测试包导入功能"""
    try:
        # 测试主要功能函数导入
        from blockchain_payment_mcp import (
            handle_get_balance,
            handle_send_transaction,
            handle_get_transaction_status,
            handle_estimate_gas_fees,
            handle_create_wallet,
            handle_get_network_info,
            handle_get_supported_tokens,
            handle_validate_address,
            handle_set_user_wallet
        )
        print("[PASS] 所有功能函数导入成功")
        return True
    except Exception as e:
        print(f"[FAIL] 导入失败: {e}")
        return False

def test_config():
    """测试配置访问"""
    try:
        from blockchain_payment_mcp import config
        print(f"[PASS] 配置访问成功，默认网络: {config.default_network}")
        print(f"[PASS] 支持的网络数量: {len(config.get_supported_networks())}")
        print(f"[PASS] 支持的代币数量: {len(config.get_supported_tokens())}")
        return True
    except Exception as e:
        print(f"[FAIL] 配置访问失败: {e}")
        return False

async def test_basic_functionality():
    """测试基本功能"""
    try:
        from blockchain_payment_mcp import handle_get_supported_tokens
        
        # 测试获取支持的代币列表
        result = await handle_get_supported_tokens({})
        if "supported_tokens" in result:
            print("[PASS] 基本功能测试成功")
            return True
        else:
            print("[FAIL] 基本功能测试失败")
            return False
    except Exception as e:
        print(f"[FAIL] 基本功能测试失败: {e}")
        return False

def test_mcp_server():
    """测试MCP服务器模块导入"""
    try:
        from blockchain_payment_mcp import server
        print("[PASS] MCP服务器模块导入成功")
        return True
    except Exception as e:
        print(f"[FAIL] MCP服务器模块导入失败: {e}")
        return False

async def main():
    """主测试函数"""
    print("开始测试 blockchain-payment-mcp 包...")
    print("=" * 50)
    
    # 测试导入
    import_success = test_imports()
    
    # 测试配置
    config_success = test_config()
    
    # 测试基本功能
    functionality_success = await test_basic_functionality()
    
    # 测试MCP服务器
    server_success = test_mcp_server()
    
    print("=" * 50)
    if all([import_success, config_success, functionality_success, server_success]):
        print("[SUCCESS] 所有测试通过！包可以正常使用。")
        print("\n在 Cherry Studio 中使用说明：")
        print("1. 确保已安装包: pip install blockchain-payment-mcp")
        print("2. 在 Cherry Studio 的 MCP 配置中添加：")
        print("""   {
     "mcpServers": {
       "blockchain-payment": {
         "command": "blockchain-payment-mcp"
       }
     }
   }""")
        return True
    else:
        print("[ERROR] 部分测试失败，请检查上述错误信息。")
        return False

if __name__ == "__main__":
    result = asyncio.run(main())
    sys.exit(0 if result else 1)