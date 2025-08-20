# 区块链支付MCP服务器

基于Base网络的区块链支付MCP（Model Context Protocol）服务器，提供完整的区块链支付功能。

## 🌟 功能特性

- **多网络支持**: Base Sepolia测试网、Base主网、Ethereum Sepolia
- **代币支持**: ETH、USDC、DAI、WETH等主流代币
- **余额查询**: 查询任意地址的ETH和代币余额
- **安全转账**: 支持ETH和ERC20代币转账
- **交易追踪**: 实时查询交易状态和确认数
- **Gas估算**: 智能估算交易Gas费用
- **钱包管理**: 创建新钱包、验证地址格式
- **安全限制**: 内置交易金额限制和安全检查

## 🚀 快速开始

### 1. 安装依赖

```bash
pip install -r requirements.txt
```

### 2. 环境配置

创建`.env`文件（可选）：

```bash
# 私钥（用于发送交易，可选）
PRIVATE_KEY=your_private_key_here

# 默认网络（默认为base_sepolia）
DEFAULT_NETWORK=base_sepolia

# 最大交易金额限制（默认10 ETH）
MAX_TRANSACTION_VALUE=10

# 调试模式
DEBUG=false
```

### 3. 配置MCP客户端

#### 在 Cursor 中使用

在Cursor的`mcp.json`中添加：

```json
{
  "mcpServers": {
    "blockchain-payment": {
      "command": "python",
      "args": ["-m", "blockchain_payment_mcp.server"],
      "env": {
        "PRIVATE_KEY": "your_private_key_here",
        "DEFAULT_NETWORK": "base_sepolia",
        "DEBUG": "false",
        "MAX_TRANSACTION_VALUE": "10"
      },
      "cwd": "/path/to/blockmcp"
    }
  }
}
```

#### 在 Cherry Studio 中使用

在Cherry Studio的MCP配置中添加：

```json
{
  "mcpServers": {
    "blockchain-payment": {
      "command": "blockchain-payment-mcp",
      "env": {
        "PRIVATE_KEY": "your_private_key_here",
        "DEFAULT_NETWORK": "base_sepolia",
        "DEBUG": "false",
        "MAX_TRANSACTION_VALUE": "10"
      }
    }
  }
}
```

或者，您也可以使用Python模块方式：

```json
{
  "mcpServers": {
    "blockchain-payment": {
      "command": "python",
      "args": ["-m", "blockchain_payment_mcp.server"],
      "env": {
        "PRIVATE_KEY": "your_private_key_here",
        "DEFAULT_NETWORK": "base_sepolia",
        "DEBUG": "false",
        "MAX_TRANSACTION_VALUE": "10"
      }
    }
  }
}
```

### 4. 测试服务器

```bash
python test_mcp.py
```

## 🛠️ 可用工具

### `get_balance`
查询指定地址的余额

**参数:**
- `address`: 钱包地址（必需）
- `token_symbol`: 代币符号，如"USDC"、"DAI"（可选）
- `network`: 网络名称（可选，默认base_sepolia）

**示例:**
```python
# 查询ETH余额
{"address": "0x742d35cc6585c5d74b3c9e5c29ae4eeaae27b76d"}

# 查询USDC余额
{"address": "0x742d35cc6585c5d74b3c9e5c29ae4eeaae27b76d", "token_symbol": "USDC"}
```

### `send_transaction`
发送代币转账交易

**参数:**
- `to_address`: 接收方地址（必需）
- `amount`: 转账金额（必需）
- `token_symbol`: 代币符号（可选，默认"ETH"）
- `network`: 网络名称（可选）
- `private_key`: 发送方私钥（可选，如未提供则使用环境变量）

**示例:**
```python
# 发送0.01 ETH
{"to_address": "0x...", "amount": "0.01"}

# 发送100 USDC
{"to_address": "0x...", "amount": "100", "token_symbol": "USDC"}
```

### `get_transaction_status`
查询交易状态

**参数:**
- `tx_hash`: 交易哈希（必需）
- `network`: 网络名称（可选）

