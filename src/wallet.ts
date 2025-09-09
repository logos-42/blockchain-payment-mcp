/**
 * 钱包和签名器模块 - TypeScript版本
 */
import { ethers } from 'ethers';

// 钱包接口
export interface WalletInfo {
  address: string;
  privateKey: string;
  warning?: string;
}

// 钱包连接器接口
export interface WalletConnector {
  getConnectionInstructions(): ConnectionInstructions;
  setConnectedAccount(account: string): void;
  getConnectedAccount(): string | null;
}

// 连接说明接口
export interface ConnectionInstructions {
  type: string;
  instructions: string[];
  javascriptCode?: string;
  warning?: string;
}

// 私钥验证正则表达式
const PRIVATE_KEY_REGEX = /^0x[a-fA-F0-9]{64}$/;

// 地址验证正则表达式
const ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/i;

export class WalletSigner {
  private readonly privateKey: string | undefined;
  private readonly wallet: ethers.Wallet | undefined;

  constructor(privateKey?: string) {
    this.privateKey = privateKey;

    if (this.privateKey) {
      try {
        this.wallet = new ethers.Wallet(this.privateKey);
        console.log(`钱包初始化成功，地址: ${this.wallet.address}`);
      } catch (error) {
        console.error(`私钥无效: ${error}`);
        this.wallet = undefined;
      }
    }
  }

  public get address(): string | null {
    return this.wallet?.address ?? null;
  }

  public hasPrivateKey(): boolean {
    return this.wallet !== undefined;
  }

  public getPrivateKey(): string | undefined {
    return this.privateKey;
  }

  public signTransaction(transaction: ethers.TransactionRequest): Promise<string> {
    if (!this.wallet) {
      throw new Error('没有可用的私钥进行签名');
    }

    return this.wallet.signTransaction(transaction);
  }

  public createAccount(): WalletInfo {
    const newWallet = ethers.Wallet.createRandom();
    return {
      address: newWallet.address,
      privateKey: newWallet.privateKey,
      warning: '请安全保存私钥，丢失将无法找回资产！',
    };
  }

  public static validateAddress(address: string): boolean {
    try {
      return ADDRESS_REGEX.test(address) && ethers.isAddress(address);
    } catch {
      return false;
    }
  }

  public static validatePrivateKey(privateKey: string): boolean {
    try {
      return PRIVATE_KEY_REGEX.test(privateKey) && !!new ethers.Wallet(privateKey);
    } catch {
      return false;
    }
  }
}

export class MetaMaskConnector implements WalletConnector {
  private connectedAccount: string | null = null;

  public getConnectionInstructions(): ConnectionInstructions {
    return {
      type: 'metamask_connection',
      instructions: [
        '1. 确保已安装MetaMask浏览器插件',
        '2. 在浏览器中打开应用页面',
        '3. 点击"连接钱包"按钮',
        '4. 在MetaMask中确认连接请求',
        '5. 选择要使用的账户',
      ],
      javascriptCode: `
// 连接MetaMask的JavaScript代码示例
async function connectWallet() {
    if (typeof window.ethereum !== 'undefined') {
        try {
            const accounts = await window.ethereum.request({ 
                method: 'eth_requestAccounts' 
            });
            console.log('连接的账户:', accounts[0]);
            return accounts[0];
        } catch (error) {
            console.error('连接失败:', error);
        }
    } else {
        alert('请安装MetaMask!');
    }
}

// 发送交易
async function sendTransaction(to, value, data = '0x') {
    const txParams = {
        to: to,
        value: ethers.utils.hexlify(ethers.utils.parseEther(value)),
        data: data,
        gasLimit: '0x5208',
    };
    
    const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [txParams],
    });
    
    return txHash;
}
      `,
      warning: 'MetaMask集成需要在浏览器环境中运行',
    };
  }

  public setConnectedAccount(account: string): void {
    if (WalletSigner.validateAddress(account)) {
      this.connectedAccount = account;
    } else {
      throw new Error('无效的账户地址');
    }
  }

  public getConnectedAccount(): string | null {
    return this.connectedAccount ?? null;
  }
}

// 钱包管理器类
export class WalletManager {
  private wallets: Map<string, WalletSigner> = new Map();
  private currentWalletLabel: string | null = null;

  public addWallet(label: string, privateKey: string): boolean {
    if (WalletSigner.validatePrivateKey(privateKey)) {
      this.wallets.set(label, new WalletSigner(privateKey));
      // 如果这是第一个钱包，设置为当前钱包
      if (this.currentWalletLabel === null) {
        this.currentWalletLabel = label;
      }
      return true;
    }
    return false;
  }

  public setCurrentWallet(label: string): boolean {
    if (this.wallets.has(label)) {
      this.currentWalletLabel = label;
      return true;
    }
    return false;
  }

  public getCurrentWallet(): WalletSigner | null {
    if (this.currentWalletLabel && this.wallets.has(this.currentWalletLabel)) {
      return this.wallets.get(this.currentWalletLabel) || null;
    }
    return null;
  }

  public getWallet(label: string): WalletSigner | null {
    return this.wallets.get(label) || null;
  }

  public removeWallet(label: string): boolean {
    if (this.wallets.has(label)) {
      this.wallets.delete(label);
      // 如果删除的是当前钱包，重置当前钱包
      if (this.currentWalletLabel === label) {
        this.currentWalletLabel = this.wallets.size > 0 ? Array.from(this.wallets.keys())[0] ?? null : null;
      }
      return true;
    }
    return false;
  }

  public listWallets(): Array<{ label: string; address: string; isCurrent: boolean }> {
    const result: Array<{ label: string; address: string; isCurrent: boolean }> = [];
    for (const [label, wallet] of this.wallets) {
      result.push({
        label,
        address: wallet.address || '',
        isCurrent: label === this.currentWalletLabel,
      });
    }
    return result;
  }
}
