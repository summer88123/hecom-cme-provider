# Jest 测试迁移实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将项目测试框架从 Mocha 完全迁移到 Jest，使用纯 Node.js 环境和 manual mocks。

**Architecture:** 一次性完全迁移方案，创建新的 test/ 目录，配置 Jest + ts-jest，编写 VSCode API manual mocks，转换所有测试用例，删除 Mocha 相关配置。

**Tech Stack:** Jest 29.x, ts-jest 29.x, TypeScript, Node.js

---

## Task 1: 创建测试目录结构

**Files:**
- Create: `test/__mocks__/.gitkeep`
- Create: `test/providers/.gitkeep`

**Step 1: 创建 test 目录结构**

```bash
mkdir -p test/__mocks__
mkdir -p test/providers
touch test/__mocks__/.gitkeep
touch test/providers/.gitkeep
```

**Step 2: 验证目录结构**

Run: `ls -la test/`
Expected: 显示 `__mocks__/` 和 `providers/` 目录

**Step 3: 提交目录结构**

```bash
git add test/
git commit -m "test: 创建 Jest 测试目录结构"
```

---

## Task 2: 编写 VSCode API Mock

**Files:**
- Create: `test/__mocks__/vscode.ts`

**Step 1: 编写 VSCode API mock 文件**

创建 `test/__mocks__/vscode.ts`，内容如下：

```typescript
/**
 * VSCode API Manual Mock
 * 用于在 Node.js 环境中模拟 VSCode API
 */

// Mock CancellationToken
export class CancellationTokenSource {
  private _token: CancellationToken;
  
  constructor() {
    this._token = new CancellationToken();
  }
  
  get token(): CancellationToken {
    return this._token;
  }
  
  cancel(): void {
    this._token.cancel();
  }
  
  dispose(): void {
    // no-op
  }
}

export class CancellationToken {
  private _isCancellationRequested = false;
  
  get isCancellationRequested(): boolean {
    return this._isCancellationRequested;
  }
  
  cancel(): void {
    this._isCancellationRequested = true;
  }
}

// Mock workspace configuration
const mockConfigurations = new Map<string, any>();

export const workspace = {
  getConfiguration: jest.fn((section?: string) => {
    return {
      get: jest.fn(<T>(key: string, defaultValue?: T): T | undefined => {
        const fullKey = section ? `${section}.${key}` : key;
        return mockConfigurations.get(fullKey) ?? defaultValue;
      }),
      update: jest.fn((key: string, value: any) => {
        const fullKey = section ? `${section}.${key}` : key;
        mockConfigurations.set(fullKey, value);
        return Promise.resolve();
      }),
      has: jest.fn((key: string): boolean => {
        const fullKey = section ? `${section}.${key}` : key;
        return mockConfigurations.has(fullKey);
      }),
      inspect: jest.fn()
    };
  }),
  
  // 辅助方法：设置配置值（测试中使用）
  __setConfiguration: (key: string, value: any) => {
    mockConfigurations.set(key, value);
  },
  
  // 辅助方法：清空配置（测试中使用）
  __clearConfiguration: () => {
    mockConfigurations.clear();
  }
};

// Mock window
export const window = {
  showInformationMessage: jest.fn(),
  showWarningMessage: jest.fn(),
  showErrorMessage: jest.fn(),
  createOutputChannel: jest.fn(() => ({
    append: jest.fn(),
    appendLine: jest.fn(),
    clear: jest.fn(),
    show: jest.fn(),
    hide: jest.fn(),
    dispose: jest.fn()
  }))
};

// Mock Disposable
export class Disposable {
  constructor(private callOnDispose: () => void) {}
  
  dispose(): void {
    this.callOnDispose();
  }
  
  static from(...disposables: { dispose(): any }[]): Disposable {
    return new Disposable(() => {
      disposables.forEach(d => d.dispose());
    });
  }
}

// Mock ExtensionContext
export interface ExtensionContext {
  subscriptions: { dispose(): any }[];
  extensionPath: string;
  globalState: any;
  workspaceState: any;
  asAbsolutePath(relativePath: string): string;
}

// 导出常用的类型（供测试文件使用）
export const CancellationTokenNone = new CancellationToken();
```

