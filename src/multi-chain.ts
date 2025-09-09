/**
 * 多链支持模块 - TypeScript版本
 *
 * 为各种主流区块链提供统一的接口支持，包括：
 * - EVM兼容链（以太坊、BSC、Polygon等）
 * - Solana
 * - Cosmos生态链
 */

import { ethers } from 'ethers';
import { config } from './config.js';
import type { NetworkConfig, TokenConfig } from './config.js';
import { WalletSigner } from './wallet.js';

// 通用接口定义
export interface BalanceResult {
  address: string;
  network: string;
  balances: Record<string, TokenBalance>;
  error?: string;
}

export interface TokenBalance {
  balance: string;
  symbol: string;
  decimals: number;
  wei?: string;
  lamports?: string;
  contractAddress?: string;
}

export interface GasEstimate {
  gasPrice?: string;
  gasPriceGwei?: string;
  gasLimit?: number;
  estimatedFeeWei?: string;
  estimatedFeeEth?: string;
  priorityFee?: string;
  priorityFeeUnit?: string;
  network: string;
  error?: string;
}

export interface TransactionResult {
  transactionHash: string;
  fromAddress: string;
  toAddress: string;
  amount: string;
  symbol: string;
  contractAddress?: string;
  status: string;
  gasUsed?: number;
  blockNumber?: number;
  network: string;
  error?: string;
}

export interface TransactionStatus {
  transactionHash: string;
  status: string;
  blockNumber?: number;
  confirmations?: number;
  gasUsed?: number;
  fromAddress?: string;
  toAddress?: string;
  valueWei?: string;
  valueEth?: string;
  blockTime?: number;
  slot?: number;
  network: string;
  message?: string;
  error?: string;
}

// 多链接口抽象基类
export abstract class MultiChainInterface {
  protected networkConfig: NetworkConfig;

  constructor(networkConfig: NetworkConfig) {
    this.networkConfig = networkConfig;
  }

  public abstract getBalance(address: string, tokenSymbol?: string): Promise<BalanceResult>;
  public abstract estimateGasFees(transaction?: Record<string, any>): Promise<GasEstimate>;
  public abstract sendTransaction(
    toAddress: string,
    amount: string | number,
    tokenSymbol?: string,
    _wallet?: WalletSigner
  ): Promise<TransactionResult>;
  public abstract getTransactionStatus(txHash: string): Promise<TransactionStatus>;
}

// EVM兼容链接口实现
export class EVMChainInterface extends MultiChainInterface {
  private provider: ethers.JsonRpcProvider;

  constructor(networkConfig: NetworkConfig) {
    super(networkConfig);
    this.provider = new ethers.JsonRpcProvider(networkConfig.rpcUrl);

    // 验证连接
    this.provider
      .getNetwork()
      .then((network) => {
        console.log(`EVM链连接成功: ${networkConfig.name} (Chain ID: ${network.chainId})`);
      })
      .catch((error) => {
        console.warn(`EVM链连接警告 ${networkConfig.name}: ${error}`);
      });
  }

  public async getBalance(address: string, _tokenSymbol?: string): Promise<BalanceResult> {
    try {
      if (!WalletSigner.validateAddress(address)) {
        throw new Error('无效的地址格式');
      }

      // 转换为checksum地址
      address = ethers.getAddress(address);

      const result: BalanceResult = {
        address,
        network: this.networkConfig.name,
        balances: {},
      };

      // 获取原生代币余额
      const nativeBalanceWei = await this.provider.getBalance(address);
      const nativeBalance = ethers.formatEther(nativeBalanceWei);
      result.balances[this.networkConfig.nativeToken] = {
        balance: nativeBalance,
        symbol: this.networkConfig.nativeToken,
        decimals: 18,
        wei: nativeBalanceWei.toString(),
      };

      // 获取指定代币余额
      if (_tokenSymbol) {
        const tokenConfig = config.getToken(_tokenSymbol);
        if (tokenConfig) {
          const tokenBalance = await this.getTokenBalance(address, tokenConfig);
          result.balances[_tokenSymbol] = tokenBalance;
        } else {
          result.error = `未知代币: ${_tokenSymbol}`;
        }
      } else {
        // 获取所有已配置代币的余额
        for (const [symbol, tokenConfig] of Object.entries(config.tokens)) {
          try {
            const tokenBalance = await this.getTokenBalance(address, tokenConfig);
            result.balances[symbol] = tokenBalance;
          } catch (error) {
            console.warn(`获取代币 ${symbol} 余额失败: ${error}`);
          }
        }
      }

      return result;
    } catch (error) {
      console.error(`获取余额失败: ${error}`);
      return {
        address,
        network: this.networkConfig.name,
        balances: {},
        error: String(error),
      };
    }
  }

