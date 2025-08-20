#!/usr/bin/env python3
"""
专门测试Base Sepolia测试网交易功能
"""

import asyncio
import json
import os

# 从已安装的blockchain_payment_mcp包导入必要的功能
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

async def test_base_sepolia_transaction():
    """测试Base Sepolia测试网交易功能"""
    print("开始测试Base Sepolia测试网交易功能...")
    
    # 1. 测试Base Sepolia网络信息
    print("\n1. 获取Base Sepolia网络信息:")
    try:
        result = await handle_get_network_info({"network": "base_sepolia"})
        print(f" 网络名称: {result.get('network', 'N/A')}")
        print(f" Chain ID: {result.get('chain_id', 'N/A')}")
        print(f" RPC URL: {result.get('rpc_url', 'N/A')}")
        print(f" 原生代币: {result.get('native_token', 'N/A')}")
        print(f" 浏览器URL: {result.get('explorer_url', 'N/A')}")
        print(f" 连接状态: {result.get('is_connected', 'N/A')}")
        print(f" 最新区块: {result.get('latest_block', 'N/A')}")
    except Exception as e:
        print(f" 获取网络信息失败: {e}")
        return
    
    # 2. 创建测试钱包
    print("\n2. 创建测试钱包:")
    try:
        wallet_result = await handle_create_wallet({})
        test_private_key = wallet_result.get("private_key")
        test_address = wallet_result.get("address")
        print(f" 钱包创建成功")
        print(f"   地址: {test_address}")
        print(f"   私钥: {test_private_key[:10]}...{test_private_key[-10:]}")
    except Exception as e:
        print(f" 创建钱包失败: {e}")
        return
    
    # 3. 测试地址验证
    print("\n3. 验证测试地址:")
    try:
        result = await handle_validate_address({"address": test_address})
        print(f" 地址验证: {'有效' if result['is_valid'] else '无效'}")
    except Exception as e:
        print(f" 地址验证失败: {e}")
    
    # 4. 设置用户钱包
    print("\n4. 设置用户钱包:")
    try:
        result = await handle_set_user_wallet({
            "private_key": test_private_key,
            "label": "base_test_wallet"
        })
        print(f" 钱包设置: {'成功' if result['success'] else '失败'}")
        if result['success']:
            print(f"   钱包标签: {result.get('label', 'N/A')}")
            print(f"   钱包地址: {result.get('address', 'N/A')}")
    except Exception as e:
        print(f" 钱包设置失败: {e}")
    
    # 5. 查询Base Sepolia余额
    print("\n5. 查询Base Sepolia余额:")
    try:
        result = await handle_get_balance({
            "address": test_address,
            "network": "base_sepolia"
        })
        if "error" in result:
            print(f" 余额查询失败: {result['error']}")
        else:
            balances = result.get("balances", {})
            print(f" 钱包地址: {result.get('address', 'N/A')}")
            print(f" 网络: {result.get('network', 'N/A')}")
            for token, info in balances.items():
                print(f"  {token}: {info['balance']}")
    except Exception as e:
        print(f" 余额查询异常: {e}")
    
    # 6. 查询支持的代币
    print("\n6. 查询Base Sepolia支持的代币:")
    try:
        result = await handle_get_supported_tokens({})
        if "supported_tokens" in result:
            tokens = result["supported_tokens"]
            base_tokens = {k: v for k, v in tokens.items() if "BASE" in k}
            print(f" Base网络支持的代币:")
            for symbol, info in base_tokens.items():
                print(f"  {symbol}: {info['name']} ({info['address']})")
        else:
            print(f" 查询支持代币失败: {result}")
    except Exception as e:
        print(f" 查询支持代币异常: {e}")
    
    # 7. 估算Gas费用
    print("\n7. 估算Base Sepolia Gas费用:")
    try:
        result = await handle_estimate_gas_fees({
            "to_address": test_address,  # 发送到自己地址
            "amount": "0.001",
            "network": "base_sepolia"
        })
        if "error" in result:
            print(f" Gas估算失败: {result['error']}")
        else:
            print(f" Gas价格: {result.get('gas_price_gwei', 'N/A')} Gwei")
            print(f" Gas限制: {result.get('gas_limit', 'N/A')}")
            print(f" 预估费用: {result.get('estimated_fee_eth', 'N/A')} ETH")
    except Exception as e:
        print(f" Gas估算异常: {e}")
    
    # 8. 尝试发送ETH交易 (使用非常小的金额)
    print("\n8. 尝试发送Base Sepolia ETH交易:")
    print("   注意: 由于是新创建的钱包，没有余额，交易会失败，但可以验证功能")
    try:
        result = await handle_send_transaction({
            "to_address": test_address,  # 发送到自己地址
            "amount": "0.000001",  # 极小的金额
            "network": "base_sepolia",
            "private_key": test_private_key
        })
        
        if "error" in result:
            # 检查是否是因为余额不足导致的错误，这实际上是预期的行为
            error_msg = result['error'].lower()
            if "insufficient" in error_msg or "余额" in error_msg or "funds" in error_msg:
                print(f" ETH交易功能验证成功 (因余额不足而失败，符合预期)")
                print(f"   错误信息: {result['error']}")
            else:
                print(f" ETH交易失败 (非余额问题): {result['error']}")
        else:
            print(f" ETH交易提交成功:")
            print(f"   交易哈希: {result.get('transaction_hash', 'N/A')}")
            print(f"   发送地址: {result.get('from_address', 'N/A')}")
            print(f"   接收地址: {result.get('to_address', 'N/A')}")
            print(f"   金额: {result.get('amount', 'N/A')} ETH")
            print(f"   状态: {result.get('status', 'N/A')}")
    except Exception as e:
        print(f" ETH交易异常: {e}")
    
    # 9. 尝试发送USDC代币交易 (如果支持)
    print("\n9. 尝试发送Base Sepolia USDC代币交易:")
    print("   注意: 由于是新创建的钱包，没有余额，交易会失败，但可以验证功能")
    try:
        result = await handle_send_transaction({
            "to_address": test_address,  # 发送到自己地址
            "amount": "0.000001",  # 极小的金额
            "token_symbol": "USDC_BASE",
            "network": "base_sepolia",
            "private_key": test_private_key
        })
        
        if "error" in result:
            # 检查是否是因为余额不足导致的错误，这实际上是预期的行为
            error_msg = result['error'].lower()
            if "insufficient" in error_msg or "余额" in error_msg or "funds" in error_msg:
                print(f" USDC代币交易功能验证成功 (因余额不足而失败，符合预期)")
                print(f"   错误信息: {result['error']}")
            else:
                print(f" USDC代币交易失败 (非余额问题): {result['error']}")
        else:
            print(f" USDC代币交易提交成功:")
            print(f"   交易哈希: {result.get('transaction_hash', 'N/A')}")
            print(f"   发送地址: {result.get('from_address', 'N/A')}")
            print(f"   接收地址: {result.get('to_address', 'N/A')}")
            print(f"   金额: {result.get('amount', 'N/A')} USDC")
            print(f"   状态: {result.get('status', 'N/A')}")
    except Exception as e:
        print(f" USDC代币交易异常: {e}")
    
    # 10. 测试交易状态查询 (使用一个已知的Base Sepolia交易哈希)
    print("\n10. 测试Base Sepolia交易状态查询:")
    # 使用一个示例交易哈希 (需要替换为真实的Base Sepolia交易哈希)
    example_tx_hash = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
    
    try:
        result = await handle_get_transaction_status({
            "tx_hash": example_tx_hash,
            "network": "base_sepolia"
        })
        if "error" in result:
            print(f" 交易状态查询返回错误: {result['error']}")
        else:
            print(" 交易状态查询成功")
            print(f"   交易哈希: {result.get('transaction_hash', 'N/A')}")
            print(f"   状态: {result.get('status', 'N/A')}")
            print(f"   区块号: {result.get('block_number', 'N/A')}")
            print(f"   确认数: {result.get('confirmations', 'N/A')}")
    except Exception as e:
        print(f" 交易状态查询异常: {e}")
    
    print("\n Base Sepolia测试网交易功能测试完成！")

if __name__ == "__main__":
    # 设置环境变量以便测试
    os.environ["DEBUG"] = "true"
    
    asyncio.run(test_base_sepolia_transaction())