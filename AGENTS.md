# AGENTS.md - 代码库指南

本文档为 AI 代码助手提供代码库规范和指南。

## 项目概述

Hecom CME Provider 是 VSCode Commit Message Editor 的扩展插件，实现 DynamicOptionsProvider 接口，为提交消息编辑器提供华为云 CodeArts 数据源。

**架构**: 独立 Provider 架构，每个 Provider 独立实现接口，通过主插件 API 注册。

## 项目配置

### 初始化设置

首次克隆项目后，运行：
```bash
npm install            # 安装依赖
npm run prepare        # 初始化 Git hooks（husky）
```

### 代码质量工具

**ESLint**: 代码风格检查工具
- 配置文件: `.eslintrc.json`
- 规则: TypeScript 严格模式，分号、花括号、等值比较等

**Prettier**: 代码格式化工具
- 配置文件: `.prettierrc.json`
- 规则: 单引号、分号、2 空格缩进、100 字符行宽

**Commitlint**: Git 提交消息规范检查
- 配置文件: `commitlint.config.js`
- 规范: 遵循 Conventional Commits 规范
- 提交格式: `<type>(<scope>): <subject>`
- 类型: feat, fix, docs, style, refactor, perf, test, chore, revert, build, ci

**Husky**: Git 钩子管理
- 配置目录: `.husky/`
- pre-commit: 运行 lint 检查
- commit-msg: 运行 commitlint 检查

**EditorConfig**: 编辑器配置统一
- 配置文件: `.editorconfig`
- 规则: UTF-8、LF 换行、2 空格缩进

### VSCode 配置

**调试配置** (`.vscode/launch.json`):
- `Run Extension`: 启动扩展开发主机
- `Extension Tests`: 运行扩展测试

**任务配置** (`.vscode/tasks.json`):
- 默认构建任务: `npm run watch`（监视模式编译）

**工作区设置** (`.vscode/settings.example.json`):
- 复制为 `.vscode/settings.json` 并填入实际配置
- 包含华为云 AK/SK/ProjectId 等敏感信息
- `.vscode/settings.json` 已加入 `.gitignore`

## 构建与测试命令

### 编译
```bash
npm run compile        # 编译 TypeScript
npm run watch          # 监视模式编译
npm run vscode:prepublish  # 发布前构建
```

### 代码检查与格式化
```bash
npm run lint           # 运行 ESLint 检查
npm run lint:fix       # 自动修复 ESLint 问题
npm run format         # 格式化代码（Prettier）
npm run format:check   # 检查代码格式
```

### 测试
```bash
npm test               # 运行所有测试
npm run pretest        # 编译并 lint（测试前自动执行）
```

**运行单个测试**: VSCode 扩展测试使用 Mocha，无法直接运行单个测试文件。需通过 VSCode 测试 UI 或修改 `src/test/suite/index.ts` 中的 glob 模式来指定测试文件。

### 打包
```bash
npm run package        # 打包为 .vsix 文件（需要全局安装 @vscode/vsce）
```

### 调试
按 F5 启动扩展开发主机，在新窗口中测试扩展功能。使用 VSCode 开发者工具查看日志。

## 代码风格指南

### 导入规范

1. **导入顺序**: 标准库 → 第三方库 → 本地模块
```typescript
import * as vscode from 'vscode';
import { SomeClass } from '@huaweicloud/huaweicloud-sdk-projectman';
import { LocalClass } from './local-module';
```

2. **类型导入**: 使用 `type` 关键字导入类型
```typescript
import type { DynamicOptionItem, DynamicOptionsContext } from '../types/cme-api';
```

3. **路径**: 使用相对路径导入本地模块，使用 `../` 导航到父目录

### 格式化

