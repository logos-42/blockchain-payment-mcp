/**
 * 智能钱包管理器 - 管理双钱包架构
 */

import { WalletSigner, WalletManager } from './wallet.js';
import { WalletConnectorManager, WalletType } from './wallet-connectors.js';
import type { ConnectionStatus } from './wallet-connectors.js';
import { PermissionController } from './permission-controller.js';
import type { OperationContext, WalletSelectionResult } from './permission-controller.js';

// 钱包类型枚举
export enum SmartWalletType {
  AGENT = 'agent',      // 智能体钱包
  USER = 'user',        // 用户钱包（MetaMask等）
  EXTERNAL = 'external' // 外部钱包
}

// 智能钱包信息接口
export interface SmartWalletInfo {
  type: SmartWalletType;
  label: string;
  address: string;
  isConnected: boolean;
  walletType: WalletType | undefined;
  balance?: string;
  isCurrent: boolean;
}

// 操作结果接口
export interface OperationResult {
  success: boolean;
  walletType: SmartWalletType;
  transactionHash?: string;
  error?: string;
  message: string;
  requiresUserConfirmation?: boolean;
}

// 智能钱包管理器类
export class SmartWalletManager {
  private agentWalletManager: WalletManager;
  private walletConnectorManager: WalletConnectorManager;
  private permissionController: PermissionController;
  private currentUserWallet: string | null = null;

  constructor() {
    this.agentWalletManager = new WalletManager();
    this.walletConnectorManager = new WalletConnectorManager();
    this.permissionController = new PermissionController();
  }

  /**
   * 创建智能体钱包
   */
  public createAgentWallet(label: string = 'agent_wallet'): SmartWalletInfo {
    const wallet = new WalletSigner();
    const walletInfo = wallet.createAccount();
    
    // 添加到智能体钱包管理器
    this.agentWalletManager.addWallet(label, walletInfo.privateKey);
    this.agentWalletManager.setCurrentWallet(label);

    return {
      type: SmartWalletType.AGENT,
      label,
      address: walletInfo.address,
      isConnected: true,
      walletType: undefined,
      isCurrent: true
    };
  }

  /**
   * 连接用户钱包
   */
  public async connectUserWallet(walletType: WalletType, label: string = 'user_wallet'): Promise<SmartWalletInfo> {
    const connectionStatus = await this.walletConnectorManager.connectWallet(walletType);
    
    if (!connectionStatus.isConnected || !connectionStatus.address) {
      throw new Error(`连接${walletType}钱包失败: ${connectionStatus.error || '未知错误'}`);
    }

    this.currentUserWallet = label;

    return {
      type: SmartWalletType.USER,
      label,
      address: connectionStatus.address,
      isConnected: true,
      walletType,
      isCurrent: true
    };
  }

  /**
   * 断开用户钱包
   */
  public async disconnectUserWallet(): Promise<void> {
    await this.walletConnectorManager.disconnectWallet();
    this.currentUserWallet = null;
  }

  /**
   * 智能选择钱包执行操作
   */
  public async executeOperation(
    operationType: 'transfer' | 'defi' | 'contract_call' | 'nft' | 'swap',
    toAddress: string,
    amount: string,
    tokenSymbol: string = 'ETH',
    network: string = 'base_sepolia',
    fromWalletLabel?: string
  ): Promise<OperationResult> {
    
    // 构建操作上下文
    const context: OperationContext = {
      operationType,
      amount,
      tokenSymbol,
      toAddress,
      network,
      fromWalletLabel,
      isTrustedAddress: this.permissionController.isTrustedAddress(toAddress),
      isNewAddress: !this.permissionController.isTrustedAddress(toAddress),
      currentTime: new Date()
    };

    // 检查权限并选择钱包
    const selection = this.permissionController.checkPermission(context);

    switch (selection.walletType) {
      case 'agent':
        return await this.executeWithAgentWallet(context);
      
      case 'user':
        return await this.executeWithUserWallet(context, selection);
      
      case 'rejected':
        return {
          success: false,
          walletType: SmartWalletType.AGENT,
          error: selection.reason,
          message: `操作被拒绝: ${selection.reason}`
        };
      
      default:
        return {
          success: false,
          walletType: SmartWalletType.AGENT,
          error: '未知的钱包选择结果',
          message: '无法确定使用哪个钱包执行操作'
        };
    }
  }

  /**
   * 使用智能体钱包执行操作
   */
  private async executeWithAgentWallet(context: OperationContext): Promise<OperationResult> {
    try {
      const agentWallet = this.agentWalletManager.getCurrentWallet();
      if (!agentWallet || !agentWallet.hasPrivateKey()) {
        return {
          success: false,
          walletType: SmartWalletType.AGENT,
          error: '智能体钱包未设置或无效',
          message: '请先创建智能体钱包'
        };
      }

      // 这里应该调用实际的区块链操作
      // 暂时模拟交易哈希
      const transactionHash = '0x' + Math.random().toString(16).substr(2, 64);

      return {
        success: true,
        walletType: SmartWalletType.AGENT,
        transactionHash,
        message: `智能体钱包自动执行${context.operationType}操作成功`
      };

    } catch (error) {
      return {
        success: false,
        walletType: SmartWalletType.AGENT,
        error: String(error),
        message: `智能体钱包执行操作失败: ${error}`
      };
    }
  }

