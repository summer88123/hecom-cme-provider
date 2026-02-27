import { ListIssueCustomFieldsRequest } from '@huaweicloud/huaweicloud-sdk-projectman/v4/model/ListIssueCustomFieldsRequest';
import { ListIssueCustomFieldsRequestBody } from '@huaweicloud/huaweicloud-sdk-projectman/v4/model/ListIssueCustomFieldsRequestBody';
import { ProjectManClientManager } from '../clients/ProjectManClientManager';
import { UserInfoManager } from '../clients/UserInfoManager';
import type {
  DynamicOptionItem,
  DynamicOptionsContext,
  DynamicOptionsProvider,
} from '../types/cme-api';
import { logger } from '../utils/logger';

/**
 * 引入阶段 Provider
 *
 * 从华为云 CodeArts 获取"引入阶段"自定义字段的选项列表
 */
export class IntroductionStageProvider implements DynamicOptionsProvider {
  private clientManager: ProjectManClientManager;
  private userInfoManager: UserInfoManager;

  constructor() {
    this.clientManager = ProjectManClientManager.getInstance();
    this.userInfoManager = UserInfoManager.getInstance();
  }

  /**
   * 实现 DynamicOptionsProvider 接口
   * 提供引入阶段选项列表
   */
  async provideOptions(context: DynamicOptionsContext): Promise<DynamicOptionItem[]> {
    logger.info('IntroductionStageProvider', 'provideOptions 被调用');
    logger.info('IntroductionStageProvider', 'Context 信息', {
      hasCancellationToken: !!context.cancellationToken,
      isCancelled: context.cancellationToken?.isCancellationRequested,
    });

    const client = this.clientManager.getClient();
    const projectId = this.userInfoManager.getProjectId();

    if (!client || !projectId) {
      const error = '华为云配置不完整,请在设置中配置 AK/SK、DomainId 和 ProjectId';
      logger.error('IntroductionStageProvider', error);
      throw new Error(error);
    }

    // 检查是否被取消
    if (context.cancellationToken?.isCancellationRequested) {
      logger.info('IntroductionStageProvider', '请求已被取消');
      return [];
    }

    try {
      const request = new ListIssueCustomFieldsRequest();
      request.projectId = projectId;

      const body = new ListIssueCustomFieldsRequestBody();
      const fieldNames = ['引入阶段'];
      body.withNames(fieldNames);
      request.withBody(body);

      logger.info('IntroductionStageProvider', '开始请求引入阶段字段数据', { projectId });
      const response = await client.listIssueCustomFields(request);

      // @ts-ignore - 华为云 SDK 的类型定义可能不完整
      if (!response || !response.datas || response.datas.length === 0) {
        logger.warn('IntroductionStageProvider', '未获取到引入阶段字段数据');
        return [];
      }

      // @ts-ignore
      const fieldData = response.datas[0];

      logger.info('IntroductionStageProvider', '字段数据', {
        name: fieldData.name,
        type: fieldData.type,
        optionsType: typeof fieldData.options,
        options: fieldData.options,
      });

      if (!fieldData.options) {
        logger.warn('IntroductionStageProvider', '引入阶段字段没有可用选项');
        return [];
      }

      // options 是逗号分隔的字符串,需要分割成数组
      let optionValues: string[];
      if (typeof fieldData.options === 'string') {
        optionValues = fieldData.options
          .split(',')
          .map((opt: string) => opt.trim())
          .filter((opt: string) => opt.length > 0)
          .sort((a: string, b: string) => b.localeCompare(a));
      } else if (Array.isArray(fieldData.options)) {
        // 如果已经是数组,直接使用
        optionValues = fieldData.options;
      } else {
        logger.warn('IntroductionStageProvider', '无法识别的 options 类型', {
          type: typeof fieldData.options,
        });
        return [];
      }

      if (optionValues.length === 0) {
        logger.warn('IntroductionStageProvider', '引入阶段字段没有可用选项');
        return [];
      }

      logger.info('IntroductionStageProvider', `获取到引入阶段选项数量: ${optionValues.length}`);

      // 转换为 DynamicOptionItem 格式
      const options: DynamicOptionItem[] = optionValues.map((optionValue: string) => {
        return {
          label: optionValue,
          value: optionValue,
          description: `引入阶段: ${optionValue}`,
        };
      });

      logger.success('IntroductionStageProvider', '成功获取引入阶段选项', {
        count: options.length,
      });
      return options;
    } catch (error) {
      logger.error('IntroductionStageProvider', '获取引入阶段选项失败', error);
      throw new Error(
        `获取引入阶段选项失败: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}
