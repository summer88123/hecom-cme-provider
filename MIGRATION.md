# 主插件更名适配说明

## 更新内容

主插件已从 `bendera.commit-message-editor` 更名为 `adam-bender.hecom-commit-message-editor`，以下文件已更新：

### 1. 源代码更新

#### `src/extension.ts`
- ✅ 扩展 ID 已更新：`'bendera.commit-message-editor'` → `'adam-bender.hecom-commit-message-editor'`
- ✅ 注释已更新：反映新的插件名称

```typescript
// 更新前
const cmeExtension = vscode.extensions.getExtension('bendera.commit-message-editor');

// 更新后
const cmeExtension = vscode.extensions.getExtension('adam-bender.hecom-commit-message-editor');
```

### 2. 文档更新

#### `README.md`
- ✅ 链接已更新：指向 GitHub 仓库而非 Marketplace
- ✅ 插件名称已更新：`Commit Message Editor` → `Hecom Commit Message Editor`

#### `QUICKSTART.md`
- ✅ 插件名称已更新
- ✅ 命令说明已更新：`Commit Message Editor: Open` → `Git: Open commit message editor`

#### `DEVELOPMENT.md`
- ✅ 扩展 ID 已更新：文档中的集成说明

### 3. 编译验证

- ✅ 项目已重新编译成功
- ✅ 无编译错误
- ✅ 输出文件已更新（`out/extension.js`）

## 主要变更点

| 项目 | 旧值 | 新值 |
|------|------|------|
| 扩展 ID | `bendera.commit-message-editor` | `adam-bender.hecom-commit-message-editor` |
| 显示名称 | Commit Message Editor | Hecom Commit Message Editor |
| Publisher | bendera | adam-bender |
| Package Name | commit-message-editor | hecom-commit-message-editor |

## 兼容性说明

- ✅ Provider 现在会正确查找新的主插件 ID
- ✅ 如果主插件未安装，会显示适当的警告消息
- ✅ 支持主插件的异步激活流程
- ✅ 向后兼容：如果 API 不可用，会给出友好提示

## 测试建议

1. 确保主插件 `hecom-commit-message-editor` 已安装
2. 在扩展开发主机中激活本 provider
3. 检查控制台输出是否显示：
   - "Hecom CME Provider 已激活"
   - "Hecom CME Provider 注册成功"
4. 打开 Commit Message Editor 验证选项是否正确加载

## 下一步

- 在主插件中实现 `registerOptionsProvider` API
- 定义统一的 Provider 接口规范
- 测试完整的集成流程
