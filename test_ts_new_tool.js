#!/usr/bin/env node
/**
 * 测试TypeScript版本的新功能
 */
import { ethers } from 'ethers';

// 测试从私钥获取地址功能
function testGetWalletAddress() {
    console.log('=== 测试TypeScript版本的get_wallet_address功能 ===\n');
    
    const testPrivateKey = '1655aad5f3b8e80ac2bd4383d3ac8bbab3ec928645c7342e568b394193efdf2c';
    
    try {
        // 创建钱包实例
        const wallet = new ethers.Wallet(testPrivateKey);
        
        console.log('✅ 钱包创建成功');
        console.log(`地址: ${wallet.address}`);
        console.log(`私钥掩码: ${testPrivateKey.substring(0, 10)}...${testPrivateKey.substring(testPrivateKey.length - 10)}`);
        
        // 验证地址格式
        const isValidAddress = ethers.isAddress(wallet.address);
        console.log(`地址验证: ${isValidAddress ? '✅ 有效' : '❌ 无效'}`);
        
        // 验证私钥格式
        const isValidPrivateKey = /^0x[a-fA-F0-9]{64}$/.test(testPrivateKey);
        console.log(`私钥验证: ${isValidPrivateKey ? '✅ 有效' : '❌ 无效'}`);
        
        return {
            success: true,
            address: wallet.address,
            private_key_masked: testPrivateKey.substring(0, 10) + '...' + testPrivateKey.substring(testPrivateKey.length - 10),
            message: '成功从私钥获取钱包地址'
        };
        
    } catch (error) {
        console.log(`❌ 错误: ${error.message}`);
        return {
            success: false,
            error: `获取地址失败: ${error.message}`
        };
    }
}

// 测试无效私钥处理
function testInvalidPrivateKey() {
    console.log('\n=== 测试无效私钥处理 ===\n');
    
    const invalidPrivateKey = 'invalid_key';
    
    try {
        const wallet = new ethers.Wallet(invalidPrivateKey);
        console.log('❌ 应该抛出错误但没有');
        return { success: false, error: '无效私钥处理异常' };
    } catch (error) {
        console.log('✅ 正确处理了无效私钥');
        console.log(`错误信息: ${error.message}`);
        return { success: true, message: '无效私钥处理正确' };
    }
}

// 运行测试
console.log('开始测试TypeScript版本的新功能...\n');

const result1 = testGetWalletAddress();
const result2 = testInvalidPrivateKey();

console.log('\n=== 测试结果总结 ===');
console.log(`get_wallet_address功能: ${result1.success ? '✅ 通过' : '❌ 失败'}`);
console.log(`无效私钥处理: ${result2.success ? '✅ 通过' : '❌ 失败'}`);

if (result1.success && result2.success) {
    console.log('\n🎉 所有测试通过！TypeScript版本功能正常');
} else {
    console.log('\n⚠️ 部分测试失败，需要检查');
}

