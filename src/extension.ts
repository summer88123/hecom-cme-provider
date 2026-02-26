import * as vscode from 'vscode';
import { HecomOptionsProvider } from './HecomOptionsProvider';

/**
 * 扩展激活函数
 */
export function activate(_context: vscode.ExtensionContext) {
  console.log('Hecom CME Provider 已激活');

  // 创建 provider 实例
  const provider = new HecomOptionsProvider();

  // 注册 provider 到 hecom-commit-message-editor
  // 这里需要等待主插件暴露注册 API
  try {
    // 尝试获取主插件的 API
    const cmeExtension = vscode.extensions.getExtension('adam-bender.hecom-commit-message-editor');
    
    if (cmeExtension) {
      if (!cmeExtension.isActive) {
        cmeExtension.activate().then((api) => {
          registerProvider(api, provider);
        });
      } else {
        const api = cmeExtension.exports;
        registerProvider(api, provider);
      }
    } else {
      vscode.window.showWarningMessage(
        'Hecom CME Provider: 未找到 Commit Message Editor 扩展，请先安装该扩展。'
      );
    }
  } catch (error) {
    console.error('注册 Hecom CME Provider 失败:', error);
    vscode.window.showErrorMessage(
      `Hecom CME Provider: 注册失败 - ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * 注册 provider
 */
function registerProvider(api: any, provider: HecomOptionsProvider) {
  if (api && typeof api.registerOptionsProvider === 'function') {
    api.registerOptionsProvider('hecom', provider);
    console.log('Hecom CME Provider 注册成功');
    vscode.window.showInformationMessage('Hecom CME Provider 已成功注册');
  } else {
    console.error('Commit Message Editor API 不支持 registerOptionsProvider 方法');
    vscode.window.showWarningMessage(
      'Hecom CME Provider: 主插件版本可能不支持动态 provider，请更新 Commit Message Editor 扩展。'
    );
  }
}

/**
 * 扩展停用函数
 */
export function deactivate() {
  console.log('Hecom CME Provider 已停用');
}
