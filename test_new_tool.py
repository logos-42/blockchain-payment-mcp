#!/usr/bin/env python3
"""
测试新添加的get_wallet_address工具
"""
import asyncio
import sys
import os

# 添加当前目录到Python路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from blockchain_payment_mcp.server import list_tools, handle_get_wallet_address

async def test_new_tool():
    """测试新工具"""
    print("=== 测试新添加的get_wallet_address工具 ===\n")
    
    # 1. 检查工具列表中是否包含新工具
    print("1. 检查工具列表...")
    tools = await list_tools()
    tool_names = [tool.name for tool in tools]
    
    print(f"可用工具数量: {len(tools)}")
    print("工具列表:")
    for i, name in enumerate(tool_names, 1):
        print(f"  {i}. {name}")
    
    # 检查是否包含新工具
    if "get_wallet_address" in tool_names:
        print("✅ get_wallet_address工具已成功添加到工具列表")
    else:
        print("❌ get_wallet_address工具未在工具列表中找到")
    
    print("\n" + "="*50 + "\n")
    
    # 2. 测试新工具的功能
    print("2. 测试get_wallet_address工具功能...")
    test_private_key = "1655aad5f3b8e80ac2bd4383d3ac8bbab3ec928645c7342e568b394193efdf2c"
    
    try:
        result = await handle_get_wallet_address({"private_key": test_private_key})
        print("工具执行结果:")
        print(f"  成功: {result.get('success', False)}")
        print(f"  地址: {result.get('address', 'N/A')}")
        print(f"  消息: {result.get('message', 'N/A')}")
        print(f"  私钥掩码: {result.get('private_key_masked', 'N/A')}")
        
        if result.get('success'):
            print("✅ 工具功能测试成功")
        else:
            print(f"❌ 工具功能测试失败: {result.get('error', '未知错误')}")
            
    except Exception as e:
        print(f"❌ 工具执行异常: {e}")
    
    print("\n" + "="*50 + "\n")
    
    # 3. 测试无效私钥
    print("3. 测试无效私钥处理...")
    try:
        result = await handle_get_wallet_address({"private_key": "invalid_key"})
        print("无效私钥测试结果:")
        print(f"  成功: {result.get('success', False)}")
        print(f"  错误: {result.get('error', 'N/A')}")
        
        if not result.get('success'):
            print("✅ 无效私钥处理正确")
        else:
            print("❌ 无效私钥处理异常")
            
    except Exception as e:
        print(f"❌ 无效私钥测试异常: {e}")

if __name__ == "__main__":
    asyncio.run(test_new_tool())


