/**
 * VSCode API Manual Mock
 * 用于在 Node.js 环境中模拟 VSCode API
 */

// Mock CancellationToken
export class CancellationTokenSource {
  private _token: CancellationToken;
  
  constructor() {
    this._token = new CancellationToken();
  }
  
  get token(): CancellationToken {
    return this._token;
  }
  
  cancel(): void {
    this._token.cancel();
  }
  
  dispose(): void {
    // no-op
  }
}

export class CancellationToken {
  private _isCancellationRequested = false;
  
  get isCancellationRequested(): boolean {
    return this._isCancellationRequested;
  }
  
  cancel(): void {
    this._isCancellationRequested = true;
  }
}

// Mock workspace configuration
const mockConfigurations = new Map<string, any>();

export const workspace = {
  getConfiguration: jest.fn((section?: string) => {
    return {
      get: jest.fn(<T>(key: string, defaultValue?: T): T | undefined => {
        const fullKey = section ? `${section}.${key}` : key;
        return mockConfigurations.get(fullKey) ?? defaultValue;
      }),
      update: jest.fn((key: string, value: any) => {
        const fullKey = section ? `${section}.${key}` : key;
        mockConfigurations.set(fullKey, value);
        return Promise.resolve();
      }),
      has: jest.fn((key: string): boolean => {
        const fullKey = section ? `${section}.${key}` : key;
        return mockConfigurations.has(fullKey);
      }),
      inspect: jest.fn()
    };
  }),
  
  onDidChangeConfiguration: jest.fn(() => {
    return new Disposable(() => {});
  }),
  
  // 辅助方法：设置配置值（测试中使用）
  __setConfiguration: (key: string, value: any) => {
    mockConfigurations.set(key, value);
  },
  
  // 辅助方法：清空配置（测试中使用）
  __clearConfiguration: () => {
    mockConfigurations.clear();
  }
};

// Mock window
export const window = {
  showInformationMessage: jest.fn(),
  showWarningMessage: jest.fn(),
  showErrorMessage: jest.fn(),
  createOutputChannel: jest.fn(() => ({
    append: jest.fn(),
    appendLine: jest.fn(),
    clear: jest.fn(),
    show: jest.fn(),
    hide: jest.fn(),
    dispose: jest.fn()
  }))
};

// Mock Disposable
export class Disposable {
  constructor(private callOnDispose: () => void) {}
  
  dispose(): void {
    this.callOnDispose();
  }
  
  static from(...disposables: { dispose(): any }[]): Disposable {
    return new Disposable(() => {
      disposables.forEach(d => d.dispose());
    });
  }
}

// Mock ExtensionContext
export interface ExtensionContext {
  subscriptions: { dispose(): any }[];
  extensionPath: string;
  globalState: any;
  workspaceState: any;
  asAbsolutePath(relativePath: string): string;
}

// 导出常用的类型（供测试文件使用）
export const CancellationTokenNone = new CancellationToken();
