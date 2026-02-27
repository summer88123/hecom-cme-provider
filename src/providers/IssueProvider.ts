import { ListWorkTableIssueRequestV4RequestBody } from '@huaweicloud/huaweicloud-sdk-projectman/v4/model/ListWorkTableIssueRequestV4RequestBody';
import { SearchIssuesRequest } from '@huaweicloud/huaweicloud-sdk-projectman/v4/model/SearchIssuesRequest';
import * as vscode from 'vscode';
import { ProjectManClientManager } from '../clients/ProjectManClientManager';
import { logger } from '../utils/logger';
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
    logger.info('IssueProvider', '构造函数开始执行');
    this.clientManager = ProjectManClientManager.getInstance();
    this.initialize();
    
    // 监听配置变更
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('hecomCmeProvider.huaweiCloud')) {
        logger.info('IssueProvider', '检测到配置变更，重新初始化');
        this.initialize();
      }
    });
    logger.info('IssueProvider', '构造函数执行完成');
  }

  /**
   * 初始化华为云客户端
   */
  private initialize() {
    logger.info('IssueProvider', '开始初始化...');
    try {
      const config = vscode.workspace.getConfiguration('hecomCmeProvider');
      const projectId = config.get<string>('huaweiCloud.projectId'); // CodeArts 项目 ID

      logger.info('IssueProvider', '读取配置', {
        hasProjectId: !!projectId,
        projectId: projectId || '未设置',
      });

      if (!projectId) {
        logger.warn('IssueProvider', '华为云配置不完整，请在设置中配置 ProjectId');
        this.projectId = undefined;
        return;
      }

      this.projectId = projectId;

      // 使用统一的客户端管理器初始化客户端
      logger.info('IssueProvider', '调用客户端管理器初始化...');
      this.clientManager.initializeFromConfig();

      logger.success('IssueProvider', '华为云 CodeArts IssueProvider 初始化成功');
    } catch (error) {
      logger.error('IssueProvider', '初始化华为云 IssueProvider 失败', error);
      this.projectId = undefined;
    }
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
    
    logger.info('IssueProvider', '状态检查', {
      hasClient: !!client,
      hasProjectId: !!this.projectId,
      projectId: this.projectId,
    });

    if (!client || !this.projectId) {
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
      logger.info('IssueProvider', '开始构建请求...');
      const request = new SearchIssuesRequest();
      const body = new ListWorkTableIssueRequestV4RequestBody();
      
      // 设置分页和基本查询参数
      body.withOffset(0);
      body.withLimit(100);
      
      // 可以根据需要添加更多过滤条件
      body.withStatusId("1,15,2,13");  // 只查询待处理的状态
      body.withTrackerId("2,3");       // 查询 bug 和 task 类型的 Issue
      
      request.withBody(body);

      logger.info('IssueProvider', '发送请求到华为云...');
      const response = await client.searchIssues(request);
      logger.success('IssueProvider', '请求成功，解析响应...');

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
          value: `${subject}: https://devcloud.cn-north-4.huaweicloud.com/projectman/scrum/${this.projectId}/task/detail/${issue.id} `,
          description: description,
        };
      });

      logger.success('IssueProvider', `成功获取并转换 ${options.length} 个 Issue`);
      logger.info('IssueProvider', '前 3 个 Issue', options.slice(0, 3));
      return options;
    } catch (error) {
      logger.error('IssueProvider', '获取 Issue 列表失败', error);
      throw new Error(`获取 Issue 列表失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
