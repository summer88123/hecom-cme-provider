import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { logger } from './logger';

/**
 * 凭证配置文件格式
 */
export interface CredentialsFileContent {
  ak: string;
  sk: string;
}

/**
 * 凭证信息
 */
export interface Credentials {
  accessKey: string;
  secretKey: string;
}

/**
 * 在工作区父目录中查找文件
 *
 * @param relativePattern 相对父目录的 glob 模式（如 ../*.json, ../../config/*.json）
 * @returns 匹配的文件 Uri 数组
 */
async function findFilesInParentDirectory(relativePattern: string): Promise<vscode.Uri[]> {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  if (!workspaceFolder) {
    logger.warn('CredentialsLoader', '未打开工作区，无法搜索父目录');
    return [];
  }

  const workspacePath = workspaceFolder.uri.fsPath;

  // 解析相对路径，得到绝对路径的基础目录和 glob 模式
  // 例如：../config/*.json -> { base: /A, pattern: config/*.json }
  const segments = relativePattern.split('/');
  let parentLevels = 0;
  let patternStart = 0;

  // 计算需要向上几级
  for (let i = 0; i < segments.length; i++) {
    if (segments[i] === '..') {
      parentLevels++;
      patternStart = i + 1;
    } else {
      break;
    }
  }

  // 计算基础目录的绝对路径
  let baseDir = workspacePath;
  for (let i = 0; i < parentLevels; i++) {
    baseDir = path.dirname(baseDir);
  }

  // 提取剩余的 glob 模式
  const remainingPattern = segments.slice(patternStart).join('/');

  logger.info('CredentialsLoader', '在父目录中搜索', {
    baseDir,
    pattern: remainingPattern,
  });

  // 使用 RelativePattern 在父目录中搜索
  const pattern = new vscode.RelativePattern(vscode.Uri.file(baseDir), remainingPattern);
  const files = await vscode.workspace.findFiles(pattern, '**/node_modules/**', 1);

  return files;
}


/**
 * 从配置文件加载凭证
 *
 * @param filePattern 文件路径模式，支持以下格式：
 *   - Glob 模式（相对工作区）: `**\/*.json`, `**\/config\/(tokens|code-arts.config).json`
 *   - 带父目录的 Glob: `../*.json`, `../../config/*.json`（自动转换为绝对路径搜索）
 *   - 绝对路径: `/path/to/credentials.json`
 * @returns 凭证信息，如果加载失败返回 undefined
 */
export async function loadCredentialsFromFile(
  filePattern: string,
): Promise<Credentials | undefined> {
  try {
    logger.info('CredentialsLoader', '开始从配置文件加载凭证', { filePattern });

    let files: vscode.Uri[] = [];

    // 检查是否是绝对路径
    if (path.isAbsolute(filePattern)) {
      // 直接使用绝对路径
      if (fs.existsSync(filePattern)) {
        files = [vscode.Uri.file(filePattern)];
      }
    } else if (filePattern.startsWith('..')) {
      // 处理相对父目录的模式（如 ../config/*.json）
      files = await findFilesInParentDirectory(filePattern);
    } else {
      // 标准工作区内搜索
      files = await vscode.workspace.findFiles(filePattern, '**/node_modules/**', 1);
    }

    if (files.length === 0) {
      logger.warn('CredentialsLoader', '未找到匹配的凭证文件', { filePattern });
      return undefined;
    }

    const credentialsFilePath = files[0].fsPath;
    logger.info('CredentialsLoader', '找到凭证文件', { path: credentialsFilePath });

    // 检查文件扩展名
    if (!credentialsFilePath.endsWith('.json')) {
      logger.error(
        'CredentialsLoader',
        '凭证文件必须是 JSON 格式',
        new Error(`文件扩展名不是 .json: ${credentialsFilePath}`),
      );
      return undefined;
    }

    // 读取文件内容
    const fileContent = fs.readFileSync(credentialsFilePath, 'utf-8');
    const credentials: CredentialsFileContent = JSON.parse(fileContent);

    // 验证文件内容
    if (!credentials.ak || !credentials.sk) {
      logger.error(
        'CredentialsLoader',
        '凭证文件格式不正确',
        new Error('文件必须包含 ak 和 sk 字段'),
      );
      return undefined;
    }

    logger.success('CredentialsLoader', '成功从配置文件加载凭证');
    return {
      accessKey: credentials.ak,
      secretKey: credentials.sk,
    };
  } catch (error) {
    logger.error('CredentialsLoader', '加载凭证文件失败', error);
    return undefined;
  }
}

/**
 * 获取凭证配置
 * 优先从配置文件读取，如果没有配置文件则从 VSCode 配置读取
 * 
 * @returns 凭证信息，如果获取失败返回 undefined
 */
export async function getCredentials(): Promise<Credentials | undefined> {
  const config = vscode.workspace.getConfiguration('hecomCmeProvider.huaweiCloud');
  const credentialsFile = config.get<string>('credentialsFile');

  // 优先从配置文件读取
  if (credentialsFile && credentialsFile.trim() !== '') {
    logger.info('CredentialsLoader', '检测到凭证文件配置，尝试从文件读取');
    const credentials = await loadCredentialsFromFile(credentialsFile);
    if (credentials) {
      return credentials;
    }
    logger.warn('CredentialsLoader', '从凭证文件读取失败，尝试从 VSCode 配置读取');
  }

  // 从 VSCode 配置读取
  const ak = config.get<string>('accessKey');
  const sk = config.get<string>('secretKey');

  if (!ak || !sk) {
    logger.warn('CredentialsLoader', '未配置 AK/SK');
    return undefined;
  }

  logger.info('CredentialsLoader', '从 VSCode 配置读取凭证');
  return {
    accessKey: ak,
    secretKey: sk,
  };
}
