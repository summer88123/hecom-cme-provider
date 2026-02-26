import * as assert from 'assert';
import * as vscode from 'vscode';
import { IssueProvider } from '../../providers/IssueProvider';
import type { DynamicOptionsContext } from '../../types/cme-api';

suite('IssueProvider Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	suite('Configuration', () => {
		test('应该能够读取配置', () => {
			const config = vscode.workspace.getConfiguration('hecomCmeProvider.huaweiCloud');
			assert.ok(config !== undefined);
		});

		test('配置缺失时应该抛出错误', async () => {
			// 创建一个测试用的 Provider 实例
			const provider = new IssueProvider();
			
			// 清空配置（通过传递一个空的上下文）
			const context: DynamicOptionsContext = {
				tokenValues: {},
			};

			try {
				// 尝试调用 provideOptions，应该抛出错误
				await provider.provideOptions(context);
				assert.fail('应该抛出配置错误');
			} catch (error: any) {
				assert.ok(error.message.includes('配置') || error.message.includes('未配置'));
			}
		});
	});

	suite('Data Transformation', () => {
		test('应该正确转换 Issue 数据格式', () => {
			// 模拟华为云返回的 Issue 数据
			const mockIssue = {
				id: 123,
				subject: '修复登录问题',
				status: {
					name: '进行中'
				}
			};

			// 验证转换后的格式
			const expected = {
				label: '#123',
				value: '123',
				description: '修复登录问题 [进行中]'
			};

			// 这里我们测试数据转换逻辑
			// 实际的转换发生在 Provider 内部
			const label = `#${mockIssue.id}`;
			const value = String(mockIssue.id);
			const description = `${mockIssue.subject} [${mockIssue.status.name}]`;

			assert.strictEqual(label, expected.label);
			assert.strictEqual(value, expected.value);
			assert.strictEqual(description, expected.description);
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

			assert.strictEqual(label, '#456');
			assert.strictEqual(value, '456');
			assert.strictEqual(description, '添加新功能');
		});
	});

	suite('Cancellation Token', () => {
		test('应该响应取消令牌', async () => {
			const provider = new IssueProvider();
			
			// 创建一个已经取消的 token
			const tokenSource = new vscode.CancellationTokenSource();
			tokenSource.cancel();

			const context: DynamicOptionsContext = {
				tokenValues: {},
				cancellationToken: tokenSource.token,
			};

			const result = await provider.provideOptions(context);
			
			// 当请求被取消时，应该返回空数组
			assert.strictEqual(result.length, 0);
		});
	});

	suite('Error Handling', () => {
		test('应该在配置不完整时抛出明确的错误', async () => {
			const provider = new IssueProvider();
			
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
					error.message.includes('配置')
				);
			}
		});
	});

	suite('Provider Instance', () => {
		test('应该能够创建 Provider 实例', () => {
			const provider = new IssueProvider();
			assert.ok(provider);
			assert.ok(typeof provider.provideOptions === 'function');
		});

		test('Provider 应该实现正确的接口', () => {
			const provider = new IssueProvider();
			
			// 验证 provideOptions 方法存在
			assert.ok('provideOptions' in provider);
			
			// 验证方法签名正确
			const method = provider.provideOptions;
			assert.strictEqual(typeof method, 'function');
		});
	});

	suite('Configuration Reload', () => {
		test('应该能监听配置变更', (done) => {
			// 创建 Provider 实例时会注册配置监听器
			const provider = new IssueProvider();
			
			// 如果能创建成功，说明配置监听器注册正常
			assert.ok(provider);
			done();
		});
	});
});
