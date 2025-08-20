#!/usr/bin/env python3
"""
测试 blockchain-payment-mcp 服务器功能
"""

import asyncio
import json
import sys
from blockchain_payment_mcp.server import (
    handle_get_network_info,
    handle_get_supported_tokens,
    handle_validate_address,
    handle_create_wallet
)

async def test_mcp_functions():
    """测试 MCP 函数"""
    print("🧪 测试 blockchain-payment-mcp 功能...")
    
    # 测试获取网络信息
    print("\n1. 测试获取网络信息:")
    try:
        result = await handle_get_network_info({})
        print(f"✅ 网络信息: {json.dumps(result, indent=2, ensure_ascii=False)}")
    except Exception as e:
        print(f"❌ 获取网络信息失败: {e}")
    
    # 测试获取支持的代币
    print("\n2. 测试获取支持的代币:")
    try:
        result = await handle_get_supported_tokens({})
        print(f"✅ 支持的代币: {json.dumps(result, indent=2, ensure_ascii=False)}")
    except Exception as e:
        print(f"❌ 获取支持的代币失败: {e}")
    
    # 测试地址验证
    print("\n3. 测试地址验证:")
    test_address = "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6"
    try:
        result = await handle_validate_address({"address": test_address})
        print(f"✅ 地址验证结果: {json.dumps(result, indent=2, ensure_ascii=False)}")
    except Exception as e:
        print(f"❌ 地址验证失败: {e}")
    
    # 测试创建钱包
    print("\n4. 测试创建钱包:")
    try:
        result = await handle_create_wallet({})
        print(f"✅ 创建钱包结果: {json.dumps(result, indent=2, ensure_ascii=False)}")
    except Exception as e:
        print(f"❌ 创建钱包失败: {e}")
    
    print("\n🎉 测试完成！")

if __name__ == "__main__":
    asyncio.run(test_mcp_functions())
