import { ListIssueRequestV4 } from '@huaweicloud/huaweicloud-sdk-projectman/v4/model/ListIssueRequestV4';
import { ListIssuesV4Request } from '@huaweicloud/huaweicloud-sdk-projectman/v4/model/ListIssuesV4Request';
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
      const request = new ListIssuesV4Request();
      request.projectId = projectId;

      const body = new ListIssueRequestV4();
      body.limit = 60; // 设置返回的 Issue 数量上限，避免一次性拉取过多数据
      const userId = this.userInfoManager.getUserId();
      body.assignedIds = userId ? [userId] : []; // 只获取分配给当前用户的 Issue

      // 设置 tracker IDs (2=bug, 3=task)
      const trackerIds = [2, 3];
      body.withTrackerIds(trackerIds);

      // 设置 status IDs (1=新建, 2=处理中, 15=已解决, 13=已拒绝)
      const statusIds = [1, 2, 15, 13];
      body.withStatusIds(statusIds);

      request.withBody(body);

      const response = await client.listIssuesV4(request);

      // @ts-ignore
      if (!response || !response.issues) {
        logger.warn('IssueProvider', '未获取到 Issue 数据');
        return [];
      }

      // @ts-ignore
      const issues = response.issues;
      logger.info('IssueProvider', `获取到 Issue 数量: ${issues.length}`);

      const options: DynamicOptionItem[] = issues.map((issue) => {
        const subject = issue.name || '无标题';
        const trackerName = issue.tracker?.name || '';

        // 处理自定义字段，拼接到 value 上
        const bugType = // @ts-ignore - 华为云 SDK 的类型定义可能不完整
          issue.new_custom_fields?.find((field) => field.field_name === '缺陷类型')?.value;
        const isCustomerFeedback = bugType === '客户反馈';

        const issueUrl = `https://devcloud.cn-north-4.huaweicloud.com/projectman/scrum/${projectId}/task/detail/${issue.id}`;

        return {
          label: `[${isCustomerFeedback ? bugType : trackerName}] ${subject}`,
          value: `${isCustomerFeedback ? `[${bugType}] ` : ''}${subject}: ${issueUrl}`,
        };
      });

      return options;
    } catch (error) {
      logger.error('IssueProvider', '获取 Issue 列表失败', error);
      throw new Error(
        `获取 Issue 列表失败: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}
