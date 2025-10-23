/**
 * 权限控制器 - 智能决定操作权限和钱包选择
 */

export interface PermissionRule {
  operationType: string;
  maxAmount: string;
  requireUserConfirmation: boolean;
  allowedNetworks: string[];
  timeRestrictions?: {
    startHour: number;
    endHour: number;
    timezone: string;
  } | undefined;
}

export interface WalletSelectionResult {
  walletType: 'agent' | 'user' | 'rejected';
  reason: string;
  requiresConfirmation: boolean;
  estimatedGas?: string;
}

export interface OperationContext {
  operationType: 'transfer' | 'defi' | 'contract_call' | 'nft' | 'swap';
  amount: string;
  tokenSymbol: string;
  toAddress: string;
  network: string;
  fromWalletLabel: string | undefined;
  isTrustedAddress: boolean;
  isNewAddress: boolean;
  currentTime: Date;
}

export class PermissionController {
  private rules: PermissionRule[] = [];
  private trustedAddresses: Set<string> = new Set();
  private blacklistedAddresses: Set<string> = new Set();
  private dailyLimits: Map<string, { amount: string; date: string }> = new Map();

  constructor() {
    this.initializeDefaultRules();
  }

  private initializeDefaultRules(): void {
    // 默认权限规则
    this.rules = [
      {
        operationType: 'transfer',
        maxAmount: '0.1', // 0.1 ETH
        requireUserConfirmation: false,
        allowedNetworks: ['base_sepolia', 'ethereum_sepolia'],
        timeRestrictions: {
          startHour: 8,
          endHour: 22,
          timezone: 'Asia/Shanghai'
        }
      },
      {
        operationType: 'defi',
        maxAmount: '0.05', // 0.05 ETH
        requireUserConfirmation: true,
        allowedNetworks: ['base_sepolia', 'ethereum_sepolia']
      },
      {
        operationType: 'contract_call',
        maxAmount: '0.01', // 0.01 ETH
        requireUserConfirmation: true,
        allowedNetworks: ['base_sepolia', 'ethereum_sepolia']
      },
      {
        operationType: 'nft',
        maxAmount: '0.1', // 0.1 ETH
        requireUserConfirmation: true,
        allowedNetworks: ['base_sepolia', 'ethereum_sepolia']
      },
      {
        operationType: 'swap',
        maxAmount: '0.05', // 0.05 ETH
        requireUserConfirmation: true,
        allowedNetworks: ['base_sepolia', 'ethereum_sepolia']
      }
    ];
  }

  /**
   * 检查操作权限并选择钱包
   */
  public checkPermission(context: OperationContext): WalletSelectionResult {
    // 1. 检查黑名单地址
    if (this.blacklistedAddresses.has(context.toAddress.toLowerCase())) {
      return {
        walletType: 'rejected',
        reason: '目标地址在黑名单中',
        requiresConfirmation: false
      };
    }

    // 2. 检查网络支持
    const rule = this.getRuleForOperation(context.operationType);
    if (!rule || !rule.allowedNetworks.includes(context.network)) {
      return {
        walletType: 'rejected',
        reason: `网络 ${context.network} 不支持 ${context.operationType} 操作`,
        requiresConfirmation: false
      };
    }

    // 3. 检查时间限制
    if (rule.timeRestrictions && !this.isWithinTimeWindow(rule.timeRestrictions, context.currentTime)) {
      return {
        walletType: 'user',
        reason: '当前时间不在自动执行窗口内',
        requiresConfirmation: true
      };
    }

    // 4. 检查金额限制
    const amountInEth = this.convertToEth(context.amount, context.tokenSymbol);
    if (this.isAmountExceedsLimit(amountInEth, rule.maxAmount)) {
      return {
        walletType: 'user',
        reason: `金额 ${amountInEth} ETH 超过自动执行限额 ${rule.maxAmount} ETH`,
        requiresConfirmation: true
      };
    }

    // 5. 检查每日限额
    if (this.isDailyLimitExceeded(context.fromWalletLabel || 'default', amountInEth)) {
      return {
        walletType: 'user',
        reason: '已达到每日自动执行限额',
        requiresConfirmation: true
      };
    }

    // 6. 检查是否需要用户确认
    if (rule.requireUserConfirmation) {
      return {
        walletType: 'user',
        reason: `${context.operationType} 操作需要用户确认`,
        requiresConfirmation: true
      };
    }

    // 7. 检查新地址
    if (context.isNewAddress && !context.isTrustedAddress) {
      return {
        walletType: 'user',
        reason: '向新地址转账需要用户确认',
        requiresConfirmation: true
      };
    }

    // 8. 允许自动执行
    return {
      walletType: 'agent',
      reason: '满足自动执行条件',
      requiresConfirmation: false
    };
  }

