# 开发文档

## 项目架构

### 核心概念

本项目是 `vscode-commit-message-editor` 主插件的扩展插件，基于主插件的 **Dynamic Options Provider** 架构设计。

**主插件设计文档**: `/Users/summer/Documents/GitHub/vscode-commit-message-editor/docs/plans/2026-02-26-dynamic-enum-provider-design.md`

### 架构原则

1. **独立 Provider**: 每个 Provider 独立实现 `DynamicOptionsProvider` 接口
2. **平级关系**: Provider 之间平级，互不依赖
3. **统一注册**: 所有 Provider 通过主插件的 API 统一注册
4. **标准接口**: 遵循主插件定义的接口规范

### 核心文件

```
src/
├── extension.ts                               # 扩展入口，负责 Provider 注册
├── types/
│   └── cme-api.ts                             # 主插件 API 类型定义（临时）
└── providers/
    └── IssueProvider.ts            # 华为云 Issue Provider 实现
```

## Provider 接口

### DynamicOptionsProvider

```typescript
interface DynamicOptionsProvider {
  /**
   * 提供选项数据
   * @param context 上下文信息
   * @returns 选项数组或 Promise
   */
  provideOptions(
    context: DynamicOptionsContext
  ): DynamicOptionItem[] | Promise<DynamicOptionItem[]>;
}
```

### DynamicOptionsContext

```typescript
interface DynamicOptionsContext {
  /** 当前 Git 仓库路径 */
  repositoryPath?: string;
  
  /** 其他 token 的当前值，支持联动 */
  tokenValues: Record<string, string>;
  
  /** 取消令牌，用于处理长时间请求 */
  cancellationToken?: vscode.CancellationToken;
}
```

### DynamicOptionItem

```typescript
interface DynamicOptionItem {
  /** 显示标签 */
  label: string;
  
  /** 选项值（可选，默认使用 label） */
  value?: string;
  
  /** 描述信息（可选） */
  description?: string;
}
```

## Provider 实现指南

### 基本结构

```typescript
import type {
  DynamicOptionsProvider,
  DynamicOptionsContext,
  DynamicOptionItem,
} from '../types/cme-api';

export class MyProvider implements DynamicOptionsProvider {
  constructor() {
    // 初始化逻辑
  }

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
        description: item.description
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

### 注册 Provider

在 `extension.ts` 中：

```typescript
export function activate(context: vscode.ExtensionContext) {
  // 获取主插件 API
  const cmeExtension = vscode.extensions.getExtension('hecom.hecom-commit-message-editor');
  
  const registerProviders = async () => {
    const api = await cmeExtension.activate();
    
    // 创建并注册 Provider
    const myProvider = new MyProvider();
    const disposable = api.registerDynamicOptionsProvider(
      'hecom.my-provider',  // Provider ID（必须唯一）
      myProvider
    );
    
    // 添加到订阅列表，确保正确清理
    context.subscriptions.push(disposable);
  };
  
  registerProviders();
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

## 与主插件的集成

### 注册流程

```
扩展激活
  ↓
获取主插件扩展对象
  ↓
等待主插件激活
  ↓
获取主插件 API
  ↓
创建 Provider 实例
  ↓
调用 registerDynamicOptionsProvider
  ↓
主插件将 Provider 加入注册表
  ↓
返回 Disposable 对象
  ↓
加入 subscriptions
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

### 配置关联

在主插件配置中引用 Provider：

```json
{
  "commit-message-editor.tokens": [
    {
      "name": "issue",
      "type": "dynamic-enum",
      "provider": "hecom.huawei-cloud-issues",
      "description": "选择关联的 Issue"
    }
  ]
}
```

## 故障排除

### Provider 未注册

**症状**: 控制台没有 "Provider 注册成功" 日志

**排查**:
1. 检查主插件是否已安装
2. 检查主插件版本是否支持 API
3. 查看是否有异常抛出

### 选项未加载

**症状**: 下拉框为空或显示错误

**排查**:
1. 查看控制台错误日志
2. 检查配置是否正确
3. 验证网络连接
4. 检查 Provider ID 是否匹配

### 加载缓慢

**症状**: 点击后长时间无响应

**排查**:
1. 检查网络请求耗时
2. 优化数据获取逻辑
3. 考虑添加缓存
4. 减少返回数据量

### 类型错误

**症状**: TypeScript 编译错误

**解决**:
1. 确保 `types/cme-api.ts` 存在
2. 确保类型定义与主插件一致
3. 运行 `npm run compile` 验证

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

## 参考资源

- [VSCode 扩展 API](https://code.visualstudio.com/api)
- [主插件设计文档](/Users/summer/Documents/GitHub/vscode-commit-message-editor/docs/plans/2026-02-26-dynamic-enum-provider-design.md)
- [TypeScript 文档](https://www.typescriptlang.org/docs/)
- [华为云 SDK](https://github.com/huaweicloud/huaweicloud-sdk-nodejs-v3)
