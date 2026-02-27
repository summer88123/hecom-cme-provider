"use strict";
/**
 * VSCode API Manual Mock
 * 用于在 Node.js 环境中模拟 VSCode API
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CancellationTokenNone = exports.Disposable = exports.window = exports.workspace = exports.CancellationToken = exports.CancellationTokenSource = void 0;
// Mock CancellationToken
class CancellationTokenSource {
    constructor() {
        this._token = new CancellationToken();
    }
    get token() {
        return this._token;
    }
    cancel() {
        this._token.cancel();
    }
    dispose() {
        // no-op
    }
}
exports.CancellationTokenSource = CancellationTokenSource;
class CancellationToken {
    constructor() {
        this._isCancellationRequested = false;
    }
    get isCancellationRequested() {
        return this._isCancellationRequested;
    }
    cancel() {
        this._isCancellationRequested = true;
    }
}
exports.CancellationToken = CancellationToken;
// Mock workspace configuration
const mockConfigurations = new Map();
exports.workspace = {
    getConfiguration: jest.fn((section) => {
        return {
            get: jest.fn((key, defaultValue) => {
                const fullKey = section ? `${section}.${key}` : key;
                return mockConfigurations.get(fullKey) ?? defaultValue;
            }),
            update: jest.fn((key, value) => {
                const fullKey = section ? `${section}.${key}` : key;
                mockConfigurations.set(fullKey, value);
                return Promise.resolve();
            }),
            has: jest.fn((key) => {
                const fullKey = section ? `${section}.${key}` : key;
                return mockConfigurations.has(fullKey);
            }),
            inspect: jest.fn()
        };
    }),
    onDidChangeConfiguration: jest.fn(() => {
        return new Disposable(() => { });
    }),
    // 辅助方法：设置配置值（测试中使用）
    __setConfiguration: (key, value) => {
        mockConfigurations.set(key, value);
    },
    // 辅助方法：清空配置（测试中使用）
    __clearConfiguration: () => {
        mockConfigurations.clear();
    }
};
// Mock window
exports.window = {
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
class Disposable {
    constructor(callOnDispose) {
        this.callOnDispose = callOnDispose;
    }
    dispose() {
        this.callOnDispose();
    }
    static from(...disposables) {
        return new Disposable(() => {
            disposables.forEach(d => d.dispose());
        });
    }
}
exports.Disposable = Disposable;
// 导出常用的类型（供测试文件使用）
exports.CancellationTokenNone = new CancellationToken();
//# sourceMappingURL=vscode.js.map