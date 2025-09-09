#!/usr/bin/env python3
"""
简单的 MCP 测试
"""

import asyncio
import subprocess
import sys
import json
import time

def test_simple_mcp():
    """简单测试 MCP"""
    print("🧪 简单 MCP 测试...")
    
    try:
        # 启动 MCP 服务器
        process = subprocess.Popen(
            [sys.executable, "-m", "blockchain_payment_mcp.server"],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        
        time.sleep(2)
        
        if process.poll() is not None:
            stderr_output = process.stderr.read()
            print(f"❌ 启动失败: {stderr_output}")
            return
        
        print("✅ 服务器启动成功")
        
        # 初始化
        init_msg = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "initialize",
            "params": {
                "protocolVersion": "2024-11-05",
                "capabilities": {},
                "clientInfo": {"name": "test", "version": "1.0"}
            }
        }
        
        process.stdin.write(json.dumps(init_msg) + "\n")
        process.stdin.flush()
        
        time.sleep(1)
        response = process.stdout.readline()
        print(f"✅ 初始化: {response.strip()}")
        
        # 列出工具
        list_msg = {
            "jsonrpc": "2.0",
            "id": 2,
            "method": "tools/list"
        }
        
        process.stdin.write(json.dumps(list_msg) + "\n")
        process.stdin.flush()
        
        time.sleep(1)
        response = process.stdout.readline()
        print(f"✅ 工具列表: {response.strip()}")
        
        # 测试网络信息
        call_msg = {
            "jsonrpc": "2.0",
            "id": 3,
            "method": "tools/call",
            "params": {
                "name": "get_network_info",
                "arguments": {}
            }
        }
        
        process.stdin.write(json.dumps(call_msg) + "\n")
        process.stdin.flush()
        
        time.sleep(1)
        response = process.stdout.readline()
        print(f"✅ 网络信息: {response.strip()}")
        
        process.terminate()
        process.wait()
        
        print("🎉 测试完成")
        
    except Exception as e:
        print(f"❌ 错误: {e}")

if __name__ == "__main__":
    test_simple_mcp()
