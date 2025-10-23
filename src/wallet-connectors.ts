/**
 * 钱包连接器模块 - 支持多种钱包连接
 */

import type { WalletConnector, ConnectionInstructions } from './wallet.js';

// 钱包类型枚举
export enum WalletType {
  METAMASK = 'metamask',
  OKX = 'okx',
  COINBASE = 'coinbase',
  TRUST = 'trust',
  PHANTOM = 'phantom',
  RAINBOW = 'rainbow',
  WALLETCONNECT = 'walletconnect'
}

// 连接状态接口
export interface ConnectionStatus {
  isConnected: boolean;
  walletType: WalletType | null;
  address: string | null;
  chainId: number | null;
  error?: string;
}

// 钱包连接器基类
export abstract class BaseWalletConnector implements WalletConnector {
  protected connectedAccount: string | null = null;
  protected chainId: number | null = null;
  protected isConnected: boolean = false;

  abstract getConnectionInstructions(): ConnectionInstructions;
  abstract connect(): Promise<ConnectionStatus>;
  abstract disconnect(): Promise<void>;
  abstract sendTransaction(transaction: any): Promise<string>;

  public setConnectedAccount(account: string): void {
    this.connectedAccount = account;
    this.isConnected = true;
  }

  public getConnectedAccount(): string | null {
    return this.connectedAccount;
  }

  public getConnectionStatus(): ConnectionStatus {
    return {
      isConnected: this.isConnected,
      walletType: this.getWalletType(),
      address: this.connectedAccount,
      chainId: this.chainId
    };
  }

  protected abstract getWalletType(): WalletType;
}

// MetaMask连接器
export class MetaMaskConnector extends BaseWalletConnector {
  protected getWalletType(): WalletType {
    return WalletType.METAMASK;
  }

  public getConnectionInstructions(): ConnectionInstructions {
    return {
      type: 'metamask_connection',
      instructions: [
        '1. 确保已安装MetaMask浏览器插件',
        '2. 在浏览器中打开应用页面',
        '3. 点击"连接MetaMask"按钮',
        '4. 在MetaMask中确认连接请求',
        '5. 选择要使用的账户',
        '6. 确认网络切换（如需要）'
      ],
      javascriptCode: `
// MetaMask连接代码
async function connectMetaMask() {
    if (typeof window.ethereum !== 'undefined') {
        try {
            // 请求连接
            const accounts = await window.ethereum.request({ 
                method: 'eth_requestAccounts' 
            });
            
            // 获取链ID
            const chainId = await window.ethereum.request({ 
                method: 'eth_chainId' 
            });
            
            console.log('连接的账户:', accounts[0]);
            console.log('链ID:', chainId);
            
            return {
                address: accounts[0],
                chainId: parseInt(chainId, 16)
            };
        } catch (error) {
            console.error('MetaMask连接失败:', error);
            throw error;
        }
    } else {
        throw new Error('请安装MetaMask浏览器插件');
    }
}

// 发送交易
async function sendMetaMaskTransaction(to, value, data = '0x') {
    const txParams = {
        to: to,
        value: '0x' + (parseFloat(value) * 1e18).toString(16),
        data: data,
        gasLimit: '0x5208',
    };
    
    const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [txParams],
    });
    
    return txHash;
}

// 监听账户变化
window.ethereum.on('accountsChanged', (accounts) => {
    console.log('账户变化:', accounts);
});

// 监听网络变化
window.ethereum.on('chainChanged', (chainId) => {
    console.log('网络变化:', chainId);
    window.location.reload();
});
      `,
      warning: 'MetaMask集成需要在浏览器环境中运行'
    };
  }

  public async connect(): Promise<ConnectionStatus> {
    // 在实际应用中，这里会调用浏览器的ethereum API
    // 这里只是模拟连接过程
    return {
      isConnected: true,
      walletType: WalletType.METAMASK,
      address: this.connectedAccount,
      chainId: this.chainId
    };
  }

  public async disconnect(): Promise<void> {
    this.connectedAccount = null;
    this.chainId = null;
    this.isConnected = false;
  }

  public async sendTransaction(_transaction: any): Promise<string> {
    if (!this.isConnected) {
      throw new Error('钱包未连接');
    }
    // 在实际应用中，这里会调用MetaMask的发送交易API
    return '0x' + Math.random().toString(16).substr(2, 64);
  }
}

// OKX钱包连接器
export class OKXConnector extends BaseWalletConnector {
  protected getWalletType(): WalletType {
    return WalletType.OKX;
  }

