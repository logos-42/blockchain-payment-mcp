# 区块链支付MCP服务器

基于Base网络的区块链支付MCP（Model Context Protocol）服务器，提供完整的区块链支付功能。

## 🌟 功能特性

- **多网络支持**: 支持多个测试网和主网，包括Base Sepolia、Base Mainnet、Ethereum Sepolia、Ethereum Mainnet等
- **代币支持**: ETH、USDC、USDT、DAI、WETH等主流代币
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

### 3. 本地下载代码-配置MCP客户端

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

### 4. 测试服务器


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
{"address": "0x742d..."}

# 查询USDC余额
{"address": "0x742d...", "token_symbol": "USDC"}
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
- **RPC**: https://base-sepolia-rpc.publicnode.com
- **浏览器**: https://sepolia.basescan.org
- **原生代币**: ETH

### Base Mainnet (主网)
- **Chain ID**: 8453
- **RPC**: https://base-rpc.publicnode.com
- **浏览器**: https://basescan.org
- **原生代币**: ETH

### Ethereum Sepolia (测试网)
- **Chain ID**: 11155111
- **RPC**: https://ethereum-sepolia-rpc.publicnode.com
- **浏览器**: https://sepolia.etherscan.io
- **原生代币**: ETH

### Ethereum Mainnet (主网)
- **Chain ID**: 1
- **RPC**: https://ethereum-rpc.publicnode.com
- **浏览器**: https://etherscan.io
- **原生代币**: ETH

### BSC Testnet (测试网)
- **Chain ID**: 97
- **RPC**: https://bsc-testnet-rpc.publicnode.com
- **浏览器**: https://testnet.bscscan.com
- **原生代币**: BNB

### BSC Mainnet (主网)
- **Chain ID**: 56
- **RPC**: https://bsc-rpc.publicnode.com
- **浏览器**: https://bscscan.com
- **原生代币**: BNB

### Polygon Amoy (测试网)
- **Chain ID**: 80002
- **RPC**: https://polygon-amoy-rpc.publicnode.com
- **浏览器**: https://amoy.polygonscan.com
- **原生代币**: MATIC

### Polygon Mainnet (主网)
- **Chain ID**: 137
- **RPC**: https://polygon-rpc.com
- **浏览器**: https://polygonscan.com
- **原生代币**: MATIC

### Avalanche Fuji (测试网)
- **Chain ID**: 43113
- **RPC**: https://avalanche-fuji-c-chain-rpc.publicnode.com
- **浏览器**: https://testnet.snowtrace.io
- **原生代币**: AVAX

### Avalanche Mainnet (主网)
- **Chain ID**: 43114
- **RPC**: https://avalanche-c-chain-rpc.publicnode.com
- **浏览器**: https://snowtrace.io
- **原生代币**: AVAX


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
请帮我查询地址 0x742d... 的USDC余额
```

```
请发送0.001 ETH到地址 0x123456789...
```

```
请查询交易 0xabcdef... 的状态
```

### 在测试链上进行操作

```
请在Base Sepolia测试网上查询地址 0x742d35cc6585c5d74b3c9e5c29ae4eeaae27b76d 的ETH余额
```

```
请在Ethereum Sepolia测试网上发送0.001 ETH到地址 0x1234567890123456789012345678901234567890
```

### 程序化使用

```python
# 直接调用MCP工具
from blockchain_payment_mcp.server import handle_get_balance

result = await handle_get_balance({
    "address": "0x742d35cc6585c5d74b3c9e5c29ae4eeaae27b76d",
    "token_symbol": "USDC",
    "network": "ethereum_sepolia"
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





## 🧪 测试链支持

本系统支持在多个测试链上进行支付操作，包括:

1. Ethereum Sepolia (ETH)
2. Base Sepolia (ETH)
3. BSC Testnet (BNB)
4. Polygon Amoy (MATIC)
5. Avalanche Fuji (AVAX)

### 获取测试代币

要获取测试链上的代币用于测试，请访问相应的水龙头:

1. **Ethereum Sepolia**: 
   - https://sepoliafaucet.com/
   - https://www.infura.io/faucet/sepolia

2. **Base Sepolia**: 
   - https://base.org/faucet

3. **BSC Testnet**: 
   - https://testnet.bnbchain.org/faucet-smart

4. **Polygon Amoy**: 
   - https://tools.polygon.technology/faucet/

5. **Avalanche Fuji**: 
   - https://faucet.avax-test.network/

### 测试链注意事项

1. 测试链上的代币没有实际价值，仅用于开发和测试目的
2. 测试链的Gas价格通常比主网低得多
3. 不同测试链可能有不同的区块时间和确认时间
4. 测试链可能会重置，导致测试资产丢失

## 🤝 贡献

欢迎提交Issue和Pull Request！

## 📄 许可证

MIT License

## ⚠️ 免责声明

本软件仅用于教育和开发目的。使用前请充分测试，作者不承担任何资金损失责任。在主网使用前请确保充分的安全测试。
