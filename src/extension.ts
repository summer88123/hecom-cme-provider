import * as vscode from 'vscode';
import { IssueProvider } from './providers/IssueProvider';
import { logger } from './utils/logger';

/**
 * 扩展激活函数
 */
export function activate(context: vscode.ExtensionContext) {
  logger.separator();
  logger.info('Extension', 'Hecom CME Provider 开始激活');
  logger.separator();

  // 获取主插件 API
  logger.info('Extension', '查找主插件: hecom.hecom-commit-message-editor');
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
        logger.info('Extension', '主插件未激活，等待激活...');
        api = await cmeExtension.activate();
        logger.success('Extension', '主插件激活完成');
      } else {
        logger.info('Extension', '主插件已激活，直接获取 API');
        api = cmeExtension.exports;
      }

      logger.info('Extension', 'API 对象检查', {
        hasApi: !!api,
        hasRegisterFunction: api && typeof api.registerDynamicOptionsProvider === 'function',
        apiKeys: api ? Object.keys(api) : [],
      });

      if (!api || typeof api.registerDynamicOptionsProvider !== 'function') {
        const msg = '主插件版本过旧，不支持 Dynamic Options Provider API';
        logger.error('Extension', msg);
        vscode.window.showErrorMessage(`Hecom CME Provider: ${msg}`);
        return;
      }

      // 注册华为云 Issue Provider
      logger.info('Extension', '创建 IssueProvider 实例...');
      const issueProvider = new IssueProvider();
      logger.success('Extension', 'IssueProvider 创建成功');

      logger.info('Extension', '注册 Provider: hecom.huawei-cloud-issues');
      const issueProviderDisposable = api.registerDynamicOptionsProvider(
        'hecom.huawei-cloud-issues',
        issueProvider
      );
      logger.info('Extension', 'Provider 注册调用完成');

      context.subscriptions.push(issueProviderDisposable);

      logger.success('Extension', '华为云 Issue Provider 注册成功');
      logger.info('Extension', '💡 提示: 在输出面板查看日志 (查看 → 输出 → 选择 "Hecom CME Provider")');
      
      vscode.window.showInformationMessage('Hecom CME Provider 已成功注册');

      // 自动显示输出面板（可选）
      // logger.show();

    } catch (error) {
      logger.error('Extension', '注册 Hecom CME Provider 失败', error);
      vscode.window.showErrorMessage(
        `Hecom CME Provider: 注册失败 - ${error instanceof Error ? error.message : String(error)}`
      );
    }
  };

  registerProviders();
  logger.info('Extension', 'activate 函数执行完成');
}

/**
 * 扩展停用函数
 */
export function deactivate() {
  logger.separator();
  logger.info('Extension', 'Hecom CME Provider 已停用');
  logger.separator();
}
