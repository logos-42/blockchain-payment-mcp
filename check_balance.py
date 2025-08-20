#!/usr/bin/env python3
"""
检查指定地址在多个链上的余额
示例脚本展示如何使用 blockchain-payment-mcp 包
"""

import asyncio
import json
import os
import sys

# 从已安装的包导入函数
try:
    from blockchain_payment_mcp import handle_get_balance
except ImportError:
    # 如果包未安装，从本地模块导入（开发环境）
    from blockchain_payment_mcp.server import handle_get_balance

async def check_balance(address: str):
    """检查指定地址在多个链上的余额"""
    print(f"检查地址 {address} 在各链上的余额...")
    
    # 设置调试模式
    os.environ['DEBUG'] = 'true'
    
    # 要检查的网络列表
    networks = [
        "base_mainnet",
        "ethereum_mainnet", 
        "bsc_mainnet",
        "polygon_mainnet",
        "avalanche_mainnet"
    ]
    
    for network in networks:
        print(f"\n检查 {network}...")
        try:
            balance_info = await handle_get_balance({
                "address": address,
                "network": network
            })
            
            if "error" in balance_info:
                print(f"  错误: {balance_info['error']}")
                continue
                
            print(f"  网络: {balance_info['network']}")
            
            # 显示原生代币余额
            native_token = list(balance_info['balances'].keys())[0]
            native_balance = balance_info['balances'][native_token]
            print(f"  {native_token} 余额: {native_balance['balance']}")
            
            # 显示其他代币余额（如果有）
            for token, info in balance_info['balances'].items():
                if token != native_token:
                    print(f"  {token} 余额: {info['balance']}")
                    
        except Exception as e:
            print(f"  获取 {network} 余额失败: {e}")

if __name__ == "__main__":
    # 从命令行参数获取地址，如果没有则提示输入
    if len(sys.argv) > 1:
        address = sys.argv[1].strip()
    else:
        address = input("请输入要查询的地址: ").strip()
    
    if not address:
        print("地址不能为空")
        exit(1)
        
    asyncio.run(check_balance(address))