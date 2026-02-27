import { ShowCurUserInfoRequest } from '@huaweicloud/huaweicloud-sdk-projectman/v4/public-api';
import * as vscode from 'vscode';
import { logger } from '../utils/logger';
import { ProjectManClientManager } from './ProjectManClientManager';

/**
 * 用户信息接口
 */
export interface UserInfo {
  userId: string;
  userName: string;
  nickName: string;
  domainId: string;
  domainName: string;
  userNumId?: number;
  gender?: string;
  userType?: string;
  createdTime?: number;
  updatedTime?: number;
}

/**
 * 用户信息管理器（单例模式）
 * 
 * 负责在插件初始化时读取当前用户信息，并提供全局访问接口
 * 同时管理 projectId（业务使用的项目 ID）
 */
export class UserInfoManager {
  private static instance: UserInfoManager;
  private userInfo?: UserInfo;
  private projectId?: string;
  private isInitialized: boolean = false;

  private constructor() {
    // 私有构造函数，防止外部实例化
  }

  /**
   * 获取单例实例
   */
  public static getInstance(): UserInfoManager {
    if (!UserInfoManager.instance) {
      UserInfoManager.instance = new UserInfoManager();
    }
    return UserInfoManager.instance;
  }

  /**
   * 初始化用户信息
   * 从华为云 ProjectMan API 读取当前用户信息
   * 
   * 
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      logger.info('UserInfoManager', '用户信息已初始化，跳过重复初始化');
      return;
    }

    logger.info('UserInfoManager', '开始初始化用户信息...');

    try {
      // 从配置读取 projectId
      const config = vscode.workspace.getConfiguration('hecomCmeProvider');
      this.projectId = config.get<string>('huaweiCloud.projectId');
      
      // 获取客户端
      const clientManager = ProjectManClientManager.getInstance();
      const client = clientManager.getClient();

      if (!client) {
        logger.warn('UserInfoManager', 'ProjectMan 客户端未初始化，跳过用户信息获取');
        return;
      }

      // 调用 API 获取当前用户信息
      const request = new ShowCurUserInfoRequest();
      const response: any = await client.showCurUserInfo(request);

      logger.info('UserInfoManager', '用户信息', {
        userId: response.user_id,
        userName: response.user_name,
        nickName: response.nick_name,
        domainId: response.domain_id,
      });

      // 保存用户信息
      this.userInfo = {
        userId: response.user_id || '',
        userName: response.user_name || '',
        nickName: response.nick_name || '',
        domainId: response.domain_id || '',
        domainName: response.domain_name || '',
        userNumId: response.user_num_id,
        gender: response.gender,
        userType: response.user_type,
      };

      this.isInitialized = true;
    } catch (error) {
      logger.error('UserInfoManager', '初始化用户信息失败', error);
      throw error;
    }
  }

  /**
   * 获取用户信息
   */
  public getUserInfo(): UserInfo | undefined {
    if (!this.isInitialized) {
      logger.warn('UserInfoManager', '用户信息尚未初始化');
    }
    return this.userInfo;
  }

  /**
   * 获取用户 ID
   */
  public getUserId(): string | undefined {
    return this.userInfo?.userId;
  }

  /**
   * 获取用户名
   */
  public getUserName(): string | undefined {
    return this.userInfo?.userName;
  }

  /**
   * 获取用户昵称
   */
  public getNickName(): string | undefined {
    return this.userInfo?.nickName;
  }

  /**
   * 获取 Domain ID
   */
  public getDomainId(): string | undefined {
    return this.userInfo?.domainId;
  }

  /**
   * 获取 Domain 名称
   */
  public getDomainName(): string | undefined {
    return this.userInfo?.domainName;
  }

  /**
   * 获取用户数字 ID
   */
  public getUserNumId(): number | undefined {
    return this.userInfo?.userNumId;
  }

  /**
   * 获取项目 ID（业务使用的）
   */
  public getProjectId(): string | undefined {
    return this.projectId;
  }

  /**
   * 设置项目 ID
   */
  public setProjectId(projectId: string): void {
    this.projectId = projectId;
    logger.info('UserInfoManager', '项目 ID 已更新', { projectId });
  }

  /**
   * 检查是否已初始化
   */
  public isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * 重置用户信息（用于测试或重新初始化）
   */
  public reset(): void {
    this.userInfo = undefined;
    this.projectId = undefined;
    this.isInitialized = false;
    logger.info('UserInfoManager', '用户信息已重置');
  }
}