  public getConnectionInstructions(): ConnectionInstructions {
    return {
      type: 'okx_connection',
      instructions: [
        '1. 确保已安装OKX钱包浏览器插件',
        '2. 在浏览器中打开应用页面',
        '3. 点击"连接OKX钱包"按钮',
        '4. 在OKX钱包中确认连接请求',
        '5. 选择要使用的账户',
        '6. 确认网络切换（如需要）'
      ],
      javascriptCode: `
// OKX钱包连接代码
async function connectOKX() {
    if (typeof window.okxwallet !== 'undefined') {
        try {
            // 请求连接
            const accounts = await window.okxwallet.request({ 
                method: 'eth_requestAccounts' 
            });
            
            // 获取链ID
            const chainId = await window.okxwallet.request({ 
                method: 'eth_chainId' 
            });
            
            console.log('连接的账户:', accounts[0]);
            console.log('链ID:', chainId);
            
            return {
                address: accounts[0],
                chainId: parseInt(chainId, 16)
            };
        } catch (error) {
            console.error('OKX钱包连接失败:', error);
            throw error;
        }
    } else {
        throw new Error('请安装OKX钱包浏览器插件');
    }
}

// 发送交易
async function sendOKXTransaction(to, value, data = '0x') {
    const txParams = {
        to: to,
        value: '0x' + (parseFloat(value) * 1e18).toString(16),
        data: data,
        gasLimit: '0x5208',
    };
    
    const txHash = await window.okxwallet.request({
        method: 'eth_sendTransaction',
        params: [txParams],
    });
    
    return txHash;
}
      `,
      warning: 'OKX钱包集成需要在浏览器环境中运行'
    };
  }

  public async connect(): Promise<ConnectionStatus> {
    return {
      isConnected: true,
      walletType: WalletType.OKX,
      address: this.connectedAccount,
      chainId: this.chainId
    };
  }

  public async disconnect(): Promise<void> {
    this.connectedAccount = null;
    this.chainId = null;
    this.isConnected = false;
  }

  public async sendTransaction(_transaction: any): Promise<string> {
    if (!this.isConnected) {
      throw new Error('钱包未连接');
    }
    return '0x' + Math.random().toString(16).substr(2, 64);
  }
}

// Coinbase钱包连接器
export class CoinbaseConnector extends BaseWalletConnector {
  protected getWalletType(): WalletType {
    return WalletType.COINBASE;
  }

  public getConnectionInstructions(): ConnectionInstructions {
    return {
      type: 'coinbase_connection',
      instructions: [
        '1. 确保已安装Coinbase钱包浏览器插件',
        '2. 在浏览器中打开应用页面',
        '3. 点击"连接Coinbase钱包"按钮',
        '4. 在Coinbase钱包中确认连接请求',
        '5. 选择要使用的账户'
      ],
      javascriptCode: `
// Coinbase钱包连接代码
async function connectCoinbase() {
    if (typeof window.coinbaseWalletExtension !== 'undefined') {
        try {
            const accounts = await window.coinbaseWalletExtension.request({ 
                method: 'eth_requestAccounts' 
            });
            
            return {
                address: accounts[0],
                chainId: 1 // 默认以太坊主网
            };
        } catch (error) {
            console.error('Coinbase钱包连接失败:', error);
            throw error;
        }
    } else {
        throw new Error('请安装Coinbase钱包浏览器插件');
    }
}
      `,
      warning: 'Coinbase钱包集成需要在浏览器环境中运行'
    };
  }

  public async connect(): Promise<ConnectionStatus> {
    return {
      isConnected: true,
      walletType: WalletType.COINBASE,
      address: this.connectedAccount,
      chainId: this.chainId
    };
  }

  public async disconnect(): Promise<void> {
    this.connectedAccount = null;
    this.chainId = null;
    this.isConnected = false;
  }

  public async sendTransaction(_transaction: any): Promise<string> {
    if (!this.isConnected) {
      throw new Error('钱包未连接');
    }
    return '0x' + Math.random().toString(16).substr(2, 64);
  }
}

// Trust钱包连接器
export class TrustConnector extends BaseWalletConnector {
  protected getWalletType(): WalletType {
    return WalletType.TRUST;
  }

  public getConnectionInstructions(): ConnectionInstructions {
    return {
      type: 'trust_connection',
      instructions: [
        '1. 确保已安装Trust钱包浏览器插件',
        '2. 在浏览器中打开应用页面',
        '3. 点击"连接Trust钱包"按钮',
        '4. 在Trust钱包中确认连接请求',
        '5. 选择要使用的账户'
      ],
      javascriptCode: `
// Trust钱包连接代码
async function connectTrust() {
    if (typeof window.trustwallet !== 'undefined') {
        try {
            const accounts = await window.trustwallet.request({ 
                method: 'eth_requestAccounts' 
            });
            
            return {
                address: accounts[0],
                chainId: 1
            };
        } catch (error) {
            console.error('Trust钱包连接失败:', error);
            throw error;
        }
    } else {
        throw new Error('请安装Trust钱包浏览器插件');
    }
}
      `,
      warning: 'Trust钱包集成需要在浏览器环境中运行'
    };
  }

  public async connect(): Promise<ConnectionStatus> {
    return {
      isConnected: true,
      walletType: WalletType.TRUST,
      address: this.connectedAccount,
      chainId: this.chainId
    };
  }

  public async disconnect(): Promise<void> {
    this.connectedAccount = null;
    this.chainId = null;
    this.isConnected = false;
  }