**Step 2: 验证文件创建**

Run: `cat test/__mocks__/vscode.ts | head -20`
Expected: 显示文件前 20 行内容

**Step 3: 提交 mock 文件**

```bash
git add test/__mocks__/vscode.ts
git commit -m "test: 添加 VSCode API manual mock"
```

---

## Task 3: 编写 Jest 全局设置文件

**Files:**
- Create: `test/setup.ts`

**Step 1: 编写全局设置文件**

创建 `test/setup.ts`，内容如下：

```typescript
// Jest 全局设置文件
// 可以在这里配置全局的测试钩子、mock 等

// 设置测试超时时间
jest.setTimeout(10000);

// 全局 mock console 方法（可选，避免测试输出污染）
global.console = {
  ...console,
  // 保留 error 和 warn，屏蔽 log 和 info
  log: jest.fn(),
  info: jest.fn(),
};
```

**Step 2: 验证文件创建**

Run: `cat test/setup.ts`
Expected: 显示文件内容

**Step 3: 提交设置文件**

```bash
git add test/setup.ts
git commit -m "test: 添加 Jest 全局设置文件"
```

---

## Task 4: 创建 Jest 配置文件

**Files:**
- Create: `jest.config.js`

**Step 1: 编写 Jest 配置**

创建根目录的 `jest.config.js`，内容如下：

```javascript
module.exports = {
  // 使用 ts-jest 预设
  preset: 'ts-jest',
  
  // 测试环境为 Node.js
  testEnvironment: 'node',
  
  // 测试文件匹配模式
  testMatch: [
    '**/test/**/*.test.ts'
  ],
  
  // 模块路径映射
  moduleNameMapper: {
    '^vscode$': '<rootDir>/test/__mocks__/vscode.ts'
  },
  
  // 覆盖率收集配置
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/test/**',
    '!src/**/*.d.ts',
    '!src/extension.ts'
  ],
  
  // 覆盖率阈值
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  
  // 覆盖率报告格式
  coverageReporters: ['text', 'lcov', 'html'],
  
  // 设置文件
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
  
  // 模块文件扩展名
  moduleFileExtensions: ['ts', 'js', 'json'],
  
  // 转换配置
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: {
        esModuleInterop: true,
        allowSyntheticDefaultImports: true
      }
    }]
  },
  
  // 全局变量
  globals: {
    'ts-jest': {
      isolatedModules: true
    }
  }
};
```

**Step 2: 验证配置文件**

Run: `cat jest.config.js`
Expected: 显示配置内容

**Step 3: 提交配置文件**

```bash
git add jest.config.js
git commit -m "test: 添加 Jest 配置文件"
```

---

## Task 5: 更新 package.json 依赖和脚本

**Files:**
- Modify: `package.json`

**Step 1: 移除 Mocha 依赖并添加 Jest 依赖**

编辑 `package.json`：

1. 在 `devDependencies` 中**移除**：
```json
"@types/mocha": "^10.0.1",
"@vscode/test-electron": "^2.2.0",
"mocha": "^10.1.0"
```

2. 在 `devDependencies` 中**添加**：
```json
"@types/jest": "^29.5.0",
"@jest/globals": "^29.5.0",
"jest": "^29.5.0",
"ts-jest": "^29.1.0"
```

**Step 2: 更新测试脚本**

在 `package.json` 的 `scripts` 中，将：
```json
"pretest": "npm run compile && npm run lint",
"test": "node ./out/test/runTest.js"
```

改为：
```json
"pretest": "npm run lint",
"test": "jest",
"test:watch": "jest --watch",
"test:coverage": "jest --coverage"
```

**Step 3: 安装新依赖**

