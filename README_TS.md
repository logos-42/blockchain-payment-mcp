# 区块链支付MCP服务器 - TypeScript版本

这是一个基于TypeScript的区块链支付MCP（Model Context Protocol）服务器，提供完整的区块链交互功能。

## 功能特性

- 🔗 **多链支持**: 支持以太坊、Base、BSC、Polygon、Avalanche等主流区块链
- 💰 **余额查询**: 查询ETH和ERC20代币余额
- 📤 **代币转账**: 支持原生代币和ERC20代币转账
- ⛽ **Gas估算**: 智能估算交易费用
- 🔍 **交易状态**: 实时查询交易状态和详情
- 🏦 **钱包管理**: 多钱包管理，支持标签和切换
- 🛡️ **安全验证**: 地址格式验证和私钥安全处理

## 安装和设置

### 1. 安装依赖

```bash
npm install
```

### 2. 构建项目

```bash
npm run build
```

### 3. 配置环境变量

创建 `.env` 文件：

```env
PRIVATE_KEY=your_private_key_here
DEFAULT_NETWORK=base_sepolia
DEBUG=false
MAX_TRANSACTION_VALUE=10
```

### 4. 配置MCP客户端

将 `mcp-ts.json` 的内容添加到你的MCP客户端配置中。

## 使用方法

### 启动服务器

```bash
npm start
```

### 开发模式

```bash
npm run dev
```

## 支持的网络

- **Base Sepolia** (测试网)
- **Base Mainnet** (主网)
- **Ethereum Mainnet** (主网)
- **Ethereum Sepolia** (测试网)
- **BSC Mainnet** (主网)
- **BSC Testnet** (测试网)
- **Polygon Mainnet** (主网)
- **Polygon Amoy** (测试网)
- **Avalanche Mainnet** (主网)
- **Avalanche Fuji** (测试网)

## 支持的代币

- **ETH** (原生代币)
- **USDC** (多链支持)
- **DAI** (多链支持)
- **WETH** (多链支持)

## 可用工具

### 1. get_balance
查询指定地址的余额

```json
{
  "name": "get_balance",
  "arguments": {
    "address": "0x...",
    "token_symbol": "USDC",
    "network": "base_sepolia"
  }
}
```

### 2. send_transaction
发送代币转账

```json
{
  "name": "send_transaction",
  "arguments": {
    "to_address": "0x...",
    "amount": "0.1",
    "token_symbol": "ETH",
    "network": "base_sepolia"
  }
}
```

### 3. get_transaction_status
查询交易状态

```json
{
  "name": "get_transaction_status",
  "arguments": {
    "tx_hash": "0x...",
    "network": "base_sepolia"
  }
}
```

### 4. estimate_gas_fees
估算Gas费用

```json
{
  "name": "estimate_gas_fees",
  "arguments": {
    "to_address": "0x...",
    "amount": "0.1",
    "network": "base_sepolia"
  }
}
```

### 5. create_wallet
创建新钱包

```json
{
  "name": "create_wallet",
  "arguments": {
    "label": "my_wallet"
  }
}
```

### 6. set_user_wallet
设置用户钱包

```json
{
  "name": "set_user_wallet",
  "arguments": {
    "private_key": "0x...",
    "label": "main_wallet"
  }
}
```

### 7. list_wallets
列出所有钱包

```json
{
  "name": "list_wallets",
  "arguments": {}
}
```

### 8. switch_wallet
切换当前钱包

```json
{
  "name": "switch_wallet",
  "arguments": {
    "label": "main_wallet"
  }
}
```

### 9. remove_wallet
移除钱包

```json
{
  "name": "remove_wallet",
  "arguments": {
    "label": "old_wallet"
  }
}
```

### 10. validate_address
验证地址格式

```json
{
  "name": "validate_address",
  "arguments": {
    "address": "0x..."
  }
}
```

### 11. get_network_info
获取网络信息

```json
{
  "name": "get_network_info",
  "arguments": {
    "network": "base_sepolia"
  }
}
```

### 12. get_supported_tokens
获取支持的代币列表

```json
{
  "name": "get_supported_tokens",
  "arguments": {}
}
```

## 安全注意事项

1. **私钥安全**: 永远不要在代码中硬编码私钥
2. **环境变量**: 使用环境变量存储敏感信息
3. **测试网**: 在测试网上进行测试，避免主网损失
4. **金额限制**: 设置合理的交易金额限制
5. **地址验证**: 始终验证接收地址的正确性

## 开发

### 代码风格

项目使用ESLint和Prettier进行代码格式化：

```bash
npm run lint
npm run format
```

### 测试

```bash
npm test
```

## 故障排除

### 常见问题

1. **网络连接失败**: 检查RPC节点URL是否正确
2. **私钥无效**: 确保私钥格式正确（64位十六进制）
3. **余额不足**: 检查账户余额是否足够支付Gas费用
4. **交易失败**: 检查网络状态和Gas价格设置

### 调试模式

设置 `DEBUG=true` 环境变量启用详细日志。

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request来改进这个项目。
