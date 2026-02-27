import * as vscode from 'vscode';
import { ProjectManClientManager } from './clients/ProjectManClientManager';
import { UserInfoManager } from './clients/UserInfoManager';
import { IntroductionStageProvider } from './providers/IntroductionStageProvider';
import { IssueProvider } from './providers/IssueProvider';
import { logger } from './utils/logger';

/**
 * 扩展激活函数
 */
export function activate(context: vscode.ExtensionContext) {
  logger.separator();
  logger.info('Extension', 'Hecom CME Provider 开始激活');
  logger.separator();

  const cmeExtension = vscode.extensions.getExtension('hecom.hecom-commit-message-editor');

  if (!cmeExtension) {
    const msg = '未找到 Commit Message Editor 扩展，请先安装该扩展。';
    logger.error('Extension', msg);
    vscode.window.showWarningMessage(`Hecom CME Provider: ${msg}`);
    return;
  }

  logger.success('Extension', '找到主插件', {
    id: cmeExtension.id,
    isActive: cmeExtension.isActive,
  });

  // 等待主插件激活并注册 providers
  const registerProviders = async () => {
    try {
      logger.info('Extension', '开始注册 Providers...');
      let api: any;

      if (!cmeExtension.isActive) {
        api = await cmeExtension.activate();
      } else {
        api = cmeExtension.exports;
      }

      if (!api || typeof api.registerDynamicOptionsProvider !== 'function') {
        const msg = '主插件版本过旧，不支持 Dynamic Options Provider API';
        logger.error('Extension', msg);
        vscode.window.showErrorMessage(`Hecom CME Provider: ${msg}`);
        return;
      }

      const client = ProjectManClientManager.getInstance();
      const userInfoManager = UserInfoManager.getInstance();

      // 监听配置变更
      vscode.workspace.onDidChangeConfiguration(async (e) => {
        if (e.affectsConfiguration('hecomCmeProvider.huaweiCloud')) {
          logger.info('IssueProvider', '检测到配置变更，重新初始化');
          await client.initializeFromConfig();
          await userInfoManager.initialize();
        }
      });

      await client.initializeFromConfig();
      await userInfoManager.initialize();

      // 注册 Issue Provider
      const issueProvider = new IssueProvider();
      const issueProviderDisposable = api.registerDynamicOptionsProvider(
        'hecom.huawei-cloud-issues',
        issueProvider
      );
      context.subscriptions.push(issueProviderDisposable);

      // 注册引入阶段 Provider
      const introductionStageProvider = new IntroductionStageProvider();
      const introductionStageProviderDisposable = api.registerDynamicOptionsProvider(
        'hecom.introduction-stage',
        introductionStageProvider
      );
      context.subscriptions.push(introductionStageProviderDisposable);
    } catch (error) {
      logger.error('Extension', '注册 Hecom CME Provider 失败', error);
      vscode.window.showErrorMessage(
        `Hecom CME Provider: 注册失败 - ${error instanceof Error ? error.message : String(error)}`
      );
    }
  };

  registerProviders();
}

/**
 * 扩展停用函数
 */
export function deactivate() {
  logger.separator();
  logger.info('Extension', 'Hecom CME Provider 已停用');
  logger.separator();
}