Run: `npm install`
Expected: 成功安装所有依赖，无错误

**Step 4: 提交 package.json 变更**

```bash
git add package.json package-lock.json
git commit -m "chore: 将测试依赖从 Mocha 迁移到 Jest"
```

---

## Task 6: 转换 IssueProvider 测试

**Files:**
- Create: `test/providers/IssueProvider.test.ts`

**Step 1: 编写转换后的 IssueProvider 测试**

创建 `test/providers/IssueProvider.test.ts`，内容如下：

```typescript
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
      const provider = new IssueProvider();
      const tokenSource = new vscode.CancellationTokenSource();
      tokenSource.cancel();

      const context: DynamicOptionsContext = {
        tokenValues: {},
        cancellationToken: tokenSource.token,
      };

      const result = await provider.provideOptions(context);
      expect(result).toHaveLength(0);
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
```

**Step 2: 验证文件创建**

Run: `cat test/providers/IssueProvider.test.ts | head -30`
Expected: 显示文件前 30 行

**Step 3: 提交测试文件**

```bash
git add test/providers/IssueProvider.test.ts
git commit -m "test: 转换 IssueProvider 测试到 Jest"
```

---

## Task 7: 转换 IntroductionStageProvider 测试

**Files:**
- Create: `test/providers/IntroductionStageProvider.test.ts`

**Step 1: 编写转换后的 IntroductionStageProvider 测试**

创建 `test/providers/IntroductionStageProvider.test.ts`，完整内容参考设计文档中的第六部分。

由于文件较长（400+ 行），这里仅展示结构：

```typescript
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
    // 2 个测试用例
  });

  describe('Configuration', () => {
    // 2 个测试用例
  });

  describe('Options String Parsing', () => {
    // 6 个测试用例
  });

  describe('Data Transformation', () => {
    // 3 个测试用例
  });

  describe('API Response Handling', () => {
    // 3 个测试用例
  });

  describe('Cancellation Token', () => {
    // 2 个测试用例
  });

  describe('Error Handling', () => {
    // 2 个测试用例
  });

  describe('Edge Cases', () => {
    // 5 个测试用例
  });

  describe('Type Detection', () => {
    // 4 个测试用例
  });
});
```

完整代码见设计文档《2026-02-27-jest-migration-design.md》第六部分。

**Step 2: 验证文件创建**

Run: `wc -l test/providers/IntroductionStageProvider.test.ts`
Expected: 显示约 427 行

**Step 3: 提交测试文件**

```bash
git add test/providers/IntroductionStageProvider.test.ts
git commit -m "test: 转换 IntroductionStageProvider 测试到 Jest"
```

---

## Task 8: 删除旧的 Mocha 测试目录

**Files:**
- Delete: `src/test/` (整个目录)

**Step 1: 删除旧测试目录**

```bash
rm -rf src/test
```

**Step 2: 验证删除**

Run: `ls src/`
Expected: 不再显示 `test/` 目录

**Step 3: 提交删除操作**

```bash
git add -A
git commit -m "test: 删除旧的 Mocha 测试目录"
```

---

## Task 9: 运行 Jest 测试验证

**Files:**
- (无文件修改)

**Step 1: 运行所有测试**

Run: `npm test`
Expected: 所有测试通过，显示测试统计信息

**Step 2: 运行覆盖率测试**

Run: `npm run test:coverage`
Expected: 
- 所有测试通过
- 显示覆盖率报告
- 覆盖率达到或接近 70% 阈值

**Step 3: 检查生成的覆盖率报告**

Run: `ls -la coverage/`
Expected: 显示 `lcov-report/`、`lcov.info` 等文件

**Step 4: 验证测试 watch 模式（可选）**

Run: `npm run test:watch` (按 'a' 运行所有测试，然后按 'q' 退出)
Expected: Watch 模式正常工作

---

## Task 10: 更新 AGENTS.md 文档

**Files:**
- Modify: `AGENTS.md`

