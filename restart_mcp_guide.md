# MCP服务器重启指南

## 问题
新添加的 `get_wallet_address` 工具已经成功添加到Python服务器中，但Cursor的MCP客户端还没有重新加载工具列表。

## 解决方案

### 方案1：重启Cursor（推荐）
1. 完全关闭Cursor
2. 重新打开Cursor
3. 等待MCP服务器重新连接
4. 新工具应该会出现在可用工具列表中

### 方案2：重新加载MCP配置
1. 在Cursor中按 `Ctrl+Shift+P` 打开命令面板
2. 搜索 "MCP" 相关命令
3. 选择重新加载MCP配置或重启MCP服务器

### 方案3：手动重启MCP服务器
1. 在终端中停止当前MCP服务器进程
2. 重新启动：`python -m blockchain_payment_mcp.server`

## 验证新工具
重启后，您应该能看到以下新工具：
- `get_wallet_address` - 从私钥获取钱包地址

## 测试新工具
```python
# 使用新工具获取地址
result = await get_wallet_address({
    "private_key": "1655aad5f3b8e80ac2bd4383d3ac8bbab3ec928645c7342e568b394193efdf2c"
})
print(result["address"])  # 应该输出: 0x308339a0C2fA14475EC42fbF0b8Fae239b293b52
```

## 新工具功能
- **输入**：私钥字符串
- **输出**：钱包地址、私钥掩码、成功状态
- **验证**：自动验证私钥格式
- **安全**：私钥只显示前10位和后10位