### `estimate_gas_fees`
估算Gas费用

**参数:**
- `to_address`: 接收方地址（可选）
- `amount`: 转账金额（可选）
- `token_symbol`: 代币符号（可选）
- `network`: 网络名称（可选）

### `create_wallet`
创建新的钱包地址和私钥

**参数:** 无

### `get_network_info`
获取当前网络信息

**参数:**
- `network`: 网络名称（可选）

### `get_supported_tokens`
获取支持的代币列表

**参数:** 无

### `validate_address`
验证以太坊地址格式

**参数:**
- `address`: 要验证的地址（必需）

## 🌐 支持的网络

### Base Sepolia (测试网)
- **Chain ID**: 84532
- **RPC**: https://sepolia.base.org
- **浏览器**: https://sepolia.basescan.org
- **原生代币**: ETH

### Base Mainnet (主网)
- **Chain ID**: 8453
- **RPC**: https://mainnet.base.org
- **浏览器**: https://basescan.org
- **原生代币**: ETH

### Ethereum Sepolia (测试网)
- **Chain ID**: 11155111
- **RPC**: https://sepolia.infura.io/v3/YOUR_INFURA_KEY
- **浏览器**: https://sepolia.etherscan.io
- **原生代币**: ETH

## 🪙 支持的代币

### Base Sepolia测试网代币
- **USDC**: 0x036CbD53842c5426634e7929541eC2318f3dCF7e
- **DAI**: 0x7683022d84F726C432F2bF39dEB9E768c0FeE63b
- **WETH**: 0x4200000000000000000000000000000000000006

## 🔒 安全特性

1. **交易限制**: 内置最大交易金额限制（默认10 ETH）
2. **地址验证**: 严格验证所有以太坊地址格式
3. **私钥保护**: 支持环境变量和可选私钥传入
4. **错误处理**: 完善的异常处理和错误信息
5. **日志记录**: 详细的操作日志和调试信息

## 🧪 测试

运行测试脚本验证功能：

```bash
python test_mcp.py
```

测试包括：
- 配置加载测试
- 网络连接测试
- 钱包功能测试
- 地址验证测试
- Gas估算测试

## 📝 示例用法

### 在AI对话中使用

```
请帮我查询地址 0x742d35cc6585c5d74b3c9e5c29ae4eeaae27b76d 的USDC余额
```

```
请发送0.001 ETH到地址 0x1234567890123456789012345678901234567890
```

```
请查询交易 0xabcdef... 的状态
```

### 程序化使用

```python
# 直接调用MCP工具
from blockchain_payment_mcp.server import handle_get_balance

result = await handle_get_balance({
    "address": "0x742d35cc6585c5d74b3c9e5c29ae4eeaae27b76d",
    "token_symbol": "USDC"
})
print(result)
```

## 🔧 开发

### 项目结构

```
blockmcp/
├── blockchain_payment_mcp/
│   ├── __init__.py
│   ├── server.py          # MCP服务器主文件
│   ├── blockchain.py      # 区块链交互层
│   ├── wallet.py          # 钱包和签名器
│   └── config.py          # 配置管理
├── requirements.txt       # Python依赖
├── pyproject.toml        # 项目配置
├── test_mcp.py           # 测试脚本
└── README.md             # 说明文档
```

### 添加新网络

在`config.py`中添加新的网络配置：

```python
"new_network": NetworkConfig(
    name="New Network",
    chain_id=12345,
    rpc_url="https://rpc.new-network.org",
    native_token="ETH",
    explorer_url="https://explorer.new-network.org",
    gas_price=20000000000
)
```

### 添加新代币

在`config.py`中添加新的代币配置：

```python
"NEW_TOKEN": TokenConfig(
    symbol="NEW",
    address="0x...",
    decimals=18,
    name="New Token"
)
```

## 🤝 贡献

欢迎提交Issue和Pull Request！

## 📄 许可证

MIT License

## ⚠️ 免责声明

本软件仅用于教育和开发目的。使用前请充分测试，作者不承担任何资金损失责任。在主网使用前请确保充分的安全测试。

