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
      const userId = this.userInfoManager.getUserId();
      const PAGE_SIZE = 50;
      let offset = 0;
      let total = Infinity;
      const allIssues: any[] = [];

      // 循环拉取，直到获取所有数据
      while (allIssues.length < total) {
        // 检查是否被取消
        if (context.cancellationToken?.isCancellationRequested) {
          logger.info('IssueProvider', '请求已被取消');
          return [];
        }

        const request = new ListIssuesV4Request();
        request.projectId = projectId;

        const body = new ListIssueRequestV4();
        body.limit = PAGE_SIZE;
        body.offset = offset;
        body.assignedIds = userId ? [userId] : []; // 只获取分配给当前用户的 Issue

        // 设置 tracker IDs (2=bug, 3=task)
        const trackerIds = [2, 3];
        body.withTrackerIds(trackerIds);

        // 设置 status IDs (1=新建, 2=处理中, 15=重新打开)
        const statusIds = [1, 2, 15];
        body.withStatusIds(statusIds);

        request.withBody(body);

        const response = await client.listIssuesV4(request);

        // @ts-ignore
        if (!response || !response.issues) {
          break;
        }

        // @ts-ignore
        const pageIssues = response.issues;
        allIssues.push(...pageIssues);

        // 首次请求时获取总数
        if (offset === 0) {
          // @ts-ignore
          total = response.total ?? pageIssues.length;
          logger.info('IssueProvider', `Issue 总数: ${total}`);
        }

        offset += pageIssues.length;

        // 如果本页返回数量不足一页，说明已到最后一页
        if (pageIssues.length < PAGE_SIZE) {
          break;
        }
      }

      if (allIssues.length === 0) {
        logger.warn('IssueProvider', '未获取到 Issue 数据');
        return [];
      }

      const issues = allIssues;
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
