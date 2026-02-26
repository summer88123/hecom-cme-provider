# 快速开始指南

## 1. 安装依赖

```bash
npm install
```

## 2. 编译项目

```bash
npm run compile
```

## 3. 配置华为云 CodeArts（可选）

如果您想使用华为云 Issue Provider，需要在 VSCode 设置中配置：

打开 VSCode 设置（`Cmd/Ctrl + ,`），搜索 `hecomCmeProvider`，配置以下项：

```json
{
  "hecomCmeProvider.huaweiCloud.accessKey": "your-ak",
  "hecomCmeProvider.huaweiCloud.secretKey": "your-sk",
  "hecomCmeProvider.huaweiCloud.projectId": "your-project-id",
  "hecomCmeProvider.huaweiCloud.region": "cn-north-4"
}
```

**获取配置信息：**

1. **AK/SK**: 登录华为云控制台 → 我的凭证 → 访问密钥 → 创建访问密钥
2. **Project ID**: 在 CodeArts 项目管理页面的 URL 中查找
3. **Region**: 根据您的华为云资源所在区域选择（如：cn-north-4）

## 4. 配置主插件

在主插件（Commit Message Editor）的配置中添加 Issue token：

```json
{
  "commit-message-editor.tokens": [
    {
      "label": "Type",
      "name": "type",
      "type": "enum",
      "options": [
        { "label": "feat", "value": "feat", "description": "新功能" },
        { "label": "fix", "value": "fix", "description": "Bug 修复" }
      ]
    },
    {
      "label": "Issue",
      "name": "issue",
      "type": "dynamic-enum",
      "provider": "hecom.huawei-cloud-issues",
      "description": "选择关联的华为云 CodeArts Issue"
    },
    {
      "label": "Subject",
      "name": "subject",
      "type": "text",
      "description": "简短描述",
      "maxLength": 100
    }
  ]
}
```

## 5. 测试扩展

### 方法 1: 使用 VSCode 调试

1. 在 VSCode 中打开本项目
2. 按 `F5` 启动扩展开发主机
3. 在新打开的 VSCode 窗口中，打开一个 Git 仓库
4. 打开命令面板（`Cmd/Ctrl + Shift + P`）
5. 运行命令：`Commit Message Editor: Open Editor`
6. 观察 Issue 字段是否显示华为云的 Issue 列表

### 方法 2: 打包安装

```bash
# 安装打包工具
npm install -g @vscode/vsce

# 打包扩展
vsce package

# 在 VSCode 中安装 .vsix 文件
# Extensions -> ... -> Install from VSIX
```

## 6. 验证

### 检查扩展是否激活

打开 VSCode 开发者工具（帮助 → 切换开发人员工具），查看控制台输出：

```
Hecom CME Provider 已激活
华为云 CodeArts 客户端初始化成功
Hecom CME Provider: 华为云 Issue Provider 注册成功
```

### 检查 Provider 注册

如果成功注册，应该看到通知消息：`Hecom CME Provider 已成功注册`

### 测试 Issue 加载

1. 打开 Commit Message Editor
2. 点击 Issue 字段的下拉框
3. 应该显示加载动画，然后显示 Issue 列表
4. Issue 格式：`#123 - 修复登录问题 [进行中]`

## 常见问题

### Q: 扩展未激活？

A: 检查：
1. 是否已安装主插件 `Hecom Commit Message Editor`
2. 是否在 Git 仓库中打开项目
3. 查看 VSCode 开发者工具的错误信息

### Q: Provider 未注册成功？

A: 可能原因：
1. 主插件版本过旧，不支持 `DynamicOptionsProvider` API
2. 主插件未正确暴露 `registerDynamicOptionsProvider` 方法
3. 需要等待主插件先实现并发布 API 支持

### Q: Issue 列表为空或显示错误？

A: 检查：
1. 华为云配置是否正确（AK/SK/ProjectId/Region）
2. 网络连接是否正常
3. ProjectId 是否有权限访问
4. 查看控制台日志获取详细错误信息

### Q: 类型错误？

A: 
- 目前使用本地类型定义（`src/types/cme-api.ts`）
- 当主插件发布后，可以直接导入主插件的类型
- 暂时忽略 IDE 中的类型警告，编译应该能够通过

## 架构说明

### Provider 架构

```
vscode-commit-message-editor (主插件)
    ├── 提供 API: registerDynamicOptionsProvider
    ├── 管理 Provider 注册表
    ├── 处理 Provider 调用和缓存
    └── 渲染 UI 和错误处理

hecom-cme-provider (本扩展)
    └── providers/
        └── IssueProvider
            ├── 实现 DynamicOptionsProvider 接口
            ├── 从华为云获取 Issue 数据
            └── 返回标准格式的选项列表
```

### 工作流程

```
1. 扩展激活
   ↓
2. 获取主插件 API
   ↓
3. 创建 IssueProvider 实例
   ↓
4. 注册 Provider (ID: hecom.huawei-cloud-issues)
   ↓
5. 用户打开编辑器，点击 Issue 字段
   ↓
6. 主插件调用 provideOptions()
   ↓
7. Provider 从华为云获取数据
   ↓
8. 返回选项列表给主插件
   ↓
9. 主插件渲染下拉列表
```

## 下一步

- 查看 [README.md](./README.md) 了解功能特性
- 查看 [DEVELOPMENT.md](./DEVELOPMENT.md) 了解开发细节
- 根据实际业务需求添加新的 Provider

## 添加新 Provider

如果您想添加新的 Provider（例如 GitLab MR、Jira Issue 等）：

1. 在 `src/providers/` 下创建新的 Provider 文件
2. 实现 `DynamicOptionsProvider` 接口
3. 在 `extension.ts` 中注册 Provider
4. 在主插件配置中引用 Provider ID

详见 [DEVELOPMENT.md](./DEVELOPMENT.md) 的"添加新的 Provider"章节。
