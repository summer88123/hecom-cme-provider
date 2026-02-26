import { ProjectManClient } from '@huaweicloud/huaweicloud-sdk-projectman/v4/ProjectManClient';
import { GlobalCredentials } from '@huaweicloud/huaweicloud-sdk-core/auth/GlobalCredentials';
import { ListIssuesV4Request } from '@huaweicloud/huaweicloud-sdk-projectman/v4/model/ListIssuesV4Request';
import { ProjectManRegion } from '@huaweicloud/huaweicloud-sdk-projectman/v4/ProjectManRegion';

/**
 * 测试华为云 Issue Provider 连接
 * 
 * 使用方法:
 * npx ts-node src/test-provider.ts
 */
async function testHuaweiCloudConnection() {
  // 从命令行参数或环境变量读取配置
  const accessKey = process.env.HUAWEI_CLOUD_AK || 'HPUAAZEXL1ZFZSLG8WY8';
  const secretKey = process.env.HUAWEI_CLOUD_SK || 'RdNO1tUtrHCjjOmiRYDOkp7CeuKkHwL2pUjodH0i';
  const domainId = process.env.HUAWEI_CLOUD_DOMAIN_ID || 'c39b16df034244438c03a9fe61bcf9cc'; // 认证用的 Domain ID
  const projectId = process.env.HUAWEI_CLOUD_PROJECT_ID || 'ea9762777b694cbe8b099d7f6acb453c'; // CodeArts 项目 ID
  const region = process.env.HUAWEI_CLOUD_REGION || 'cn-north-4';

  console.log('🔧 测试配置:');
  console.log(`  AK: ${accessKey.substring(0, 8)}...`);
  console.log(`  SK: ${secretKey.substring(0, 8)}...`);
  console.log(`  Domain ID (认证): ${domainId}`);
  console.log(`  Project ID (查询): ${projectId}`);
  console.log(`  Region: ${region}`);
  console.log('');

  try {
    console.log('🔌 正在连接华为云 CodeArts...');
    
    // 创建认证（使用 domainId）
    const credentials = new GlobalCredentials()
      .withAk(accessKey)
      .withSk(secretKey)
      .withDomainId(domainId);

    // 创建客户端
    const client = ProjectManClient.newBuilder()
      .withCredential(credentials)
      .withRegion(ProjectManRegion.valueOf(region))
      .build();

    console.log('✅ 客户端创建成功');
    console.log('');

    // 创建请求
    const request = new ListIssuesV4Request();
    request.projectId = projectId;

    console.log('📡 正在获取 Issue 列表...');
    const response = await client.listIssuesV4(request);

    console.log('✅ 获取成功！');
    console.log('');

    // 显示结果
    const issues = response.issues || [];
    console.log(`📋 找到 ${issues.length} 个 Issue:`);
    console.log('');

    if (issues.length === 0) {
      console.log('  暂无 Issue');
    } else {
      // 显示前 10 个
      issues.slice(0, 10).forEach((issue: any) => {
        const id = issue.id || 0;
        const subject = issue.subject || '无标题';
        const statusName = issue.status?.name || '未知状态';
        
        console.log(`  #${id}: ${subject}`);
        console.log(`    状态: ${statusName}`);
        console.log('');
      });

      if (issues.length > 10) {
        console.log(`  ... 还有 ${issues.length - 10} 个 Issue`);
        console.log('');
      }
    }

    // 显示转换后的格式（Provider 返回的格式）
    console.log('📦 Provider 返回格式示例:');
    const sampleIssue: any = issues[0];
    if (sampleIssue) {
      const subject = sampleIssue.subject || '无标题';
      const statusName = sampleIssue.status?.name || '';
      const description = statusName ? `${subject} [${statusName}]` : subject;
      
      const formattedOption = {
        label: `#${sampleIssue.id}`,
        value: String(sampleIssue.id),
        description: description
      };
      console.log(JSON.stringify(formattedOption, null, 2));
    }
    console.log('');

    console.log('🎉 测试完成！Provider 可以正常工作。');

  } catch (error: any) {
    console.error('❌ 测试失败:');
    console.error('');
    console.error(`  错误类型: ${error.name || 'Error'}`);
    console.error(`  错误消息: ${error.message}`);
    
    if (error.response) {
      console.error(`  HTTP 状态: ${error.response.status}`);
      console.error(`  响应数据: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    
    if (error.stack) {
      console.error('');
      console.error('详细错误堆栈:');
      console.error(error.stack);
    }
    
    process.exit(1);
  }
}

// 运行测试
testHuaweiCloudConnection().catch(console.error);
