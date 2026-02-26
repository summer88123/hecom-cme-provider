import { ListWorkTableIssueRequestV4RequestBody } from '@huaweicloud/huaweicloud-sdk-projectman/v4/model/ListWorkTableIssueRequestV4RequestBody';
import { SearchIssuesRequest } from '@huaweicloud/huaweicloud-sdk-projectman/v4/model/SearchIssuesRequest';
import * as vscode from 'vscode';
import { ProjectManClientManager } from '../clients/ProjectManClientManager';
import type {
  DynamicOptionItem,
  DynamicOptionsContext,
  DynamicOptionsProvider,
} from '../types/cme-api';

/**
 * 华为云 CodeArts Issue Provider
 * 
 * 实现 DynamicOptionsProvider 接口，从华为云 CodeArts 获取 Issue 列表
 */
export class IssueProvider implements DynamicOptionsProvider {
  private clientManager: ProjectManClientManager;
  private projectId?: string; // CodeArts 项目 ID（业务用）

  constructor() {
    this.clientManager = ProjectManClientManager.getInstance();
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
      const projectId = config.get<string>('huaweiCloud.projectId'); // CodeArts 项目 ID

      if (!projectId) {
        console.warn('华为云配置不完整，请在设置中配置 ProjectId');
        this.projectId = undefined;
        return;
      }

      this.projectId = projectId;

      // 使用统一的客户端管理器初始化客户端
      this.clientManager.initializeFromConfig();

      console.log('华为云 CodeArts IssueProvider 初始化成功');
    } catch (error) {
      console.error('初始化华为云 IssueProvider 失败:', error);
      this.projectId = undefined;
    }
  }

  /**
   * 实现 DynamicOptionsProvider 接口
   * 提供 Issue 选项列表
   */
  async provideOptions(context: DynamicOptionsContext): Promise<DynamicOptionItem[]> {
    const client = this.clientManager.getClient();
    
    if (!client || !this.projectId) {
      throw new Error('华为云配置不完整，请在设置中配置 AK/SK、DomainId 和 ProjectId');
    }

    // 检查是否被取消
    if (context.cancellationToken?.isCancellationRequested) {
      return [];
    }

    try {
      const request = new SearchIssuesRequest();
      const body = new ListWorkTableIssueRequestV4RequestBody();
      
      // 设置分页和基本查询参数
      body.withOffset(0);
      body.withLimit(100);
      
      // 可以根据需要添加更多过滤条件
      body.withStatusId("1,15,2,13");  // 只查询待处理的状态
      body.withTrackerId("2,3");       // 查询 bug 和 task 类型的 Issue
      
      request.withBody(body);

      const response = await client.searchIssues(request);
      // @ts-ignore
      if (!response || !response.issue_list) {
        console.warn('未获取到 Issue 数据');
        return [];
      }

      // 转换为 DynamicOptionItem 格式 
      //  @ts-ignore
      const options: DynamicOptionItem[] = response.issue_list.map((issue) => {
        const subject = issue.subject || '无标题';
        const statusName = issue.status?.name || '';
        const trackerName = issue.tracker?.name || '';
        const description = `[${statusName}]`;
        
        return {
          label: `[${trackerName}] ${subject}`,
          value: `${subject}: https://devcloud.cn-north-4.huaweicloud.com/projectman/scrum/${this.projectId}/task/detail/${issue.id} `,
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