- **分号**: 必须使用分号（ESLint `@typescript-eslint/semi: warn`）
- **引号**: 单引号优先，字符串中包含单引号时使用双引号
- **缩进**: 2 空格
- **花括号**: 所有控制语句必须使用花括号（ESLint `curly: warn`）
- **比较**: 使用 `===` 和 `!==`（ESLint `eqeqeq: warn`）
- **行尾空格**: 移除行尾空格
- **文件结尾**: 文件以换行符结尾

### TypeScript 类型规范

1. **严格模式**: 启用 `strict` 模式（tsconfig.json）
2. **类型注解**: 
   - 函数参数和返回值必须有类型注解
   - 局部变量可推断类型时可省略
   - 避免使用 `any`，使用 `unknown` 或具体类型
3. **接口 vs 类型别名**: 接口用于对象形状定义，类型别名用于联合类型和复杂类型
4. **可选属性**: 使用 `?` 标记可选属性
5. **`@ts-ignore`**: 仅在必要时使用（如第三方库类型定义不完整），并添加注释说明原因

### 命名约定

- **类**: PascalCase（如 `IssueProvider`, `UserInfoManager`）
- **接口**: PascalCase，无 `I` 前缀（如 `DynamicOptionsProvider`）
- **函数/方法**: camelCase（如 `provideOptions`, `getClient`）
- **变量**: camelCase（如 `projectId`, `clientManager`）
- **常量**: UPPER_SNAKE_CASE（如 `DEFAULT_TIMEOUT`）
- **私有成员**: camelCase，无下划线前缀（TypeScript 使用 `private` 关键字）
- **文件名**: PascalCase 用于类文件（如 `IssueProvider.ts`），camelCase 用于工具文件（如 `logger.ts`）

### 注释规范

1. **文件头注释**: 类文件应有简短描述
```typescript
/**
 * 华为云 CodeArts Issue Provider
 * 
 * 实现 DynamicOptionsProvider 接口，从华为云 CodeArts 获取 Issue 列表
 */
```

2. **JSDoc**: 公共 API 和接口方法需要 JSDoc 注释
```typescript
/**
 * 实现 DynamicOptionsProvider 接口
 * 提供 Issue 选项列表
 */
async provideOptions(context: DynamicOptionsContext): Promise<DynamicOptionItem[]>
```

3. **行内注释**: 用于解释复杂逻辑，避免显而易见的注释
4. **中文注释**: 本项目使用中文注释

### 错误处理

1. **错误抛出**: 使用 `Error` 对象，提供清晰的错误消息
```typescript
throw new Error('华为云配置不完整，请在设置中配置 AK/SK、DomainId 和 ProjectId');
```

2. **错误捕获**: 捕获具体错误类型，避免空 catch 块
```typescript
try {
  await someOperation();
} catch (error) {
  logger.error('Tag', '操作失败', error);
  throw new Error(`操作失败: ${error instanceof Error ? error.message : String(error)}`);
}
```

3. **错误消息**: 
   - 明确指出问题所在
   - 提供解决建议
   - 避免暴露敏感信息
   - 使用中文描述

4. **日志记录**: 使用 `logger` 工具记录错误，不使用 `console.log`
```typescript
logger.error('IssueProvider', '获取 Issue 列表失败', error);
```

### 异步处理

1. **Async/Await**: 优先使用 `async/await` 而非 Promise 链
2. **取消支持**: 检查 `cancellationToken` 状态
```typescript
if (context.cancellationToken?.isCancellationRequested) {
  logger.info('Provider', '请求已被取消');
  return [];
}
```

3. **错误传播**: 让错误冒泡到调用方，由主插件处理

### 单例模式

使用静态 `getInstance()` 方法实现单例：
```typescript
class Manager {
  private static instance: Manager;
  
  private constructor() {}
  
  public static getInstance(): Manager {
    if (!Manager.instance) {
      Manager.instance = new Manager();
    }
    return Manager.instance;
  }
}
```

### 日志规范

使用 `logger` 工具记录日志：
```typescript
logger.info('Tag', '信息消息', optionalData);
logger.warn('Tag', '警告消息', optionalData);
logger.error('Tag', '错误消息', error);
logger.success('Tag', '成功消息', optionalData);
logger.separator(); // 分隔线
```

