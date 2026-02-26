import * as vscode from 'vscode';
import { ProjectManClient } from '@huaweicloud/huaweicloud-sdk-projectman/v4/ProjectManClient';
import { GlobalCredentials } from '@huaweicloud/huaweicloud-sdk-core/auth/GlobalCredentials';
import { ListIssuesV4Request } from '@huaweicloud/huaweicloud-sdk-projectman/v4/model/ListIssuesV4Request';
import { ProjectManRegion } from '@huaweicloud/huaweicloud-sdk-projectman/v4/ProjectManRegion';
import type {
  DynamicOptionsProvider,
  DynamicOptionsContext,
  DynamicOptionItem,
} from '../types/cme-api';

/**
 * 华为云 CodeArts Issue Provider
 * 
 * 实现 DynamicOptionsProvider 接口，从华为云 CodeArts 获取 Issue 列表
 */
export class IssueProvider implements DynamicOptionsProvider {
  private client?: ProjectManClient;
  private projectId?: string; // CodeArts 项目 ID（业务用）

  constructor() {
    this.initialize();
    
    // 监听配置变更
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('hecomCmeProvider.huaweiCloud')) {
        this.initialize();
      }
    });
  }

  /**
   * 初始化华为云客户端
   */
  private initialize() {
    try {
      const config = vscode.workspace.getConfiguration('hecomCmeProvider');
      const ak = config.get<string>('huaweiCloud.accessKey');
      const sk = config.get<string>('huaweiCloud.secretKey');
      const domainId = config.get<string>('huaweiCloud.domainId'); // 认证用的 Domain ID
      const projectId = config.get<string>('huaweiCloud.projectId'); // CodeArts 项目 ID
      const region = config.get<string>('huaweiCloud.region', 'cn-north-4');

      if (!ak || !sk || !domainId || !projectId) {
        console.warn('华为云配置不完整，请在设置中配置 AK/SK、DomainId 和 ProjectId');
        this.client = undefined;
        this.projectId = undefined;
        return;
      }

      this.projectId = projectId;

      // 创建认证信息（使用 domainId 进行认证）
      const credentials = new GlobalCredentials()
        .withAk(ak)
        .withSk(sk)
        .withDomainId(domainId);

      // 获取 Region 对象
      const regionObj = ProjectManRegion.valueOf(region);

      // 创建 ProjectMan 客户端
      this.client = ProjectManClient.newBuilder()
        .withCredential(credentials)
        .withRegion(regionObj)
        .build();

      console.log('华为云 CodeArts 客户端初始化成功');
    } catch (error) {
      console.error('初始化华为云客户端失败:', error);
      this.client = undefined;
      this.projectId = undefined;
    }
  }

  /**
   * 实现 DynamicOptionsProvider 接口
   * 提供 Issue 选项列表
   */
  async provideOptions(context: DynamicOptionsContext): Promise<DynamicOptionItem[]> {
    if (!this.client || !this.projectId) {
      throw new Error('华为云配置不完整，请在设置中配置 AK/SK、DomainId 和 ProjectId');
    }

    // 检查是否被取消
    if (context.cancellationToken?.isCancellationRequested) {
      return [];
    }

    try {
      const request = new ListIssuesV4Request();
      request.projectId = this.projectId;
      
      // 可以根据需要添加更多过滤条件
      // request.offset = 0;
      // request.limit = 100;

      const response = await this.client.listIssuesV4(request);
      
      if (!response || !response.issues) {
        console.warn('未获取到 Issue 数据');
        return [];
      }

      // 转换为 DynamicOptionItem 格式
      const options: DynamicOptionItem[] = response.issues.map((issue: any) => {
        const subject = issue.subject || '无标题';
        const statusName = issue.status?.name || '';
        const description = statusName ? `${subject} [${statusName}]` : subject;
        
        return {
          label: `#${issue.id}`,
          value: String(issue.id),
          description: description,
        };
      });

      console.log(`成功获取 ${options.length} 个 Issue`);
      return options;
    } catch (error) {
      console.error('获取 Issue 列表失败:', error);
      throw new Error(`获取 Issue 列表失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
