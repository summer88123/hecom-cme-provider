import { ListWorkTableIssueRequestV4RequestBody } from '@huaweicloud/huaweicloud-sdk-projectman/v4/model/ListWorkTableIssueRequestV4RequestBody';
import { SearchIssuesRequest } from '@huaweicloud/huaweicloud-sdk-projectman/v4/model/SearchIssuesRequest';
import { ProjectManClientManager } from '../clients/ProjectManClientManager';
import { UserInfoManager } from '../clients/UserInfoManager';
import type {
  DynamicOptionItem,
  DynamicOptionsContext,
  DynamicOptionsProvider,
} from '../types/cme-api';
import { logger } from '../utils/logger';

/**
 * 华为云 CodeArts Issue Provider
 * 
 * 实现 DynamicOptionsProvider 接口，从华为云 CodeArts 获取 Issue 列表
 */
export class IssueProvider implements DynamicOptionsProvider {
  private clientManager: ProjectManClientManager;
  private userInfoManager: UserInfoManager;

  constructor() {
    this.clientManager = ProjectManClientManager.getInstance();
    this.userInfoManager = UserInfoManager.getInstance();
  }

  /**
   * 实现 DynamicOptionsProvider 接口
   * 提供 Issue 选项列表
   */
  async provideOptions(context: DynamicOptionsContext): Promise<DynamicOptionItem[]> {
    logger.info('IssueProvider', 'provideOptions 被调用');
    logger.info('IssueProvider', 'Context 信息', {
      hasCancellationToken: !!context.cancellationToken,
      isCancelled: context.cancellationToken?.isCancellationRequested,
    });

    const client = this.clientManager.getClient();
    const projectId = this.userInfoManager.getProjectId();
    
    if (!client || !projectId) {
      const error = '华为云配置不完整，请在设置中配置 AK/SK、DomainId 和 ProjectId';
      logger.error('IssueProvider', error);
      throw new Error(error);
    }

    // 检查是否被取消
    if (context.cancellationToken?.isCancellationRequested) {
      logger.info('IssueProvider', '请求已被取消');
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
        logger.warn('IssueProvider', '未获取到 Issue 数据');
        return [];
      }

      // 转换为 DynamicOptionItem 格式 
      //  @ts-ignore
      const issues = response.issue_list;
      logger.info('IssueProvider', `获取到 Issue 数量: ${issues.length}`);

      const options: DynamicOptionItem[] = issues.map((issue: any) => {
        const subject = issue.subject || '无标题';
        const statusName = issue.status?.name || '';
        const trackerName = issue.tracker?.name || '';
        const description = `[${statusName}]`;
        
        return {
          label: `[${trackerName}] ${subject}`,
          value: `${subject}: https://devcloud.cn-north-4.huaweicloud.com/projectman/scrum/${projectId}/task/detail/${issue.id} `,
          description: description,
        };
      });

      return options;
    } catch (error) {
      logger.error('IssueProvider', '获取 Issue 列表失败', error);
      throw new Error(`获取 Issue 列表失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
