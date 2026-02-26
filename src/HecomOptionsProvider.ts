import * as vscode from 'vscode';

/**
 * Hecom 业务场景选项 Provider
 * 
 * 根据内部业务场景提供动态的提交消息选项
 */
export class HecomOptionsProvider {
  /**
   * 获取项目类型选项
   */
  public async getTypeOptions(): Promise<Array<{ label: string; value: string; description?: string }>> {
    // 可以根据配置或项目类型定制选项
    // const config = vscode.workspace.getConfiguration('hecomCmeProvider');
    // const projectTypes = config.get<string[]>('projectTypes', ['frontend', 'backend', 'mobile', 'common']);
    // const detectedType = await this.detectProjectType();

    const options = [
      { label: 'feat', value: 'feat', description: '新功能' },
      { label: 'fix', value: 'fix', description: '错误修复' },
      { label: 'docs', value: 'docs', description: '文档变更' },
      { label: 'style', value: 'style', description: '代码格式' },
      { label: 'refactor', value: 'refactor', description: '重构' },
      { label: 'perf', value: 'perf', description: '性能优化' },
      { label: 'test', value: 'test', description: '测试相关' },
      { label: 'build', value: 'build', description: '构建相关' },
      { label: 'ci', value: 'ci', description: 'CI 配置' },
      { label: 'chore', value: 'chore', description: '其他杂项' },
      { label: 'revert', value: 'revert', description: '回退' },
    ];

    return options;
  }

  /**
   * 获取范围选项（基于项目类型和文件变更）
   */
  public async getScopeOptions(): Promise<Array<{ label: string; value: string; description?: string }>> {
    const detectedType = await this.detectProjectType();
    const changedFiles = await this.getChangedFiles();

    const scopes: Array<{ label: string; value: string; description?: string }> = [];

    // 根据项目类型提供不同的 scope
    switch (detectedType) {
      case 'frontend':
        scopes.push(
          { label: 'components', value: 'components', description: '组件相关' },
          { label: 'pages', value: 'pages', description: '页面相关' },
          { label: 'utils', value: 'utils', description: '工具函数' },
          { label: 'styles', value: 'styles', description: '样式相关' },
          { label: 'hooks', value: 'hooks', description: 'Hooks' },
          { label: 'store', value: 'store', description: '状态管理' }
        );
        break;
      case 'backend':
        scopes.push(
          { label: 'api', value: 'api', description: 'API 接口' },
          { label: 'service', value: 'service', description: '服务层' },
          { label: 'model', value: 'model', description: '数据模型' },
          { label: 'middleware', value: 'middleware', description: '中间件' },
          { label: 'config', value: 'config', description: '配置' },
          { label: 'database', value: 'database', description: '数据库' }
        );
        break;
      case 'mobile':
        scopes.push(
          { label: 'screens', value: 'screens', description: '屏幕' },
          { label: 'navigation', value: 'navigation', description: '导航' },
          { label: 'native', value: 'native', description: '原生模块' },
          { label: 'components', value: 'components', description: '组件' },
          { label: 'utils', value: 'utils', description: '工具' }
        );
        break;
      default:
        scopes.push(
          { label: 'core', value: 'core', description: '核心功能' },
          { label: 'common', value: 'common', description: '通用模块' },
          { label: 'utils', value: 'utils', description: '工具' },
          { label: 'config', value: 'config', description: '配置' }
        );
    }

    // 根据变更文件智能推荐 scope
    const suggestedScopes = this.suggestScopesFromFiles(changedFiles);
    for (const scope of suggestedScopes) {
      if (!scopes.find((s) => s.value === scope)) {
        scopes.unshift({ label: scope, value: scope, description: '(从变更文件推荐)' });
      }
    }

    return scopes;
  }

  /**
   * 检测项目类型
   */
  private async detectProjectType(): Promise<string> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      return 'common';
    }

    const rootPath = workspaceFolders[0].uri.fsPath;

    try {
      // 检查 package.json
      const packageJson = await vscode.workspace.fs.readFile(
        vscode.Uri.file(`${rootPath}/package.json`)
      );
      const packageData = JSON.parse(Buffer.from(packageJson).toString('utf8'));

      // 根据依赖判断类型
      const dependencies = {
        ...packageData.dependencies,
        ...packageData.devDependencies,
      };

      if (dependencies['react-native']) {
        return 'mobile';
      }

      if (dependencies['react'] || dependencies['vue'] || dependencies['@angular/core']) {
        return 'frontend';
      }

      if (dependencies['express'] || dependencies['koa'] || dependencies['fastify'] || dependencies['nestjs']) {
        return 'backend';
      }
    } catch (error) {
      // 如果读取失败，返回默认值
    }

    return 'common';
  }

  /**
   * 获取变更的文件列表
   */
  private async getChangedFiles(): Promise<string[]> {
    try {
      const gitExtension = vscode.extensions.getExtension('vscode.git');
      if (!gitExtension) {
        return [];
      }

      const git = gitExtension.exports.getAPI(1);
      if (!git || git.repositories.length === 0) {
        return [];
      }

      const repository = git.repositories[0];
      const changes = [
        ...repository.state.workingTreeChanges,
        ...repository.state.indexChanges,
      ];

      return changes.map((change: any) => change.uri.fsPath);
    } catch (error) {
      console.error('获取变更文件失败:', error);
      return [];
    }
  }

  /**
   * 根据变更文件智能推荐 scope
   */
  private suggestScopesFromFiles(files: string[]): string[] {
    const scopes = new Set<string>();

    for (const file of files) {
      const parts = file.split('/');
      
      // 提取常见的目录结构作为 scope
      for (let i = 0; i < parts.length - 1; i++) {
        const dir = parts[i];
        
        // 跳过常见的顶层目录
        if (['src', 'lib', 'dist', 'build', 'node_modules'].includes(dir)) {
          continue;
        }

        // 添加有意义的目录名
        if (dir && dir.length > 2 && !dir.startsWith('.')) {
          scopes.add(dir);
        }
      }
    }

    return Array.from(scopes).slice(0, 5); // 最多返回 5 个推荐
  }

  /**
   * 获取完整的动态配置
   */
  public async getDynamicConfig(): Promise<any> {
    const types = await this.getTypeOptions();
    const scopes = await this.getScopeOptions();

    return {
      staticTemplate: [
        'type',
        'scope',
        'subject',
        'body',
        'footer',
      ],
      dynamicTemplate: [
        '{type}({scope}): {subject}',
        '',
        '{body}',
        '',
        '{footer}',
      ],
      tokens: [
        {
          label: 'Type',
          name: 'type',
          type: 'enum',
          options: types,
          description: '提交类型',
        },
        {
          label: 'Scope',
          name: 'scope',
          type: 'enum',
          options: scopes,
          description: '影响范围',
          multiline: false,
        },
        {
          label: 'Subject',
          name: 'subject',
          type: 'text',
          description: '简短描述',
          maxLength: 100,
        },
        {
          label: 'Body',
          name: 'body',
          type: 'text',
          description: '详细描述',
          multiline: true,
          maxLines: 20,
        },
        {
          label: 'Footer',
          name: 'footer',
          type: 'text',
          description: '备注信息',
          multiline: true,
          lines: 5,
        },
      ],
    };
  }
}
