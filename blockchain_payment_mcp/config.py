"""
区块链配置模块
"""
import os
from typing import Dict, Optional
from dataclasses import dataclass
from decimal import Decimal

@dataclass
class NetworkConfig:
    """网络配置"""
    name: str
    chain_id: int
    rpc_url: str
    native_token: str
    explorer_url: str
    gas_price: int = 20000000000  # 20 Gwei

@dataclass 
class TokenConfig:
    """代币配置"""
    symbol: str
    address: str
    decimals: int
    name: str

@dataclass
class PromptConfig:
    """Prompt配置"""
    template_type: str
    variables: Dict[str, str]
    custom_template: Optional[str] = None

class Config:
    """主配置类"""
    
    def __init__(self):
        # 从环境变量读取私钥
        self.private_key = os.getenv("PRIVATE_KEY")
        
        # 安全配置
        self.max_transaction_value = Decimal(os.getenv("MAX_TRANSACTION_VALUE", "10"))
        self.debug = os.getenv("DEBUG", "false").lower() == "true"
        
        # 网络配置 - 使用更可靠的RPC节点
        self.networks = {
            "base_sepolia": NetworkConfig(
                name="Base Sepolia",
                chain_id=84532,
                rpc_url="https://base-sepolia-rpc.publicnode.com",
                native_token="ETH",
                explorer_url="https://sepolia.basescan.org",
                gas_price=1000000000  # 1 Gwei for testnet
            ),
            "base_mainnet": NetworkConfig(
                name="Base Mainnet", 
                chain_id=8453,
                rpc_url="https://base-rpc.publicnode.com",
                native_token="ETH",
                explorer_url="https://basescan.org",
                gas_price=20000000000  # 20 Gwei
            ),
            "ethereum_mainnet": NetworkConfig(
                name="Ethereum Mainnet",
                chain_id=1,
                rpc_url="https://ethereum-rpc.publicnode.com",
                native_token="ETH",
                explorer_url="https://etherscan.io",
                gas_price=20000000000
            ),
            "ethereum_sepolia": NetworkConfig(
                name="Ethereum Sepolia",
                chain_id=11155111,
                rpc_url="https://ethereum-sepolia-rpc.publicnode.com",
                native_token="ETH",
                explorer_url="https://sepolia.etherscan.io",
                gas_price=1000000000  # 1 Gwei for testnet
            ),
            # 添加更多主流链的配置
            "bsc_mainnet": NetworkConfig(
                name="Binance Smart Chain",
                chain_id=56,
                rpc_url="https://bsc-rpc.publicnode.com",
                native_token="BNB",
                explorer_url="https://bscscan.com",
                gas_price=5000000000  # 5 Gwei
            ),
            "bsc_testnet": NetworkConfig(
                name="BSC Testnet",
                chain_id=97,
                rpc_url="https://bsc-testnet-rpc.publicnode.com",
                native_token="BNB",
                explorer_url="https://testnet.bscscan.com",
                gas_price=1000000000  # 1 Gwei for testnet
            ),
            "polygon_mainnet": NetworkConfig(
                name="Polygon Mainnet",
                chain_id=137,
                rpc_url="https://polygon-rpc.com",
                native_token="MATIC",
                explorer_url="https://polygonscan.com",
                gas_price=30000000000  # 30 Gwei
            ),
            "polygon_amoy": NetworkConfig(
                name="Polygon Amoy",
                chain_id=80002,
                rpc_url="https://polygon-amoy-rpc.publicnode.com",
                native_token="MATIC",
                explorer_url="https://amoy.polygonscan.com",
                gas_price=1000000000  # 1 Gwei for testnet
            ),
            "avalanche_mainnet": NetworkConfig(
                name="Avalanche C-Chain",
                chain_id=43114,
                rpc_url="https://avalanche-c-chain-rpc.publicnode.com",
                native_token="AVAX",
                explorer_url="https://snowtrace.io",
                gas_price=25000000000  # 25 Gwei
            ),
            "avalanche_fuji": NetworkConfig(
                name="Avalanche Fuji",
                chain_id=43113,
                rpc_url="https://avalanche-fuji-c-chain-rpc.publicnode.com",
                native_token="AVAX",
                explorer_url="https://testnet.snowtrace.io",
                gas_price=25000000000  # 25 Gwei
            ),
            "solana_mainnet": NetworkConfig(
                name="Solana Mainnet",
                chain_id=0,  # Solana没有传统意义上的chain_id
                rpc_url="https://solana-rpc.publicnode.com",
                native_token="SOL",
                explorer_url="https://solscan.io"
            ),
            "solana_devnet": NetworkConfig(
                name="Solana Devnet",
                chain_id=0,  # Solana没有传统意义上的chain_id
                rpc_url="https://solana-devnet-rpc.publicnode.com",
                native_token="SOL",
                explorer_url="https://solscan.io"
            )
        }
        
        # 代币配置 (支持多链的主流代币)
        self.tokens = {
            "USDC": TokenConfig(
                symbol="USDC",
                address="0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",  # 以太坊主网USDC
                decimals=6,
                name="USD Coin"
            ),
            "USDC_BASE": TokenConfig(
                symbol="USDC_BASE",
                address="0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",  # Base主网USDC
                decimals=6,
                name="USD Coin"
            ),
            "USDC_BSC": TokenConfig(
                symbol="USDC_BSC",
                address="0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",  # BSC主网USDC
                decimals=18,
                name="USD Coin"
            ),
            "USDC_POLYGON": TokenConfig(
                symbol="USDC_POLYGON",
                address="0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",  # Polygon主网USDC
                decimals=6,
                name="USD Coin"
            ),
            "DAI": TokenConfig(
                symbol="DAI", 
                address="0x6B175474E89094C44Da98b954EedeAC495271d0F",  # 以太坊主网DAI
                decimals=18,
                name="Dai Stablecoin"
            ),
            "DAI_BASE": TokenConfig(
                symbol="DAI_BASE",
                address="0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb",  # Base主网DAI
                decimals=18,
                name="Dai Stablecoin"
            ),
            "DAI_BSC": TokenConfig(
                symbol="DAI_BSC",
                address="0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3",  # BSC主网DAI
                decimals=18,
                name="Dai Stablecoin"
            ),
            "DAI_POLYGON": TokenConfig(
                symbol="DAI_POLYGON",
                address="0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063",  # Polygon主网DAI
                decimals=18,
                name="Dai Stablecoin"
            ),
            "WETH": TokenConfig(
                symbol="WETH",
                address="0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",  # 以太坊主网WETH
                decimals=18,
                name="Wrapped Ether"
            ),
            "WETH_BASE": TokenConfig(
                symbol="WETH_BASE",
                address="0x4200000000000000000000000000000000000006",  # Base主网WETH
                decimals=18,
                name="Wrapped Ether"
            )
        }
        
        # 默认网络
        self.default_network = os.getenv("DEFAULT_NETWORK", "ethereum_mainnet")
        
        # Prompt配置
        self.prompt_templates = {
            "balance_query": {
                "description": "余额查询prompt模板",
                "default_variables": ["address", "network", "token_symbol"]
            },
            "transaction_send": {
                "description": "交易发送prompt模板", 
                "default_variables": ["from_address", "to_address", "amount", "token_symbol", "network"]
            },
            "wallet_management": {
                "description": "钱包管理prompt模板",
                "default_variables": ["wallet_count", "current_wallet"]
            },
            "network_info": {
                "description": "网络信息prompt模板",
                "default_variables": ["network", "chain_id", "rpc_url", "explorer_url", "native_token"]
            }
        }
    
    def get_network(self, network_id: Optional[str] = None) -> NetworkConfig:
        """获取网络配置"""
        network_id = network_id or self.default_network
        
        if network_id not in self.networks:
            raise ValueError(f"未知网络: {network_id}. 可用网络: {list(self.networks.keys())}")
        
        return self.networks[network_id]
    
    def get_token(self, symbol: str) -> Optional[TokenConfig]:
        """获取代币配置"""
        return self.tokens.get(symbol.upper())
    
    def add_token(self, token_config: TokenConfig) -> None:
        """添加代币配置"""
        self.tokens[token_config.symbol.upper()] = token_config
    
    def get_supported_networks(self) -> list:
        """获取支持的网络列表"""
        return list(self.networks.keys())
    
    def get_supported_tokens(self) -> list:
        """获取支持的代币列表"""
        return list(self.tokens.keys())
    
    def get_prompt_template(self, template_type: str) -> Optional[Dict]:
        """获取prompt模板配置"""
        return self.prompt_templates.get(template_type)
    
    def get_available_prompt_templates(self) -> list:
        """获取可用的prompt模板列表"""
        return list(self.prompt_templates.keys())

# 全局配置实例
config = Config()
