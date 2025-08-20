# Base区块链支付MCP

基于Base网络的区块链支付模型上下文协议(MCP)服务器。

## 🌟 功能特性

- ✅ 支持Base Sepolia/Mainnet/Goerli测试网
- ✅ ETH和ERC20代币余额查询  
- ✅ 发送ETH和代币转账
- ✅ Gas费用估算
- ✅ 交易状态查询
- ✅ 创建新钱包
- ✅ MetaMask集成支持

## 🚀 快速开始

### 1. 安装依赖
```bash
pip install -e .
```

### 2. 配置环境
复制 `.env.example` 为 `.env` 并配置：
```bash
DEFAULT_NETWORK=base_sepolia
PRIVATE_KEY=your_private_key_here
DEBUG=true
```

### 3. 启动MCP服务器
```bash
# Windows
start_mcp.bat

# Linux/Mac  
python -m blockchain_payment_mcp.server
```

### 4. 测试功能
```bash
python test_mcp.py
```

## 🛠️ MCP工具

### 余额查询
```python
check_balance(
    address="0x...",           # 钱包地址
    network="base_sepolia",    # 可选: 网络
    token_symbol="ETH"         # 可选: 代币符号
)
```

### 发送支付
```python
send_payment(
    to_address="0x...",        # 接收地址
    amount="0.01",             # 金额
    token_symbol="ETH",        # 可选: 代币符号
    network="base_sepolia",    # 可选: 网络
    private_key="..."          # 可选: 私钥
)
```

### 费用估算
```python
estimate_transaction_fee(
    to_address="0x...",        # 可选: 接收地址
    amount="0.01",             # 可选: 金额
    network="base_sepolia"     # 可选: 网络
)
```

### 交易状态
```python
check_transaction_status(
    tx_hash="0x...",           # 交易哈希
    network="base_sepolia"     # 可选: 网络
)
```

## 🌐 支持的网络

| 网络 | Chain ID | RPC URL |
|------|----------|---------|
| Base Sepolia | 84532 | https://sepolia.base.org |
| Base Mainnet | 8453 | https://mainnet.base.org |
| Base Goerli | 84531 | https://goerli.base.org |

## 🔧 Cursor集成

在 `cursor_mcp_config.json` 中配置：
```json
{
  "mcpServers": {
    "blockchain-payment": {
      "command": "python",
      "args": ["-m", "blockchain_payment_mcp.server"],
      "env": {
        "PRIVATE_KEY": "your_key",
        "DEFAULT_NETWORK": "base_sepolia"
      }
    }
  }
}
```

## ⚠️ 安全提醒

- 🔑 私钥管理：生产环境请使用硬件钱包或密钥管理服务
- 🧪 测试优先：先在测试网验证功能
- 💰 限额设置：配置合理的交易限额
- 🔒 网络安全：使用可信的RPC提供商

## 🧪 获取测试ETH

Base Sepolia测试网水龙头：
- https://bridge.base.org/
- https://faucet.quicknode.com/base/sepolia

## 📚 更多资源

- [Base官方文档](https://docs.base.org/)
- [MCP协议规范](https://spec.modelcontextprotocol.io/)
- [Web3.py文档](https://web3py.readthedocs.io/)

## 🐛 故障排除

### 连接问题
1. 检查网络配置和RPC URL
2. 验证Chain ID是否正确
3. 确认网络服务是否可用

### 交易失败
1. 确保账户有足够的ETH用于Gas费
2. 检查私钥格式（不含0x前缀）
3. 验证接收地址格式

### Gas费过高
1. 使用Base网络（费用更低）
2. 在网络拥堵时间外操作
3. 调整Gas价格设置