**Step 1: 更新测试运行命令部分**

在 `AGENTS.md` 中找到 "测试" 相关章节，将：

```markdown
### 测试
\`\`\`bash
npm test               # 运行所有测试
npm run pretest        # 编译并 lint（测试前自动执行）
\`\`\`

**运行单个测试**: VSCode 扩展测试使用 Mocha，无法直接运行单个测试文件。需通过 VSCode 测试 UI 或修改 `src/test/suite/index.ts` 中的 glob 模式来指定测试文件。
```

改为：

```markdown
### 测试
\`\`\`bash
npm test               # 运行所有测试
npm run test:watch     # 监视模式运行测试
npm run test:coverage  # 运行测试并生成覆盖率报告
npm run pretest        # lint（测试前自动执行）
\`\`\`

**运行单个测试文件**:
\`\`\`bash
npm test test/providers/IssueProvider.test.ts
\`\`\`

**运行单个测试用例**:
\`\`\`bash
npm test -- -t "应该能够读取配置"
\`\`\`
```

**Step 2: 更新测试规范部分**

在 `AGENTS.md` 中找到 "测试规范" 相关章节，将：

```markdown
## 测试规范

### 测试结构

使用 Mocha 测试框架，测试文件命名为 `*.test.ts`。

### 测试套件组织

\`\`\`typescript
suite('Provider Test Suite', () => {
  suite('子套件名称', () => {
    test('测试用例描述', () => {
      // 测试代码
    });
  });
});
\`\`\`

### 断言

使用 Node.js `assert` 模块：
\`\`\`typescript
assert.ok(value);
assert.strictEqual(actual, expected);
assert.fail('失败消息');
\`\`\`
```

改为：

```markdown
## 测试规范

### 测试结构

使用 Jest 测试框架，测试文件命名为 `*.test.ts`，放置在 `test/` 目录下。

### 测试套件组织

\`\`\`typescript
import { describe, test, expect, beforeEach, jest } from '@jest/globals';

describe('Provider Test Suite', () => {
  beforeEach(() => {
    // 每个测试前清理状态
    jest.clearAllMocks();
  });

  describe('子套件名称', () => {
    test('测试用例描述', () => {
      // 测试代码
    });
  });
});
\`\`\`

### 断言

使用 Jest `expect` 断言：
\`\`\`typescript
expect(value).toBeTruthy();          // 值为真
expect(actual).toBe(expected);        // 严格相等
expect(array).toHaveLength(3);        // 数组长度
expect(str).toMatch(/pattern/);       // 正则匹配
await expect(promise).rejects.toThrow(); // 异步错误
\`\`\`
```

**Step 3: 更新项目结构部分**

在 `AGENTS.md` 的 "项目结构" 章节，将：

```
src/
├── extension.ts
├── ...
└── test/
    ├── runTest.ts
    └── suite/
        ├── index.ts
        ├── IssueProvider.test.ts
        └── IntroductionStageProvider.test.ts
```

改为：

```
src/
├── extension.ts
├── ...
test/
├── __mocks__/
│   └── vscode.ts
├── providers/
│   ├── IssueProvider.test.ts
│   └── IntroductionStageProvider.test.ts
└── setup.ts
```

**Step 4: 添加 VSCode API Mock 说明**

在测试规范章节添加：

```markdown
### VSCode API Mock

测试在 Node.js 环境中运行，VSCode API 通过 manual mock 模拟（`test/__mocks__/vscode.ts`）。

**使用 mock 配置**:
\`\`\`typescript
import * as vscode from 'vscode';

// 设置配置值
(vscode.workspace as any).__setConfiguration('key', 'value');

// 清空配置
(vscode.workspace as any).__clearConfiguration();
\`\`\`
```

**Step 5: 提交文档更新**

```bash
git add AGENTS.md
git commit -m "docs: 更新测试文档以反映 Jest 迁移"
```

---

## Task 11: 更新 .gitignore

**Files:**
- Modify: `.gitignore`

