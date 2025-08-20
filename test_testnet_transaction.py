#!/usr/bin/env python3
"""
测试 blockchain-payment-mcp 在测试网上的交易功能
"""

import asyncio
import json
import os
from decimal import Decimal

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

async def test_testnet_transaction():
    """测试测试网交易功能"""
    print("开始测试测试网交易功能...")
    
    # 1. 测试获取测试网信息
    print("\n1. 测试获取测试网信息:")
    test_networks = ["ethereum_sepolia", "base_sepolia", "bsc_testnet", "polygon_amoy"]
    
    for network in test_networks:
        try:
            result = await handle_get_network_info({"network": network})
            print(f" {network}: {result['is_connected']}")
            if not result['is_connected']:
                print(f"    {network} 连接失败，请检查RPC配置")
        except Exception as e:
            print(f" {network} 获取信息失败: {e}")
    
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
    
    # 4. 测试设置用户钱包
    print("\n4. 设置用户钱包:")
    try:
        result = await handle_set_user_wallet({
            "private_key": test_private_key,
            "label": "test_wallet"
        })
        print(f" 钱包设置: {'成功' if result['success'] else '失败'}")
    except Exception as e:
        print(f" 钱包设置失败: {e}")
    
    # 5. 测试余额查询 (在测试网上)
    print("\n5. 查询测试网余额:")
    for network in test_networks[:2]:  # 只测试前两个网络以节省时间
        try:
            result = await handle_get_balance({
                "address": test_address,
                "network": network
            })
            if "error" in result:
                print(f"  {network} 余额查询失败: {result['error']}")
            else:
                balances = result.get("balances", {})
                print(f"  {network} 余额:")
                for token, info in balances.items():
                    print(f"   {token}: {info['balance']}")
        except Exception as e:
            print(f"  {network} 余额查询异常: {e}")
    
    # 6. 测试Gas费用估算
    print("\n6. 估算测试网Gas费用:")
    for network in test_networks[:2]:  # 只测试前两个网络
        try:
            result = await handle_estimate_gas_fees({
                "to_address": test_address,  # 发送到自己地址
                "amount": "0.001",
                "network": network
            })
            if "error" in result:
                print(f"  {network} Gas估算失败: {result['error']}")
            else:
                print(f"  {network} Gas估算成功:")
                print(f"   Gas价格: {result.get('gas_price_gwei', 'N/A')} Gwei")
                print(f"   预估费用: {result.get('estimated_fee_eth', 'N/A')} ETH")
        except Exception as e:
            print(f"  {network} Gas估算异常: {e}")
    
    # 7. 尝试发送交易 (使用非常小的金额)
    print("\n7. 尝试发送测试网交易:")
    print("    注意: 由于是新创建的钱包，没有余额，交易会失败，但可以验证功能")
    
    for network in test_networks[:2]:  # 只测试前两个网络
        try:
            result = await handle_send_transaction({
                "to_address": test_address,  # 发送到自己地址
                "amount": "0.000001",  # 极小的金额
                "network": network,
                "private_key": test_private_key
            })
            
            if "error" in result:
                # 检查是否是因为余额不足导致的错误，这实际上是预期的行为
                error_msg = result['error'].lower()
                if "insufficient" in error_msg or "余额" in error_msg or "funds" in error_msg:
                    print(f"  {network} 交易功能验证成功 (因余额不足而失败，符合预期)")
                else:
                    print(f"   {network} 交易失败 (非余额问题): {result['error']}")
            else:
                print(f"  {network} 交易提交成功:")
                print(f"   交易哈希: {result.get('transaction_hash', 'N/A')}")
        except Exception as e:
            print(f"  {network} 交易异常: {e}")
    
    # 8. 测试交易状态查询 (使用一个已知的测试网交易哈希)
    print("\n8. 测试交易状态查询:")
    # 使用一个示例交易哈希 (Sepolia网络上的一个示例交易)
    example_tx_hash = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
    
    try:
        result = await handle_get_transaction_status({
            "tx_hash": example_tx_hash,
            "network": "ethereum_sepolia"
        })
        if "error" in result and "not found" in result["error"].lower():
            print(" 交易状态查询功能正常 (交易未找到)")
        elif "error" in result:
            print(f" 交易状态查询返回错误: {result['error']}")
        else:
            print(" 交易状态查询成功")
            print(f"   状态: {result.get('status', 'N/A')}")
    except Exception as e:
        print(f" 交易状态查询异常: {e}")
    
    print("\n 测试网交易功能测试完成！")
    print("\n 总结:")
    print("   - 如果余额查询和Gas估算成功，说明测试网连接正常")
    print("   - 如果交易发送因余额不足而失败，说明交易功能正常")
    print("   - 可以通过获取Sepolia等测试网的ETH来进一步测试完整交易流程")

if __name__ == "__main__":
    # 设置环境变量以便测试
    os.environ["DEBUG"] = "true"
    
    asyncio.run(test_testnet_transaction())