  private async getTokenBalance(address: string, tokenConfig: TokenConfig): Promise<TokenBalance> {
    // ERC20 balanceOf 函数的ABI
    const balanceAbi = [
      {
        constant: true,
        inputs: [{ name: '_owner', type: 'address' }],
        name: 'balanceOf',
        outputs: [{ name: 'balance', type: 'uint256' }],
        type: 'function',
      },
    ];

    const contract = new ethers.Contract(tokenConfig.address, balanceAbi, this.provider);
    const balanceWei = await contract['balanceOf']?.(address);
    const balance = Number(balanceWei) / 10 ** tokenConfig.decimals;

    return {
      balance: balance.toString(),
      symbol: tokenConfig.symbol,
      decimals: tokenConfig.decimals,
      wei: balanceWei.toString(),
      contractAddress: tokenConfig.address,
    };
  }

  public async estimateGasFees(_transaction?: Record<string, any>): Promise<GasEstimate> {
    try {
      // 获取当前gas价格
      const feeData = await this.provider.getFeeData();
      const gasPrice = feeData.gasPrice || BigInt(this.networkConfig.gasPrice);

      // 默认gas限制
      let gasLimit = 21000;

      // 如果提供了交易，估算实际gas使用量
      if (_transaction) {
        try {
          const txParams = this.buildTransactionParams(_transaction);
          gasLimit = Number(await this.provider.estimateGas(txParams));
        } catch (error) {
          console.warn(`Gas估算失败，使用默认值: ${error}`);
          gasLimit = 21000;
        }
      }

      // 计算费用
      const estimatedFeeWei = gasPrice * BigInt(gasLimit);
      const estimatedFeeEth = ethers.formatEther(estimatedFeeWei);

      return {
        gasPrice: gasPrice.toString(),
        gasPriceGwei: ethers.formatUnits(gasPrice, 'gwei'),
        gasLimit,
        estimatedFeeWei: estimatedFeeWei.toString(),
        estimatedFeeEth,
        network: this.networkConfig.name,
      };
    } catch (error) {
      console.error(`估算Gas费用失败: ${error}`);
      return {
        network: this.networkConfig.name,
        error: String(error),
      };
    }
  }

  public async sendTransaction(
    toAddress: string,
    amount: string | number,
    tokenSymbol?: string,
    _wallet?: WalletSigner
  ): Promise<TransactionResult> {
    try {
      // 验证地址
      if (!WalletSigner.validateAddress(toAddress)) {
        throw new Error('无效的接收地址');
      }

      // 转换为checksum地址
      toAddress = ethers.getAddress(toAddress);

      // 使用提供的钱包或创建临时钱包
      let senderWallet = _wallet;
      if (!senderWallet && config.privateKey) {
        senderWallet = new WalletSigner(config.privateKey);
      }

      if (!senderWallet || !senderWallet.hasPrivateKey()) {
        return {
          transactionHash: '',
          fromAddress: '',
          toAddress,
          amount: amount.toString(),
          symbol: tokenSymbol || this.networkConfig.nativeToken,
          status: 'error',
          network: this.networkConfig.name,
          error: '需要私钥进行交易签名',
        };
      }

      // 转换金额
      const amountDecimal = parseFloat(amount.toString());

      // 安全检查
      if (amountDecimal > config.maxTransactionValue) {
        throw new Error(`交易金额超过限制 ${config.maxTransactionValue} ETH`);
      }

      // 构建交易
      if (tokenSymbol && tokenSymbol.toUpperCase() !== 'ETH') {
        // ERC20代币转账
        return await this.sendTokenTransaction(senderWallet, toAddress, amountDecimal, tokenSymbol);
      } else {
        // 原生代币转账
        return await this.sendNativeTransaction(senderWallet, toAddress, amountDecimal);
      }
    } catch (error) {
      console.error(`发送交易失败: ${error}`);
      return {
        transactionHash: '',
        fromAddress: '',
        toAddress,
        amount: amount.toString(),
        symbol: tokenSymbol || this.networkConfig.nativeToken,
        status: 'error',
        network: this.networkConfig.name,
        error: String(error),
      };
    }
  }

  private async sendNativeTransaction(
    wallet: WalletSigner,
    toAddress: string,
    amount: number
  ): Promise<TransactionResult> {
    if (!wallet.hasPrivateKey()) {
      throw new Error('钱包未初始化');
    }

    const connectedWallet = new ethers.Wallet(wallet.getPrivateKey()!, this.provider);

    // 获取nonce
    const nonce = await this.provider.getTransactionCount(wallet.address!);

    // 估算gas
    const gasEstimate = await this.estimateGasFees();
    const gasPrice = BigInt(gasEstimate.gasPrice || this.networkConfig.gasPrice);
    const gasLimit = gasEstimate.gasLimit || 21000;

    // 构建交易参数
    const transaction = {
      to: toAddress,
      value: ethers.parseEther(amount.toString()),
      gasLimit,
      gasPrice,
      nonce,
    };

    // 签名并发送交易
    const txResponse = await connectedWallet.sendTransaction(transaction);
    const receipt = await txResponse.wait();

    return {
      transactionHash: txResponse.hash,
      fromAddress: wallet.address!,
      toAddress,
      amount: amount.toString(),
      symbol: this.networkConfig.nativeToken,
      status: receipt?.status === 1 ? 'success' : 'failed',
      gasUsed: Number(receipt?.gasUsed || 0),
      blockNumber: receipt?.blockNumber || 0,
      network: this.networkConfig.name,
    };
  }

