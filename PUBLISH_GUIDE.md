# NPM发布指南

## 发布前准备

### 1. 更新package.json信息
- 修改`repository`、`homepage`、`bugs`中的GitHub URL为你的实际仓库地址
- 确认版本号是否需要更新
- 检查包名是否可用

### 2. 构建项目
```bash
npm run build
```

### 3. 测试构建结果
```bash
npm test
```

## 发布步骤

### 1. 登录npm
```bash
npm login
```

### 2. 检查包名可用性
```bash
npm view blockchain-payment-mcp-ts
```
如果返回404，说明包名可用。

### 3. 发布到npm
```bash
npm publish
```

### 4. 验证发布
```bash
npm view blockchain-payment-mcp-ts
```

## 使用方式

### 全局安装
```bash
npm install -g blockchain-payment-mcp-ts
```

### 本地安装
```bash
npm install blockchain-payment-mcp-ts
```

### 在MCP配置中使用
```json
{
  "mcpServers": {
    "blockchain-payment-ts": {
      "command": "npx",
      "args": ["blockchain-payment-mcp-ts"],
      "env": {
        "PRIVATE_KEY": "your_private_key",
        "DEFAULT_NETWORK": "base_sepolia"
      }
    }
  }
}
```

## 注意事项

1. **版本管理**: 使用语义化版本号
2. **环境变量**: 确保用户知道如何配置环境变量
3. **文档**: 保持README_TS.md更新
4. **测试**: 发布前充分测试所有功能

## 更新版本

```bash
# 更新版本号
npm version patch  # 或 minor, major

# 重新发布
npm publish
```



