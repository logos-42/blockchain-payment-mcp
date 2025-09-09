# PyPI上传指南

## 版本更新完成 ✅

### 📋 更新内容
- **项目版本**: 0.1.6 → 0.1.10
- **MCP SDK版本**: 1.0.0 → 1.13.0 (最新版本)
- **新增功能**: `get_wallet_address` 工具

### 📦 构建文件
- `blockchain_payment_mcp-0.1.10-py3-none-any.whl` ✅ 构建成功
- 包检查通过 ✅

## 🚀 上传到PyPI

### 方法1: 使用API Token (推荐)

1. **获取API Token**:
   - 访问 [PyPI](https://pypi.org) 并登录
   - 进入 Account Settings → API tokens
   - 创建新的API token

2. **上传命令**:
   ```bash
   twine upload dist/*
   ```
   - 用户名: `__token__`
   - 密码: 你的API token

### 方法2: 使用用户名密码

```bash
twine upload dist/*
```
- 输入你的PyPI用户名和密码

### 方法3: 上传到测试PyPI

```bash
twine upload --repository testpypi dist/*
```

## 📝 版本说明

### v0.1.10 更新内容
- ✅ 更新MCP SDK到最新版本 (1.13.0)
- ✅ 新增 `get_wallet_address` 工具
- ✅ 改进钱包管理功能
- ✅ 优化错误处理
- ✅ 更新依赖版本

### 新工具功能
```python
# 从私钥获取钱包地址
result = await get_wallet_address({
    "private_key": "your_private_key_here"
})
print(result["address"])  # 输出钱包地址
```

## 🔧 安装新版本

上传成功后，用户可以通过以下方式安装：

```bash
pip install blockchain-payment-mcp==0.1.10
```

或者升级现有版本：

```bash
pip install --upgrade blockchain-payment-mcp
```

## 📋 检查清单

- [x] 版本号更新到 0.1.10
- [x] MCP SDK更新到 1.13.0
- [x] 新工具 `get_wallet_address` 已添加
- [x] 包构建成功
- [x] 包检查通过
- [ ] 上传到PyPI (需要API token)
- [ ] 验证安装

## ⚠️ 注意事项

1. **API Token**: 上传需要有效的PyPI API token
2. **版本唯一性**: 确保0.1.10版本在PyPI上不存在
3. **依赖兼容性**: MCP 1.13.0是最新稳定版本
4. **测试**: 建议先在测试PyPI上测试

## 🎯 下一步

1. 获取PyPI API token
2. 执行上传命令
3. 验证包在PyPI上的显示
4. 测试安装新版本

