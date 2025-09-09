#!/usr/bin/env python3
"""
测试MCP配置是否正确
"""
import os
import sys
import asyncio
from pathlib import Path

# 设置工作目录
os.chdir("D:\\AI\\私有链\\blockchain_payment_MCP")
sys.path.insert(0, "D:\\AI\\私有链\\blockchain_payment_MCP")

print("=== MCP配置测试 ===\n")

# 1. 检查环境变量
print("1. 检查环境变量:")
env_vars = {
    "PRIVATE_KEY": os.getenv("PRIVATE_KEY"),
    "DEFAULT_NETWORK": os.getenv("DEFAULT_NETWORK"),
    "DEBUG": os.getenv("DEBUG"),
    "MAX_TRANSACTION_VALUE": os.getenv("MAX_TRANSACTION_VALUE"),
    "PYTHONPATH": os.getenv("PYTHONPATH")
}

for key, value in env_vars.items():
    if value:
        if key == "PRIVATE_KEY":
            print(f"  {key}: {value[:10]}...{value[-10:]}")
        else:
            print(f"  {key}: {value}")
    else:
        print(f"  {key}: 未设置")

print("\n" + "="*50 + "\n")

# 2. 检查模块导入
print("2. 检查模块导入:")
try:
    from blockchain_payment_mcp.server import list_tools, handle_get_wallet_address
    print("  ✅ 模块导入成功")
except Exception as e:
    print(f"  ❌ 模块导入失败: {e}")
    sys.exit(1)

print("\n" + "="*50 + "\n")

# 3. 测试工具列表
print("3. 测试工具列表:")
async def test_tools():
    try:
        tools = await list_tools()
        print(f"  工具数量: {len(tools)}")
        
        # 检查是否包含新工具
        tool_names = [tool.name for tool in tools]
        if "get_wallet_address" in tool_names:
            print("  ✅ get_wallet_address工具已加载")
        else:
            print("  ❌ get_wallet_address工具未找到")
        
        print("  所有工具:")
        for i, name in enumerate(tool_names, 1):
            print(f"    {i}. {name}")
            
    except Exception as e:
        print(f"  ❌ 工具列表测试失败: {e}")

asyncio.run(test_tools())

print("\n" + "="*50 + "\n")

# 4. 测试新工具功能
print("4. 测试新工具功能:")
async def test_new_tool():
    try:
        test_private_key = "1655aad5f3b8e80ac2bd4383d3ac8bbab3ec928645c7342e568b394193efdf2c"
        result = await handle_get_wallet_address({"private_key": test_private_key})
        
        if result.get("success"):
            print("  ✅ 新工具功能正常")
            print(f"  地址: {result.get('address')}")
            print(f"  私钥掩码: {result.get('private_key_masked')}")
        else:
            print(f"  ❌ 新工具功能异常: {result.get('error')}")
            
    except Exception as e:
        print(f"  ❌ 新工具测试失败: {e}")

asyncio.run(test_new_tool())

print("\n" + "="*50 + "\n")
print("配置测试完成！")
print("\n如果所有测试都通过，请重启Cursor以加载新的MCP配置。")