  private async sendTokenTransaction(
    wallet: WalletSigner,
    toAddress: string,
    amount: number,
    tokenSymbol: string
  ): Promise<TransactionResult> {
    const tokenConfig = config.getToken(tokenSymbol);
    if (!tokenConfig) {
      throw new Error(`未知代币: ${tokenSymbol}`);
    }

    if (!wallet.hasPrivateKey()) {
      throw new Error('钱包未初始化');
    }

    const connectedWallet = new ethers.Wallet(wallet.getPrivateKey()!, this.provider);

    // ERC20 transfer 函数的ABI
    const transferAbi = [
      {
        constant: false,
        inputs: [
          { name: '_to', type: 'address' },
          { name: '_value', type: 'uint256' },
        ],
        name: 'transfer',
        outputs: [{ name: '', type: 'bool' }],
        type: 'function',
      },
    ];

    const contract = new ethers.Contract(tokenConfig.address, transferAbi, connectedWallet);

    // 转换金额到wei单位
    const amountWei = BigInt(Math.floor(amount * 10 ** tokenConfig.decimals));

    // 构建交易
    const txResponse = await contract['transfer']?.(toAddress, amountWei, {
      gasLimit: 60000, // ERC20 转账通常需要更多gas
    });

    const receipt = await txResponse.wait();

    return {
      transactionHash: txResponse.hash,
      fromAddress: wallet.address!,
      toAddress,
      amount: amount.toString(),
      symbol: tokenSymbol,
      contractAddress: tokenConfig.address,
      status: receipt?.status === 1 ? 'success' : 'failed',
      gasUsed: Number(receipt?.gasUsed || 0),
      blockNumber: receipt?.blockNumber,
      network: this.networkConfig.name,
    };
  }

  public async getTransactionStatus(txHash: string): Promise<TransactionStatus> {
    try {
      // 获取交易信息
      const transaction = await this.provider.getTransaction(txHash);
      if (!transaction) {
        return {
          transactionHash: txHash,
          status: 'not_found',
          network: this.networkConfig.name,
          message: '交易未找到',
        };
      }

      const receipt = await this.provider.getTransactionReceipt(txHash);
      if (!receipt) {
        return {
          transactionHash: txHash,
          status: 'pending',
          confirmations: 0,
          network: this.networkConfig.name,
          message: '交易正在处理中...',
        };
      }

      const status = receipt.status === 1 ? 'success' : 'failed';
      const currentBlock = await this.provider.getBlockNumber();
      const confirmations = currentBlock - receipt.blockNumber;

      return {
        transactionHash: txHash,
        status,
        blockNumber: receipt.blockNumber,
        confirmations,
        gasUsed: Number(receipt.gasUsed),
        fromAddress: transaction.from,
        toAddress: transaction.to || '',
        valueWei: transaction.value.toString(),
        valueEth: ethers.formatEther(transaction.value),
        network: this.networkConfig.name,
      };
    } catch (error) {
      console.error(`获取交易状态失败: ${error}`);
      return {
        transactionHash: txHash,
        status: 'error',
        network: this.networkConfig.name,
        error: String(error),
      };
    }
  }

  private buildTransactionParams(transaction: Record<string, any>): ethers.TransactionRequest {
    const params: ethers.TransactionRequest = {};

    if (transaction['to']) {
      params.to = ethers.getAddress(transaction['to']);
    }
    if (transaction['value']) {
      params.value = ethers.parseEther(transaction['value'].toString());
    }
    if (transaction['data']) {
      params.data = transaction['data'];
    }

    return params;
  }
}

// Solana链接口实现（简化版本，需要额外的Solana库）
export class SolanaChainInterface extends MultiChainInterface {
  constructor(networkConfig: NetworkConfig) {
    super(networkConfig);
    console.log(`Solana链接口初始化: ${networkConfig.name}`);
    // 注意：这里需要安装 @solana/web3.js 等库来完整实现
  }

  public async getBalance(address: string, _tokenSymbol?: string): Promise<BalanceResult> {
    return {
      address,
      network: this.networkConfig.name,
      balances: {},
      error: 'Solana链支持需要安装额外的依赖库',
    };
  }

