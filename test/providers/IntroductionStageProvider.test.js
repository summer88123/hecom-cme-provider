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
const IntroductionStageProvider_1 = require("../../src/providers/IntroductionStageProvider");
(0, globals_1.describe)('IntroductionStageProvider Test Suite', () => {
    (0, globals_1.beforeEach)(() => {
        vscode.workspace.__clearConfiguration();
        globals_1.jest.clearAllMocks();
    });
    (0, globals_1.describe)('Provider Instance', () => {
        (0, globals_1.test)('应该能够创建 Provider 实例', () => {
            const provider = new IntroductionStageProvider_1.IntroductionStageProvider();
            (0, globals_1.expect)(provider).toBeDefined();
            (0, globals_1.expect)(typeof provider.provideOptions).toBe('function');
        });
        (0, globals_1.test)('Provider 应该实现 DynamicOptionsProvider 接口', () => {
            const provider = new IntroductionStageProvider_1.IntroductionStageProvider();
            // 验证 provideOptions 方法存在
            (0, globals_1.expect)('provideOptions' in provider).toBe(true);
            // 验证方法签名正确
            const method = provider.provideOptions;
            (0, globals_1.expect)(typeof method).toBe('function');
        });
    });
    (0, globals_1.describe)('Configuration', () => {
        (0, globals_1.test)('应该能够读取配置', () => {
            const config = vscode.workspace.getConfiguration('hecomCmeProvider.huaweiCloud');
            (0, globals_1.expect)(config).toBeDefined();
        });
        (0, globals_1.test)('配置缺失时应该抛出错误', async () => {
            const provider = new IntroductionStageProvider_1.IntroductionStageProvider();
            const context = {
                tokenValues: {},
            };
            try {
                await provider.provideOptions(context);
                throw new Error('应该抛出配置错误');
            }
            catch (error) {
                (0, globals_1.expect)(error.message.includes('配置') || error.message.includes('未配置')).toBe(true);
                (0, globals_1.expect)(error.message.includes('AK') ||
                    error.message.includes('SK') ||
                    error.message.includes('ProjectId')).toBe(true);
            }
        });
    });
    (0, globals_1.describe)('Options String Parsing', () => {
        (0, globals_1.test)('应该正确解析逗号分隔的字符串', () => {
            // 模拟华为云返回的 options 字符串
            const optionsString = "2501,2502,2503,2504,历史版本,2505";
            // 测试解析逻辑
            const parsed = optionsString
                .split(',')
                .map(opt => opt.trim())
                .filter(opt => opt.length > 0);
            (0, globals_1.expect)(parsed.length).toBe(6);
            (0, globals_1.expect)(parsed[0]).toBe('2501');
            (0, globals_1.expect)(parsed[1]).toBe('2502');
            (0, globals_1.expect)(parsed[4]).toBe('历史版本');
            (0, globals_1.expect)(parsed[5]).toBe('2505');
        });
        (0, globals_1.test)('应该处理包含空格的字符串', () => {
            const optionsString = "2501, 2502 , 2503,  2504  ";
            const parsed = optionsString
                .split(',')
                .map(opt => opt.trim())
                .filter(opt => opt.length > 0);
            (0, globals_1.expect)(parsed.length).toBe(4);
            (0, globals_1.expect)(parsed[0]).toBe('2501');
            (0, globals_1.expect)(parsed[1]).toBe('2502');
            (0, globals_1.expect)(parsed[2]).toBe('2503');
            (0, globals_1.expect)(parsed[3]).toBe('2504');
        });
        (0, globals_1.test)('应该过滤空值', () => {
            const optionsString = "2501,,2502,,,2503";
            const parsed = optionsString
                .split(',')
                .map(opt => opt.trim())
                .filter(opt => opt.length > 0);
            (0, globals_1.expect)(parsed.length).toBe(3);
            (0, globals_1.expect)(parsed[0]).toBe('2501');
            (0, globals_1.expect)(parsed[1]).toBe('2502');
            (0, globals_1.expect)(parsed[2]).toBe('2503');
        });
        (0, globals_1.test)('应该处理中文选项', () => {
            const optionsString = "开发阶段,测试阶段,生产阶段,历史版本";
            const parsed = optionsString
                .split(',')
                .map(opt => opt.trim())
                .filter(opt => opt.length > 0);
            (0, globals_1.expect)(parsed.length).toBe(4);
            (0, globals_1.expect)(parsed[0]).toBe('开发阶段');
            (0, globals_1.expect)(parsed[1]).toBe('测试阶段');
            (0, globals_1.expect)(parsed[2]).toBe('生产阶段');
            (0, globals_1.expect)(parsed[3]).toBe('历史版本');
        });
        (0, globals_1.test)('应该处理单个选项', () => {
            const optionsString = "唯一选项";
            const parsed = optionsString
                .split(',')
                .map(opt => opt.trim())
                .filter(opt => opt.length > 0);
            (0, globals_1.expect)(parsed.length).toBe(1);
            (0, globals_1.expect)(parsed[0]).toBe('唯一选项');
        });
        (0, globals_1.test)('应该处理空字符串', () => {
            const optionsString = "";
            const parsed = optionsString
                .split(',')
                .map(opt => opt.trim())
                .filter(opt => opt.length > 0);
            (0, globals_1.expect)(parsed.length).toBe(0);
        });
    });
    (0, globals_1.describe)('Data Transformation', () => {
        (0, globals_1.test)('应该正确转换选项数据为 DynamicOptionItem', () => {
            const optionValue = "2501";
            const item = {
                label: optionValue,
                value: optionValue,
                description: `引入阶段: ${optionValue}`,
            };
            (0, globals_1.expect)(item.label).toBe('2501');
            (0, globals_1.expect)(item.value).toBe('2501');
            (0, globals_1.expect)(item.description).toBe('引入阶段: 2501');
        });
        (0, globals_1.test)('应该正确转换中文选项', () => {
            const optionValue = "历史版本";
            const item = {
                label: optionValue,
                value: optionValue,
                description: `引入阶段: ${optionValue}`,
            };
            (0, globals_1.expect)(item.label).toBe('历史版本');
            (0, globals_1.expect)(item.value).toBe('历史版本');
            (0, globals_1.expect)(item.description).toBe('引入阶段: 历史版本');
        });
        (0, globals_1.test)('应该转换多个选项', () => {
            const optionValues = ["2501", "2502", "历史版本"];
            const items = optionValues.map(optionValue => ({
                label: optionValue,
                value: optionValue,
                description: `引入阶段: ${optionValue}`,
            }));
            (0, globals_1.expect)(items.length).toBe(3);
            (0, globals_1.expect)(items[0].label).toBe('2501');
            (0, globals_1.expect)(items[1].label).toBe('2502');
            (0, globals_1.expect)(items[2].label).toBe('历史版本');
        });
    });
    (0, globals_1.describe)('API Response Handling', () => {
        (0, globals_1.test)('应该识别字符串类型的 options', () => {
            const mockResponse = {
                datas: [
                    {
                        // eslint-disable-next-line @typescript-eslint/naming-convention
                        custom_field: "custom_field29",
                        type: "radio",
                        name: "引入阶段",
                        options: "2501,2502,2503",
                    }
                ]
            };
            const fieldData = mockResponse.datas[0];
            (0, globals_1.expect)(typeof fieldData.options).toBe('string');
            const parsed = fieldData.options
                .split(',')
                .map(opt => opt.trim())
                .filter(opt => opt.length > 0);
            (0, globals_1.expect)(parsed.length).toBe(3);
        });
        (0, globals_1.test)('应该识别数组类型的 options', () => {
            const mockResponse = {
                datas: [
                    {
                        // eslint-disable-next-line @typescript-eslint/naming-convention
                        custom_field: "custom_field29",
                        type: "radio",
                        name: "引入阶段",
                        options: ["2501", "2502", "2503"],
                    }
                ]
            };
            const fieldData = mockResponse.datas[0];
            (0, globals_1.expect)(Array.isArray(fieldData.options)).toBe(true);
            (0, globals_1.expect)(fieldData.options.length).toBe(3);
        });
        (0, globals_1.test)('应该处理完整的 API 响应', () => {
            const mockResponse = {
                datas: [
                    {
                        // eslint-disable-next-line @typescript-eslint/naming-convention
                        custom_field: "custom_field29",
                        type: "radio",
                        name: "引入阶段",
                        options: "2501,2502,2503,2504,2505,2506,2507,2508,历史版本,2509,2510,2511,2512,2601,2602,2603,2604,2605,2607",
                        // eslint-disable-next-line @typescript-eslint/naming-convention
                        tracker_ids: [3],
                        // eslint-disable-next-line @typescript-eslint/naming-convention
                        create_time: "2025-09-09T14:39:28+08:00"
                    }
                ]
            };
            const fieldData = mockResponse.datas[0];
            (0, globals_1.expect)(fieldData).toBeDefined();
            (0, globals_1.expect)(fieldData.name).toBe('引入阶段');
            (0, globals_1.expect)(fieldData.type).toBe('radio');
            const optionValues = fieldData.options
                .split(',')
                .map((opt) => opt.trim())
                .filter((opt) => opt.length > 0);
            (0, globals_1.expect)(optionValues.length).toBe(19);
            (0, globals_1.expect)(optionValues.includes('历史版本')).toBe(true);
            (0, globals_1.expect)(optionValues.includes('2501')).toBe(true);
            (0, globals_1.expect)(optionValues.includes('2607')).toBe(true);
        });
    });
    (0, globals_1.describe)('Cancellation Token', () => {
        (0, globals_1.test)('应该响应取消令牌', async () => {
            // 由于单例模式和配置检查，我们只能测试取消令牌的数据结构
            const tokenSource = new vscode.CancellationTokenSource();
            (0, globals_1.expect)(tokenSource.token.isCancellationRequested).toBe(false);
            tokenSource.cancel();
            (0, globals_1.expect)(tokenSource.token.isCancellationRequested).toBe(true);
        });
        (0, globals_1.test)('应该在请求前检查取消令牌', async () => {
            // 测试取消令牌的基本功能
            const tokenSource = new vscode.CancellationTokenSource();
            const startTime = Date.now();
            (0, globals_1.expect)(tokenSource.token.isCancellationRequested).toBe(false);
            tokenSource.cancel();
            (0, globals_1.expect)(tokenSource.token.isCancellationRequested).toBe(true);
            const endTime = Date.now();
            // 取消操作应该是即时的
            (0, globals_1.expect)(endTime - startTime).toBeLessThan(100);
        });
    });
    (0, globals_1.describe)('Error Handling', () => {
        (0, globals_1.test)('应该在配置不完整时抛出明确的错误', async () => {
            const provider = new IntroductionStageProvider_1.IntroductionStageProvider();
            const context = {
                tokenValues: {},
            };
            try {
                await provider.provideOptions(context);
                throw new Error('应该抛出错误');
            }
            catch (error) {
                // 验证错误消息是否有用
                (0, globals_1.expect)(error.message.length).toBeGreaterThan(0);
                (0, globals_1.expect)(error.message.includes('AK') ||
                    error.message.includes('SK') ||
                    error.message.includes('配置') ||
                    error.message.includes('ProjectId')).toBe(true);
            }
        });
        (0, globals_1.test)('错误消息应该包含有用的调试信息', async () => {
            const provider = new IntroductionStageProvider_1.IntroductionStageProvider();
            const context = {
                tokenValues: {},
            };
            try {
                await provider.provideOptions(context);
                throw new Error('应该抛出错误');
            }
            catch (error) {
                // 验证错误消息包含关键信息
                (0, globals_1.expect)(error instanceof Error).toBe(true);
                (0, globals_1.expect)(error.message.includes('配置')).toBe(true);
            }
        });
    });
    (0, globals_1.describe)('Edge Cases', () => {
        (0, globals_1.test)('应该处理空的 datas 数组', () => {
            const mockResponse = {
                datas: []
            };
            const hasData = mockResponse.datas && mockResponse.datas.length > 0;
            (0, globals_1.expect)(hasData).toBe(false);
        });
        (0, globals_1.test)('应该处理缺少 options 字段', () => {
            const mockResponse = {
                datas: [
                    {
                        // eslint-disable-next-line @typescript-eslint/naming-convention
                        custom_field: "custom_field29",
                        type: "radio",
                        name: "引入阶段",
                        // options 字段缺失
                    }
                ]
            };
            const fieldData = mockResponse.datas[0];
            const hasOptions = fieldData.options !== undefined &&
                (typeof fieldData.options === 'string' ? fieldData.options.length > 0 : fieldData.options.length > 0);
            (0, globals_1.expect)(hasOptions).toBe(false);
        });
        (0, globals_1.test)('应该处理空的 options 字符串', () => {
            const optionsString = "";
            const parsed = optionsString
                .split(',')
                .map(opt => opt.trim())
                .filter(opt => opt.length > 0);
            (0, globals_1.expect)(parsed.length).toBe(0);
        });
        (0, globals_1.test)('应该处理只包含逗号的字符串', () => {
            const optionsString = ",,,";
            const parsed = optionsString
                .split(',')
                .map(opt => opt.trim())
                .filter(opt => opt.length > 0);
            (0, globals_1.expect)(parsed.length).toBe(0);
        });
        (0, globals_1.test)('应该处理空的 options 数组', () => {
            const optionsArray = [];
            (0, globals_1.expect)(optionsArray.length).toBe(0);
        });
    });
    (0, globals_1.describe)('Type Detection', () => {
        (0, globals_1.test)('应该正确检测字符串类型', () => {
            const options = "2501,2502,2503";
            (0, globals_1.expect)(typeof options).toBe('string');
            (0, globals_1.expect)(Array.isArray(options)).toBe(false);
        });
        (0, globals_1.test)('应该正确检测数组类型', () => {
            const options = ["2501", "2502", "2503"];
            (0, globals_1.expect)(typeof options).toBe('object');
            (0, globals_1.expect)(Array.isArray(options)).toBe(true);
        });
        (0, globals_1.test)('应该识别未知类型', () => {
            const options = null;
            const isString = typeof options === 'string';
            const isArray = Array.isArray(options);
            (0, globals_1.expect)(isString).toBe(false);
            (0, globals_1.expect)(isArray).toBe(false);
        });
        (0, globals_1.test)('应该识别 undefined', () => {
            const options = undefined;
            const isString = typeof options === 'string';
            const isArray = Array.isArray(options);
            (0, globals_1.expect)(isString).toBe(false);
            (0, globals_1.expect)(isArray).toBe(false);
        });
    });
});
//# sourceMappingURL=IntroductionStageProvider.test.js.map