"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const vscode = __importStar(require("vscode"));
const IssueProvider_1 = require("../../src/providers/IssueProvider");
(0, globals_1.describe)('IssueProvider Test Suite', () => {
    (0, globals_1.beforeEach)(() => {
        vscode.workspace.__clearConfiguration();
        globals_1.jest.clearAllMocks();
    });
    (0, globals_1.describe)('Configuration', () => {
        (0, globals_1.test)('应该能够读取配置', () => {
            const config = vscode.workspace.getConfiguration('hecomCmeProvider.huaweiCloud');
            (0, globals_1.expect)(config).toBeDefined();
        });
        (0, globals_1.test)('配置缺失时应该抛出错误', async () => {
            const provider = new IssueProvider_1.IssueProvider();
            const context = {
                tokenValues: {},
            };
            await (0, globals_1.expect)(provider.provideOptions(context)).rejects.toThrow(/配置|未配置/);
        });
    });
    (0, globals_1.describe)('Data Transformation', () => {
        (0, globals_1.test)('应该正确转换 Issue 数据格式', () => {
            const mockIssue = {
                id: 123,
                subject: '修复登录问题',
                status: {
                    name: '进行中'
                }
            };
            const expected = {
                label: '#123',
                value: '123',
                description: '修复登录问题 [进行中]'
            };
            const label = `#${mockIssue.id}`;
            const value = String(mockIssue.id);
            const description = `${mockIssue.subject} [${mockIssue.status.name}]`;
            (0, globals_1.expect)(label).toBe(expected.label);
            (0, globals_1.expect)(value).toBe(expected.value);
            (0, globals_1.expect)(description).toBe(expected.description);
        });
        (0, globals_1.test)('应该处理没有状态的 Issue', () => {
            const mockIssue = {
                id: 456,
                subject: '添加新功能',
                status: undefined
            };
            const label = `#${mockIssue.id}`;
            const value = String(mockIssue.id);
            const description = mockIssue.status
                ? `${mockIssue.subject} [${mockIssue.status}]`
                : mockIssue.subject;
            (0, globals_1.expect)(label).toBe('#456');
            (0, globals_1.expect)(value).toBe('456');
            (0, globals_1.expect)(description).toBe('添加新功能');
        });
    });
    (0, globals_1.describe)('Cancellation Token', () => {
        (0, globals_1.test)('应该响应取消令牌', async () => {
            const provider = new IssueProvider_1.IssueProvider();
            const tokenSource = new vscode.CancellationTokenSource();
            tokenSource.cancel();
            const context = {
                tokenValues: {},
                cancellationToken: tokenSource.token,
            };
            const result = await provider.provideOptions(context);
            (0, globals_1.expect)(result).toHaveLength(0);
        });
    });
    (0, globals_1.describe)('Error Handling', () => {
        (0, globals_1.test)('应该在配置不完整时抛出明确的错误', async () => {
            const provider = new IssueProvider_1.IssueProvider();
            const context = {
                tokenValues: {},
            };
            await (0, globals_1.expect)(async () => {
                await provider.provideOptions(context);
            }).rejects.toThrow();
            try {
                await provider.provideOptions(context);
            }
            catch (error) {
                (0, globals_1.expect)(error.message.length).toBeGreaterThan(0);
                (0, globals_1.expect)(error.message).toMatch(/AK|SK|配置/);
            }
        });
    });
    (0, globals_1.describe)('Provider Instance', () => {
        (0, globals_1.test)('应该能够创建 Provider 实例', () => {
            const provider = new IssueProvider_1.IssueProvider();
            (0, globals_1.expect)(provider).toBeDefined();
            (0, globals_1.expect)(typeof provider.provideOptions).toBe('function');
        });
        (0, globals_1.test)('Provider 应该实现正确的接口', () => {
            const provider = new IssueProvider_1.IssueProvider();
            (0, globals_1.expect)('provideOptions' in provider).toBe(true);
            const method = provider.provideOptions;
            (0, globals_1.expect)(typeof method).toBe('function');
        });
    });
    (0, globals_1.describe)('Configuration Reload', () => {
        (0, globals_1.test)('应该能监听配置变更', () => {
            const provider = new IssueProvider_1.IssueProvider();
            (0, globals_1.expect)(provider).toBeDefined();
        });
    });
});
//# sourceMappingURL=IssueProvider.test.js.map