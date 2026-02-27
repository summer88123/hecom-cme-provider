import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import * as vscode from 'vscode';
import * as fs from 'fs';
import { loadCredentialsFromFile, getCredentials } from '../../src/utils/credentialsLoader';

// Mock modules
jest.mock('fs');
jest.mock('../../src/utils/logger');

describe('credentialsLoader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (vscode.workspace as any).__clearConfiguration();
  });

  describe('loadCredentialsFromFile', () => {
    test('应该能够从有效的 JSON 文件加载凭证', async () => {
      // Mock findFiles 返回一个文件
      const mockUri = {
        fsPath: '/path/to/credentials.json',
      } as vscode.Uri;
      jest.spyOn(vscode.workspace, 'findFiles').mockResolvedValue([mockUri]);

      // Mock fs.readFileSync 返回有效的 JSON
      const mockFileContent = JSON.stringify({
        ak: 'test-access-key',
        sk: 'test-secret-key',
      });
      (fs.readFileSync as jest.Mock).mockReturnValue(mockFileContent);

      const result = await loadCredentialsFromFile('**/credentials.json');

      expect(result).toBeTruthy();
      expect(result?.accessKey).toBe('test-access-key');
      expect(result?.secretKey).toBe('test-secret-key');
    });

    test('当文件不存在时应该返回 undefined', async () => {
      // Mock findFiles 返回空数组
      jest.spyOn(vscode.workspace, 'findFiles').mockResolvedValue([]);

      const result = await loadCredentialsFromFile('**/credentials.json');

      expect(result).toBeUndefined();
    });

    test('当文件扩展名不是 .json 时应该返回 undefined', async () => {
      // Mock findFiles 返回一个非 JSON 文件
      const mockUri = {
        fsPath: '/path/to/credentials.txt',
      } as vscode.Uri;
      jest.spyOn(vscode.workspace, 'findFiles').mockResolvedValue([mockUri]);

      const result = await loadCredentialsFromFile('**/credentials.txt');

      expect(result).toBeUndefined();
    });

    test('当 JSON 文件格式不正确时应该返回 undefined', async () => {
      // Mock findFiles 返回一个文件
      const mockUri = {
        fsPath: '/path/to/credentials.json',
      } as vscode.Uri;
      jest.spyOn(vscode.workspace, 'findFiles').mockResolvedValue([mockUri]);

      // Mock fs.readFileSync 返回缺少字段的 JSON
      const mockFileContent = JSON.stringify({
        ak: 'test-access-key',
        // 缺少 sk 字段
      });
      (fs.readFileSync as jest.Mock).mockReturnValue(mockFileContent);

      const result = await loadCredentialsFromFile('**/credentials.json');

      expect(result).toBeUndefined();
    });

    test('当读取文件失败时应该返回 undefined', async () => {
      // Mock findFiles 返回一个文件
      const mockUri = {
        fsPath: '/path/to/credentials.json',
      } as vscode.Uri;
      jest.spyOn(vscode.workspace, 'findFiles').mockResolvedValue([mockUri]);

      // Mock fs.readFileSync 抛出错误
      (fs.readFileSync as jest.Mock).mockImplementation(() => {
        throw new Error('File read error');
      });

      const result = await loadCredentialsFromFile('**/credentials.json');

      expect(result).toBeUndefined();
    });

    test('当 JSON 解析失败时应该返回 undefined', async () => {
      // Mock findFiles 返回一个文件
      const mockUri = {
        fsPath: '/path/to/credentials.json',
      } as vscode.Uri;
      jest.spyOn(vscode.workspace, 'findFiles').mockResolvedValue([mockUri]);

      // Mock fs.readFileSync 返回无效的 JSON
      (fs.readFileSync as jest.Mock).mockReturnValue('invalid json');

      const result = await loadCredentialsFromFile('**/credentials.json');

      expect(result).toBeUndefined();
    });
  });

  describe('getCredentials', () => {
    test('应该优先从配置文件读取凭证', async () => {
      // 设置配置文件路径
      (vscode.workspace as any).__setConfiguration(
        'hecomCmeProvider.huaweiCloud.credentialsFile',
        '**/credentials.json',
      );
      (vscode.workspace as any).__setConfiguration(
        'hecomCmeProvider.huaweiCloud.accessKey',
        'config-ak',
      );
      (vscode.workspace as any).__setConfiguration(
        'hecomCmeProvider.huaweiCloud.secretKey',
        'config-sk',
      );

      // Mock findFiles 返回一个文件
      const mockUri = {
        fsPath: '/path/to/credentials.json',
      } as vscode.Uri;
      jest.spyOn(vscode.workspace, 'findFiles').mockResolvedValue([mockUri]);

      // Mock fs.readFileSync 返回有效的 JSON
      const mockFileContent = JSON.stringify({
        ak: 'file-access-key',
        sk: 'file-secret-key',
      });
      (fs.readFileSync as jest.Mock).mockReturnValue(mockFileContent);

      const result = await getCredentials();

      // 应该使用文件中的凭证，而不是配置中的
      expect(result?.accessKey).toBe('file-access-key');
      expect(result?.secretKey).toBe('file-secret-key');
    });

    test('当配置文件读取失败时应该从 VSCode 配置读取', async () => {
      // 设置配置文件路径（但文件不存在）
      (vscode.workspace as any).__setConfiguration(
        'hecomCmeProvider.huaweiCloud.credentialsFile',
        '**/credentials.json',
      );
      (vscode.workspace as any).__setConfiguration(
        'hecomCmeProvider.huaweiCloud.accessKey',
        'config-ak',
      );
      (vscode.workspace as any).__setConfiguration(
        'hecomCmeProvider.huaweiCloud.secretKey',
        'config-sk',
      );

      // Mock findFiles 返回空数组（文件不存在）
      jest.spyOn(vscode.workspace, 'findFiles').mockResolvedValue([]);

      const result = await getCredentials();

      // 应该回退到 VSCode 配置
      expect(result?.accessKey).toBe('config-ak');
      expect(result?.secretKey).toBe('config-sk');
    });

    test('当没有配置文件路径时应该从 VSCode 配置读取', async () => {
      // 不设置配置文件路径
      (vscode.workspace as any).__setConfiguration(
        'hecomCmeProvider.huaweiCloud.accessKey',
        'config-ak',
      );
      (vscode.workspace as any).__setConfiguration(
        'hecomCmeProvider.huaweiCloud.secretKey',
        'config-sk',
      );

      const result = await getCredentials();

      expect(result?.accessKey).toBe('config-ak');
      expect(result?.secretKey).toBe('config-sk');
    });

    test('当配置文件路径为空字符串时应该从 VSCode 配置读取', async () => {
      // 设置配置文件路径为空字符串
      (vscode.workspace as any).__setConfiguration(
        'hecomCmeProvider.huaweiCloud.credentialsFile',
        '',
      );
      (vscode.workspace as any).__setConfiguration(
        'hecomCmeProvider.huaweiCloud.accessKey',
        'config-ak',
      );
      (vscode.workspace as any).__setConfiguration(
        'hecomCmeProvider.huaweiCloud.secretKey',
        'config-sk',
      );

      const result = await getCredentials();

      expect(result?.accessKey).toBe('config-ak');
      expect(result?.secretKey).toBe('config-sk');
    });

    test('当所有配置都缺失时应该返回 undefined', async () => {
      // 不设置任何配置

      const result = await getCredentials();

      expect(result).toBeUndefined();
    });

    test('当只配置了 AK 没有 SK 时应该返回 undefined', async () => {
      (vscode.workspace as any).__setConfiguration(
        'hecomCmeProvider.huaweiCloud.accessKey',
        'config-ak',
      );

      const result = await getCredentials();

      expect(result).toBeUndefined();
    });
  });

  describe('高级场景测试', () => {
    test('应该支持从父目录加载凭证文件（场景：项目在 /A/B，文件在 /A/xx.json）', async () => {
      // Mock 工作区文件夹
      const mockWorkspaceFolder = {
        uri: vscode.Uri.file('/A/B'),
        name: 'B',
        index: 0,
      };
      Object.defineProperty(vscode.workspace, 'workspaceFolders', {
        get: jest.fn(() => [mockWorkspaceFolder]),
        configurable: true,
      });

      // Mock findFiles 返回父目录中的文件
      const mockUri = {
        fsPath: '/A/xx.json',
      } as vscode.Uri;
      
      // 需要在调用时才返回，因为 RelativePattern 是在运行时创建的
      const findFilesSpy = jest.spyOn(vscode.workspace, 'findFiles');
      findFilesSpy.mockImplementation(async (include: any) => {
        // 验证是否使用了 RelativePattern
        if (include && typeof include === 'object' && 'pattern' in include) {
          return [mockUri];
        }
        return [];
      });

      // Mock fs.readFileSync 返回有效的 JSON
      const mockFileContent = JSON.stringify({
        ak: 'parent-ak',
        sk: 'parent-sk',
      });
      (fs.readFileSync as jest.Mock).mockReturnValue(mockFileContent);

      const result = await loadCredentialsFromFile('../xx.json');

      expect(result).toBeTruthy();
      expect(result?.accessKey).toBe('parent-ak');
      expect(result?.secretKey).toBe('parent-sk');

      // 验证使用了 RelativePattern
      expect(findFilesSpy).toHaveBeenCalled();
    });

    test('应该支持多层父目录搜索（../../config/tokens.json）', async () => {
      // Mock 工作区文件夹
      const mockWorkspaceFolder = {
        uri: vscode.Uri.file('/A/B/C'),
        name: 'C',
        index: 0,
      };
      Object.defineProperty(vscode.workspace, 'workspaceFolders', {
        get: jest.fn(() => [mockWorkspaceFolder]),
        configurable: true,
      });

      // Mock findFiles 返回祖父目录中的文件
      const mockUri = {
        fsPath: '/A/config/tokens.json',
      } as vscode.Uri;
      
      const findFilesSpy = jest.spyOn(vscode.workspace, 'findFiles');
      findFilesSpy.mockImplementation(async (include: any) => {
        if (include && typeof include === 'object' && 'pattern' in include) {
          return [mockUri];
        }
        return [];
      });

      // Mock fs.readFileSync 返回有效的 JSON
      const mockFileContent = JSON.stringify({
        ak: 'grandparent-ak',
        sk: 'grandparent-sk',
      });
      (fs.readFileSync as jest.Mock).mockReturnValue(mockFileContent);

      const result = await loadCredentialsFromFile('../../config/tokens.json');

      expect(result).toBeTruthy();
      expect(result?.accessKey).toBe('grandparent-ak');
      expect(result?.secretKey).toBe('grandparent-sk');
    });

    test('应该支持绝对路径', async () => {
      const absolutePath = '/absolute/path/to/credentials.json';

      // Mock fs.existsSync 返回 true
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      // Mock fs.readFileSync 返回有效的 JSON
      const mockFileContent = JSON.stringify({
        ak: 'absolute-ak',
        sk: 'absolute-sk',
      });
      (fs.readFileSync as jest.Mock).mockReturnValue(mockFileContent);

      const result = await loadCredentialsFromFile(absolutePath);

      expect(result).toBeTruthy();
      expect(result?.accessKey).toBe('absolute-ak');
      expect(result?.secretKey).toBe('absolute-sk');

      // 验证使用了 fs.existsSync 而不是 findFiles
      expect(fs.existsSync).toHaveBeenCalledWith(absolutePath);
    });

    test('应该支持 glob 模式匹配多种文件名（tokens.json 或 code-arts.config.json）', async () => {
      // Mock findFiles 返回匹配的文件（tokens.json）
      const mockUri = {
        fsPath: '/path/to/tokens.json',
      } as vscode.Uri;
      jest.spyOn(vscode.workspace, 'findFiles').mockResolvedValue([mockUri]);

      // Mock fs.readFileSync 返回有效的 JSON
      const mockFileContent = JSON.stringify({
        ak: 'tokens-ak',
        sk: 'tokens-sk',
      });
      (fs.readFileSync as jest.Mock).mockReturnValue(mockFileContent);

      // 使用 glob 花括号语法匹配多种文件名
      const result = await loadCredentialsFromFile('**/{tokens,code-arts.config}.json');

      expect(result).toBeTruthy();
      expect(result?.accessKey).toBe('tokens-ak');
      expect(result?.secretKey).toBe('tokens-sk');
    });

    test('当没有工作区时，父目录搜索应该返回空', async () => {
      // Mock 没有工作区
      Object.defineProperty(vscode.workspace, 'workspaceFolders', {
        get: jest.fn(() => undefined),
        configurable: true,
      });

      const result = await loadCredentialsFromFile('../xx.json');

      expect(result).toBeUndefined();
    });
  });
});
