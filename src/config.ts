/**
 * 区块链配置模块 - TypeScript版本
 */
// 网络配置接口
export interface NetworkConfig {
  name: string;
  chainId: number;
  rpcUrl: string;
  nativeToken: string;
  explorerUrl: string;
  gasPrice: number;
}

// 代币配置接口
export interface TokenConfig {
  symbol: string;
  address: string;
  decimals: number;
  name: string;
}

// Prompt配置接口
export interface PromptConfig {
  templateType: string;
  variables: Record<string, string>;
  customTemplate?: string;
}

export class Config {
  public readonly privateKey: string | undefined;
  public readonly maxTransactionValue: number;
  public readonly debug: boolean;
  public readonly networks: Record<string, NetworkConfig>;
  public readonly tokens: Record<string, TokenConfig>;
  public readonly defaultNetwork: string;
  public readonly promptTemplates: Record<string, any>;

  constructor() {
    // 从环境变量读取私钥
    this.privateKey = process.env['PRIVATE_KEY'];

    // 安全配置
    this.maxTransactionValue = parseFloat(process.env['MAX_TRANSACTION_VALUE'] || '10');
    this.debug = process.env['DEBUG']?.toLowerCase() === 'true';

    // 网络配置 - 使用更可靠的RPC节点
    this.networks = {
      base_sepolia: {
        name: 'Base Sepolia',
        chainId: 84532,
        rpcUrl: 'https://base-sepolia-rpc.publicnode.com',
        nativeToken: 'ETH',
        explorerUrl: 'https://sepolia.basescan.org',
        gasPrice: 1000000000, // 1 Gwei for testnet
      },
      base_mainnet: {
        name: 'Base Mainnet',
        chainId: 8453,
        rpcUrl: 'https://base-rpc.publicnode.com',
        nativeToken: 'ETH',
        explorerUrl: 'https://basescan.org',
        gasPrice: 20000000000, // 20 Gwei
      },
      ethereum_mainnet: {
        name: 'Ethereum Mainnet',
        chainId: 1,
        rpcUrl: 'https://ethereum-rpc.publicnode.com',
        nativeToken: 'ETH',
        explorerUrl: 'https://etherscan.io',
        gasPrice: 20000000000,
      },
      ethereum_sepolia: {
        name: 'Ethereum Sepolia',
        chainId: 11155111,
        rpcUrl: 'https://ethereum-sepolia-rpc.publicnode.com',
        nativeToken: 'ETH',
        explorerUrl: 'https://sepolia.etherscan.io',
        gasPrice: 1000000000, // 1 Gwei for testnet
      },
      // 添加更多主流链的配置
      bsc_mainnet: {
        name: 'Binance Smart Chain',
        chainId: 56,
        rpcUrl: 'https://bsc-rpc.publicnode.com',
        nativeToken: 'BNB',
        explorerUrl: 'https://bscscan.com',
        gasPrice: 5000000000, // 5 Gwei
      },
      bsc_testnet: {
        name: 'BSC Testnet',
        chainId: 97,
        rpcUrl: 'https://bsc-testnet-rpc.publicnode.com',
        nativeToken: 'BNB',
        explorerUrl: 'https://testnet.bscscan.com',
        gasPrice: 1000000000, // 1 Gwei for testnet
      },
      polygon_mainnet: {
        name: 'Polygon Mainnet',
        chainId: 137,
        rpcUrl: 'https://polygon-rpc.com',
        nativeToken: 'MATIC',
        explorerUrl: 'https://polygonscan.com',
        gasPrice: 30000000000, // 30 Gwei
      },
      polygon_amoy: {
        name: 'Polygon Amoy',
        chainId: 80002,
        rpcUrl: 'https://polygon-amoy-rpc.publicnode.com',
        nativeToken: 'MATIC',
        explorerUrl: 'https://amoy.polygonscan.com',
        gasPrice: 1000000000, // 1 Gwei for testnet
      },
      avalanche_mainnet: {
        name: 'Avalanche C-Chain',
        chainId: 43114,
        rpcUrl: 'https://avalanche-c-chain-rpc.publicnode.com',
        nativeToken: 'AVAX',
        explorerUrl: 'https://snowtrace.io',
        gasPrice: 25000000000, // 25 Gwei
      },
      avalanche_fuji: {
        name: 'Avalanche Fuji',
        chainId: 43113,
        rpcUrl: 'https://avalanche-fuji-c-chain-rpc.publicnode.com',
        nativeToken: 'AVAX',
        explorerUrl: 'https://testnet.snowtrace.io',
        gasPrice: 25000000000, // 25 Gwei
      },
      solana_mainnet: {
        name: 'Solana Mainnet',
        chainId: 0, // Solana没有传统意义上的chain_id
        rpcUrl: 'https://solana-rpc.publicnode.com',
        nativeToken: 'SOL',
        explorerUrl: 'https://solscan.io',
        gasPrice: 0,
      },
      solana_devnet: {
        name: 'Solana Devnet',
        chainId: 0, // Solana没有传统意义上的chain_id
        rpcUrl: 'https://solana-devnet-rpc.publicnode.com',
        nativeToken: 'SOL',
        explorerUrl: 'https://solscan.io',
        gasPrice: 0,
      },
    };

    // 代币配置 (支持多链的主流代币)
    this.tokens = {
      USDC: {
        symbol: 'USDC',
        address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // 以太坊主网USDC
        decimals: 6,
        name: 'USD Coin',
      },
      USDC_BASE: {
        symbol: 'USDC_BASE',
        address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // Base主网USDC
        decimals: 6,
        name: 'USD Coin',
      },
      USDC_BSC: {
        symbol: 'USDC_BSC',
        address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', // BSC主网USDC
        decimals: 18,
        name: 'USD Coin',
      },
      USDC_POLYGON: {
        symbol: 'USDC_POLYGON',
        address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', // Polygon主网USDC
        decimals: 6,
        name: 'USD Coin',
      },
      DAI: {
        symbol: 'DAI',
        address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', // 以太坊主网DAI
        decimals: 18,
        name: 'Dai Stablecoin',
      },
      DAI_BASE: {
        symbol: 'DAI_BASE',
        address: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb', // Base主网DAI
        decimals: 18,
        name: 'Dai Stablecoin',
      },
      DAI_BSC: {
        symbol: 'DAI_BSC',
        address: '0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3', // BSC主网DAI
        decimals: 18,
        name: 'Dai Stablecoin',
      },
      DAI_POLYGON: {
        symbol: 'DAI_POLYGON',
        address: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063', // Polygon主网DAI
        decimals: 18,
        name: 'Dai Stablecoin',
      },
      WETH: {
        symbol: 'WETH',
        address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // 以太坊主网WETH
        decimals: 18,
        name: 'Wrapped Ether',
      },
      WETH_BASE: {
        symbol: 'WETH_BASE',
        address: '0x4200000000000000000000000000000000000006', // Base主网WETH
        decimals: 18,
        name: 'Wrapped Ether',
      },
    };

    // 默认网络
    this.defaultNetwork = process.env['DEFAULT_NETWORK'] || 'ethereum_mainnet';

    // Prompt配置
    this.promptTemplates = {
      balance_query: {
        description: '余额查询prompt模板',
        default_variables: ['address', 'network', 'token_symbol'],
      },
      transaction_send: {
        description: '交易发送prompt模板',
        default_variables: ['from_address', 'to_address', 'amount', 'token_symbol', 'network'],
      },
      wallet_management: {
        description: '钱包管理prompt模板',
        default_variables: ['wallet_count', 'current_wallet'],
      },
      network_info: {
        description: '网络信息prompt模板',
        default_variables: ['network', 'chain_id', 'rpc_url', 'explorer_url', 'native_token'],
      },
    };
  }

  public getNetwork(networkId?: string): NetworkConfig {
    const id = networkId || this.defaultNetwork;

    if (!(id in this.networks)) {
      throw new Error(`未知网络: ${id}. 可用网络: ${Object.keys(this.networks).join(', ')}`);
    }

    const network = this.networks[id];
    if (!network) {
      throw new Error(`网络配置未找到: ${id}`);
    }

    return network;
  }

  public getToken(symbol: string): TokenConfig | undefined {
    return this.tokens[symbol.toUpperCase()];
  }

  public addToken(tokenConfig: TokenConfig): void {
    this.tokens[tokenConfig.symbol.toUpperCase()] = tokenConfig;
  }

  public getSupportedNetworks(): string[] {
    return Object.keys(this.networks);
  }

  public getSupportedTokens(): string[] {
    return Object.keys(this.tokens);
  }

  public getPromptTemplate(templateType: string): any {
    return this.promptTemplates[templateType];
  }

  public getAvailablePromptTemplates(): string[] {
    return Object.keys(this.promptTemplates);
  }
}

// 全局配置实例
export const config = new Config();
