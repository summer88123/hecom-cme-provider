import * as vscode from 'vscode';

/**
 * 日志管理器
 * 使用 VSCode 输出通道记录日志
 */
class Logger {
  private static instance: Logger;
  private outputChannel: vscode.OutputChannel;

  private constructor() {
    this.outputChannel = vscode.window.createOutputChannel('Hecom CME Provider');
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * 显示输出通道
   */
  public show() {
    this.outputChannel.show(true); // true = 保留焦点在编辑器
  }

  /**
   * 记录信息日志
   */
  public info(tag: string, message: string, data?: any) {
    const timestamp = new Date().toLocaleTimeString();
    let logMessage = `[${timestamp}] [${tag}] ${message}`;

    if (data !== undefined) {
      if (typeof data === 'object') {
        logMessage += '\n' + JSON.stringify(data, null, 2);
      } else {
        logMessage += ` ${data}`;
      }
    }

    this.outputChannel.appendLine(logMessage);
  }

  /**
   * 记录警告日志
   */
  public warn(tag: string, message: string, data?: any) {
    const timestamp = new Date().toLocaleTimeString();
    let logMessage = `[${timestamp}] [${tag}] ⚠️  ${message}`;

    if (data !== undefined) {
      if (typeof data === 'object') {
        logMessage += '\n' + JSON.stringify(data, null, 2);
      } else {
        logMessage += ` ${data}`;
      }
    }

    this.outputChannel.appendLine(logMessage);
  }

  /**
   * 记录错误日志
   */
  public error(tag: string, message: string, error?: any) {
    const timestamp = new Date().toLocaleTimeString();
    let logMessage = `[${timestamp}] [${tag}] ❌ ${message}`;

    if (error !== undefined) {
      if (error instanceof Error) {
        logMessage += `\n  错误: ${error.message}`;
        if (error.stack) {
          logMessage += `\n  堆栈:\n${error.stack}`;
        }
      } else if (typeof error === 'object') {
        logMessage += '\n' + JSON.stringify(error, null, 2);
      } else {
        logMessage += ` ${error}`;
      }
    }

    this.outputChannel.appendLine(logMessage);
  }

  /**
   * 记录成功日志
   */
  public success(tag: string, message: string, data?: any) {
    const timestamp = new Date().toLocaleTimeString();
    let logMessage = `[${timestamp}] [${tag}] ✅ ${message}`;

    if (data !== undefined) {
      if (typeof data === 'object') {
        logMessage += '\n' + JSON.stringify(data, null, 2);
      } else {
        logMessage += ` ${data}`;
      }
    }

    this.outputChannel.appendLine(logMessage);
  }

  /**
   * 记录分隔线
   */
  public separator() {
    this.outputChannel.appendLine('='.repeat(80));
  }

  /**
   * 清空日志
   */
  public clear() {
    this.outputChannel.clear();
  }

  /**
   * 销毁输出通道
   */
  public dispose() {
    this.outputChannel.dispose();
  }
}

// 导出单例实例
export const logger = Logger.getInstance();
