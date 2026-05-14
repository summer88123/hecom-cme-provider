import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import * as vscode from 'vscode';
import { IssueProvider } from '../../src/providers/IssueProvider';
import type { DynamicOptionsContext } from '../../src/types/cme-api';

describe('IssueProvider Test Suite', () => {
  // 辅助函数：设置完整的配置和 Mock（单页数据，total 默认等于 issues 长度）
  const setupProviderWithMock = (mockIssues: any[], total?: number) => {
    // 设置完整配置
    (vscode.workspace as any).__setConfiguration('hecomCmeProvider.huaweiCloud.accessKey', 'test-ak');
    (vscode.workspace as any).__setConfiguration('hecomCmeProvider.huaweiCloud.secretKey', 'test-sk');
    (vscode.workspace as any).__setConfiguration('hecomCmeProvider.huaweiCloud.domainId', 'test-domain');
    (vscode.workspace as any).__setConfiguration('hecomCmeProvider.huaweiCloud.projectId', 'test-project-id');

    const provider = new IssueProvider();

    // Mock client response
    // @ts-ignore - Mock 对象类型
    const mockClient = {
      // @ts-ignore
      listIssuesV4: jest.fn().mockResolvedValue({
        issues: mockIssues,
        total: total ?? mockIssues.length,
      })
    };

    // 替换客户端和用户信息管理器
    const clientManager = (provider as any).clientManager;
    clientManager.getClient = jest.fn().mockReturnValue(mockClient);

    const userInfoManager = (provider as any).userInfoManager;
    userInfoManager.getProjectId = jest.fn().mockReturnValue('test-project-id');

    return { provider, mockClient };
  };

  // 辅助函数：生成指定数量的 Mock Issue 列表
  const generateMockIssues = (count: number, startId = 1) =>
    Array.from({ length: count }, (_, i) => ({
      id: startId + i,
      name: `Issue ${startId + i}`,
      tracker: { name: 'Task' },
      new_custom_fields: [],
    }));

  beforeEach(() => {
    (vscode.workspace as any).__clearConfiguration();
    jest.clearAllMocks();
  });

  describe('Configuration', () => {
    test('应该能够读取配置', () => {
      const config = vscode.workspace.getConfiguration('hecomCmeProvider.huaweiCloud');
      expect(config).toBeDefined();
    });

    test('配置缺失时应该抛出错误', async () => {
      const provider = new IssueProvider();
      const context: DynamicOptionsContext = {
        tokenValues: {},
      };

      await expect(provider.provideOptions(context)).rejects.toThrow(/配置|未配置/);
    });
  });

  describe('Data Transformation', () => {
    test('应该正确转换普通 Issue 数据格式（无自定义字段）', async () => {
      const { provider } = setupProviderWithMock([
        {
          id: 123,
          name: '修复登录问题',
          status: { name: '进行中' },
          tracker: { name: 'Bug' },
          new_custom_fields: []
        }
      ]);

      const context: DynamicOptionsContext = {
        tokenValues: {},
      };

      const result = await provider.provideOptions(context);

      expect(result).toHaveLength(1);
      expect(result[0].label).toBe('[Bug] 修复登录问题');
      expect(result[0].value).toContain('修复登录问题:');
      expect(result[0].value).toContain('https://devcloud.cn-north-4.huaweicloud.com/projectman/scrum/test-project-id/task/detail/123');
      expect(result[0].value).not.toContain('[客户反馈]');
    });

    test('应该处理缺陷类型为"客户反馈"的 Issue', async () => {
      const { provider } = setupProviderWithMock([
        {
          id: 456,
          name: '用户反馈的问题',
          status: { name: '新建' },
          tracker: { name: 'Bug' },
          new_custom_fields: [
            {
              custom_field: 'custom_field36',
              value: '客户反馈',
              field_name: '缺陷类型',
              field_type: 'radio',
              description: ''
            }
          ]
        }
      ]);

      const context: DynamicOptionsContext = {
        tokenValues: {},
      };

      const result = await provider.provideOptions(context);

      expect(result).toHaveLength(1);
      // label 应该使用"客户反馈"而不是"Bug"
      expect(result[0].label).toBe('[客户反馈] 用户反馈的问题');
      // value 应该包含"[客户反馈]"前缀
      expect(result[0].value).toContain('[客户反馈] 用户反馈的问题:');
      expect(result[0].value).toContain('https://devcloud.cn-north-4.huaweicloud.com/projectman/scrum/test-project-id/task/detail/456');
    });

    test('应该处理缺陷类型为其他值的 Issue', async () => {
      const { provider } = setupProviderWithMock([
        {
          id: 789,
          name: '测试问题',
          status: { name: '已解决' },
          tracker: { name: 'Task' },
          new_custom_fields: [
            {
              custom_field: 'custom_field36',
              value: '代码问题',
              field_name: '缺陷类型',
              field_type: 'radio',
              description: ''
            }
          ]
        }
      ]);

      const context: DynamicOptionsContext = {
        tokenValues: {},
      };

      const result = await provider.provideOptions(context);

      expect(result).toHaveLength(1);
      // label 应该使用 tracker 名称
      expect(result[0].label).toBe('[Task] 测试问题');
      // value 不应该包含"[客户反馈]"前缀
      expect(result[0].value).toContain('测试问题:');
      expect(result[0].value).not.toContain('[客户反馈]');
    });

    test('应该处理没有自定义字段的 Issue', async () => {
      const { provider } = setupProviderWithMock([
        {
          id: 999,
          name: '简单问题',
          status: { name: '已拒绝' },
          tracker: { name: 'Bug' },
          new_custom_fields: undefined
        }
      ]);

      const context: DynamicOptionsContext = {
        tokenValues: {},
      };

      const result = await provider.provideOptions(context);

      expect(result).toHaveLength(1);
      expect(result[0].label).toBe('[Bug] 简单问题');
      expect(result[0].value).toContain('简单问题:');
      expect(result[0].value).not.toContain('[客户反馈]');
    });

    test('应该处理 Issue 名称为空的情况', async () => {
      const { provider } = setupProviderWithMock([
        {
          id: 111,
          name: '',
          status: { name: '新建' },
          tracker: { name: 'Task' },
          new_custom_fields: []
        }
      ]);

      const context: DynamicOptionsContext = {
        tokenValues: {},
      };

      const result = await provider.provideOptions(context);

      expect(result).toHaveLength(1);
      expect(result[0].label).toBe('[Task] 无标题');
      expect(result[0].value).toContain('无标题:');
    });
  });

  describe('Cancellation Token', () => {
    test('应该响应取消令牌', async () => {
      // 由于单例模式和配置检查，我们只能测试配置完整时的取消逻辑
      // 这个测试主要验证取消令牌的数据结构
      const tokenSource = new vscode.CancellationTokenSource();
      expect(tokenSource.token.isCancellationRequested).toBe(false);

      tokenSource.cancel();
      expect(tokenSource.token.isCancellationRequested).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('应该在配置不完整时抛出明确的错误', async () => {
      // 清除所有 mock 和配置
      jest.clearAllMocks();
      (vscode.workspace as any).__clearConfiguration();

      // 创建新的 Provider（不使用 setupProviderWithMock）
      const provider = new IssueProvider();

      // 重置客户端和用户信息管理器（移除之前测试的 Mock）
      const clientManager = (provider as any).clientManager;
      delete clientManager.getClient;

      const userInfoManager = (provider as any).userInfoManager;
      delete userInfoManager.getProjectId;

      const context: DynamicOptionsContext = {
        tokenValues: {},
      };

      await expect(provider.provideOptions(context)).rejects.toThrow(/AK|SK|配置/);
    });
  });

  describe('Provider Instance', () => {
    test('应该能够创建 Provider 实例', () => {
      const provider = new IssueProvider();
      expect(provider).toBeDefined();
      expect(typeof provider.provideOptions).toBe('function');
    });

    test('Provider 应该实现正确的接口', () => {
      const provider = new IssueProvider();
      expect('provideOptions' in provider).toBe(true);

      const method = provider.provideOptions;
      expect(typeof method).toBe('function');
    });
  });

  describe('Configuration Reload', () => {
    test('应该能监听配置变更', () => {
      const provider = new IssueProvider();
      expect(provider).toBeDefined();
    });
  });

  describe('Pagination', () => {
    test('总数超过 50 时应循环拉取所有数据', async () => {
      // 模拟 total=120，分三页：50+50+20
      const page1 = generateMockIssues(50, 1);
      const page2 = generateMockIssues(50, 51);
      const page3 = generateMockIssues(20, 101);
      const TOTAL = 120;

      // 配置 mock
      (vscode.workspace as any).__setConfiguration('hecomCmeProvider.huaweiCloud.accessKey', 'test-ak');
      (vscode.workspace as any).__setConfiguration('hecomCmeProvider.huaweiCloud.secretKey', 'test-sk');
      (vscode.workspace as any).__setConfiguration('hecomCmeProvider.huaweiCloud.domainId', 'test-domain');
      (vscode.workspace as any).__setConfiguration('hecomCmeProvider.huaweiCloud.projectId', 'test-project-id');

      const provider = new IssueProvider();

      const mockClient = {
        listIssuesV4: jest
          .fn()
          // @ts-ignore
          .mockResolvedValueOnce({ issues: page1, total: TOTAL })
          // @ts-ignore
          .mockResolvedValueOnce({ issues: page2, total: TOTAL })
          // @ts-ignore
          .mockResolvedValueOnce({ issues: page3, total: TOTAL }),
      };

      (provider as any).clientManager.getClient = jest.fn().mockReturnValue(mockClient);
      (provider as any).userInfoManager.getProjectId = jest.fn().mockReturnValue('test-project-id');

      const context: DynamicOptionsContext = { tokenValues: {} };
      const result = await provider.provideOptions(context);

      expect(result).toHaveLength(TOTAL);
      expect(mockClient.listIssuesV4).toHaveBeenCalledTimes(3);

      // 验证 offset 参数递增
      // @ts-ignore
      expect(mockClient.listIssuesV4.mock.calls[0][0].body.offset).toBe(0);
      // @ts-ignore
      expect(mockClient.listIssuesV4.mock.calls[1][0].body.offset).toBe(50);
      // @ts-ignore
      expect(mockClient.listIssuesV4.mock.calls[2][0].body.offset).toBe(100);
    });

    test('数据量恰好为 50 时只请求一次', async () => {
      const { provider, mockClient } = setupProviderWithMock(generateMockIssues(50), 50);

      const context: DynamicOptionsContext = { tokenValues: {} };
      const result = await provider.provideOptions(context);

      expect(result).toHaveLength(50);
      expect(mockClient.listIssuesV4).toHaveBeenCalledTimes(1);
    });

    test('取消令牌在第二页请求前触发时应提前返回空数组', async () => {
      const page1 = generateMockIssues(50, 1);
      const TOTAL = 100;

      (vscode.workspace as any).__setConfiguration('hecomCmeProvider.huaweiCloud.accessKey', 'test-ak');
      (vscode.workspace as any).__setConfiguration('hecomCmeProvider.huaweiCloud.secretKey', 'test-sk');
      (vscode.workspace as any).__setConfiguration('hecomCmeProvider.huaweiCloud.domainId', 'test-domain');
      (vscode.workspace as any).__setConfiguration('hecomCmeProvider.huaweiCloud.projectId', 'test-project-id');

      const provider = new IssueProvider();
      const tokenSource = new vscode.CancellationTokenSource();

      const mockClient = {
        // 第一页正常返回，同时触发取消
        listIssuesV4: jest.fn().mockImplementation(async () => {
          tokenSource.cancel();
          return { issues: page1, total: TOTAL };
        }),
      };

      (provider as any).clientManager.getClient = jest.fn().mockReturnValue(mockClient);
      (provider as any).userInfoManager.getProjectId = jest.fn().mockReturnValue('test-project-id');

      const context: DynamicOptionsContext = {
        tokenValues: {},
        cancellationToken: tokenSource.token,
      };
      const result = await provider.provideOptions(context);

      // 第一页拿到后发现已取消，应在第二次循环开始时返回 []
      expect(result).toHaveLength(0);
      expect(mockClient.listIssuesV4).toHaveBeenCalledTimes(1);
    });
  });
});