  /**
   * 使用用户钱包执行操作
   */
  private async executeWithUserWallet(context: OperationContext, selection: WalletSelectionResult): Promise<OperationResult> {
    try {
      const userConnector = this.walletConnectorManager.getCurrentConnector();
      if (!userConnector) {
        return {
          success: false,
          walletType: SmartWalletType.USER,
          error: '用户钱包未连接',
          message: '请先连接用户钱包',
          requiresUserConfirmation: true
        };
      }

      // 构建交易参数
      const transaction = {
        to: context.toAddress,
        value: context.amount,
        data: '0x'
      };

      // 发送交易（需要用户确认）
      const transactionHash = await userConnector.sendTransaction(transaction);

      return {
        success: true,
        walletType: SmartWalletType.USER,
        transactionHash,
        message: `用户钱包执行${context.operationType}操作成功`,
        requiresUserConfirmation: selection.requiresConfirmation
      };

    } catch (error) {
      return {
        success: false,
        walletType: SmartWalletType.USER,
        error: String(error),
        message: `用户钱包执行操作失败: ${error}`,
        requiresUserConfirmation: true
      };
    }
  }

  /**
   * 获取所有钱包信息
   */
  public getAllWallets(): SmartWalletInfo[] {
    const wallets: SmartWalletInfo[] = [];

    // 获取智能体钱包
    const agentWallets = this.agentWalletManager.listWallets();
    agentWallets.forEach(wallet => {
      wallets.push({
        type: SmartWalletType.AGENT,
        label: wallet.label,
        address: wallet.address,
        isConnected: true,
        walletType: undefined,
        isCurrent: wallet.isCurrent
      });
    });

    // 获取用户钱包
    const userConnectionStatus = this.walletConnectorManager.getCurrentConnectionStatus();
    if (userConnectionStatus.isConnected && userConnectionStatus.address) {
      wallets.push({
        type: SmartWalletType.USER,
        label: this.currentUserWallet || 'user_wallet',
        address: userConnectionStatus.address,
        isConnected: true,
        walletType: userConnectionStatus.walletType || undefined,
        isCurrent: true
      });
    }

    return wallets;
  }

  /**
   * 获取当前活跃的钱包
   */
  public getCurrentWallet(): SmartWalletInfo | null {
    const wallets = this.getAllWallets();
    return wallets.find(wallet => wallet.isCurrent) || null;
  }

  /**
   * 切换智能体钱包
   */
  public switchAgentWallet(label: string): boolean {
    return this.agentWalletManager.setCurrentWallet(label);
  }

  /**
   * 添加信任地址
   */
  public addTrustedAddress(address: string): void {
    this.permissionController.addTrustedAddress(address);
  }

  /**
   * 移除信任地址
   */
  public removeTrustedAddress(address: string): void {
    this.permissionController.removeTrustedAddress(address);
  }

  /**
   * 获取信任地址列表
   */
  public getTrustedAddresses(): string[] {
    return this.permissionController.getTrustedAddresses();
  }

  /**
   * 更新权限规则
   */
  public updatePermissionRule(operationType: string, rule: any): void {
    this.permissionController.updateRule(operationType, rule);
  }

  /**
   * 获取所有权限规则
   */
  public getPermissionRules(): any[] {
    return this.permissionController.getAllRules();
  }

  /**
   * 获取每日限额使用情况
   */
  public getDailyLimitUsage(walletLabel: string): { used: string; limit: string; remaining: string } {
    return this.permissionController.getDailyLimitUsage(walletLabel);
  }

  /**
   * 重置每日限额
   */
  public resetDailyLimits(): void {
    this.permissionController.resetDailyLimits();
  }

  /**
   * 获取支持的钱包类型
   */
  public getSupportedWalletTypes(): WalletType[] {
    return this.walletConnectorManager.getSupportedWalletTypes();
  }

  /**
   * 检查钱包是否已安装
   */
  public isWalletInstalled(walletType: WalletType): boolean {
    return this.walletConnectorManager.isWalletInstalled(walletType);
  }

  /**
   * 获取钱包连接说明
   */
  public getWalletConnectionInstructions(walletType: WalletType): any {
    const connector = this.walletConnectorManager.getConnector(walletType);
    return connector?.getConnectionInstructions();
  }

  /**
   * 获取当前连接状态
   */
  public getConnectionStatus(): ConnectionStatus {
    return this.walletConnectorManager.getCurrentConnectionStatus();
  }

  /**
   * 获取智能体钱包管理器
   */
  public getAgentWalletManager(): WalletManager {
    return this.agentWalletManager;
  }

  /**
   * 获取钱包连接器管理器
   */
  public getWalletConnectorManager(): WalletConnectorManager {
    return this.walletConnectorManager;
  }

  /**
   * 获取权限控制器
   */
  public getPermissionController(): PermissionController {
    return this.permissionController;
  }
}
