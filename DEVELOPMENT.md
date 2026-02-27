# 开发指南

## 项目概述

本项目是 `vscode-commit-message-editor` 主插件的扩展插件，实现了主插件的 `DynamicOptionsProvider` 接口，为提交消息编辑器提供动态数据源。

### 架构设计

根据主插件的 Provider 注册系统设计，本项目采用**独立 Provider 架构**：

- 每个 Provider 独立实现 `DynamicOptionsProvider` 接口
- Provider 之间完全解耦，互不依赖
- 通过主插件的 `registerDynamicOptionsProvider` API 注册
- 支持多个 Provider 并存

**主插件设计文档**: `/Users/summer/Documents/GitHub/vscode-commit-message-editor/docs/plans/2026-02-26-dynamic-enum-provider-design.md`

### 为什么采用独立 Provider 架构？

1. **关注点分离**: 每个 Provider 专注于一个数据源
2. **易于扩展**: 添加新 Provider 不影响现有功能
3. **独立测试**: 每个 Provider 可以单独测试
4. **灵活组合**: 用户可以选择性地启用/禁用 Provider
5. **遵循设计模式**: 符合 VSCode 扩展生态的最佳实践

## 项目结构

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
├── README.md
└── DEVELOPMENT.md
```

## DynamicOptionsProvider 接口

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

## 添加新的 Provider

### 1. 创建 Provider 类

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
    // 检查取消状态
    if (context.cancellationToken?.isCancellationRequested) {
      return [];
    }

    try {
      // 获取数据
      const data = await this.fetchData();
      
      // 转换为选项格式
      return data.map(item => ({
        label: item.name,
        value: item.id,
      }));
    } catch (error) {
      // 抛出错误，由主插件处理
      throw new Error(`Failed to load options: ${error.message}`);
    }
  }

  private async fetchData() {
    // 实现数据获取逻辑
  }
}
```

### 2. 在 extension.ts 中注册

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

### 3. 在主插件配置中使用

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

### Provider ID 命名规范

**格式**: `<publisher>.<provider-name>`

**示例**:
- `hecom.huawei-cloud-issues` - 华为云 Issue Provider
- `hecom.gitlab-mrs` - GitLab MR Provider
- `hecom.jira-tasks` - Jira Task Provider

**注意事项**:
- 必须全局唯一
- 使用小写字母和连字符
- 前缀使用发布者 ID

## 开发工作流

### 安装依赖

```bash
npm install
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

### 调试

1. 按 F5 启动扩展开发主机
2. 打开开发者工具（帮助 → 切换开发人员工具）
3. 查看控制台输出和网络请求
4. 在 Provider 代码中添加断点

### 打包

```bash
npm install -g @vscode/vsce
vsce package
```

## 架构说明

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

### 数据流

```
用户打开编辑器
  ↓
用户点击 dynamic-enum 字段
  ↓
主插件触发加载
  ↓
主插件创建 context
  ↓
主插件调用 provider.provideOptions(context)
  ↓
Provider 返回选项数组
  ↓
主插件缓存结果
  ↓
主插件渲染选项列表
```

## Provider 实现细节

### 华为云 CodeArts Issue Provider

**Provider ID**: `hecom.huawei-cloud-issues`

**实现文件**: `src/providers/IssueProvider.ts`

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

**实现文件**: `src/providers/IntroductionStageProvider.ts`

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

## 配置管理

### 读取配置

```typescript
const config = vscode.workspace.getConfiguration('hecomCmeProvider');
const apiKey = config.get<string>('myService.apiKey');
const apiUrl = config.get<string>('myService.apiUrl', 'https://default.com');
```

### 监听配置变更

```typescript
constructor() {
  vscode.workspace.onDidChangeConfiguration((e) => {
    if (e.affectsConfiguration('hecomCmeProvider.myService')) {
      this.reloadConfig();
    }
  });
}
```

### 在 package.json 中定义配置

```json
{
  "contributes": {
    "configuration": {
      "properties": {
        "hecomCmeProvider.myService.apiKey": {
          "type": "string",
          "default": "",
          "description": "API Key for My Service"
        }
      }
    }
  }
}
```

## 错误处理

### Provider 错误处理策略

```typescript
async provideOptions(context: DynamicOptionsContext): Promise<DynamicOptionItem[]> {
  // 1. 配置验证
  if (!this.isConfigured()) {
    throw new Error('Provider not configured. Please set API credentials in settings.');
  }

  // 2. 取消检查
  if (context.cancellationToken?.isCancellationRequested) {
    return [];
  }

  try {
    // 3. 数据获取
    const data = await this.fetchData();
    return this.transformData(data);
  } catch (error) {
    // 4. 错误包装
    throw new Error(`Failed to fetch data: ${error.message}`);
  }
}
```

### 主插件的错误处理

主插件会自动处理 Provider 抛出的错误：

1. **显示错误消息**: 在 UI 上显示友好的错误信息
2. **提供重试按钮**: 用户可以手动重试
3. **Fallback 机制**: 自动降级为文本输入框

### 错误消息最佳实践

- ✅ 明确指出问题所在
- ✅ 提供解决建议
- ✅ 包含相关上下文信息
- ❌ 避免技术细节过多
- ❌ 避免暴露敏感信息

## 性能优化

### 延迟加载

数据仅在用户点击下拉框时加载，避免启动时的性能开销。

### 取消支持

```typescript
async provideOptions(context: DynamicOptionsContext): Promise<DynamicOptionItem[]> {
  const controller = new AbortController();
  
  context.cancellationToken?.onCancellationRequested(() => {
    controller.abort();
  });

  const response = await fetch(url, {
    signal: controller.signal
  });
  
  // ...
}
```

### 会话级缓存

主插件自动实现会话级缓存，Provider 无需自行缓存。

### 超时控制

主插件默认超时 30 秒，Provider 应该：
- 响应取消令牌
- 避免长时间阻塞操作
- 考虑实现自己的超时机制

## 测试策略

### 单元测试

测试 Provider 的数据转换逻辑：

```typescript
import { MyProvider } from './MyProvider';

