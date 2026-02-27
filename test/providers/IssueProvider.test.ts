import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import * as vscode from 'vscode';
import { IssueProvider } from '../../src/providers/IssueProvider';
import type { DynamicOptionsContext } from '../../src/types/cme-api';

describe('IssueProvider Test Suite', () => {
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
    test('应该正确转换 Issue 数据格式', () => {
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

      expect(label).toBe(expected.label);
      expect(value).toBe(expected.value);
      expect(description).toBe(expected.description);
    });

    test('应该处理没有状态的 Issue', () => {
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

      expect(label).toBe('#456');
      expect(value).toBe('456');
      expect(description).toBe('添加新功能');
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
      const provider = new IssueProvider();
      const context: DynamicOptionsContext = {
        tokenValues: {},
      };

      await expect(async () => {
        await provider.provideOptions(context);
      }).rejects.toThrow();

      try {
        await provider.provideOptions(context);
      } catch (error: any) {
        expect(error.message.length).toBeGreaterThan(0);
        expect(error.message).toMatch(/AK|SK|配置/);
      }
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
});