  public async sendTransaction(_transaction: any): Promise<string> {
    if (!this.isConnected) {
      throw new Error('钱包未连接');
    }
    return '0x' + Math.random().toString(16).substr(2, 64);
  }
}

// Phantom钱包连接器（Solana）
export class PhantomConnector extends BaseWalletConnector {
  protected getWalletType(): WalletType {
    return WalletType.PHANTOM;
  }

  public getConnectionInstructions(): ConnectionInstructions {
    return {
      type: 'phantom_connection',
      instructions: [
        '1. 确保已安装Phantom钱包浏览器插件',
        '2. 在浏览器中打开应用页面',
        '3. 点击"连接Phantom钱包"按钮',
        '4. 在Phantom钱包中确认连接请求',
        '5. 选择要使用的账户'
      ],
      javascriptCode: `
// Phantom钱包连接代码（Solana）
async function connectPhantom() {
    if (typeof window.solana !== 'undefined' && window.solana.isPhantom) {
        try {
            const response = await window.solana.connect();
            
            return {
                address: response.publicKey.toString(),
                chainId: 0 // Solana没有传统意义上的chain_id
            };
        } catch (error) {
            console.error('Phantom钱包连接失败:', error);
            throw error;
        }
    } else {
        throw new Error('请安装Phantom钱包浏览器插件');
    }
}

// 发送Solana交易
async function sendPhantomTransaction(to, amount) {
    const transaction = new Transaction().add(
        SystemProgram.transfer({
            fromPubkey: window.solana.publicKey,
            toPubkey: new PublicKey(to),
            lamports: amount * 1e9 // SOL to lamports
        })
    );
    
    const signature = await window.solana.signAndSendTransaction(transaction);
    return signature;
}
      `,
      warning: 'Phantom钱包集成需要在浏览器环境中运行，主要用于Solana网络'
    };
  }

  public async connect(): Promise<ConnectionStatus> {
    return {
      isConnected: true,
      walletType: WalletType.PHANTOM,
      address: this.connectedAccount,
      chainId: 0 // Solana
    };
  }

  public async disconnect(): Promise<void> {
    this.connectedAccount = null;
    this.chainId = null;
    this.isConnected = false;
  }

  public async sendTransaction(_transaction: any): Promise<string> {
    if (!this.isConnected) {
      throw new Error('钱包未连接');
    }
    return '0x' + Math.random().toString(16).substr(2, 64);
  }
}

// 钱包连接器管理器
export class WalletConnectorManager {
  private connectors: Map<WalletType, BaseWalletConnector> = new Map();
  private currentConnector: BaseWalletConnector | null = null;

  constructor() {
    this.initializeConnectors();
  }

  private initializeConnectors(): void {
    this.connectors.set(WalletType.METAMASK, new MetaMaskConnector());
    this.connectors.set(WalletType.OKX, new OKXConnector());
    this.connectors.set(WalletType.COINBASE, new CoinbaseConnector());
    this.connectors.set(WalletType.TRUST, new TrustConnector());
    this.connectors.set(WalletType.PHANTOM, new PhantomConnector());
  }

  /**
   * 获取指定类型的连接器
   */
  public getConnector(walletType: WalletType): BaseWalletConnector | undefined {
    return this.connectors.get(walletType);
  }

  /**
   * 获取所有可用的连接器
   */
  public getAllConnectors(): Map<WalletType, BaseWalletConnector> {
    return new Map(this.connectors);
  }

  /**
   * 连接指定类型的钱包
   */
  public async connectWallet(walletType: WalletType): Promise<ConnectionStatus> {
    const connector = this.connectors.get(walletType);
    if (!connector) {
      throw new Error(`不支持的钱包类型: ${walletType}`);
    }

    const status = await connector.connect();
    if (status.isConnected) {
      this.currentConnector = connector;
    }

    return status;
  }

  /**
   * 断开当前连接的钱包
   */
  public async disconnectWallet(): Promise<void> {
    if (this.currentConnector) {
      await this.currentConnector.disconnect();
      this.currentConnector = null;
    }
  }

  /**
   * 获取当前连接的钱包
   */
  public getCurrentConnector(): BaseWalletConnector | null {
    return this.currentConnector;
  }

  /**
   * 获取当前连接状态
   */
  public getCurrentConnectionStatus(): ConnectionStatus {
    if (this.currentConnector) {
      return this.currentConnector.getConnectionStatus();
    }
    return {
      isConnected: false,
      walletType: null,
      address: null,
      chainId: null
    };
  }

  /**
   * 获取支持的钱包类型列表
   */
  public getSupportedWalletTypes(): WalletType[] {
    return Array.from(this.connectors.keys());
  }

  /**
   * 检查钱包是否已安装
   */
  public isWalletInstalled(_walletType: WalletType): boolean {
    // 在实际应用中，这里会检查浏览器中是否安装了对应的钱包插件
    // 这里只是模拟返回true
    return true;
  }
}