  public async estimateGasFees(_transaction?: Record<string, any>): Promise<GasEstimate> {
    return {
      network: this.networkConfig.name,
      error: 'Solana链支持需要安装额外的依赖库',
    };
  }

  public async sendTransaction(
    toAddress: string,
    amount: string | number,
    tokenSymbol?: string,
    _wallet?: WalletSigner
  ): Promise<TransactionResult> {
    return {
      transactionHash: '',
      fromAddress: '',
      toAddress,
      amount: amount.toString(),
      symbol: tokenSymbol || 'SOL',
      status: 'error',
      network: this.networkConfig.name,
      error: 'Solana链支持需要安装额外的依赖库',
    };
  }

  public async getTransactionStatus(txHash: string): Promise<TransactionStatus> {
    return {
      transactionHash: txHash,
      status: 'error',
      network: this.networkConfig.name,
      error: 'Solana链支持需要安装额外的依赖库',
    };
  }
}

// Cosmos链接口实现（简化版本）
export class CosmosChainInterface extends MultiChainInterface {
  constructor(networkConfig: NetworkConfig) {
    super(networkConfig);
    console.log(`Cosmos链接口初始化: ${networkConfig.name}`);
  }

  public async getBalance(address: string, _tokenSymbol?: string): Promise<BalanceResult> {
    return {
      address,
      network: this.networkConfig.name,
      balances: {},
      error: 'Cosmos链支持正在开发中',
    };
  }

  public async estimateGasFees(_transaction?: Record<string, any>): Promise<GasEstimate> {
    return {
      network: this.networkConfig.name,
      error: 'Cosmos链支持正在开发中',
    };
  }

  public async sendTransaction(
    toAddress: string,
    amount: string | number,
    tokenSymbol?: string,
    _wallet?: WalletSigner
  ): Promise<TransactionResult> {
    return {
      transactionHash: '',
      fromAddress: '',
      toAddress,
      amount: amount.toString(),
      symbol: tokenSymbol || 'ATOM',
      status: 'error',
      network: this.networkConfig.name,
      error: 'Cosmos链支持正在开发中',
    };
  }

  public async getTransactionStatus(txHash: string): Promise<TransactionStatus> {
    return {
      transactionHash: txHash,
      status: 'error',
      network: this.networkConfig.name,
      error: 'Cosmos链支持正在开发中',
    };
  }
}

// 多链工厂类
export class MultiChainFactory {
  // 链类型映射
  private static readonly CHAIN_TYPE_MAPPING: Record<string, string> = {
    ethereum: 'evm',
    base: 'evm',
    bsc: 'evm',
    polygon: 'evm',
    avalanche: 'evm',
    fantom: 'evm',
    arbitrum: 'evm',
    optimism: 'evm',
    solana: 'solana',
    cosmos: 'cosmos',
    osmosis: 'cosmos',
    terra: 'cosmos',
  };

  public static createChainInterface(networkConfig: NetworkConfig): MultiChainInterface {
    // 根据网络名称判断链类型
    let chainType: string | undefined;
    for (const [chain, chainTypeKey] of Object.entries(this.CHAIN_TYPE_MAPPING)) {
      if (networkConfig.name.toLowerCase().includes(chain.toLowerCase())) {
        chainType = chainTypeKey;
        break;
      }
    }

    // 如果没有匹配，根据chain_id判断
    if (!chainType) {
      const evmChainIds = [1, 56, 137, 43114, 250, 42161, 10, 8453]; // 常见EVM链ID
      if (evmChainIds.includes(networkConfig.chainId)) {
        chainType = 'evm';
      }
    }

    // 创建对应的接口实例
    switch (chainType) {
      case 'evm':
        return new EVMChainInterface(networkConfig);
      case 'solana':
        return new SolanaChainInterface(networkConfig);
      case 'cosmos':
        return new CosmosChainInterface(networkConfig);
      default:
        // 默认使用EVM接口
        console.warn(`未知链类型，使用默认EVM接口: ${networkConfig.name}`);
        return new EVMChainInterface(networkConfig);
    }
  }
}

// 全局多链接口管理器
export class MultiChainManager {
  private chainInterfaces: Map<string, MultiChainInterface> = new Map();

  public getChainInterface(networkId: string): MultiChainInterface {
    // 如果已经创建过，直接返回
    if (this.chainInterfaces.has(networkId)) {
      return this.chainInterfaces.get(networkId)!;
    }

    // 获取网络配置
    const networkConfig = config.getNetwork(networkId);

    // 创建链接口实例
    const chainInterface = MultiChainFactory.createChainInterface(networkConfig);
    this.chainInterfaces.set(networkId, chainInterface);

    return chainInterface;
  }
}

// 全局多链管理器实例
export const multiChainManager = new MultiChainManager();
