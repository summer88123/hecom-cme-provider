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

// Mock Uri
export class Uri {
  private constructor(
    public readonly scheme: string,
    public readonly authority: string,
    public readonly path: string,
    public readonly query: string,
    public readonly fragment: string,
  ) {}

  public fsPath: string = '';

  static file(path: string): Uri {
    const uri = new Uri('file', '', path, '', '');
    uri.fsPath = path;
    return uri;
  }

  static parse(value: string): Uri {
    // Simple implementation for testing
    return new Uri('file', '', value, '', '');
  }

  toString(): string {
    return `${this.scheme}://${this.authority}${this.path}`;
  }
}

// Mock RelativePattern
export class RelativePattern {
  constructor(
    public readonly base: Uri | string,
    public readonly pattern: string,
  ) {}

  // 添加类型判断方法，方便测试中识别
  get isRelativePattern(): boolean {
    return true;
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
      inspect: jest.fn(),
    };
  }),

  onDidChangeConfiguration: jest.fn(() => {
    return new Disposable(() => {});
  }),

  findFiles: jest.fn((
    _include: string,
    _exclude?: string | null,
    _maxResults?: number,
  ): Promise<Uri[]> => {
    // Default implementation returns empty array
    // Tests can mock this to return specific files
    return Promise.resolve([]);
  }),

  // 辅助方法：设置配置值（测试中使用）
  __setConfiguration: (key: string, value: any) => {
    mockConfigurations.set(key, value);
  },

  // 辅助方法：清空配置（测试中使用）
  __clearConfiguration: () => {
    mockConfigurations.clear();
  },
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
