/**
 * 区块链交互层 - TypeScript版本
 */
import { config } from './config.js';
import type { NetworkConfig } from './config.js';
import { WalletSigner } from './wallet.js';
import { multiChainManager, MultiChainInterface } from './multi-chain.js';

export class BlockchainInterface {
  private networkConfig: NetworkConfig;
  private chainInterface: MultiChainInterface;

  constructor(networkId?: string) {
    this.networkConfig = config.getNetwork(networkId);
    // 使用多链管理器获取对应的链接口实例
    this.chainInterface = multiChainManager.getChainInterface(networkId || config.defaultNetwork);
  }

  public getNetworkConfig(): NetworkConfig {
    return this.networkConfig;
  }

  public async getBalance(address: string, tokenSymbol?: string): Promise<Record<string, any>> {
    try {
      return await this.chainInterface.getBalance(address, tokenSymbol);
    } catch (error) {
      console.error(`获取余额失败: ${error}`);
      return { error: String(error), address };
    }
  }

  public async estimateGasFees(transaction?: Record<string, any>): Promise<Record<string, any>> {
    try {
      return await this.chainInterface.estimateGasFees(transaction);
    } catch (error) {
      console.error(`估算Gas费用失败: ${error}`);
      return { error: String(error) };
    }
  }

  public async sendTransaction(
    toAddress: string,
    amount: string | number,
    tokenSymbol?: string,
    wallet?: WalletSigner
  ): Promise<Record<string, any>> {
    try {
      return await this.chainInterface.sendTransaction(toAddress, amount, tokenSymbol, wallet);
    } catch (error) {
      console.error(`发送交易失败: ${error}`);
      return { error: String(error) };
    }
  }

  public async getTransactionStatus(txHash: string): Promise<Record<string, any>> {
    try {
      return await this.chainInterface.getTransactionStatus(txHash);
    } catch (error) {
      console.error(`获取交易状态失败: ${error}`);
      return { error: String(error), transaction_hash: txHash };
    }
  }
}