suite('MyProvider', () => {
  test('should transform data correctly', async () => {
    const provider = new MyProvider();
    const result = await provider.provideOptions({
      tokenValues: {},
    });
    
    assert.strictEqual(result.length, 3);
    assert.strictEqual(result[0].label, 'Option 1');
  });
});
```

### 集成测试

测试与主插件的集成：

```typescript
suite('Provider Integration', () => {
  test('should register provider successfully', async () => {
    const extension = vscode.extensions.getExtension('hecom.hecom-commit-message-editor');
    const api = await extension.activate();
    
    const provider = new MyProvider();
    const disposable = api.registerDynamicOptionsProvider('test.provider', provider);
    
    // 验证注册成功
    assert.ok(disposable);
    disposable.dispose();
  });
});
```

### E2E 测试

在真实环境中测试完整流程：

1. 启动扩展开发主机（F5）
2. 打开 Commit Message Editor
3. 验证选项加载
4. 测试错误场景
5. 验证 fallback 机制

## 调试技巧

### 启用日志

```typescript
console.log('[MyProvider] Loading options...');
console.error('[MyProvider] Error:', error);
```

### 使用 VSCode 调试器

1. 在 Provider 代码中设置断点
2. 按 F5 启动调试
3. 在新窗口中触发 Provider 调用
4. 调试器会在断点处暂停

### 查看网络请求

在开发者工具（帮助 → 切换开发人员工具）的 Network 标签中查看 HTTP 请求。

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

### Q: 如何处理敏感信息（AK/SK）？

A:
1. 不要将 AK/SK 提交到代码仓库
2. 使用 VSCode 的 Settings（用户设置或工作区设置）
3. 生产环境建议使用 VSCode SecretStorage API
4. 考虑从环境变量读取凭证

## 发布流程

### 打包

```bash
npm install -g @vscode/vsce
vsce package
```

### 发布到 Marketplace

```bash
vsce publish
```

需要先创建 [Personal Access Token](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)。

### 版本管理

遵循语义化版本：
- `MAJOR.MINOR.PATCH`
- 主插件 API 变更时更新 MAJOR
- 添加新 Provider 时更新 MINOR
- Bug 修复时更新 PATCH

## 最佳实践

### Provider 设计

1. **单一职责**: 每个 Provider 只负责一个数据源
2. **快速响应**: 避免长时间阻塞操作
3. **错误友好**: 提供清晰的错误消息
4. **配置验证**: 在初始化时验证配置
5. **资源清理**: 在 dispose 时清理资源

### 配置管理

1. **默认值**: 为所有配置提供合理的默认值
2. **验证**: 在使用前验证配置有效性
3. **敏感信息**: 使用 SecretStorage 存储敏感信息
4. **文档**: 在 package.json 中添加清晰的描述

### 错误处理

1. **具体**: 错误消息应该具体明确
2. **可操作**: 提供解决问题的建议
3. **不泄露**: 避免暴露敏感信息
4. **分类**: 区分配置错误、网络错误等

### 性能

1. **按需加载**: 只在需要时加载数据
2. **响应取消**: 支持 CancellationToken
3. **数据分页**: 对大量数据进行分页
4. **缓存利用**: 利用主插件的缓存机制

## 安全考虑

- Provider 代码在 VSCode 扩展沙箱中运行
- 敏感信息（API Token）通过配置管理，不暴露在代码中
- 支持从环境变量读取凭证
- 建议使用 VSCode SecretStorage API 存储敏感信息

## 参考资源

- [VSCode 扩展 API](https://code.visualstudio.com/api)
- [主插件设计文档](/Users/summer/Documents/GitHub/vscode-commit-message-editor/docs/plans/2026-02-26-dynamic-enum-provider-design.md)
- [TypeScript 文档](https://www.typescriptlang.org/docs/)
- [华为云 SDK](https://github.com/huaweicloud/huaweicloud-sdk-nodejs-v3)

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT
