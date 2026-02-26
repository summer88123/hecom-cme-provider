# Hecom CME Provider

为 **Hecom Commit Message Editor** 提供基于内部业务场景的动态选项 Provider。

## 功能特性

- 🎯 **智能项目类型检测**: 自动识别前端、后端、移动端等项目类型
- 📁 **基于变更文件的智能推荐**: 根据 Git 变更文件自动推荐合适的 scope
- 🔧 **可配置的选项**: 支持自定义项目类型和提交类型
- 🚀 **即插即用**: 安装后自动注册到 Commit Message Editor

## 使用方法

### 前置要求

- VSCode >= 1.74.0
- **Hecom Commit Message Editor** 扩展（需要支持动态 Provider 的版本）

### 安装

1. 克隆或下载本项目
2. 在项目根目录运行：
   ```bash
   npm install
   npm run compile
   ```
3. 在 VSCode 中按 F5 启动扩展开发主机进行测试
4. 或使用 `vsce package` 打包为 `.vsix` 文件后安装

### 配置

在 VSCode 设置中可以配置以下选项：

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

## 支持的项目类型

### 前端项目
- React、Vue、Angular 等
- 提供 components、pages、utils、styles、hooks、store 等 scope

### 后端项目
- Express、Koa、NestJS 等
- 提供 api、service、model、middleware、config、database 等 scope

### 移动端项目
- React Native 等
- 提供 screens、navigation、native、components、utils 等 scope

### 通用项目
- 其他类型项目
- 提供 core、common、utils、config 等 scope

## 智能推荐

Provider 会根据当前的 Git 变更文件自动推荐相关的 scope，例如：

- 如果修改了 `src/components/Button.tsx`，会推荐 `components` 作为 scope
- 如果修改了 `src/pages/Home.tsx`，会推荐 `pages` 作为 scope
- 如果修改了 `src/api/user.ts`，会推荐 `api` 作为 scope

## 开发

### 项目结构

```
hecom-cme-provider/
├── src/
│   ├── extension.ts              # 扩展入口
│   └── HecomOptionsProvider.ts   # Provider 实现
├── out/                           # 编译输出
├── package.json
├── tsconfig.json
└── README.md
```

### 编译

```bash
npm run compile        # 编译
npm run watch          # 监视模式
```

### 测试

```bash
npm test              # 运行测试
```

### 打包

```bash
npm install -g @vscode/vsce
vsce package
```

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT
