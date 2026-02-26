/**
 * 类型定义文件
 * 
 * 这些类型来自主插件 vscode-commit-message-editor
 * 当主插件发布后，可以直接从主插件导入这些类型
 */

import * as vscode from 'vscode';

export interface DynamicOptionItem {
  label: string;
  value?: string;
  description?: string;
}

export interface DynamicOptionsContext {
  /** 当前 Git 仓库路径 */
  repositoryPath?: string;
  /** 其他 token 的当前值，支持联动 */
  tokenValues: Record<string, string>;
  /** 取消令牌，用于处理长时间请求 */
  cancellationToken?: vscode.CancellationToken;
}

export interface DynamicOptionsProvider {
  /**
   * 提供选项数据
   * @param context 上下文信息，包含当前仓库信息、其他 token 值等
   * @returns 返回选项数组或 Promise
   */
  provideOptions(
    context: DynamicOptionsContext
  ): DynamicOptionItem[] | Promise<DynamicOptionItem[]>;
}
