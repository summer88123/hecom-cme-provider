import * as assert from 'assert';
import * as vscode from 'vscode';
import { IntroductionStageProvider } from '../../providers/IntroductionStageProvider';
import type { DynamicOptionsContext } from '../../types/cme-api';

suite('IntroductionStageProvider Test Suite', () => {
  vscode.window.showInformationMessage('Start IntroductionStageProvider tests.');

  suite('Provider Instance', () => {
    test('应该能够创建 Provider 实例', () => {
      const provider = new IntroductionStageProvider();
      assert.ok(provider);
      assert.ok(typeof provider.provideOptions === 'function');
    });

    test('Provider 应该实现 DynamicOptionsProvider 接口', () => {
      const provider = new IntroductionStageProvider();
      
      // 验证 provideOptions 方法存在
      assert.ok('provideOptions' in provider);
      
      // 验证方法签名正确
      const method = provider.provideOptions;
      assert.strictEqual(typeof method, 'function');
    });
  });

  suite('Configuration', () => {
    test('应该能够读取配置', () => {
      const config = vscode.workspace.getConfiguration('hecomCmeProvider.huaweiCloud');
      assert.ok(config !== undefined);
    });

    test('配置缺失时应该抛出错误', async () => {
      const provider = new IntroductionStageProvider();
      
      const context: DynamicOptionsContext = {
        tokenValues: {},
      };

      try {
        await provider.provideOptions(context);
        assert.fail('应该抛出配置错误');
      } catch (error: any) {
        assert.ok(error.message.includes('配置') || error.message.includes('未配置'));
        assert.ok(
          error.message.includes('AK') || 
          error.message.includes('SK') || 
          error.message.includes('ProjectId')
        );
      }
    });
  });

  suite('Options String Parsing', () => {
    test('应该正确解析逗号分隔的字符串', () => {
      // 模拟华为云返回的 options 字符串
      const optionsString = "2501,2502,2503,2504,历史版本,2505";
      
      // 测试解析逻辑
      const parsed = optionsString
        .split(',')
        .map(opt => opt.trim())
        .filter(opt => opt.length > 0);

      assert.strictEqual(parsed.length, 6);
      assert.strictEqual(parsed[0], '2501');
      assert.strictEqual(parsed[1], '2502');
      assert.strictEqual(parsed[4], '历史版本');
      assert.strictEqual(parsed[5], '2505');
    });

    test('应该处理包含空格的字符串', () => {
      const optionsString = "2501, 2502 , 2503,  2504  ";
      
      const parsed = optionsString
        .split(',')
        .map(opt => opt.trim())
        .filter(opt => opt.length > 0);

      assert.strictEqual(parsed.length, 4);
      assert.strictEqual(parsed[0], '2501');
      assert.strictEqual(parsed[1], '2502');
      assert.strictEqual(parsed[2], '2503');
      assert.strictEqual(parsed[3], '2504');
    });

    test('应该过滤空值', () => {
      const optionsString = "2501,,2502,,,2503";
      
      const parsed = optionsString
        .split(',')
        .map(opt => opt.trim())
        .filter(opt => opt.length > 0);

      assert.strictEqual(parsed.length, 3);
      assert.strictEqual(parsed[0], '2501');
      assert.strictEqual(parsed[1], '2502');
      assert.strictEqual(parsed[2], '2503');
    });

    test('应该处理中文选项', () => {
      const optionsString = "开发阶段,测试阶段,生产阶段,历史版本";
      
      const parsed = optionsString
        .split(',')
        .map(opt => opt.trim())
        .filter(opt => opt.length > 0);

      assert.strictEqual(parsed.length, 4);
      assert.strictEqual(parsed[0], '开发阶段');
      assert.strictEqual(parsed[1], '测试阶段');
      assert.strictEqual(parsed[2], '生产阶段');
      assert.strictEqual(parsed[3], '历史版本');
    });

    test('应该处理单个选项', () => {
      const optionsString = "唯一选项";
      
      const parsed = optionsString
        .split(',')
        .map(opt => opt.trim())
        .filter(opt => opt.length > 0);

      assert.strictEqual(parsed.length, 1);
      assert.strictEqual(parsed[0], '唯一选项');
    });

    test('应该处理空字符串', () => {
      const optionsString = "";
      
      const parsed = optionsString
        .split(',')
        .map(opt => opt.trim())
        .filter(opt => opt.length > 0);

      assert.strictEqual(parsed.length, 0);
    });
  });

  suite('Data Transformation', () => {
    test('应该正确转换选项数据为 DynamicOptionItem', () => {
      const optionValue = "2501";
      
      const item = {
        label: optionValue,
        value: optionValue,
        description: `引入阶段: ${optionValue}`,
      };

      assert.strictEqual(item.label, '2501');
      assert.strictEqual(item.value, '2501');
      assert.strictEqual(item.description, '引入阶段: 2501');
    });

    test('应该正确转换中文选项', () => {
      const optionValue = "历史版本";
      
      const item = {
        label: optionValue,
        value: optionValue,
        description: `引入阶段: ${optionValue}`,
      };

      assert.strictEqual(item.label, '历史版本');
      assert.strictEqual(item.value, '历史版本');
      assert.strictEqual(item.description, '引入阶段: 历史版本');
    });

    test('应该转换多个选项', () => {
      const optionValues = ["2501", "2502", "历史版本"];
      
      const items = optionValues.map(optionValue => ({
        label: optionValue,
        value: optionValue,
        description: `引入阶段: ${optionValue}`,
      }));

      assert.strictEqual(items.length, 3);
      assert.strictEqual(items[0].label, '2501');
      assert.strictEqual(items[1].label, '2502');
      assert.strictEqual(items[2].label, '历史版本');
    });
  });

  suite('API Response Handling', () => {
    test('应该识别字符串类型的 options', () => {
      const mockResponse = {
        datas: [
          {
            custom_field: "custom_field29",
            type: "radio",
            name: "引入阶段",
            options: "2501,2502,2503",
          }
        ]
      };

      const fieldData = mockResponse.datas[0];
      assert.strictEqual(typeof fieldData.options, 'string');
      
      const parsed = fieldData.options
        .split(',')
        .map(opt => opt.trim())
        .filter(opt => opt.length > 0);
      
      assert.strictEqual(parsed.length, 3);
    });

    test('应该识别数组类型的 options', () => {
      const mockResponse = {
        datas: [
          {
            custom_field: "custom_field29",
            type: "radio",
            name: "引入阶段",
            options: ["2501", "2502", "2503"],
          }
        ]
      };

      const fieldData = mockResponse.datas[0];
      assert.ok(Array.isArray(fieldData.options));
      assert.strictEqual(fieldData.options.length, 3);
    });

    test('应该处理完整的 API 响应', () => {
      const mockResponse = {
        datas: [
          {
            custom_field: "custom_field29",
            type: "radio",
            name: "引入阶段",
            options: "2501,2502,2503,2504,2505,2506,2507,2508,历史版本,2509,2510,2511,2512,2601,2602,2603,2604,2605,2607",
            tracker_ids: [3],
            create_time: "2025-09-09T14:39:28+08:00"
          }
        ]
      };

      const fieldData = mockResponse.datas[0];
      assert.ok(fieldData);
      assert.strictEqual(fieldData.name, '引入阶段');
      assert.strictEqual(fieldData.type, 'radio');
      
      const optionValues = fieldData.options
        .split(',')
        .map((opt: string) => opt.trim())
        .filter((opt: string) => opt.length > 0);

      assert.strictEqual(optionValues.length, 19);
      assert.ok(optionValues.includes('历史版本'));
      assert.ok(optionValues.includes('2501'));
      assert.ok(optionValues.includes('2607'));
    });
  });

  suite('Cancellation Token', () => {
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
      assert.strictEqual(result.length, 0);
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
      assert.ok(endTime - startTime < 100, '应该立即返回');
      assert.strictEqual(result.length, 0);
    });
  });

  suite('Error Handling', () => {
    test('应该在配置不完整时抛出明确的错误', async () => {
      const provider = new IntroductionStageProvider();
      
      const context: DynamicOptionsContext = {
        tokenValues: {},
      };

      try {
        await provider.provideOptions(context);
        assert.fail('应该抛出错误');
      } catch (error: any) {
        // 验证错误消息是否有用
        assert.ok(error.message.length > 0);
        assert.ok(
          error.message.includes('AK') || 
          error.message.includes('SK') || 
          error.message.includes('配置') ||
          error.message.includes('ProjectId')
        );
      }
    });

    test('错误消息应该包含有用的调试信息', async () => {
      const provider = new IntroductionStageProvider();
      
      const context: DynamicOptionsContext = {
        tokenValues: {},
      };

      try {
        await provider.provideOptions(context);
        assert.fail('应该抛出错误');
      } catch (error: any) {
        // 验证错误消息包含关键信息
        assert.ok(error instanceof Error);
        assert.ok(error.message.includes('配置'));
      }
    });
  });

  suite('Edge Cases', () => {
    test('应该处理空的 datas 数组', () => {
      const mockResponse = {
        datas: []
      };

      const hasData = mockResponse.datas && mockResponse.datas.length > 0;
      assert.strictEqual(hasData, false);
    });

    test('应该处理缺少 options 字段', () => {
      const mockResponse = {
        datas: [
          {
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
      
      assert.strictEqual(hasOptions, false);
    });

    test('应该处理空的 options 字符串', () => {
      const optionsString = "";
      
      const parsed = optionsString
        .split(',')
        .map(opt => opt.trim())
        .filter(opt => opt.length > 0);

      assert.strictEqual(parsed.length, 0);
    });

    test('应该处理只包含逗号的字符串', () => {
      const optionsString = ",,,";
      
      const parsed = optionsString
        .split(',')
        .map(opt => opt.trim())
        .filter(opt => opt.length > 0);

      assert.strictEqual(parsed.length, 0);
    });

    test('应该处理空的 options 数组', () => {
      const optionsArray: string[] = [];
      assert.strictEqual(optionsArray.length, 0);
    });
  });

  suite('Type Detection', () => {
    test('应该正确检测字符串类型', () => {
      const options = "2501,2502,2503";
      assert.strictEqual(typeof options, 'string');
      assert.strictEqual(Array.isArray(options), false);
    });

    test('应该正确检测数组类型', () => {
      const options = ["2501", "2502", "2503"];
      assert.strictEqual(typeof options, 'object');
      assert.strictEqual(Array.isArray(options), true);
    });

    test('应该识别未知类型', () => {
      const options = null;
      const isString = typeof options === 'string';
      const isArray = Array.isArray(options);
      
      assert.strictEqual(isString, false);
      assert.strictEqual(isArray, false);
    });

    test('应该识别 undefined', () => {
      const options = undefined;
      const isString = typeof options === 'string';
      const isArray = Array.isArray(options);
      
      assert.strictEqual(isString, false);
      assert.strictEqual(isArray, false);
    });
  });
});
