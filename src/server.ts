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
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { config } from './config.js';
import { BlockchainInterface } from './blockchain.js';
import { WalletSigner, WalletManager, WalletType } from './wallet.js';

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

// MCP Prompts - 帮助智能体理解架构
const prompts = [
  {
    name: 'wallet_architecture_guide',
    description: '智能体钱包架构指南 - 帮助智能体理解钱包类型和使用场景',
    arguments: [
      {
        name: 'scenario',
        description: '使用场景：automation(自动化操作) 或 user_interaction(用户交互)',
        required: false,
      },
    ],
  },
  {
    name: 'wallet_selection_guide',
    description: '钱包选择指南 - 帮助智能体选择合适的钱包类型',
    arguments: [
      {
        name: 'operation_type',
        description: '操作类型：transfer(转账) 或 query(查询)',
        required: false,
      },
    ],
  },
];

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
        wallet_type: {
          type: 'string',
          enum: ['agent', 'user'],
          description: '钱包类型：agent(智能体钱包，用于自动化操作) 或 user(用户钱包，需要手动确认)',
          default: 'agent',
        },
      },
      required: [],
    },
  },
  {
    name: 'create_agent_wallet',
    description: '创建智能体专用钱包（自动生成私钥，用于自动化操作）',
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
    description: '列出所有已添加的钱包（包括智能体钱包和用户钱包）',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'list_agent_wallets',
    description: '列出所有智能体钱包（用于自动化操作）',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'list_user_wallets',
    description: '列出所有用户钱包（需要手动确认）',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_agent_wallet_balance',
    description: '查询智能体钱包余额（用于自动化操作）',
    inputSchema: {
      type: 'object',
      properties: {
        wallet_label: {
          type: 'string',
          description: '智能体钱包标签(可选)，如未提供则使用当前智能体钱包',
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
      required: [],
    },
  },
  {
    name: 'send_from_agent_wallet',
    description: '使用智能体钱包发送交易（自动化操作，无需用户确认）',
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
          description: '智能体钱包标签(可选)，如未提供则使用当前智能体钱包',
        },
      },
      required: ['to_address', 'amount'],
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
  const walletType = args['wallet_type'] || 'agent';
  const wallet = new WalletSigner();
  const result = wallet.createAccount();

  // 如果提供了标签，添加到钱包管理器
  if (label) {
    const privateKey = result.privateKey;
    const type = walletType === 'user' ? WalletType.USER : WalletType.AGENT;
    if (walletManager.addWallet(label, privateKey, type)) {
      return {
        ...result,
        label,
        wallet_type: walletType,
        message: `${walletType === 'agent' ? '智能体' : '用户'}钱包已创建并添加到钱包管理器，标签: ${label}`,
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
    message: '获取所有钱包列表成功（包括智能体钱包和用户钱包）',
  };
}

async function handleCreateAgentWallet(args: Record<string, any>): Promise<Record<string, any>> {
  const label = args['label'] || `agent_wallet_${Date.now()}`;
  const wallet = new WalletSigner();
  const result = wallet.createAccount();

  // 添加到钱包管理器，明确标识为智能体钱包
  const privateKey = result.privateKey;
  if (walletManager.addWallet(label, privateKey, WalletType.AGENT)) {
    return {
      ...result,
      label,
      wallet_type: 'agent',
      message: `智能体钱包已创建，标签: ${label}。此钱包用于自动化操作，无需用户确认。`,
    };
  } else {
    return {
      ...result,
      warning: `智能体钱包创建成功，但添加到钱包管理器失败（标签: ${label}）`,
    };
  }
}

async function handleListAgentWallets(_args: Record<string, any>): Promise<Record<string, any>> {
  const agentWallets = walletManager.listAgentWallets();

  return {
    agent_wallets: agentWallets,
    count: agentWallets.length,
    message: '获取智能体钱包列表成功。这些钱包用于自动化操作，无需用户确认。',
  };
}

async function handleListUserWallets(_args: Record<string, any>): Promise<Record<string, any>> {
  const userWallets = walletManager.listUserWallets();

  return {
    user_wallets: userWallets,
    count: userWallets.length,
    message: '获取用户钱包列表成功。这些钱包需要手动确认操作。',
  };
}

async function handleGetAgentWalletBalance(args: Record<string, any>): Promise<Record<string, any>> {
  const walletLabel = args['wallet_label'];
  const tokenSymbol = args['token_symbol'];
  const network = args['network'] || config.defaultNetwork;

  // 获取智能体钱包
  let wallet: WalletSigner | null = null;
  if (walletLabel) {
    wallet = walletManager.getWallet(walletLabel);
    const walletInfo = walletManager.getWalletInfo(walletLabel);
    if (walletInfo && walletInfo.type !== WalletType.AGENT) {
      return {
        error: '指定的钱包不是智能体钱包',
        message: '只能查询智能体钱包的余额',
      };
    }
  } else {
    // 获取当前智能体钱包
    const agentWallets = walletManager.listAgentWallets();
    if (agentWallets.length > 0) {
      const currentAgentWallet = agentWallets.find(w => w.isCurrent);
      if (currentAgentWallet) {
        wallet = walletManager.getWallet(currentAgentWallet.label);
      } else {
        wallet = walletManager.getWallet(agentWallets[0]?.label || '');
      }
    }
  }

  if (!wallet) {
    return {
      error: '未找到智能体钱包',
      message: '请先创建智能体钱包或指定有效的智能体钱包标签',
    };
  }

  const bc = getBlockchain(network);
  const balance = await bc.getBalance(wallet.address || '', tokenSymbol);

  return {
    address: wallet.address || '',
    balance: balance,
    token_symbol: tokenSymbol || 'ETH',
    network: network,
    wallet_type: 'agent',
    message: '查询智能体钱包余额成功',
  };
}

async function handleSendFromAgentWallet(args: Record<string, any>): Promise<Record<string, any>> {
  const toAddress = args['to_address'];
  const amount = args['amount'];
  const tokenSymbol = args['token_symbol'] || 'ETH';
  const network = args['network'] || config.defaultNetwork;
  const fromWalletLabel = args['from_wallet_label'];

  // 获取智能体钱包
  let wallet: WalletSigner | null = null;
  if (fromWalletLabel) {
    wallet = walletManager.getWallet(fromWalletLabel);
    const walletInfo = walletManager.getWalletInfo(fromWalletLabel);
    if (walletInfo && walletInfo.type !== WalletType.AGENT) {
      return {
        error: '指定的钱包不是智能体钱包',
        message: '只能使用智能体钱包发送交易',
      };
    }
  } else {
    // 获取当前智能体钱包
    const agentWallets = walletManager.listAgentWallets();
    if (agentWallets.length > 0) {
      const currentAgentWallet = agentWallets.find(w => w.isCurrent);
      if (currentAgentWallet) {
        wallet = walletManager.getWallet(currentAgentWallet.label);
      } else {
        wallet = walletManager.getWallet(agentWallets[0]?.label || '');
      }
    }
  }

  if (!wallet) {
    return {
      error: '未找到智能体钱包',
      message: '请先创建智能体钱包或指定有效的智能体钱包标签',
    };
  }

  const bc = getBlockchain(network);
  const result = await bc.sendTransaction(toAddress, amount, tokenSymbol, wallet);

  return {
    transaction_hash: result['transactionHash'],
    from_address: wallet.address || '',
    to_address: toAddress,
    amount: amount,
    token_symbol: tokenSymbol,
    network: network,
    wallet_type: 'agent',
    message: '智能体钱包交易发送成功（自动化操作，无需用户确认）',
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

// Prompt处理函数
async function handleWalletArchitectureGuide(args: Record<string, any>): Promise<Record<string, any>> {
  const scenario = args['scenario'] || 'automation';
  
  const guide = {
    architecture_overview: {
      title: "智能体钱包架构说明",
      description: "本MCP服务器支持两种钱包类型，用于不同的使用场景",
      wallet_types: {
        agent: {
          name: "智能体钱包",
          purpose: "用于自动化操作，无需用户确认",
          features: [
            "自动生成私钥",
            "支持自动化交易",
            "无需用户交互",
            "适合批量操作"
          ],
          tools: [
            "create_agent_wallet - 创建智能体钱包",
            "get_agent_wallet_balance - 查询智能体钱包余额",
            "send_from_agent_wallet - 使用智能体钱包发送交易",
            "list_agent_wallets - 列出所有智能体钱包"
          ]
        },
        user: {
          name: "用户钱包",
          purpose: "用于用户交互，需要手动确认",
          features: [
            "用户提供私钥",
            "需要用户确认交易",
            "适合用户主动操作",
            "支持钱包连接器"
          ],
          tools: [
            "set_user_wallet - 设置用户钱包私钥",
            "list_user_wallets - 列出所有用户钱包",
            "send_transaction - 发送交易（需要用户确认）"
          ]
        }
      }
    },
    usage_scenarios: {
      automation: {
        title: "自动化场景",
        description: "使用智能体钱包进行自动化操作",
        workflow: [
          "1. 创建智能体钱包 (create_agent_wallet)",
          "2. 查询余额 (get_agent_wallet_balance)",
          "3. 执行自动化交易 (send_from_agent_wallet)",
          "4. 监控交易状态 (get_transaction_status)"
        ],
        benefits: [
          "无需用户干预",
          "支持批量操作",
          "适合定时任务",
          "提高操作效率"
        ]
      },
      user_interaction: {
        title: "用户交互场景",
        description: "使用用户钱包进行需要确认的操作",
        workflow: [
          "1. 设置用户钱包 (set_user_wallet)",
          "2. 查询余额 (get_balance)",
          "3. 发送交易 (send_transaction) - 需要用户确认",
          "4. 监控交易状态 (get_transaction_status)"
        ],
        benefits: [
          "用户完全控制",
          "安全性更高",
          "适合大额交易",
          "符合用户习惯"
        ]
      }
    },
    best_practices: [
      "智能体钱包用于自动化、批量、小额操作",
      "用户钱包用于需要用户确认的重要操作",
      "两种钱包类型可以并存，根据场景选择",
      "智能体钱包的私钥由系统管理，用户钱包的私钥由用户提供"
    ]
  };

  return {
    success: true,
    scenario: scenario,
    guide: guide,
    message: `智能体钱包架构指南 - ${scenario === 'automation' ? '自动化场景' : '用户交互场景'}`
  };
}

async function handleWalletSelectionGuide(args: Record<string, any>): Promise<Record<string, any>> {
  const operationType = args['operation_type'] || 'transfer';
  
  const selectionGuide = {
    operation_type: operationType,
    recommendations: {
      transfer: {
        agent_wallet: {
          when_to_use: [
            "自动化转账任务",
            "批量小额转账",
            "定时转账",
            "无需用户确认的转账"
          ],
          tools: ["send_from_agent_wallet"],
          example: "定时向多个地址分发代币"
        },
        user_wallet: {
          when_to_use: [
            "用户主动转账",
            "大额转账",
            "需要用户确认的转账",
            "一次性转账"
          ],
          tools: ["send_transaction"],
          example: "用户向朋友转账"
        }
      },
      query: {
        agent_wallet: {
          when_to_use: [
            "监控智能体钱包余额",
            "自动化余额检查",
            "批量余额查询"
          ],
          tools: ["get_agent_wallet_balance"],
          example: "检查智能体钱包是否有足够余额执行任务"
        },
        user_wallet: {
          when_to_use: [
            "用户查看自己钱包余额",
            "查询特定地址余额",
            "一次性余额查询"
          ],
          tools: ["get_balance"],
          example: "用户查看自己的钱包余额"
        }
      }
    },
    decision_tree: {
      question: "这个操作需要用户确认吗？",
      yes: "使用用户钱包 (user wallet)",
      no: "使用智能体钱包 (agent wallet)"
    }
  };

  return {
    success: true,
    operation_type: operationType,
    guide: selectionGuide,
    message: `钱包选择指南 - ${operationType === 'transfer' ? '转账操作' : '查询操作'}`
  };
}

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
      case 'create_agent_wallet':
        result = await handleCreateAgentWallet(args);
        break;
      case 'list_agent_wallets':
        result = await handleListAgentWallets(args);
        break;
      case 'list_user_wallets':
        result = await handleListUserWallets(args);
        break;
      case 'get_agent_wallet_balance':
        result = await handleGetAgentWalletBalance(args);
        break;
      case 'send_from_agent_wallet':
        result = await handleSendFromAgentWallet(args);
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

// 注册Prompts
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return { prompts };
});

// 处理Prompt请求
server.setRequestHandler(GetPromptRequestSchema, async (request: any) => {
  const { name, arguments: args } = request.params;
  
  try {
    let result: Record<string, any>;
    
    switch (name) {
      case 'wallet_architecture_guide':
        result = await handleWalletArchitectureGuide(args);
        break;
      case 'wallet_selection_guide':
        result = await handleWalletSelectionGuide(args);
        break;
      default:
        throw new Error(`未知的prompt: ${name}`);
    }
    
    return {
      description: result['message'],
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }
        }
      ]
    };
  } catch (error) {
    throw new Error(`处理prompt失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
});

// 主函数
async function main(): Promise<void> {
  // 设置更简洁的日志格式，避免干扰stdio通信
  if (config.debug) {
    log('info', '🚀 启动区块链支付MCP服务器');
    log('info', `📋 支持的工具数量: ${tools.length}`);
    log('info', `📋 支持的Prompts数量: ${prompts.length}`);
    log('info', `🌐 默认网络: ${config.defaultNetwork}`);
    
    // 架构说明
    log('info', '💡 智能体钱包架构说明:');
    log('info', '  🤖 智能体钱包: 用于自动化操作，无需用户确认');
    log('info', '  👤 用户钱包: 用于用户交互，需要手动确认');
    log('info', '  🔧 钱包连接: 由前端智能体处理，MCP专注于区块链操作');

    // 验证配置
    if (!config.privateKey) {
      log('warn', '⚠️ 未设置PRIVATE_KEY环境变量，发送交易功能将需要用户手动提供私钥');
    } else {
      log('info', '✅ 已配置PRIVATE_KEY环境变量');
    }

    // 测试网络连接
    try {
      const bc = getBlockchain();
      log('info', `✅ 网络连接测试成功: ${bc.getNetworkConfig().name}`);
    } catch (error) {
      log('error', `❌ 网络连接测试失败: ${error}`);
    }
  }

  // 启动服务器
  const transport = new StdioServerTransport();
  await server.connect(transport);
  log('info', '✅ 服务器启动成功，等待连接...');
}

// 启动服务器
main().catch((error) => {
  log('error', `服务器启动失败: ${error}`);
  process.exit(1);
});
