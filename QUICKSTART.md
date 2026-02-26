# 快速开始指南

## 1. 安装依赖

```bash
npm install
```

## 2. 编译项目

```bash
npm run compile
```

## 3. 测试扩展

### 方法 1: 使用 VSCode 调试

1. 在 VSCode 中打开本项目
2. 按 `F5` 启动扩展开发主机
3. 在新打开的 VSCode 窗口中，打开一个 Git 仓库
4. 使用 Hecom Commit Message Editor 创建提交

### 方法 2: 打包安装

```bash
# 安装打包工具
npm install -g @vscode/vsce

# 打包扩展
vsce package

# 在 VSCode 中安装 .vsix 文件
# Extensions -> ... -> Install from VSIX
```

## 4. 配置

在 VSCode 设置中添加：

```json
{
  "hecomCmeProvider.enabled": true,
  "hecomCmeProvider.projectTypes": [
    "frontend",
    "backend", 
    "mobile",
    "common"
  ]
}
```

## 5. 使用

1. 在 Git 仓库中做一些修改
2. 打开 Hecom Commit Message Editor（命令面板: `Git: Open commit message editor`）
3. 观察 Type 和 Scope 选项是否由 Hecom Provider 提供
4. Type 字段应包含 feat、fix、docs 等选项
5. Scope 字段应根据项目类型和变更文件智能推荐

## 6. 验证

### 检查扩展是否激活

打开 VSCode 开发者工具（帮助 -> 切换开发人员工具），查看控制台输出：

```
Hecom CME Provider 已激活
```

### 检查是否成功注册

如果成功注册，应该看到：

```
Hecom CME Provider 注册成功
```

和一个通知消息：`Hecom CME Provider 已成功注册`

## 常见问题

### Q: 扩展未激活？

A: 检查：
1. 是否已安装 Hecom Commit Message Editor 扩展
2. 是否在 Git 仓库中打开项目
3. 查看 VSCode 开发者工具的错误信息

### Q: Provider 未注册成功？

A: 可能原因：
1. 主插件版本过旧，不支持动态 provider API
2. 主插件未正确暴露 `registerOptionsProvider` 方法
3. 需要等待主插件先实现 API 支持

### Q: 智能推荐不工作？

A: 检查：
1. 是否有文件变更（`git status` 查看）
2. Git 扩展是否可用
3. 是否在 Git 仓库根目录

## 下一步

- 查看 [DEVELOPMENT.md](./DEVELOPMENT.md) 了解开发细节
- 查看 [README.md](./README.md) 了解功能特性
- 根据实际业务需求定制 Provider 实现
