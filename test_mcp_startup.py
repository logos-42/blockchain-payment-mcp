#!/usr/bin/env python3
"""
测试 MCP 服务器启动
"""

import asyncio
import subprocess
import sys
import json
import time

def test_mcp_server_startup():
    """测试 MCP 服务器启动"""
    print("🧪 测试 MCP 服务器启动...")
    
    try:
        # 启动 MCP 服务器进程
        process = subprocess.Popen(
            [sys.executable, "-m", "blockchain_payment_mcp.server"],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        
        # 等待一下让服务器启动
        time.sleep(2)
        
        # 检查进程是否还在运行
        if process.poll() is None:
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
            
            try:
                process.stdin.write(json.dumps(init_message) + "\n")
                process.stdin.flush()
                
                # 等待响应
                time.sleep(1)
                
                # 检查是否有输出
                if process.stdout.readable():
                    output = process.stdout.readline()
                    if output:
                        print(f"✅ 收到服务器响应: {output.strip()}")
                    else:
                        print("⚠️ 没有收到服务器响应")
                
            except Exception as e:
                print(f"⚠️ 发送初始化消息失败: {e}")
            
            # 终止进程
            process.terminate()
            process.wait()
            
        else:
            # 获取错误输出
            stderr_output = process.stderr.read()
            print(f"❌ MCP 服务器启动失败")
            print(f"错误信息: {stderr_output}")
            
    except Exception as e:
        print(f"❌ 测试失败: {e}")

if __name__ == "__main__":
    test_mcp_server_startup()
