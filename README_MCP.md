# 区块链支付MCP服务器配置指南

## 概述

这个项目提供了一个完整的区块链支付MCP（Model Context Protocol）服务器，支持多种区块链网络和代币操作。

## 安装和配置

### 1. 安装MCP包

```bash
pip install blockchain-payment-mcp
```

### 2. MCP配置文件

项目根目录的 `mcp_config.json` 文件已经配置好了MCP服务器：

```json
{
  "mcpServers": {
    "blockchain-payment": {
      "command": "blockchain-payment-mcp",
      "args": [],
      "env": {
        "PRIVATE_KEY": "your-private-key-here",
        "DEFAULT_NETWORK": "base_sepolia",
        "DEBUG": "true",
        "MAX_TRANSACTION_VALUE": "10",
        "PYTHONPATH": "."
      }
    }
  }
}
```

### 3. 环境变量配置

在 `mcp_config.json` 中配置以下环境变量：

- `PRIVATE_KEY`: 你的私钥（用于发送交易）
- `DEFAULT_NETWORK`: 默认网络（base_sepolia, ethereum_mainnet 等）
- `DEBUG`: 调试模式（true/false）
- `MAX_TRANSACTION_VALUE`: 最大交易金额限制

## 支持的MCP工具

### 余额和查询工具

1. **get_balance** - 查询指定地址的余额
   - 参数: `address` (必需), `token_symbol` (可选), `network` (可选)

2. **get_network_info** - 获取当前网络信息
   - 参数: `network` (可选)

3. **get_supported_tokens** - 获取支持的代币列表
   - 参数: `random_string` (必需，用于无参数工具)

4. **validate_address** - 验证以太坊地址格式
   - 参数: `address` (必需)

### 交易工具

5. **send_transaction** - 发送代币转账交易
   - 参数: `to_address` (必需), `amount` (必需), `token_symbol` (可选), `network` (可选)

6. **get_transaction_status** - 查询交易状态和详情
   - 参数: `tx_hash` (必需), `network` (可选)

7. **estimate_gas_fees** - 估算Gas费用
   - 参数: `to_address` (可选), `amount` (可选), `token_symbol` (可选), `network` (可选)

### 钱包管理工具

8. **create_wallet** - 创建新的钱包地址和私钥
   - 参数: `label` (可选)

9. **set_user_wallet** - 设置用户钱包私钥
   - 参数: `private_key` (必需), `label` (可选)

10. **list_wallets** - 列出所有已添加的钱包
    - 参数: `random_string` (必需)

11. **switch_wallet** - 切换当前使用的钱包
    - 参数: `label` (必需)

12. **remove_wallet** - 移除指定标签的钱包
    - 参数: `label` (必需)

## 支持的网络

- `base_sepolia` - Base Sepolia 测试网
- `base_mainnet` - Base 主网
- `ethereum_mainnet` - 以太坊主网
- `ethereum_sepolia` - 以太坊 Sepolia 测试网
- `bsc_mainnet` - BSC 主网
- `bsc_testnet` - BSC 测试网
- `polygon_mainnet` - Polygon 主网
- `polygon_amoy` - Polygon Amoy 测试网
- `avalanche_mainnet` - Avalanche 主网
- `avalanche_fuji` - Avalanche Fuji 测试网
- `solana_mainnet` - Solana 主网
- `solana_devnet` - Solana 开发网

## 支持的代币

- `ETH` - 以太币
- `USDC` - USD Coin
- `USDC_BASE` - Base 网络上的 USDC
- `USDC_BSC` - BSC 网络上的 USDC
- `USDC_POLYGON` - Polygon 网络上的 USDC
- `DAI` - Dai 稳定币
- `DAI_BASE` - Base 网络上的 DAI
- `DAI_BSC` - BSC 网络上的 DAI
- `DAI_POLYGON` - Polygon 网络上的 DAI
- `WETH` - Wrapped Ether
- `WETH_BASE` - Base 网络上的 WETH

## 在Cursor中使用

1. 确保 `mcp_config.json` 文件在项目根目录
2. 重启Cursor编辑器
3. 在Cursor中，你可以直接调用MCP工具名称来使用功能

### 使用示例

在Cursor中，你可以这样使用：

```
请帮我查询地址 0x1234... 的余额
```

或者：

```
请帮我发送 0.1 ETH 到地址 0x5678...
```


## 故障排除

1. **MCP服务器启动失败**
   - 检查 `blockchain-payment-mcp` 命令是否可用
   - 确保所有依赖已正确安装

2. **网络连接问题**
   - 检查网络配置是否正确
   - 确认RPC节点是否可访问

3. **私钥问题**
   - 确保私钥格式正确（64位十六进制字符串）
   - 检查私钥是否有足够的余额

## 安全注意事项

- 不要在代码中硬编码私钥
- 使用环境变量或安全的密钥管理
- 在测试网络上进行测试
- 定期备份钱包信息

## 版本信息

- 当前版本: 0.1.7
- 支持Python: >=3.8
- 主要依赖: mcp>=1.0.0, web3>=6.0.0


