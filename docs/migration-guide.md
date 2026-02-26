# 从 listIssuesV4 迁移到 searchIssues

本文档说明如何将华为云 ProjectMan SDK 的 `listIssuesV4` API 替换为 `searchIssues` API。

## 主要变化

### 1. 导入的类

**旧代码（listIssuesV4）：**
```typescript
import { ListIssuesV4Request } from '@huaweicloud/huaweicloud-sdk-projectman/v4/model/ListIssuesV4Request';
```

**新代码（searchIssues）：**
```typescript
import { SearchIssuesRequest } from '@huaweicloud/huaweicloud-sdk-projectman/v4/model/SearchIssuesRequest';
import { ListWorkTableIssueRequestV4RequestBody } from '@huaweicloud/huaweicloud-sdk-projectman/v4/model/ListWorkTableIssueRequestV4RequestBody';
```

### 2. 认证方式

**旧代码（使用 BasicCredentials + projectId）：**
```typescript
const credentials = new BasicCredentials()
  .withAk(ak)
  .withSk(sk)
  .withProjectId(projectId);
```

**新代码（使用 GlobalCredentials + domainId）：**
```typescript
const credentials = new GlobalCredentials()
  .withAk(ak)
  .withSk(sk)
  .withDomainId(domainId);
```

### 3. 创建请求对象

**旧代码（listIssuesV4）：**
```typescript
const request = new ListIssuesV4Request();
request.projectId = projectId;
request.offset = 0;
request.limit = 100;
```

**新代码（searchIssues）：**
```typescript
const request = new SearchIssuesRequest();
const body = new ListWorkTableIssueRequestV4RequestBody();

body.withOffset(0);
body.withLimit(100);

// 可选的过滤条件
body.withStatusId("1,15,2,13");  // 状态ID（多个用逗号分隔）
body.withTrackerId("2,3");       // 类型ID
body.withSubject("关键词");       // 标题搜索
body.withDeveloperId("user_id"); // 负责人ID
body.withAuthorId("user_id");    // 创建人ID
body.withPriorityId("1,2");      // 优先级ID

request.withBody(body);
```

### 4. 调用 API

**旧代码：**
```typescript
const response = await client.listIssuesV4(request);
```

**新代码：**
```typescript
const response = await client.searchIssues(request);
```

### 5. 处理响应数据

**旧代码：**
```typescript
const issues = response.issues || [];

issues.forEach(issue => {
  console.log(issue.name);        // 使用 name 字段
  console.log(issue.status?.name);
});
```

**新代码：**
```typescript
const issues = response.issue_list || [];  // 注意：字段名改为 issue_list

issues.forEach(issue => {
  console.log(issue.subject);     // 使用 subject 字段
  console.log(issue.status?.name);
});
```

## 完整对比示例

### listIssuesV4（旧方式）

```javascript
const core = require('@huaweicloud/huaweicloud-sdk-core');
const projectman = require("@huaweicloud/huaweicloud-sdk-projectman/v4/public-api");

const ak = process.env.CLOUD_SDK_AK;
const sk = process.env.CLOUD_SDK_SK;
const projectId = process.env.CLOUD_SDK_PROJECT_ID;

const credentials = new core.BasicCredentials()
  .withAk(ak)
  .withSk(sk)
  .withProjectId(projectId);

const client = projectman.ProjectManClient.newBuilder()
  .withCredential(credentials)
  .withEndpoint("https://projectman-ext.cn-north-4.myhuaweicloud.com")
  .build();

const request = new projectman.ListIssuesV4Request();
request.projectId = projectId;

client.listIssuesV4(request)
  .then(response => {
    const issues = response.issues || [];
    issues.forEach(issue => {
      console.log(`${issue.id}: ${issue.name}`);
    });
  })
  .catch(console.error);
```

### searchIssues（新方式）

```javascript
const core = require('@huaweicloud/huaweicloud-sdk-core');
const projectman = require("@huaweicloud/huaweicloud-sdk-projectman/v4/public-api");

const ak = process.env.CLOUD_SDK_AK;
const sk = process.env.CLOUD_SDK_SK;
const domainId = process.env.CLOUD_SDK_DOMAIN_ID;

const credentials = new core.GlobalCredentials()
  .withAk(ak)
  .withSk(sk)
  .withDomainId(domainId);

const client = projectman.ProjectManClient.newBuilder()
  .withCredential(credentials)
  .withEndpoint("https://projectman-ext.cn-north-4.myhuaweicloud.com")
  .build();

const request = new projectman.SearchIssuesRequest();
const body = new projectman.ListWorkTableIssueRequestV4RequestBody();

body.withOffset(0);
body.withLimit(100);
body.withStatusId("1,15,2,13");
body.withTrackerId("2,3");

request.withBody(body);

client.searchIssues(request)
  .then(response => {
    const issues = response.issue_list || [];
    console.log(`总数: ${response.total}`);
    issues.forEach(issue => {
      console.log(`${issue.id}: ${issue.subject}`);
    });
  })
  .catch(console.error);
```

## ListWorkTableIssueRequestV4RequestBody 可用的过滤字段

- `offset`: 偏移量
- `limit`: 每页数量
- `subject`: 标题关键词搜索
- `createdOn`: 创建时间范围（格式：`"2024-01-01,2024-12-31"`）
- `updatedOn`: 更新时间范围
- `closedOn`: 关闭时间范围
- `startDate`: 开始日期范围
- `dueDate`: 截止日期范围
- `trackerId`: 类型ID（多个用逗号分隔，如：`"2,3"`）
- `statusId`: 状态ID（多个用逗号分隔，如：`"1,15,2,13"`）
- `authorId`: 创建人ID
- `developerId`: 负责人ID
- `priorityId`: 优先级ID

## SearchIssuesResponse 响应字段

- `issue_list`: Issue 数组（注意不是 `issues`）
- `total`: 总数

## WorkTableIssuseListResponseBodyissue_list（Issue 对象）主要字段

- `id`: Issue ID
- `subject`: 标题（注意不是 `name`）
- `status`: 状态对象
  - `name`: 状态名称
- `tracker`: 类型对象
  - `name`: 类型名称
- `priority`: 优先级对象
  - `name`: 优先级名称
- `developer`: 负责人对象
  - `userName`: 用户名
- `author`: 创建人对象
  - `userName`: 用户名
- `createdOn`: 创建时间
- `updatedOn`: 更新时间
- `dueDate`: 截止日期

## 迁移检查清单

- [ ] 更新 import 语句
- [ ] 修改认证方式（BasicCredentials → GlobalCredentials）
- [ ] 修改 projectId → domainId
- [ ] 创建 ListWorkTableIssueRequestV4RequestBody
- [ ] 使用 body.withXxx() 方法设置过滤条件
- [ ] 调用 searchIssues 而不是 listIssuesV4
- [ ] 修改响应处理（issues → issue_list）
- [ ] 修改字段访问（name → subject）
- [ ] 测试新的 API 调用
