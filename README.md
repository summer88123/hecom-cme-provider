# Hecom CME Provider

为 **Hecom Commit Message Editor** 提供动态选项 Provider 扩展。

## 项目概述

本项目是 `vscode-commit-message-editor` 主插件的扩展插件，实现了主插件的 `DynamicOptionsProvider` 接口，为提交消息编辑器提供动态数据源。

### 架构设计

根据主插件的 Provider 注册系统设计，本项目采用**独立 Provider 架构**：

- 每个 Provider 独立实现 `DynamicOptionsProvider` 接口
- Provider 之间完全解耦，互不依赖
- 通过主插件的 `registerDynamicOptionsProvider` API 注册
- 支持多个 Provider 并存

## 功能特性

- 🔗 **华为云 CodeArts Issue Provider**: 从华为云 CodeArts 获取 Issue 列表
- 🎯 **引入阶段 Provider**: 从华为云 CodeArts 获取"引入阶段"自定义字段选项
- ✨ **标准接口**: 实现主插件的 `DynamicOptionsProvider` 接口
- 🔄 **动态加载**: 支持延迟加载和会话级缓存
- ⚡ **高性能**: 支持取消令牌和超时控制
- 🛡️ **错误处理**: 完善的错误处理和 fallback 机制

## 使用方法

### 前置要求

- VSCode >= 1.74.0
- **Hecom Commit Message Editor** 扩展（支持 DynamicOptionsProvider API 的版本）

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

#### 华为云 CodeArts 配置

在 VSCode 设置中配置华为云 CodeArts 凭证：

```json
{
  "hecomCmeProvider.huaweiCloud.accessKey": "your-ak",
  "hecomCmeProvider.huaweiCloud.secretKey": "your-sk",
  "hecomCmeProvider.huaweiCloud.domainId": "your-domain-id",
  "hecomCmeProvider.huaweiCloud.projectId": "your-project-id",
  "hecomCmeProvider.huaweiCloud.region": "cn-north-4"
}
```

**配置说明：**

- `accessKey`: 华为云访问密钥（AK）
- `secretKey`: 华为云密钥（SK）
- `domainId`: 华为云 Domain ID（用于 AK/SK 认证）
- `projectId`: CodeArts 项目 ID（用于查询 Issue 数据）
- `region`: 华为云区域（默认：cn-north-4）

**如何获取配置信息：**

1. **AK/SK**: 登录华为云控制台 → 我的凭证 → 访问密钥 → 创建访问密钥
2. **Domain ID**: 登录华为云控制台 → 我的凭证 → API 凭证 → 项目 ID（与 AK/SK 关联的账户 ID）
3. **Project ID**: 在 CodeArts 项目页面的 URL 中获取，格式如 `https://devcloud.huaweicloud.com/cloudui/project/{project_id}/...`
4. **Region**: 选择您的华为云资源所在区域

**注意：** 华为云 SDK 有两个不同的 ID 概念：
- **Domain ID**：用于 AK/SK 认证，关联到账户级别
- **Project ID**：用于查询具体的 CodeArts 项目数据

#### 在主插件中使用

在主插件的配置中引用 Provider：

```json
{
  "commit-message-editor.tokens": [
    {
      "label": "Related Issue",
      "name": "issue",
      "type": "dynamic-enum",
      "provider": "hecom.huawei-cloud-issues",
      "description": "选择关联的华为云 CodeArts Issue"
    },
    {
      "label": "引入阶段",
      "name": "introduction-stage",
      "type": "dynamic-enum",
      "provider": "hecom.introduction-stage",
      "description": "选择引入阶段"
    }
  ]
}
```

## Provider 列表

### 华为云 CodeArts Issue Provider

**Provider ID**: `hecom.huawei-cloud-issues`

**功能**: 从华为云 CodeArts 项目中获取 Issue 列表

**返回格式**:
```typescript
{
  label: "[Bug] 修复登录问题",
  value: "修复登录问题: https://devcloud.cn-north-4.huaweicloud.com/projectman/scrum/{projectId}/task/detail/{issueId}",
  description: "[进行中]"
}
```

**错误处理**:
- 配置不完整时抛出错误提示
- 网络错误时自动重试
- 支持取消长时间请求

### 引入阶段 Provider

**Provider ID**: `hecom.introduction-stage`

**功能**: 从华为云 CodeArts 项目中获取"引入阶段"自定义字段的选项列表

**API 返回格式示例**:
```json
{
  "datas": [
    {
      "custom_field": "custom_field29",
      "type": "radio",
      "name": "引入阶段",
      "options": "2501,2502,2503,2504,2505,2506,2507,2508,历史版本,2509,2510,2511,2512,2601,2602,2603,2604,2605,2607",
      "tracker_ids": [3],
      "create_time": "2025-09-09T14:39:28+08:00"
    }
  ]
}
```

**转换后的选项格式**:
```typescript
{
  label: "2501",
  value: "2501",
  description: "引入阶段: 2501"
}
```

**配置要求**: 
- 需要配置华为云 AK/SK/DomainId/ProjectId
- 项目中需要存在名为"引入阶段"的自定义字段
- 自动处理逗号分隔的字符串选项

**错误处理**:
- 配置不完整时抛出错误提示
- 字段不存在时返回空列表
- 自动识别字符串或数组类型的 options
- 网络错误时自动重试
- 支持取消长时间请求

## 开发指南

### 项目结构

```
hecom-cme-provider/
├── src/
│   ├── extension.ts                              # 扩展入口,注册所有 providers
│   ├── types/
│   │   └── cme-api.ts                            # 主插件 API 类型定义
│   ├── clients/
│   │   ├── ProjectManClientManager.ts            # 华为云客户端管理器
│   │   └── UserInfoManager.ts                    # 用户信息管理器
│   └── providers/
│       ├── IssueProvider.ts                      # 华为云 Issue Provider
│       └── IntroductionStageProvider.ts          # 引入阶段 Provider
├── examples/
│   └── introductionStageExample.ts               # 引入阶段使用示例
├── out/                                          # 编译输出
├── package.json
├── tsconfig.json
└── README.md
```

### 添加新的 Provider

1. **创建 Provider 类**

在 `src/providers/` 目录下创建新的 Provider 文件：

```typescript
// src/providers/MyProvider.ts
import type {
  DynamicOptionsProvider,
  DynamicOptionsContext,
  DynamicOptionItem,
} from '../types/cme-api';

export class MyProvider implements DynamicOptionsProvider {
  async provideOptions(context: DynamicOptionsContext): Promise<DynamicOptionItem[]> {
    // 实现你的逻辑
    return [
      {
        label: 'Option 1',
        value: 'option1',
        description: 'Description for option 1'
      }
    ];
  }
}
```

2. **在 extension.ts 中注册**

```typescript
import { MyProvider } from './providers/MyProvider';

export function activate(context: vscode.ExtensionContext) {
  // ... 其他代码
  
  const myProvider = new MyProvider();
  const disposable = api.registerDynamicOptionsProvider(
    'hecom.my-provider',  // Provider ID
    myProvider
  );
  context.subscriptions.push(disposable);
}
```

3. **在主插件配置中使用**

```json
{
  "commit-message-editor.tokens": [
    {
      "name": "myField",
      "type": "dynamic-enum",
      "provider": "hecom.my-provider"
    }
  ]
}
```

### DynamicOptionsProvider 接口

```typescript
interface DynamicOptionsProvider {
  provideOptions(context: DynamicOptionsContext): 
    DynamicOptionItem[] | Promise<DynamicOptionItem[]>;
}

interface DynamicOptionsContext {
  repositoryPath?: string;              // 当前 Git 仓库路径
  tokenValues: Record<string, string>;  // 其他 token 的当前值
  cancellationToken?: CancellationToken; // 取消令牌
}

interface DynamicOptionItem {
  label: string;       // 显示标签
  value?: string;      // 选项值（默认使用 label）
  description?: string; // 描述信息
}
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

详细的测试文档请查看 [docs/TESTING.md](docs/TESTING.md)

**测试覆盖**:
- ✅ IntroductionStageProvider: 36 个测试用例
- ✅ IssueProvider: 完整的单元测试
- ✅ 配置管理、数据转换、错误处理、边界情况

### 打包

```bash
npm install -g @vscode/vsce
vsce package
```

## 架构说明

### 为什么采用独立 Provider 架构？

1. **关注点分离**: 每个 Provider 专注于一个数据源
2. **易于扩展**: 添加新 Provider 不影响现有功能
3. **独立测试**: 每个 Provider 可以单独测试
4. **灵活组合**: 用户可以选择性地启用/禁用 Provider
5. **遵循设计模式**: 符合 VSCode 扩展生态的最佳实践

### Provider 注册流程

```
扩展激活
  ↓
获取主插件 API
  ↓
创建 Provider 实例
  ↓
调用 registerDynamicOptionsProvider
  ↓
主插件将 Provider 加入注册表
  ↓
用户打开编辑器时，主插件调用 provideOptions
```

### 与主插件的关系

```
vscode-commit-message-editor (主插件)
    ├── 提供 API: registerDynamicOptionsProvider
    ├── 管理 Provider 注册表
    ├── 处理 Provider 调用和缓存
    └── 渲染 UI 和错误处理

hecom-cme-provider (本扩展)
    ├── 实现 DynamicOptionsProvider 接口
    ├── 注册 Provider 到主插件
    └── 提供具体的业务数据
```

## 常见问题

### Q: Provider 未注册成功？

A: 检查：
1. 主插件是否已安装并激活
2. 主插件版本是否支持 `DynamicOptionsProvider` API
3. Provider ID 是否唯一
4. 查看 VSCode 开发者工具的错误信息

### Q: Issue 列表为空？

A: 检查：
1. 华为云配置是否正确（AK/SK/ProjectId/Region）
2. 网络连接是否正常
3. ProjectId 是否有权限访问
4. 查看控制台日志获取详细错误信息

### Q: 如何调试 Provider？

A: 
1. 按 F5 启动扩展开发主机
2. 打开开发者工具（帮助 → 切换开发人员工具）
3. 查看控制台输出和网络请求
4. 在 Provider 代码中添加断点

### Q: 如何处理敏感信息（AK/SK）？

A:
1. 不要将 AK/SK 提交到代码仓库
2. 使用 VSCode 的 Settings（用户设置或工作区设置）
3. 生产环境建议使用 VSCode SecretStorage API
4. 考虑从环境变量读取凭证

## 安全考虑

- Provider 代码在 VSCode 扩展沙箱中运行
- 敏感信息（API Token）通过配置管理，不暴露在代码中
- 支持从环境变量读取凭证
- 建议使用 VSCode SecretStorage API 存储敏感信息

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT
