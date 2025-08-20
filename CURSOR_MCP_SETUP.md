# Cursor MCP 配置指南

## 1. 安装 blockchain-payment-mcp

```bash
pip install blockchain-payment-mcp
```

## 2. 配置 Cursor MCP

### 方法一：使用项目内的 mcp.json（推荐）

在项目根目录创建或更新 `mcp.json` 文件：

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

### 方法二：使用全局 MCP 配置

在 Cursor 设置中添加 MCP 服务器配置：

1. 打开 Cursor 设置
2. 搜索 "MCP"
3. 在 MCP 配置中添加：

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

## 3. 环境变量说明

- `PRIVATE_KEY`: 你的以太坊私钥（可选，如果不设置需要手动提供）
- `DEFAULT_NETWORK`: 默认网络（base_sepolia, base_mainnet, ethereum_mainnet 等）
- `DEBUG`: 调试模式（true/false）
- `MAX_TRANSACTION_VALUE`: 最大交易金额限制

## 4. 重启 Cursor

配置完成后重启 Cursor 以加载 MCP 服务器。

## 5. 验证配置

在 Cursor 中，你应该能看到以下工具可用：

- `mcp_blockchain-payment_get_balance` - 查询余额
- `mcp_blockchain-payment_send_transaction` - 发送交易
- `mcp_blockchain-payment_get_transaction_status` - 查询交易状态
- `mcp_blockchain-payment_estimate_gas_fees` - 估算 Gas 费用
- `mcp_blockchain-payment_create_wallet` - 创建钱包
- `mcp_blockchain-payment_get_network_info` - 获取网络信息
- `mcp_blockchain-payment_get_supported_tokens` - 获取支持的代币
- `mcp_blockchain-payment_validate_address` - 验证地址
- `mcp_blockchain-payment_set_user_wallet` - 设置用户钱包
- `mcp_blockchain-payment_list_wallets` - 列出钱包
- `mcp_blockchain-payment_switch_wallet` - 切换钱包
- `mcp_blockchain-payment_remove_wallet` - 移除钱包

## 6. 故障排除

如果 MCP 服务器无法启动：

1. 确认包已正确安装：`pip show blockchain-payment-mcp`
2. 测试模块是否可导入：`python -c "import blockchain_payment_mcp"`
3. 检查 Python 路径是否正确
4. 查看 Cursor 的 MCP 日志输出
