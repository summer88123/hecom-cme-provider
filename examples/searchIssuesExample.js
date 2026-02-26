const core = require('@huaweicloud/huaweicloud-sdk-core');
const projectman = require("@huaweicloud/huaweicloud-sdk-projectman/v4/public-api");

/**
 * 使用 searchIssues API 查询工作项
 * 
 * 主要变化：
 * 1. 使用 SearchIssuesRequest 替代 ListIssuesV4Request
 * 2. 使用 ListWorkTableIssueRequestV4RequestBody 设置查询条件
 * 3. 响应对象使用 issue_list 字段而不是 issues
 * 4. Issue 对象使用 subject 字段而不是 name
 */

// The AK and SK used for authentication are hard-coded or stored in plaintext, which has great security risks. 
// It is recommended that the AK and SK be stored in ciphertext in configuration files or environment variables 
// and decrypted during use to ensure security.
// In this example, AK and SK are stored in environment variables for authentication. 
// Before running this example, set environment variables CLOUD_SDK_AK and CLOUD_SDK_SK in the local environment
const ak = process.env.CLOUD_SDK_AK;
const sk = process.env.CLOUD_SDK_SK;
const domainId = process.env.CLOUD_SDK_DOMAIN_ID;
const endpoint = "https://projectman-ext.cn-north-4.myhuaweicloud.com";

// 使用 GlobalCredentials 而不是 BasicCredentials
const credentials = new core.GlobalCredentials()
  .withAk(ak)
  .withSk(sk)
  .withDomainId(domainId);

const client = projectman.ProjectManClient.newBuilder()
  .withCredential(credentials)
  .withEndpoint(endpoint)
  .build();

// 创建 SearchIssuesRequest
const request = new projectman.SearchIssuesRequest();

// 创建请求体并设置查询条件
const body = new projectman.ListWorkTableIssueRequestV4RequestBody();

// 设置分页参数
body.withOffset(0);
body.withLimit(100);

// 设置过滤条件（可选）
// 状态ID过滤：1,15,2,13 表示多个状态
body.withStatusId("1,15,2,13");

// 类型ID过滤：2,3 表示多个类型（如：需求、任务等）
body.withTrackerId("2,3");

// 标题搜索（可选）
// body.withSubject("关键词");

// 负责人ID过滤（可选）
// body.withDeveloperId("user_id");

// 创建人ID过滤（可选）
// body.withAuthorId("user_id");

// 优先级ID过滤（可选）
// body.withPriorityId("1,2");

// 日期范围过滤（可选）
// body.withCreatedOn("2024-01-01,2024-12-31");
// body.withUpdatedOn("2024-01-01,2024-12-31");
// body.withDueDate("2024-01-01,2024-12-31");

request.withBody(body);

// 执行查询
const result = client.searchIssues(request);

result.then(response => {
  console.log("查询成功！");
  console.log(`总数: ${response.total || 0}`);
  
  // 注意：响应使用 issue_list 而不是 issues
  const issues = response.issue_list || [];
  console.log(`返回数量: ${issues.length}`);
  
  // 遍历 Issue 列表
  issues.forEach(issue => {
    // 注意：Issue 对象使用 subject 而不是 name
    console.log(`\nID: ${issue.id}`);
    console.log(`标题: ${issue.subject}`);
    console.log(`状态: ${issue.status?.name || '未知'}`);
    console.log(`类型: ${issue.tracker?.name || '未知'}`);
    console.log(`优先级: ${issue.priority?.name || '未知'}`);
    console.log(`负责人: ${issue.developer?.userName || '未分配'}`);
    console.log(`创建时间: ${issue.createdOn || '未知'}`);
  });
  
  console.log("\n完整响应:");
  console.log(JSON.stringify(response, null, 2));
}).catch(ex => {
  console.error("查询失败:");
  console.error("错误信息:", ex.message);
  if (ex.httpStatusCode) {
    console.error("HTTP状态码:", ex.httpStatusCode);
  }
  if (ex.errorCode) {
    console.error("错误码:", ex.errorCode);
  }
  console.error("完整错误:", JSON.stringify(ex, null, 2));
});
