/**
 * 简单的测试文件 - 验证基本功能
 */
import { config } from './config.js';
import { WalletSigner, WalletManager } from './wallet.js';
import { BlockchainInterface } from './blockchain.js';

async function testBasicFunctionality(): Promise<void> {
  console.log('🧪 开始测试基本功能...\n');

  // 测试配置
  console.log('📋 测试配置:');
  console.log(`- 默认网络: ${config.defaultNetwork}`);
  console.log(`- 支持的网络: ${config.getSupportedNetworks().join(', ')}`);
  console.log(`- 支持的代币: ${config.getSupportedTokens().join(', ')}`);
  console.log(`- 调试模式: ${config.debug}\n`);

  // 测试钱包功能
  console.log('🔑 测试钱包功能:');
  const wallet = new WalletSigner();
  const newAccount = wallet.createAccount();
  console.log(`- 新钱包地址: ${newAccount.address}`);
  console.log(`- 私钥验证: ${WalletSigner.validatePrivateKey(newAccount.privateKey)}`);
  console.log(`- 地址验证: ${WalletSigner.validateAddress(newAccount.address)}\n`);

  // 测试钱包管理器
  console.log('👛 测试钱包管理器:');
  const walletManager = new WalletManager();
  const added = walletManager.addWallet('test_wallet', newAccount.privateKey);
  console.log(`- 添加钱包: ${added}`);
  console.log(`- 钱包列表: ${walletManager.listWallets().length} 个钱包`);
  console.log(`- 当前钱包: ${walletManager.getCurrentWallet()?.address}\n`);

  // 测试区块链接口
  console.log('⛓️ 测试区块链接口:');
  try {
    const blockchain = new BlockchainInterface('base_sepolia');
    console.log(`- 网络配置: ${blockchain.getNetworkConfig().name}`);
    console.log(`- 链ID: ${blockchain.getNetworkConfig().chainId}`);
    console.log(`- RPC URL: ${blockchain.getNetworkConfig().rpcUrl}\n`);
  } catch (error) {
    console.error(`- 区块链接口错误: ${error}\n`);
  }

  // 测试地址验证
  console.log('✅ 测试地址验证:');
  const testAddresses = [
    '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
    '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b7',
    'invalid_address',
    '0x123',
  ];

  for (const addr of testAddresses) {
    const isValid = WalletSigner.validateAddress(addr);
    console.log(`- ${addr}: ${isValid ? '✅ 有效' : '❌ 无效'}`);
  }

  console.log('\n🎉 基本功能测试完成!');
}

// 运行测试
if (import.meta.url === `file://${process.argv[1]}`) {
  testBasicFunctionality().catch((error) => {
    console.error('❌ 测试失败:', error);
    process.exit(1);
  });
}
