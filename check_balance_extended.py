#!/usr/bin/env python3
"""
检查指定地址在多个链上的余额，包括各链的USDC和DAI代币
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

# 定义各链的代币符号
NETWORK_TOKENS = {
    "ethereum_mainnet": {
        "USDC": "USDC",
        "DAI": "DAI",
        "WETH": "WETH"
    },
    "base_mainnet": {
        "USDC": "USDC_BASE",
        "DAI": "DAI_BASE",
        "WETH": "WETH_BASE"
    },
    "bsc_mainnet": {
        "USDC": "USDC_BSC",
        "DAI": "DAI_BSC"
    },
    "polygon_mainnet": {
        "USDC": "USDC_POLYGON",
        "DAI": "DAI_POLYGON"
    }
}

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
            # 先查询原生代币余额
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
            
            # 查询该链的代币余额
            if network in NETWORK_TOKENS:
                tokens = NETWORK_TOKENS[network]
                for token_name, token_symbol in tokens.items():
                    try:
                        token_balance = await handle_get_balance({
                            "address": address,
                            "token_symbol": token_symbol,
                            "network": network
                        })
                        
                        if "error" not in token_balance and token_symbol in token_balance.get("balances", {}):
                            token_info = token_balance["balances"][token_symbol]
                            print(f"  {token_name} 余额: {token_info['balance']}")
                        else:
                            print(f"  {token_name} 余额: 0")
                    except Exception as e:
                        print(f"  {token_name} 余额查询失败: {e}")
            else:
                # 对于没有特殊代币配置的链，尝试查询通用代币
                try:
                    usdc_balance = await handle_get_balance({
                        "address": address,
                        "token_symbol": "USDC",
                        "network": network
                    })
                    
                    if "error" not in usdc_balance and "USDC" in usdc_balance.get("balances", {}):
                        usdc_info = usdc_balance["balances"]["USDC"]
                        print(f"  USDC 余额: {usdc_info['balance']}")
                    else:
                        print("  USDC 余额: 0")
                except Exception as e:
                    print(f"  USDC 余额查询失败: {e}")
                
                try:
                    dai_balance = await handle_get_balance({
                        "address": address,
                        "token_symbol": "DAI",
                        "network": network
                    })
                    
                    if "error" not in dai_balance and "DAI" in dai_balance.get("balances", {}):
                        dai_info = dai_balance["balances"]["DAI"]
                        print(f"  DAI 余额: {dai_info['balance']}")
                    else:
                        print("  DAI 余额: 0")
                except Exception as e:
                    print(f"  DAI 余额查询失败: {e}")
                    
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