  /**
   * 获取操作类型的规则
   */
  private getRuleForOperation(operationType: string): PermissionRule | undefined {
    return this.rules.find(rule => rule.operationType === operationType);
  }

  /**
   * 检查是否在时间窗口内
   */
  private isWithinTimeWindow(timeRestrictions: any, currentTime: Date): boolean {
    const hour = currentTime.getHours();
    return hour >= timeRestrictions.startHour && hour <= timeRestrictions.endHour;
  }

  /**
   * 检查金额是否超过限制
   */
  private isAmountExceedsLimit(amount: string, maxAmount: string): boolean {
    return parseFloat(amount) > parseFloat(maxAmount);
  }

  /**
   * 检查每日限额
   */
  private isDailyLimitExceeded(walletLabel: string, amount: string): boolean {
    const today = new Date().toISOString().split('T')[0]!;
    const dailyLimit = this.dailyLimits.get(walletLabel);
    
    if (!dailyLimit || dailyLimit.date !== today) {
      // 重置每日限额
      this.dailyLimits.set(walletLabel, { amount: '0', date: today });
      return false;
    }

    const currentAmount = parseFloat(dailyLimit.amount);
    const newAmount = currentAmount + parseFloat(amount);
    const maxDailyLimit = 1.0; // 每日最大限额 1 ETH

    if (newAmount > maxDailyLimit) {
      return true;
    }

    // 更新每日限额
    this.dailyLimits.set(walletLabel, { amount: newAmount.toString(), date: today });
    return false;
  }

  /**
   * 转换金额到ETH单位
   */
  private convertToEth(amount: string, tokenSymbol: string): string {
    // 简化处理，实际应该根据代币精度转换
    if (tokenSymbol === 'ETH') {
      return amount;
    }
    // 其他代币暂时按1:1处理，实际应该查询汇率
    return amount;
  }

  /**
   * 添加信任地址
   */
  public addTrustedAddress(address: string): void {
    this.trustedAddresses.add(address.toLowerCase());
  }

  /**
   * 移除信任地址
   */
  public removeTrustedAddress(address: string): void {
    this.trustedAddresses.delete(address.toLowerCase());
  }

  /**
   * 添加黑名单地址
   */
  public addBlacklistedAddress(address: string): void {
    this.blacklistedAddresses.add(address.toLowerCase());
  }

  /**
   * 移除黑名单地址
   */
  public removeBlacklistedAddress(address: string): void {
    this.blacklistedAddresses.delete(address.toLowerCase());
  }

  /**
   * 检查地址是否受信任
   */
  public isTrustedAddress(address: string): boolean {
    return this.trustedAddresses.has(address.toLowerCase());
  }

  /**
   * 更新权限规则
   */
  public updateRule(operationType: string, newRule: Partial<PermissionRule>): void {
    const index = this.rules.findIndex(rule => rule.operationType === operationType);
    if (index !== -1) {
      const existingRule = this.rules[index]!;
      this.rules[index] = {
        operationType,
        maxAmount: newRule.maxAmount ?? existingRule.maxAmount,
        requireUserConfirmation: newRule.requireUserConfirmation ?? existingRule.requireUserConfirmation,
        allowedNetworks: newRule.allowedNetworks ?? existingRule.allowedNetworks,
        timeRestrictions: newRule.timeRestrictions ?? existingRule.timeRestrictions
      };
    } else {
      // 创建新规则，使用默认值
      this.rules.push({
        operationType,
        maxAmount: newRule.maxAmount ?? '0.1',
        requireUserConfirmation: newRule.requireUserConfirmation ?? false,
        allowedNetworks: newRule.allowedNetworks ?? ['base_sepolia'],
        timeRestrictions: newRule.timeRestrictions ?? undefined
      });
    }
  }

  /**
   * 获取所有权限规则
   */
  public getAllRules(): PermissionRule[] {
    return [...this.rules];
  }

  /**
   * 获取信任地址列表
   */
  public getTrustedAddresses(): string[] {
    return Array.from(this.trustedAddresses);
  }

  /**
   * 获取黑名单地址列表
   */
  public getBlacklistedAddresses(): string[] {
    return Array.from(this.blacklistedAddresses);
  }

  /**
   * 重置每日限额
   */
  public resetDailyLimits(): void {
    this.dailyLimits.clear();
  }

  /**
   * 获取每日限额使用情况
   */
  public getDailyLimitUsage(walletLabel: string): { used: string; limit: string; remaining: string } {
    const today = new Date().toISOString().split('T')[0]!;
    const dailyLimit = this.dailyLimits.get(walletLabel);
    const used = dailyLimit && dailyLimit.date === today ? dailyLimit.amount : '0';
    const limit = '1.0'; // 每日限额 1 ETH
    const remaining = (parseFloat(limit) - parseFloat(used)).toString();
    
    return { used, limit, remaining };
  }
}