## 项目结构

```
src/
├── extension.ts                 # 扩展入口，注册 providers
├── types/
│   └── cme-api.ts              # 主插件 API 类型定义
├── clients/
│   ├── ProjectManClientManager.ts  # 华为云客户端管理（单例）
│   └── UserInfoManager.ts          # 用户信息管理（单例）
├── providers/
│   ├── IssueProvider.ts            # Issue Provider
│   └── IntroductionStageProvider.ts # 引入阶段 Provider
├── utils/
│   └── logger.ts                   # 日志工具（单例）
└── test/
    ├── runTest.ts                  # 测试运行器
    └── suite/
        ├── index.ts                # 测试套件入口
        ├── IssueProvider.test.ts
        └── IntroductionStageProvider.test.ts
```

## Provider 开发规范

### Provider 实现要点

1. **实现接口**: 实现 `DynamicOptionsProvider` 接口
2. **配置检查**: 在 `provideOptions` 开始时检查配置完整性
3. **取消检查**: 检查 `context.cancellationToken?.isCancellationRequested`
4. **错误处理**: 抛出有意义的错误消息，由主插件处理
5. **返回格式**: 返回 `DynamicOptionItem[]`，包含 `label`、`value`（可选）、`description`（可选）
6. **日志记录**: 记录关键操作和错误

### Provider ID 命名

格式: `<publisher>.<provider-name>`（全小写，使用连字符）

已注册 Provider ID:
- `hecom.huawei-cloud-issues` - 华为云 Issue Provider
- `hecom.introduction-stage` - 引入阶段 Provider

### Provider 注册

在 `extension.ts` 中注册：
```typescript
const provider = new MyProvider();
const disposable = api.registerDynamicOptionsProvider('hecom.provider-id', provider);
context.subscriptions.push(disposable);
```

## 测试规范

### 测试结构

使用 Mocha 测试框架，测试文件命名为 `*.test.ts`。

### 测试套件组织

```typescript
suite('Provider Test Suite', () => {
  suite('子套件名称', () => {
    test('测试用例描述', () => {
      // 测试代码
    });
  });
});
```

### 断言

使用 Node.js `assert` 模块：
```typescript
assert.ok(value); // 值为真
assert.strictEqual(actual, expected); // 严格相等
assert.fail('失败消息'); // 手动失败
```

### 异步测试

```typescript
test('异步测试', async () => {
  const result = await asyncOperation();
  assert.ok(result);
});
```

### 错误测试

```typescript
try {
  await operation();
  assert.fail('应该抛出错误');
} catch (error: any) {
  assert.ok(error.message.includes('预期错误消息'));
}
```

## 配置管理

### 读取配置

```typescript
const config = vscode.workspace.getConfiguration('hecomCmeProvider.huaweiCloud');
const value = config.get<string>('accessKey');
```

### 配置定义

在 `package.json` 的 `contributes.configuration` 中定义。

## 华为云 SDK 使用

### 客户端获取

通过单例获取：
```typescript
const clientManager = ProjectManClientManager.getInstance();
const client = clientManager.getClient();
```

### API 调用

```typescript
const request = new SomeRequest();
request.projectId = projectId;
const response = await client.someMethod(request);
```

### 类型忽略

华为云 SDK 类型定义可能不完整，必要时使用 `@ts-ignore` 并添加注释。

## 性能考虑

- Provider 延迟加载（仅在用户点击时调用）
- 主插件实现会话级缓存，Provider 无需自行缓存
- 支持取消长时间请求（检查 `cancellationToken`）
- 避免阻塞操作

## 安全考虑

- 敏感信息（AK/SK）通过 VSCode 配置管理
- 不在代码中硬编码凭证
- 错误消息不暴露敏感信息
- 支持从环境变量读取凭证（未来改进）
