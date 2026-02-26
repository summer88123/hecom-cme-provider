# 开发文档

## 项目架构

### 核心文件

- `src/extension.ts`: 扩展入口点，负责激活和注册 provider
- `src/HecomOptionsProvider.ts`: Provider 实现，提供动态选项

### Provider 接口

HecomOptionsProvider 实现以下方法：

#### `getTypeOptions()`
返回提交类型选项（feat, fix, docs 等）

#### `getScopeOptions()`
根据项目类型和变更文件返回 scope 选项

#### `getDynamicConfig()`
返回完整的动态配置对象，包括：
- `staticTemplate`: 静态模板字段
- `dynamicTemplate`: 动态模板格式
- `tokens`: 表单字段定义

### 项目类型检测

Provider 通过以下方式检测项目类型：

1. 读取 `package.json`
2. 检查关键依赖：
   - `react-native` → mobile
   - `react`, `vue`, `@angular/core` → frontend
   - `express`, `koa`, `fastify`, `nestjs` → backend
   - 其他 → common

### 智能推荐机制

根据 Git 变更文件推荐 scope：

1. 获取当前工作区的变更文件列表
2. 提取文件路径中的目录名
3. 过滤常见的顶层目录（src, dist 等）
4. 返回最多 5 个推荐的 scope

## 与主插件集成

### 注册流程

1. 扩展激活时获取主插件（adam-bender.hecom-commit-message-editor）
2. 等待主插件激活
3. 调用主插件暴露的 `registerOptionsProvider` API
4. 传入 provider 实例

### API 要求

主插件需要暴露以下 API：

```typescript
interface CommitMessageEditorAPI {
  registerOptionsProvider(id: string, provider: any): void;
}
```

### Provider 接口规范

```typescript
interface DynamicOptionsProvider {
  getTypeOptions(): Promise<Array<{
    label: string;
    value: string;
    description?: string;
  }>>;
  
  getScopeOptions(): Promise<Array<{
    label: string;
    value: string;
    description?: string;
  }>>;
  
  getDynamicConfig(): Promise<{
    staticTemplate: string[];
    dynamicTemplate: string[];
    tokens: Array<{
      label: string;
      name: string;
      type: string;
      options?: any[];
      description?: string;
      multiline?: boolean;
      maxLength?: number;
      maxLines?: number;
      lines?: number;
    }>;
  }>;
}
```

## 配置项

### `hecomCmeProvider.enabled`
- 类型: `boolean`
- 默认值: `true`
- 说明: 启用或禁用 provider

### `hecomCmeProvider.projectTypes`
- 类型: `string[]`
- 默认值: `['frontend', 'backend', 'mobile', 'common']`
- 说明: 支持的项目类型列表

## 扩展开发

### 添加新的项目类型

1. 在 `detectProjectType()` 中添加检测逻辑
2. 在 `getScopeOptions()` 中添加对应的 scope 选项
3. 更新配置项默认值

### 自定义提交类型

修改 `getTypeOptions()` 方法，添加或删除选项：

```typescript
const options = [
  { label: 'feat', value: 'feat', description: '新功能' },
  { label: 'custom', value: 'custom', description: '自定义类型' },
  // ...
];
```

### 扩展智能推荐

在 `suggestScopesFromFiles()` 中添加更多逻辑：

```typescript
private suggestScopesFromFiles(files: string[]): string[] {
  const scopes = new Set<string>();
  
  for (const file of files) {
    // 添加自定义推荐逻辑
    if (file.includes('feature')) {
      scopes.add('feature');
    }
  }
  
  return Array.from(scopes);
}
```

## 测试

### 本地测试

1. 在 VSCode 中打开项目
2. 按 F5 启动扩展开发主机
3. 在新窗口中打开一个 Git 仓库
4. 使用 Commit Message Editor 创建提交

### 调试

在 `launch.json` 中配置了两个调试配置：

- **Run Extension**: 运行扩展
- **Extension Tests**: 运行测试

## 发布

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

## 故障排除

### Provider 未注册成功

1. 确认主插件已安装并激活
2. 检查主插件版本是否支持动态 provider API
3. 查看 VSCode 开发者工具控制台的错误信息

### 选项未显示

1. 确认 `hecomCmeProvider.enabled` 为 `true`
2. 检查 `getDynamicConfig()` 返回的数据格式
3. 查看主插件是否正确加载了 provider

### 智能推荐不工作

1. 确认当前工作区是 Git 仓库
2. 确认有文件变更
3. 检查 Git 扩展是否可用
