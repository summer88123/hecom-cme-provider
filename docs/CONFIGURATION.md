# Provider 配置示例

本文档展示如何在主插件中配置使用本扩展提供的 Provider。

## 华为云 CodeArts Issue Provider

### Provider ID

`hecom.huawei-cloud-issues`

### 配置示例

在主插件（Commit Message Editor）的 `commit-message-editor.tokens` 配置中添加：

```json
{
  "commit-message-editor.tokens": [
    {
      "label": "Type",
      "name": "type",
      "type": "enum",
      "options": [
        { "label": "feat", "value": "feat", "description": "新功能" },
        { "label": "fix", "value": "fix", "description": "Bug 修复" },
        { "label": "docs", "value": "docs", "description": "文档变更" },
        { "label": "style", "value": "style", "description": "代码格式" },
        { "label": "refactor", "value": "refactor", "description": "重构" },
        { "label": "test", "value": "test", "description": "测试相关" },
        { "label": "chore", "value": "chore", "description": "其他杂项" }
      ]
    },
    {
      "label": "Scope",
      "name": "scope",
      "type": "text",
      "description": "影响范围",
      "maxLength": 50
    },
    {
      "label": "Issue",
      "name": "issue",
      "type": "dynamic-enum",
      "provider": "hecom.huawei-cloud-issues",
      "description": "选择关联的华为云 CodeArts Issue",
      "optional": true
    },
    {
      "label": "Subject",
      "name": "subject",
      "type": "text",
      "description": "简短描述",
      "maxLength": 100
    },
    {
      "label": "Body",
      "name": "body",
      "type": "text",
      "description": "详细描述",
      "multiline": true,
      "maxLines": 20
    }
  ],
  "commit-message-editor.template": [
    "{type}({scope}): {subject}",
    "",
    "{body}",
    "",
    "Related Issue: {issue}"
  ]
}
```

### 华为云凭证配置

在 VSCode 设置中配置华为云凭证：

```json
{
  "hecomCmeProvider.huaweiCloud.accessKey": "YOUR_AK",
  "hecomCmeProvider.huaweiCloud.secretKey": "YOUR_SK",
  "hecomCmeProvider.huaweiCloud.projectId": "YOUR_PROJECT_ID",
  "hecomCmeProvider.huaweiCloud.region": "cn-north-4"
}
```

**注意**: 不要将 AK/SK 提交到代码仓库中。建议：

1. 使用用户级别的 VSCode 设置（而非工作区设置）
2. 或使用 `.vscode/settings.json` 并将其加入 `.gitignore`
3. 生产环境建议使用 VSCode SecretStorage API

### 完整示例

结合完整的提交消息编辑器配置：

```json
{
  // 华为云 CodeArts 凭证
  "hecomCmeProvider.huaweiCloud.accessKey": "YOUR_AK",
  "hecomCmeProvider.huaweiCloud.secretKey": "YOUR_SK",
  "hecomCmeProvider.huaweiCloud.projectId": "YOUR_PROJECT_ID",
  "hecomCmeProvider.huaweiCloud.region": "cn-north-4",

  // 主插件配置
  "commit-message-editor.tokens": [
    {
      "label": "Type",
      "name": "type",
      "type": "enum",
      "options": [
        { "label": "feat", "value": "feat", "description": "新功能" },
        { "label": "fix", "value": "fix", "description": "Bug 修复" },
        { "label": "docs", "value": "docs", "description": "文档变更" },
        { "label": "refactor", "value": "refactor", "description": "重构" }
      ]
    },
    {
      "label": "Issue",
      "name": "issue",
      "type": "dynamic-enum",
      "provider": "hecom.huawei-cloud-issues",
      "description": "选择关联的 Issue"
    },
    {
      "label": "Subject",
      "name": "subject",
      "type": "text",
      "description": "简短描述",
      "maxLength": 100
    }
  ],
  "commit-message-editor.template": [
    "{type}: {subject}",
    "",
    "Issue: {issue}"
  ]
}
```

## 未来 Provider 示例

### GitLab MR Provider (计划中)

```json
{
  "label": "Merge Request",
  "name": "mr",
  "type": "dynamic-enum",
  "provider": "hecom.gitlab-mrs",
  "description": "选择关联的 GitLab MR"
}
```

### Jira Issue Provider (计划中)

```json
{
  "label": "Jira Issue",
  "name": "jira",
  "type": "dynamic-enum",
  "provider": "hecom.jira-issues",
  "description": "选择关联的 Jira Issue"
}
```

## 配置文件位置

### 用户设置

全局配置，对所有项目生效：

- **macOS**: `~/Library/Application Support/Code/User/settings.json`
- **Windows**: `%APPDATA%\Code\User\settings.json`
- **Linux**: `~/.config/Code/User/settings.json`

或通过 VSCode: `Code > Preferences > Settings > User`

### 工作区设置

仅对当前项目生效：

`.vscode/settings.json`

**推荐**: 将主插件配置放在工作区设置中，凭证配置放在用户设置中。

## 故障排除

### Issue 列表为空

1. 检查华为云配置是否正确
2. 检查 Project ID 是否有权限
3. 检查网络连接
4. 查看控制台日志

### Provider 未找到

错误消息: `Provider "hecom.huawei-cloud-issues" 未找到`

解决方案:
1. 确保本扩展已安装并激活
2. 检查 Provider ID 拼写是否正确
3. 重启 VSCode

### 加载超时

Provider 默认超时 30 秒，如果超时：

1. 检查网络连接速度
2. 检查华为云 API 响应时间
3. 考虑减少返回的 Issue 数量（在 Provider 代码中配置）

## 高级配置

### 自定义模板格式

根据需要调整提交消息模板：

```json
{
  "commit-message-editor.template": [
    "{type}({scope}): {subject}",
    "",
    "{body}",
    "",
    "Closes: #{issue}",
    "Co-authored-by: {author}"
  ]
}
```

### 条件显示 Issue

使用 `optional: true` 使 Issue 字段可选：

```json
{
  "label": "Issue",
  "name": "issue",
  "type": "dynamic-enum",
  "provider": "hecom.huawei-cloud-issues",
  "optional": true
}
```

### 多个 Provider

可以同时配置多个 Provider：

```json
{
  "commit-message-editor.tokens": [
    {
      "label": "华为云 Issue",
      "name": "hwIssue",
      "type": "dynamic-enum",
      "provider": "hecom.huawei-cloud-issues"
    },
    {
      "label": "Jira Issue",
      "name": "jiraIssue",
      "type": "dynamic-enum",
      "provider": "hecom.jira-issues"
    }
  ]
}
```

## 参考资源

- [主插件 Provider 设计文档](/Users/summer/Documents/GitHub/vscode-commit-message-editor/docs/plans/2026-02-26-dynamic-enum-provider-design.md)
- [VSCode 配置文档](https://code.visualstudio.com/docs/getstarted/settings)
- [华为云 CodeArts 文档](https://support.huaweicloud.com/devcloud/index.html)
