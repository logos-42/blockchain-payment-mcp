#!/usr/bin/env python3
"""
测试 MCP 工具功能
"""

import asyncio
import subprocess
import sys
import json
import time

def test_mcp_tools():
    """测试 MCP 工具"""
    print("🧪 测试 MCP 工具功能...")
    
    try:
        # 启动 MCP 服务器进程
        process = subprocess.Popen(
            [sys.executable, "-m", "blockchain_payment_mcp.server"],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        
        # 等待服务器启动
        time.sleep(2)
        
        if process.poll() is not None:
            stderr_output = process.stderr.read()
            print(f"❌ MCP 服务器启动失败: {stderr_output}")
            return
        
        print("✅ MCP 服务器启动成功")
        
        # 发送初始化消息
        init_message = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "initialize",
            "params": {
                "protocolVersion": "2024-11-05",
                "capabilities": {},
                "clientInfo": {
                    "name": "test-client",
                    "version": "1.0.0"
                }
            }
        }
        
        process.stdin.write(json.dumps(init_message) + "\n")
        process.stdin.flush()
        
        # 等待初始化响应
        time.sleep(1)
        init_response = process.stdout.readline()
        print(f"✅ 初始化响应: {init_response.strip()}")
        
        # 测试列出工具
        list_tools_message = {
            "jsonrpc": "2.0",
            "id": 2,
            "method": "tools/list"
        }
        
        process.stdin.write(json.dumps(list_tools_message) + "\n")
        process.stdin.flush()
        
        time.sleep(1)
        tools_response = process.stdout.readline()
        print(f"✅ 工具列表响应: {tools_response.strip()}")
        
        # 测试调用工具
        test_tools = [
            {
                "name": "get_network_info",
                "arguments": {}
            },
            {
                "name": "get_supported_tokens", 
                "arguments": {}
            },
            {
                "name": "validate_address",
                "arguments": {"address": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6"}
            }
        ]
        
        for i, tool in enumerate(test_tools, 3):
            call_message = {
                "jsonrpc": "2.0",
                "id": i,
                "method": "tools/call",
                "params": {
                    "name": tool["name"],
                    "arguments": tool["arguments"]
                }
            }
            
            process.stdin.write(json.dumps(call_message) + "\n")
            process.stdin.flush()
            
            time.sleep(1)
            response = process.stdout.readline()
            print(f"✅ {tool['name']} 响应: {response.strip()}")
        
        # 终止进程
        process.terminate()
        process.wait()
        
        print("🎉 所有测试完成！")
        
    except Exception as e:
        print(f"❌ 测试失败: {e}")

if __name__ == "__main__":
    test_mcp_tools()
