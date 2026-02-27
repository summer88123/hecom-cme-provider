# Hecom CME Provider

为 **Hecom Commit Message Editor** 提供动态选项 Provider 扩展。

## 简介

本项目是 [Hecom Commit Message Editor](https://marketplace.visualstudio.com/items?itemName=hecom.hecom-commit-message-editor) 主插件的扩展插件，为提交消息编辑器提供动态数据源。

## 功能特性

- 🔗 **Issue Provider**: 从华为云 CodeArts 获取 Issue 列表
- 🎯 **引入阶段 Provider**: 从华为云 CodeArts 获取"引入阶段"自定义字段选项

## 使用方法

### 前置要求

- VSCode >= 1.74.0
- **Hecom Commit Message Editor** 扩展（支持 DynamicOptionsProvider API 的版本）

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

### 引入阶段 Provider

**Provider ID**: `hecom.introduction-stage`

**功能**: 从华为云 CodeArts 项目中获取"引入阶段"自定义字段的选项列表

**返回格式**:
```typescript
{
  label: "2501",
  value: "2501",
  description: "引入阶段: 2501"
}
```

## 开发文档

如果你想扩展或自定义 Provider，请查看 [开发文档](DEVELOPMENT.md)。

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT
