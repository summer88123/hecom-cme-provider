import * as vscode from 'vscode';
import { IssueProvider } from './providers/IssueProvider';

/**
 * 扩展激活函数
 */
export function activate(context: vscode.ExtensionContext) {
  console.log('Hecom CME Provider 已激活');

  // 获取主插件 API
  const cmeExtension = vscode.extensions.getExtension('hecom.hecom-commit-message-editor');
  
  if (!cmeExtension) {
    vscode.window.showWarningMessage(
      'Hecom CME Provider: 未找到 Commit Message Editor 扩展，请先安装该扩展。'
    );
    return;
  }

  // 等待主插件激活并注册 providers
  const registerProviders = async () => {
    try {
      let api: any;
      
      if (!cmeExtension.isActive) {
        api = await cmeExtension.activate();
      } else {
        api = cmeExtension.exports;
      }

      if (!api || typeof api.registerDynamicOptionsProvider !== 'function') {
        vscode.window.showErrorMessage(
          'Hecom CME Provider: 主插件版本过旧，不支持 Dynamic Options Provider API'
        );
        return;
      }

      // 注册华为云 Issue Provider
      const issueProvider = new IssueProvider();
      const issueProviderDisposable = api.registerDynamicOptionsProvider(
        'hecom.huawei-cloud-issues',
        issueProvider
      );
      context.subscriptions.push(issueProviderDisposable);

      console.log('Hecom CME Provider: 华为云 Issue Provider 注册成功');
      vscode.window.showInformationMessage('Hecom CME Provider 已成功注册');

    } catch (error) {
      console.error('注册 Hecom CME Provider 失败:', error);
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
  console.log('Hecom CME Provider 已停用');
}
