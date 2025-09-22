#!/usr/bin/env node
/**
 * 区块链支付MCP服务器 - TypeScript版本
 *
 * 提供基于Base网络的区块链支付功能，包括：
 * - 余额查询
 * - 代币转账
 * - 交易状态查询
 * - Gas费用估算
 * - 钱包管理
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { config } from './config.js';
import { BlockchainInterface } from './blockchain.js';
import { WalletSigner, WalletManager } from './wallet.js';

// 配置日志 - 使用stderr避免干扰stdio通信
const isDebug = config.debug;

function log(level: 'info' | 'warn' | 'error', message: string): void {
  if (level === 'error' || isDebug) {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
  }
}

// 创建MCP服务器
const server = new Server(
  {
    name: 'blockchain-payment',
    version: '0.1.10',
  },
  {
    capabilities: {
      tools: {},
      prompts: {},
    },
  }
);

// 全局区块链接口实例
let blockchain: BlockchainInterface | null = null;

// 用户钱包管理器
const walletManager = new WalletManager();

function getBlockchain(networkId?: string): BlockchainInterface {
  const currentNetwork = networkId || config.defaultNetwork;

  // 确保网络ID有效
  if (!config.getSupportedNetworks().includes(currentNetwork)) {
    throw new Error(`不支持的网络: ${currentNetwork}`);
  }

  if (!blockchain || blockchain.getNetworkConfig().name !== config.getNetwork(currentNetwork).name) {
    blockchain = new BlockchainInterface(currentNetwork);
  }

  return blockchain;
}

function getWallet(privateKey?: string): WalletSigner {
  // 如果提供了私钥，使用提供的私钥
  if (privateKey) {
    return new WalletSigner(privateKey);
  }

  // 如果有当前用户钱包，返回它
  const currentWallet = walletManager.getCurrentWallet();
  if (currentWallet) {
    return currentWallet;
  }

  // 如果配置中有私钥，使用配置的私钥
  if (config.privateKey) {
    return new WalletSigner(config.privateKey);
  }

  // 如果都没有，返回一个没有私钥的钱包实例
  return new WalletSigner();
}

// 工具定义
const tools: Tool[] = [
  {
    name: 'get_balance',
    description: '查询指定地址的余额（ETH和代币）',
    inputSchema: {
      type: 'object',
      properties: {
        address: {
          type: 'string',
          description: '要查询的钱包地址',
        },
        token_symbol: {
          type: 'string',
          description: '指定代币符号(可选)，如USDC、DAI等',
          enum: config.getSupportedTokens().concat(['ETH']),
        },
        network: {
          type: 'string',
          description: '网络名称(可选)',
          enum: config.getSupportedNetworks(),
          default: config.defaultNetwork,
        },
      },
      required: ['address'],
    },
  },
  {
    name: 'send_transaction',
    description: '发送代币转账交易',
    inputSchema: {
      type: 'object',
      properties: {
        to_address: {
          type: 'string',
          description: '接收方地址',
        },
        amount: {
          type: 'string',
          description: '转账金额（以代币单位为准）',
        },
        token_symbol: {
          type: 'string',
          description: '代币符号，默认为ETH',
          enum: config.getSupportedTokens().concat(['ETH']),
          default: 'ETH',
        },
        network: {
          type: 'string',
          description: '网络名称(可选)',
          enum: config.getSupportedNetworks(),
          default: config.defaultNetwork,
        },
        from_wallet_label: {
          type: 'string',
          description: '发送方钱包标签(可选)，如未提供则使用当前钱包',
        },
        private_key: {
          type: 'string',
          description: '发送方私钥(可选，如未提供则使用当前钱包或环境变量中的私钥)',
        },
      },
      required: ['to_address', 'amount'],
    },
  },
  {
    name: 'get_transaction_status',
    description: '查询交易状态和详情',
    inputSchema: {
      type: 'object',
      properties: {
        tx_hash: {
          type: 'string',
          description: '交易哈希值',
        },
        network: {
          type: 'string',
          description: '网络名称(可选)',
          enum: config.getSupportedNetworks(),
          default: config.defaultNetwork,
        },
      },
      required: ['tx_hash'],
    },
  },
  {
    name: 'estimate_gas_fees',
    description: '估算Gas费用',
    inputSchema: {
      type: 'object',
      properties: {
        to_address: {
          type: 'string',
          description: '接收方地址(可选)',
        },
        amount: {
          type: 'string',
          description: '转账金额(可选)',
        },
        token_symbol: {
          type: 'string',
          description: '代币符号(可选)',
          enum: config.getSupportedTokens().concat(['ETH']),
        },
        network: {
          type: 'string',
          description: '网络名称(可选)',
          enum: config.getSupportedNetworks(),
          default: config.defaultNetwork,
        },
      },
      required: [],
    },
  },
  {
    name: 'create_wallet',
    description: '创建新的钱包地址和私钥',
    inputSchema: {
      type: 'object',
      properties: {
        label: {
          type: 'string',
          description: '钱包标签(可选)，用于标识钱包',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_network_info',
    description: '获取当前网络信息',
    inputSchema: {
      type: 'object',
      properties: {
        network: {
          type: 'string',
          description: '网络名称(可选)',
          enum: config.getSupportedNetworks(),
          default: config.defaultNetwork,
        },
      },
      required: [],
    },
  },
  {
    name: 'get_supported_tokens',
    description: '获取支持的代币列表',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'validate_address',
    description: '验证以太坊地址格式',
    inputSchema: {
      type: 'object',
      properties: {
        address: {
          type: 'string',
          description: '要验证的地址',
        },
      },
      required: ['address'],
    },
  },
  {
    name: 'set_user_wallet',
    description: '设置用户钱包私钥',
    inputSchema: {
      type: 'object',
      properties: {
        private_key: {
          type: 'string',
          description: '用户的私钥',
        },
        label: {
          type: 'string',
          description: '钱包标签(可选)，用于标识钱包',
        },
      },
      required: ['private_key'],
    },
  },
  {
    name: 'list_wallets',
    description: '列出所有已添加的钱包',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'switch_wallet',
    description: '切换当前使用的钱包',
    inputSchema: {
      type: 'object',
      properties: {
        label: {
          type: 'string',
          description: '要切换到的钱包标签',
        },
      },
      required: ['label'],
    },
  },
  {
    name: 'remove_wallet',
    description: '移除指定标签的钱包',
    inputSchema: {
      type: 'object',
      properties: {
        label: {
          type: 'string',
          description: '要移除的钱包标签',
        },
      },
      required: ['label'],
    },
  },
  {
    name: 'get_wallet_address',
    description: '从私钥获取钱包地址',
    inputSchema: {
      type: 'object',
      properties: {
        private_key: {
          type: 'string',
          description: '钱包私钥',
        },
      },
      required: ['private_key'],
    },
  },
];

// 工具处理函数
async function handleGetBalance(args: Record<string, any>): Promise<Record<string, any>> {
  const address = args['address'];
  const tokenSymbol = args['token_symbol'];
  const network = args['network'] || config.defaultNetwork;

  const bc = getBlockchain(network);
  return await bc.getBalance(address, tokenSymbol);
}

async function handleSendTransaction(args: Record<string, any>): Promise<Record<string, any>> {
  const toAddress = args['to_address'];
  const amount = args['amount'];
  const tokenSymbol = args['token_symbol'] || 'ETH';
  const network = args['network'] || config.defaultNetwork;
  const privateKey = args['private_key'];
  const fromWalletLabel = args['from_wallet_label'];

  // 获取钱包实例
  let wallet: WalletSigner | null = null;
  if (privateKey) {
    // 使用直接提供的私钥
    wallet = new WalletSigner(privateKey);
  } else if (fromWalletLabel) {
    // 使用指定标签的钱包
    wallet = walletManager.getWallet(fromWalletLabel);
    if (!wallet) {
      return {
        error: `未找到标签为 '${fromWalletLabel}' 的钱包`,
        suggestion: '请检查钱包标签或使用list_wallets查看可用钱包',
      };
    }
  } else {
    // 使用当前钱包或其他默认方式
    wallet = getWallet();
  }

  // 检查钱包是否有私钥
  if (!wallet || !wallet.hasPrivateKey()) {
    return {
      error: '未设置私钥，无法发送交易。',
      instructions: [
        '1. 使用set_user_wallet工具设置私钥',
        '2. 使用create_wallet工具创建新钱包',
        '3. 在环境变量中配置PRIVATE_KEY',
        '4. 使用list_wallets查看已添加的钱包并用switch_wallet切换',
      ],
    };
  }

  const bc = getBlockchain(network);
  return await bc.sendTransaction(toAddress, amount, tokenSymbol, wallet);
}

async function handleGetTransactionStatus(args: Record<string, any>): Promise<Record<string, any>> {
  const txHash = args['tx_hash'];
  const network = args['network'] || config.defaultNetwork;

  const bc = getBlockchain(network);
  return await bc.getTransactionStatus(txHash);
}

async function handleEstimateGasFees(args: Record<string, any>): Promise<Record<string, any>> {
  const network = args['network'] || config.defaultNetwork;

  // 构建交易参数用于估算
  let transaction: Record<string, any> | undefined;
  if (args['to_address'] && args['amount']) {
    transaction = {
      to: args['to_address'],
      value: args['amount'],
    };
  }

  const bc = getBlockchain(network);
  return await bc.estimateGasFees(transaction);
}

async function handleCreateWallet(args: Record<string, any>): Promise<Record<string, any>> {
  const label = args['label'];
  const wallet = new WalletSigner();
  const result = wallet.createAccount();

  // 如果提供了标签，添加到钱包管理器
  if (label) {
    const privateKey = result.privateKey;
    if (walletManager.addWallet(label, privateKey)) {
      return {
        ...result,
        label,
        message: `钱包已创建并添加到钱包管理器，标签: ${label}`,
      };
    } else {
      return {
        ...result,
        warning: `钱包创建成功，但添加到钱包管理器失败（标签: ${label}）`,
      };
    }
  }

  return result;
}

async function handleGetNetworkInfo(args: Record<string, any>): Promise<Record<string, any>> {
  const network = args['network'] || config.defaultNetwork;

  const bc = getBlockchain(network);
  const networkConfig = bc.getNetworkConfig();

  try {
    // 这里需要根据实际的provider实现来获取最新区块信息
    // 暂时返回基本配置信息
    return {
      network: networkConfig.name,
      chain_id: networkConfig.chainId,
      rpc_url: networkConfig.rpcUrl,
      native_token: networkConfig.nativeToken,
      explorer_url: networkConfig.explorerUrl,
      latest_block: null, // 需要实际实现
      is_connected: true, // 需要实际实现
      supported_tokens: config.getSupportedTokens(),
    };
  } catch (error) {
    log('warn', `获取网络状态失败: ${error}`);
    return {
      network: networkConfig.name,
      chain_id: networkConfig.chainId,
      rpc_url: networkConfig.rpcUrl,
      native_token: networkConfig.nativeToken,
      explorer_url: networkConfig.explorerUrl,
      latest_block: null,
      is_connected: false,
      supported_tokens: config.getSupportedTokens(),
      error: String(error),
    };
  }
}

async function handleGetSupportedTokens(_args: Record<string, any>): Promise<Record<string, any>> {
  const tokensInfo: Record<string, any> = {};
  for (const [symbol, tokenConfig] of Object.entries(config.tokens)) {
    tokensInfo[symbol] = {
      symbol: tokenConfig.symbol,
      name: tokenConfig.name,
      address: tokenConfig.address,
      decimals: tokenConfig.decimals,
    };
  }

  return {
    native_token: 'ETH',
    supported_tokens: tokensInfo,
    total_count: Object.keys(tokensInfo).length,
  };
}

async function handleValidateAddress(args: Record<string, any>): Promise<Record<string, any>> {
  const address = args['address'];
  const isValid = WalletSigner.validateAddress(address);

  return {
    address,
    is_valid: isValid,
    format: isValid ? 'ethereum_compatible' : 'invalid',
  };
}

async function handleSetUserWallet(args: Record<string, any>): Promise<Record<string, any>> {
  const privateKey = args['private_key'];
  const label = args['label'] || 'default';

  // 验证私钥格式
  if (!WalletSigner.validatePrivateKey(privateKey)) {
    return {
      success: false,
      error: '无效的私钥格式',
    };
  }

  // 添加到钱包管理器
  if (walletManager.addWallet(label, privateKey)) {
    walletManager.setCurrentWallet(label);

    const wallet = walletManager.getWallet(label);
    return {
      success: true,
      message: `用户钱包设置成功，标签: ${label}，地址: ${wallet?.address}`,
      label,
      address: wallet?.address,
    };
  } else {
    return {
      success: false,
      error: '钱包设置失败',
    };
  }
}

async function handleListWallets(_args: Record<string, any>): Promise<Record<string, any>> {
  const wallets = walletManager.listWallets();

  return {
    wallets,
    count: wallets.length,
    current_wallet: walletManager.getCurrentWallet()?.address || null,
  };
}

async function handleSwitchWallet(args: Record<string, any>): Promise<Record<string, any>> {
  const label = args['label'];

  if (walletManager.setCurrentWallet(label)) {
    const currentWallet = walletManager.getWallet(label);
    return {
      success: true,
      message: `已切换到钱包: ${label}`,
      label,
      address: currentWallet?.address || null,
    };
  } else {
    return {
      success: false,
      error: `未找到标签为 '${label}' 的钱包`,
      suggestion: '使用list_wallets查看可用钱包',
    };
  }
}

async function handleRemoveWallet(args: Record<string, any>): Promise<Record<string, any>> {
  const label = args['label'];

  if (walletManager.removeWallet(label)) {
    return {
      success: true,
      message: `已移除钱包: ${label}`,
    };
  } else {
    return {
      success: false,
      error: `未找到标签为 '${label}' 的钱包`,
    };
  }
}

async function handleGetWalletAddress(args: Record<string, any>): Promise<Record<string, any>> {
  const privateKey = args['private_key'];

  // 验证私钥格式
  if (!WalletSigner.validatePrivateKey(privateKey)) {
    return {
      success: false,
      error: '无效的私钥格式',
    };
  }

  try {
    const wallet = new WalletSigner(privateKey);
    return {
      success: true,
      address: wallet.address,
      private_key: privateKey.substring(0, 10) + '...' + privateKey.substring(privateKey.length - 10), // 部分显示私钥
      message: '成功从私钥获取钱包地址',
    };
  } catch (error) {
    return {
      success: false,
      error: `获取地址失败: ${String(error)}`,
    };
  }
}

// 注册工具列表处理器
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// 注册工具调用处理器
server.setRequestHandler(CallToolRequestSchema, async (request: any) => {
  const { name, arguments: args } = request.params;

  try {
    let result: Record<string, any>;

    switch (name) {
      case 'get_balance':
        result = await handleGetBalance(args);
        break;
      case 'send_transaction':
        result = await handleSendTransaction(args);
        break;
      case 'get_transaction_status':
        result = await handleGetTransactionStatus(args);
        break;
      case 'estimate_gas_fees':
        result = await handleEstimateGasFees(args);
        break;
      case 'create_wallet':
        result = await handleCreateWallet(args);
        break;
      case 'get_network_info':
        result = await handleGetNetworkInfo(args);
        break;
      case 'get_supported_tokens':
        result = await handleGetSupportedTokens(args);
        break;
      case 'validate_address':
        result = await handleValidateAddress(args);
        break;
      case 'set_user_wallet':
        result = await handleSetUserWallet(args);
        break;
      case 'list_wallets':
        result = await handleListWallets(args);
        break;
      case 'switch_wallet':
        result = await handleSwitchWallet(args);
        break;
      case 'remove_wallet':
        result = await handleRemoveWallet(args);
        break;
      case 'get_wallet_address':
        result = await handleGetWalletAddress(args);
        break;
      default:
        result = { error: `未知工具: ${name}` };
    }

    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
  } catch (error) {
    log('error', `工具调用失败 ${name}: ${error}`);
    const errorResult = { error: `工具执行失败: ${String(error)}` };
    return {
      content: [{ type: 'text', text: JSON.stringify(errorResult, null, 2) }],
    };
  }
});

// 主函数
async function main(): Promise<void> {
  // 设置更简洁的日志格式，避免干扰stdio通信
  if (config.debug) {
    log('info', '启动区块链支付MCP服务器');
    log('info', `默认网络: ${config.defaultNetwork}`);

    // 验证配置
    if (!config.privateKey) {
      log('warn', '未设置PRIVATE_KEY环境变量，发送交易功能将需要用户手动提供私钥');
    } else {
      log('info', '已配置PRIVATE_KEY环境变量');
    }

    // 测试网络连接
    try {
      const bc = getBlockchain();
      log('info', `网络连接测试成功: ${bc.getNetworkConfig().name}`);
    } catch (error) {
      log('error', `网络连接测试失败: ${error}`);
    }
  }

  // 启动服务器
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

// 启动服务器
main().catch((error) => {
  log('error', `服务器启动失败: ${error}`);
  process.exit(1);
});
