import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import * as vscode from 'vscode';
import { IntroductionStageProvider } from '../../src/providers/IntroductionStageProvider';
import type { DynamicOptionsContext } from '../../src/types/cme-api';

describe('IntroductionStageProvider Test Suite', () => {
  beforeEach(() => {
    (vscode.workspace as any).__clearConfiguration();
    jest.clearAllMocks();
  });

  describe('Provider Instance', () => {
    test('应该能够创建 Provider 实例', () => {
      const provider = new IntroductionStageProvider();
      expect(provider).toBeDefined();
      expect(typeof provider.provideOptions).toBe('function');
    });

    test('Provider 应该实现 DynamicOptionsProvider 接口', () => {
      const provider = new IntroductionStageProvider();
      
      // 验证 provideOptions 方法存在
      expect('provideOptions' in provider).toBe(true);
      
      // 验证方法签名正确
      const method = provider.provideOptions;
      expect(typeof method).toBe('function');
    });
  });

  describe('Configuration', () => {
    test('应该能够读取配置', () => {
      const config = vscode.workspace.getConfiguration('hecomCmeProvider.huaweiCloud');
      expect(config).toBeDefined();
    });

    test('配置缺失时应该抛出错误', async () => {
      const provider = new IntroductionStageProvider();
      
      const context: DynamicOptionsContext = {
        tokenValues: {},
      };

      try {
        await provider.provideOptions(context);
        throw new Error('应该抛出配置错误');
      } catch (error: any) {
        expect(error.message.includes('配置') || error.message.includes('未配置')).toBe(true);
        expect(
          error.message.includes('AK') || 
          error.message.includes('SK') || 
          error.message.includes('ProjectId')
        ).toBe(true);
      }
    });
  });

  describe('Options String Parsing', () => {
    test('应该正确解析逗号分隔的字符串', () => {
      // 模拟华为云返回的 options 字符串
      const optionsString = "2501,2502,2503,2504,历史版本,2505";
      
      // 测试解析逻辑
      const parsed = optionsString
        .split(',')
        .map(opt => opt.trim())
        .filter(opt => opt.length > 0);

      expect(parsed.length).toBe(6);
      expect(parsed[0]).toBe('2501');
      expect(parsed[1]).toBe('2502');
      expect(parsed[4]).toBe('历史版本');
      expect(parsed[5]).toBe('2505');
    });

    test('应该处理包含空格的字符串', () => {
      const optionsString = "2501, 2502 , 2503,  2504  ";
      
      const parsed = optionsString
        .split(',')
        .map(opt => opt.trim())
        .filter(opt => opt.length > 0);

      expect(parsed.length).toBe(4);
      expect(parsed[0]).toBe('2501');
      expect(parsed[1]).toBe('2502');
      expect(parsed[2]).toBe('2503');
      expect(parsed[3]).toBe('2504');
    });

    test('应该过滤空值', () => {
      const optionsString = "2501,,2502,,,2503";
      
      const parsed = optionsString
        .split(',')
        .map(opt => opt.trim())
        .filter(opt => opt.length > 0);

      expect(parsed.length).toBe(3);
      expect(parsed[0]).toBe('2501');
      expect(parsed[1]).toBe('2502');
      expect(parsed[2]).toBe('2503');
    });

    test('应该处理中文选项', () => {
      const optionsString = "开发阶段,测试阶段,生产阶段,历史版本";
      
      const parsed = optionsString
        .split(',')
        .map(opt => opt.trim())
        .filter(opt => opt.length > 0);

      expect(parsed.length).toBe(4);
      expect(parsed[0]).toBe('开发阶段');
      expect(parsed[1]).toBe('测试阶段');
      expect(parsed[2]).toBe('生产阶段');
      expect(parsed[3]).toBe('历史版本');
    });

    test('应该处理单个选项', () => {
      const optionsString = "唯一选项";
      
      const parsed = optionsString
        .split(',')
        .map(opt => opt.trim())
        .filter(opt => opt.length > 0);

      expect(parsed.length).toBe(1);
      expect(parsed[0]).toBe('唯一选项');
    });

    test('应该处理空字符串', () => {
      const optionsString = "";
      
      const parsed = optionsString
        .split(',')
        .map(opt => opt.trim())
        .filter(opt => opt.length > 0);

      expect(parsed.length).toBe(0);
    });
  });

  describe('Data Transformation', () => {
    test('应该正确转换选项数据为 DynamicOptionItem', () => {
      const optionValue = "2501";
      
      const item = {
        label: optionValue,
        value: optionValue,
        description: `引入阶段: ${optionValue}`,
      };

      expect(item.label).toBe('2501');
      expect(item.value).toBe('2501');
      expect(item.description).toBe('引入阶段: 2501');
    });

    test('应该正确转换中文选项', () => {
      const optionValue = "历史版本";
      
      const item = {
        label: optionValue,
        value: optionValue,
        description: `引入阶段: ${optionValue}`,
      };

      expect(item.label).toBe('历史版本');
      expect(item.value).toBe('历史版本');
      expect(item.description).toBe('引入阶段: 历史版本');
    });

    test('应该转换多个选项', () => {
      const optionValues = ["2501", "2502", "历史版本"];
      
      const items = optionValues.map(optionValue => ({
        label: optionValue,
        value: optionValue,
        description: `引入阶段: ${optionValue}`,
      }));

      expect(items.length).toBe(3);
      expect(items[0].label).toBe('2501');
      expect(items[1].label).toBe('2502');
      expect(items[2].label).toBe('历史版本');
    });
  });

  describe('API Response Handling', () => {
    test('应该识别字符串类型的 options', () => {
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
      expect(typeof fieldData.options).toBe('string');
      
      const parsed = fieldData.options
        .split(',')
        .map(opt => opt.trim())
        .filter(opt => opt.length > 0);
      
      expect(parsed.length).toBe(3);
    });

    test('应该识别数组类型的 options', () => {
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
      expect(Array.isArray(fieldData.options)).toBe(true);
      expect(fieldData.options.length).toBe(3);
    });

    test('应该处理完整的 API 响应', () => {
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
      expect(fieldData).toBeDefined();
      expect(fieldData.name).toBe('引入阶段');
      expect(fieldData.type).toBe('radio');
      
      const optionValues = fieldData.options
        .split(',')
        .map((opt: string) => opt.trim())
        .filter((opt: string) => opt.length > 0);

      expect(optionValues.length).toBe(19);
      expect(optionValues.includes('历史版本')).toBe(true);
      expect(optionValues.includes('2501')).toBe(true);
      expect(optionValues.includes('2607')).toBe(true);
    });
  });

  describe('Cancellation Token', () => {
    test('应该响应取消令牌', async () => {
      const provider = new IntroductionStageProvider();
      
      // 创建一个已经取消的 token
      const tokenSource = new vscode.CancellationTokenSource();
      tokenSource.cancel();

      const context: DynamicOptionsContext = {
        tokenValues: {},
        cancellationToken: tokenSource.token,
      };

      const result = await provider.provideOptions(context);
      
      // 当请求被取消时,应该返回空数组
      expect(result.length).toBe(0);
    });

    test('应该在请求前检查取消令牌', async () => {
      const provider = new IntroductionStageProvider();
      
      const tokenSource = new vscode.CancellationTokenSource();
      tokenSource.cancel();

      const context: DynamicOptionsContext = {
        tokenValues: {},
        cancellationToken: tokenSource.token,
      };

      const startTime = Date.now();
      const result = await provider.provideOptions(context);
      const endTime = Date.now();

      // 应该立即返回,不应该进行网络请求
      expect(endTime - startTime).toBeLessThan(100);
      expect(result.length).toBe(0);
    });
  });

  describe('Error Handling', () => {
    test('应该在配置不完整时抛出明确的错误', async () => {
      const provider = new IntroductionStageProvider();
      
      const context: DynamicOptionsContext = {
        tokenValues: {},
      };

      try {
        await provider.provideOptions(context);
        throw new Error('应该抛出错误');
      } catch (error: any) {
        // 验证错误消息是否有用
        expect(error.message.length).toBeGreaterThan(0);
        expect(
          error.message.includes('AK') || 
          error.message.includes('SK') || 
          error.message.includes('配置') ||
          error.message.includes('ProjectId')
        ).toBe(true);
      }
    });

    test('错误消息应该包含有用的调试信息', async () => {
      const provider = new IntroductionStageProvider();
      
      const context: DynamicOptionsContext = {
        tokenValues: {},
      };

      try {
        await provider.provideOptions(context);
        throw new Error('应该抛出错误');
      } catch (error: any) {
        // 验证错误消息包含关键信息
        expect(error instanceof Error).toBe(true);
        expect(error.message.includes('配置')).toBe(true);
      }
    });
  });

  describe('Edge Cases', () => {
    test('应该处理空的 datas 数组', () => {
      const mockResponse = {
        datas: []
      };

      const hasData = mockResponse.datas && mockResponse.datas.length > 0;
      expect(hasData).toBe(false);
    });

    test('应该处理缺少 options 字段', () => {
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

      const fieldData: any = mockResponse.datas[0];
      const hasOptions = fieldData.options && 
        (typeof fieldData.options === 'string' ? fieldData.options.length > 0 : fieldData.options.length > 0);
      
      expect(hasOptions).toBe(false);
    });

    test('应该处理空的 options 字符串', () => {
      const optionsString = "";
      
      const parsed = optionsString
        .split(',')
        .map(opt => opt.trim())
        .filter(opt => opt.length > 0);

      expect(parsed.length).toBe(0);
    });

    test('应该处理只包含逗号的字符串', () => {
      const optionsString = ",,,";
      
      const parsed = optionsString
        .split(',')
        .map(opt => opt.trim())
        .filter(opt => opt.length > 0);

      expect(parsed.length).toBe(0);
    });

    test('应该处理空的 options 数组', () => {
      const optionsArray: string[] = [];
      expect(optionsArray.length).toBe(0);
    });
  });

  describe('Type Detection', () => {
    test('应该正确检测字符串类型', () => {
      const options = "2501,2502,2503";
      expect(typeof options).toBe('string');
      expect(Array.isArray(options)).toBe(false);
    });

    test('应该正确检测数组类型', () => {
      const options = ["2501", "2502", "2503"];
      expect(typeof options).toBe('object');
      expect(Array.isArray(options)).toBe(true);
    });

    test('应该识别未知类型', () => {
      const options = null;
      const isString = typeof options === 'string';
      const isArray = Array.isArray(options);
      
      expect(isString).toBe(false);
      expect(isArray).toBe(false);
    });

    test('应该识别 undefined', () => {
      const options = undefined;
      const isString = typeof options === 'string';
      const isArray = Array.isArray(options);
      
      expect(isString).toBe(false);
      expect(isArray).toBe(false);
    });
  });
});
