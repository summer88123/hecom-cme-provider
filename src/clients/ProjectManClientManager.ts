import { GlobalCredentials } from '@huaweicloud/huaweicloud-sdk-core/auth/GlobalCredentials';
import { ProjectManClient } from '@huaweicloud/huaweicloud-sdk-projectman/v4/ProjectManClient';
import { ProjectManRegion } from '@huaweicloud/huaweicloud-sdk-projectman/v4/ProjectManRegion';
import * as vscode from 'vscode';
import { logger } from '../utils/logger';

/**
 * ProjectMan 客户端配置接口
 */
export interface ProjectManClientConfig {
  accessKey: string;
  secretKey: string;
  domainId: string;
  region: string;
}

/**
 * ProjectMan 客户端管理器（单例模式）
 * 
 * 负责创建和管理 ProjectManClient 实例，确保客户端只初始化一次
 */
export class ProjectManClientManager {
  private static instance: ProjectManClientManager;
  private client?: ProjectManClient;
  private currentConfig?: ProjectManClientConfig;

  private constructor() {
    // 私有构造函数，防止外部实例化
    this.initializeFromConfig();
    // 监听配置变更
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('hecomCmeProvider.huaweiCloud')) {
        logger.info('IssueProvider', '检测到配置变更，重新初始化');
        this.initializeFromConfig();
      }
    });
  }

  /**
   * 获取单例实例
   */
  public static getInstance(): ProjectManClientManager {
    if (!ProjectManClientManager.instance) {
      ProjectManClientManager.instance = new ProjectManClientManager();
    }
    return ProjectManClientManager.instance;
  }

  /**
   * 初始化或更新客户端
   * 只有在配置发生变化时才会重新创建客户端
   */
  private initialize(config: ProjectManClientConfig): void {
    logger.info('ClientManager', '开始初始化客户端...');
    logger.info('ClientManager', '配置信息', {
      accessKey: config.accessKey ? `${config.accessKey.substring(0, 8)}...` : '未设置',
      secretKey: config.secretKey ? '***已设置***' : '未设置',
      domainId: config.domainId || '未设置',
      region: config.region || '未设置',
    });

    // 检查配置是否变化
    if (this.client && this.isSameConfig(config)) {
      logger.info('ClientManager', '客户端配置未变化，跳过重新初始化');
      return;
    }

    try {
      // 创建认证信息（使用 domainId 进行认证）
      const credentials = new GlobalCredentials()
        .withAk(config.accessKey)
        .withSk(config.secretKey)
        .withDomainId(config.domainId);

      // 获取 Region 对象
      const regionObj = ProjectManRegion.valueOf(config.region);

      // 创建 ProjectMan 客户端
      this.client = ProjectManClient.newBuilder()
        .withCredential(credentials)
        .withRegion(regionObj)
        .build();

      this.currentConfig = { ...config };
      logger.success('ClientManager', 'ProjectMan 客户端初始化成功');
    } catch (error) {
      logger.error('ClientManager', '初始化 ProjectMan 客户端失败', error);
      this.client = undefined;
      this.currentConfig = undefined;
      throw error;
    }
  }

  /**
   * 从 VSCode 配置初始化客户端
   */
  private initializeFromConfig(): void {
    logger.info('ClientManager', '从 VSCode 配置读取参数...');
    const config = vscode.workspace.getConfiguration('hecomCmeProvider');
    const ak = config.get<string>('huaweiCloud.accessKey');
    const sk = config.get<string>('huaweiCloud.secretKey');
    const domainId = config.get<string>('huaweiCloud.domainId');
    const region = config.get<string>('huaweiCloud.region', 'cn-north-4');

    if (!ak || !sk || !domainId) {
      logger.warn('ClientManager', '华为云配置不完整，请在设置中配置 AK/SK 和 DomainId');
      this.client = undefined;
      this.currentConfig = undefined;
      return;
    }

    this.initialize({
      accessKey: ak,
      secretKey: sk,
      domainId: domainId,
      region: region,
    });
  }

  /**
   * 获取客户端实例
   */
  public getClient(): ProjectManClient | undefined {
    return this.client;
  }

  /**
   * 检查配置是否相同
   */
  private isSameConfig(config: ProjectManClientConfig): boolean {
    if (!this.currentConfig) {
      return false;
    }

    return (
      this.currentConfig.accessKey === config.accessKey &&
      this.currentConfig.secretKey === config.secretKey &&
      this.currentConfig.domainId === config.domainId &&
      this.currentConfig.region === config.region
    );
  }

  /**
   * 重置客户端（用于测试或清理）
   */
  public reset(): void {
    this.client = undefined;
    this.currentConfig = undefined;
  }
}