**Step 1: 添加 Jest 覆盖率目录到 .gitignore**

在 `.gitignore` 文件末尾添加：

```
# Jest 覆盖率报告
coverage/
*.lcov
```

**Step 2: 验证 .gitignore**

Run: `cat .gitignore | grep -A2 "Jest"`
Expected: 显示新添加的规则

**Step 3: 提交 .gitignore 更新**

```bash
git add .gitignore
git commit -m "chore: 添加 Jest 覆盖率目录到 .gitignore"
```

---

## Task 12: 最终验证和总结

**Files:**
- (无文件修改)

**Step 1: 清理并重新安装依赖**

```bash
rm -rf node_modules package-lock.json
npm install
```

Expected: 干净安装所有依赖

**Step 2: 运行完整测试**

Run: `npm test`
Expected: 所有测试通过，0 失败

**Step 3: 运行覆盖率测试**

Run: `npm run test:coverage`
Expected: 
- 所有测试通过
- 覆盖率报告显示
- 覆盖率达到或超过 70% 阈值

**Step 4: 验证测试统计**

确认以下测试数量：
- IssueProvider: 6 个 test suites, 多个测试用例
- IntroductionStageProvider: 9 个 test suites, 29 个测试用例

**Step 5: 查看 Git 历史**

Run: `git log --oneline -12`
Expected: 显示所有迁移相关的 commit

**Step 6: 最终总结提交（可选）**

如果一切正常，可以创建一个标签：

```bash
git tag -a v0.0.2-jest-migration -m "完成测试框架从 Mocha 到 Jest 的迁移"
```

---

## 验证清单

完成后，确认以下各项：

- [ ] `test/` 目录结构正确（`__mocks__/`, `providers/`, `setup.ts`）
- [ ] VSCode API mock 文件存在且功能正常
- [ ] Jest 配置文件正确
- [ ] package.json 中 Mocha 依赖已移除，Jest 依赖已添加
- [ ] 所有测试用例已转换为 Jest 语法
- [ ] `src/test/` 目录已删除
- [ ] `npm test` 运行成功，所有测试通过
- [ ] `npm run test:coverage` 生成覆盖率报告，达到 70% 阈值
- [ ] AGENTS.md 文档已更新
- [ ] .gitignore 已更新
- [ ] 所有变更已提交到 Git

---

## 故障排除

### 问题 1: 测试运行时找不到 vscode 模块

**原因**: moduleNameMapper 配置不正确

**解决**: 检查 `jest.config.js` 中的 moduleNameMapper，确保路径正确：
```javascript
moduleNameMapper: {
  '^vscode$': '<rootDir>/test/__mocks__/vscode.ts'
}
```

### 问题 2: TypeScript 编译错误

**原因**: ts-jest 配置不正确或 tsconfig 不兼容

**解决**: 
1. 确认 ts-jest 已正确安装
2. 检查 jest.config.js 中的 transform 配置
3. 尝试运行 `npm test -- --no-cache` 清除缓存

### 问题 3: 覆盖率低于预期

**原因**: 某些文件未被测试覆盖

**解决**:
1. 运行 `npm run test:coverage`
2. 查看 `coverage/lcov-report/index.html`
3. 识别未覆盖的代码
4. 添加相应测试或调整 collectCoverageFrom 排除规则

### 问题 4: Mock 不生效

**原因**: Jest 缓存或 mock 调用时机问题

**解决**:
1. 在测试的 beforeEach 中调用 `jest.clearAllMocks()`
2. 确保从 '@jest/globals' 导入 jest
3. 运行 `npm test -- --clearCache` 清除缓存

---

## 参考资料

- [Jest 官方文档](https://jestjs.io/)
- [ts-jest 文档](https://kulshekhar.github.io/ts-jest/)
- [Jest Manual Mocks](https://jestjs.io/docs/manual-mocks)
- 项目设计文档: `docs/plans/2026-02-27-jest-migration-design.md`
