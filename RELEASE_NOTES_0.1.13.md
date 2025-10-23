# 区块链支付MCP服务器 v0.1.13 发布说明

## 🚀 版本 0.1.13 - 智能体钱包架构增强版

### 📅 发布日期
2024年12月

### 🎯 主要更新

#### 1. 智能体钱包类型标识系统
- ✅ 新增 `WalletType` 枚举：`AGENT`（智能体钱包）和 `USER`（用户钱包）
- ✅ 扩展 `WalletInfo` 接口，包含钱包类型、创建时间、警告信息
- ✅ 更新 `WalletManager` 类，支持钱包类型管理和分类

#### 2. 智能体钱包专用工具
- ✅ `create_agent_wallet` - 创建智能体专用钱包（自动生成私钥）
- ✅ `get_agent_wallet_balance` - 查询智能体钱包余额
- ✅ `send_from_agent_wallet` - 使用智能体钱包发送交易（自动化操作）
- ✅ `list_agent_wallets` - 列出所有智能体钱包
- ✅ `list_user_wallets` - 列出所有用户钱包

#### 3. 增强的现有工具
- ✅ `create_wallet` - 增加 `wallet_type` 参数，支持创建不同类型的钱包
- ✅ `list_wallets` - 现在显示钱包类型和详细信息
- ✅ 所有工具都支持钱包类型识别和验证

#### 4. MCP Prompts 系统
- ✅ `wallet_architecture_guide` - 智能体钱包架构指南
- ✅ `wallet_selection_guide` - 钱包选择指南
- ✅ 详细的架构说明和使用场景指导
- ✅ 决策树式的钱包选择建议

#### 5. 架构说明和日志增强
- ✅ 服务器启动时显示详细的架构说明
- ✅ 清晰区分智能体钱包和用户钱包的用途
- ✅ 详细的日志输出，帮助理解系统状态

### 🔧 核心架构特点

#### 智能体钱包 (Agent Wallet)
- 🤖 用于自动化操作，无需用户确认
- 🔑 自动生成私钥，由系统管理
- ⚡ 适合批量、定时、小额操作
- 🛡️ 智能体完全控制，支持自动化流程

#### 用户钱包 (User Wallet)
- 👤 用于用户交互，需要手动确认
- 🔐 用户提供私钥，用户完全控制
- 💰 适合大额、重要、一次性操作
- 🛡️ 用户完全控制，安全性更高

### 📋 支持的工具列表

#### 基础工具（保留原有功能）
- `get_balance` - 查询余额
- `send_transaction` - 发送交易
- `get_transaction_status` - 查询交易状态
- `estimate_gas_fees` - 估算Gas费用
- `validate_address` - 验证地址
- `get_network_info` - 获取网络信息
- `get_supported_tokens` - 获取支持的代币

#### 钱包管理工具
- `create_wallet` - 创建钱包（支持类型选择）
- `create_agent_wallet` - 创建智能体钱包
- `list_wallets` - 列出所有钱包
- `list_agent_wallets` - 列出智能体钱包
- `list_user_wallets` - 列出用户钱包
- `set_user_wallet` - 设置用户钱包
- `switch_wallet` - 切换钱包

#### 智能体专用工具
- `get_agent_wallet_balance` - 查询智能体钱包余额
- `send_from_agent_wallet` - 使用智能体钱包发送交易

#### MCP Prompts
- `wallet_architecture_guide` - 架构指南
- `wallet_selection_guide` - 选择指南

### 💡 使用建议

#### 智能体应该使用：
1. `create_agent_wallet` 创建自己的钱包
2. `get_agent_wallet_balance` 查询余额
3. `send_from_agent_wallet` 执行自动化交易
4. `wallet_architecture_guide` 了解架构

#### 用户交互场景：
1. `set_user_wallet` 设置用户钱包
2. `send_transaction` 需要用户确认的交易
3. `wallet_selection_guide` 帮助选择钱包类型

### 🔄 向后兼容性
- ✅ 完全向后兼容，所有原有功能保持不变
- ✅ 现有工具继续正常工作
- ✅ 新增功能为可选功能，不影响现有使用

### 📦 安装方式

```bash
npm install blockchain-payment-mcp@0.1.13
```

### 🚀 快速开始

```bash
# 安装
npm install blockchain-payment-mcp

# 运行
npx blockchain-payment-mcp
```

### 📚 文档
- 详细使用说明请参考 `README_TS.md`
- MCP Prompts 提供架构指导和使用建议

### 🐛 修复
- 修复了钱包类型标识的类型安全问题
- 优化了钱包管理器的错误处理
- 改进了日志输出的可读性

### 🔮 下一步计划
- 支持更多区块链网络
- 增加钱包备份和恢复功能
- 优化智能体钱包的安全机制
- 增加更多MCP Prompts指导

---

**注意**: 此版本专注于智能体钱包管理，钱包连接由前端智能体处理，MCP专注于区块链操作执行。
