# Jest 测试迁移设计文档

**日期**: 2026-02-27  
**作者**: AI Assistant  
**状态**: 已批准

## 1. 概述

将项目的测试框架从 Mocha + @vscode/test-electron 迁移到 Jest + ts-jest，采用一次性完全迁移方案。

### 1.1 迁移目标

- 使用 Jest 作为单元测试框架
- 在纯 Node.js 环境中运行测试（不依赖 VSCode Electron 环境）
- 通过 manual mocks 模拟 VSCode API
- 配置测试覆盖率报告（70% 阈值）
- 将测试文件组织到与 src 平级的 test 目录

### 1.2 迁移方案

选择**一次性完全迁移方案**：
- 直接移除所有 Mocha 相关依赖和配置
- 一次性将所有测试转换为 Jest 格式
- 测试文件从 src/test 迁移到 test/ 目录
- 配置完整的 Jest 环境和 VSCode API mock

## 2. 项目结构调整

### 2.1 目录结构变化

**调整前：**
```
hecom-cme-provider/
├── src/
│   ├── extension.ts
│   ├── providers/
│   ├── clients/
│   ├── utils/
│   └── test/
│       ├── runTest.ts
│       └── suite/
│           ├── index.ts
│           ├── IssueProvider.test.ts
│           └── IntroductionStageProvider.test.ts
```

**调整后：**
```
hecom-cme-provider/
├── src/
│   ├── extension.ts
│   ├── providers/
│   ├── clients/
│   └── utils/
├── test/
│   ├── __mocks__/
│   │   └── vscode.ts
│   ├── providers/
│   │   ├── IssueProvider.test.ts
│   │   └── IntroductionStageProvider.test.ts
│   └── setup.ts
├── jest.config.js
├── package.json
└── tsconfig.json
```

### 2.2 变化说明

1. 删除 `src/test/` 目录及所有内容
2. 创建与 `src/` 平级的 `test/` 目录
3. 添加 `test/__mocks__/vscode.ts` 用于 VSCode API mock
4. 添加 `test/setup.ts` 用于全局测试设置
5. 添加根目录的 `jest.config.js` 配置文件

## 3. 依赖包调整

### 3.1 移除依赖

```json
{
  "devDependencies": {
    "@types/mocha": "^10.0.1",
    "@vscode/test-electron": "^2.2.0",
    "mocha": "^10.1.0"
  }
}
```

### 3.2 添加依赖

```json
{
  "devDependencies": {
    "@types/jest": "^29.5.0",
    "jest": "^29.5.0",
    "ts-jest": "^29.1.0",
    "@jest/globals": "^29.5.0"
  }
}
```

### 3.3 脚本调整

**调整前：**
```json
{
  "scripts": {
    "pretest": "npm run compile && npm run lint",
    "test": "node ./out/test/runTest.js"
  }
}
```

**调整后：**
```json
{
  "scripts": {
    "pretest": "npm run lint",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

## 4. Jest 配置

### 4.1 jest.config.js

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/test/**/*.test.ts'],
  moduleNameMapper: {
    '^vscode$': '<rootDir>/test/__mocks__/vscode.ts'
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/test/**',
    '!src/**/*.d.ts',
    '!src/extension.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: {
        esModuleInterop: true,
        allowSyntheticDefaultImports: true
      }
    }]
  },
  globals: {
    'ts-jest': {
      isolatedModules: true
    }
  }
};
```

### 4.2 配置说明

- **preset**: 使用 ts-jest 预设，直接运行 TypeScript
- **testEnvironment**: Node.js 环境（不使用 VSCode Electron）
- **moduleNameMapper**: 将 vscode 模块映射到 manual mock
- **collectCoverageFrom**: 收集 src/ 下所有 TS 文件的覆盖率
- **coverageThreshold**: 设置 70% 的覆盖率阈值
- **isolatedModules**: 加快编译速度

## 5. VSCode API Mock 设计

### 5.1 Mock 架构

使用 Jest manual mocks 机制，在 `test/__mocks__/vscode.ts` 中模拟 VSCode API。

### 5.2 Mock 的核心组件

1. **CancellationToken**: 模拟取消令牌机制
2. **workspace.getConfiguration**: 模拟配置读取
3. **window 方法**: 模拟消息提示
4. **Disposable**: 模拟资源释放

### 5.3 辅助方法

- `__setConfiguration`: 测试中设置配置值
- `__clearConfiguration`: 测试中清空配置

## 6. 测试用例转换

### 6.1 语法转换对照表

| Mocha | Jest |
|-------|------|
| `suite('name', () => {})` | `describe('name', () => {})` |
| `test('name', () => {})` | `test('name', () => {})` |
| `assert.ok(value)` | `expect(value).toBeTruthy()` |
| `assert.strictEqual(a, b)` | `expect(a).toBe(b)` |
| `assert.fail('message')` | `throw new Error('message')` |
| `done()` 回调 | async/await |

### 6.2 关键转换点

1. 导入语句：从 `@jest/globals` 导入 Jest API
2. 路径调整：从 `../../providers/` 改为 `../../src/providers/`
3. 断言转换：`assert.*` 改为 `expect().*`
4. 钩子函数：添加 `beforeEach` 清理状态
5. 异步错误测试：使用 `expect().rejects.toThrow()`
6. 移除 VSCode UI 调用（如 `showInformationMessage`）

### 6.3 测试文件组织

```
test/
├── providers/
│   ├── IssueProvider.test.ts
│   └── IntroductionStageProvider.test.ts
```

按照源码目录结构组织测试文件。

## 7. 测试覆盖率

### 7.1 覆盖率目标

- 分支覆盖率：70%
- 函数覆盖率：70%
- 行覆盖率：70%
- 语句覆盖率：70%

### 7.2 覆盖率报告

运行 `npm run test:coverage` 生成覆盖率报告：
- 终端文本报告
- HTML 报告（在 coverage/ 目录）
- LCOV 报告（用于 CI 集成）

## 8. 迁移步骤

### 8.1 准备阶段

1. 创建 test/ 目录结构
2. 编写 VSCode API mock
3. 编写 Jest 配置文件
4. 编写全局设置文件

### 8.2 依赖调整

1. 移除 Mocha 相关依赖
2. 安装 Jest 相关依赖
3. 更新 package.json 脚本

### 8.3 测试转换

1. 转换 IssueProvider.test.ts
2. 转换 IntroductionStageProvider.test.ts

### 8.4 清理阶段

1. 删除 src/test/ 目录
2. 运行测试验证
3. 生成覆盖率报告

### 8.5 文档更新

1. 更新 AGENTS.md 中的测试相关文档
2. 提交所有变更

## 9. 验证标准

### 9.1 功能验证

- [ ] 所有测试用例通过
- [ ] 覆盖率达到 70% 阈值
- [ ] VSCode API mock 正常工作
- [ ] 取消令牌测试正常

### 9.2 性能验证

- [ ] 测试运行速度快于 Mocha（无需启动 VSCode）
- [ ] watch 模式工作正常

### 9.3 开发体验

- [ ] `npm test` 运行测试
- [ ] `npm run test:watch` 监视模式
- [ ] `npm run test:coverage` 生成覆盖率

## 10. 风险与应对

### 10.1 风险

1. **测试遗漏**：一次性转换可能遗漏某些测试场景
2. **Mock 不完整**：VSCode API mock 可能不覆盖所有使用场景
3. **回滚困难**：完全移除 Mocha 后难以回滚

### 10.2 应对措施

1. 仔细对比转换前后的测试用例，确保覆盖相同场景
2. 在实际 Provider 代码中验证 mock 的覆盖度
3. 在单独的分支进行迁移，测试通过后再合并

## 11. 后续优化

### 11.1 短期

- 添加更多边界条件测试
- 完善错误场景覆盖
- 提高覆盖率到 80%+

### 11.2 长期

- 考虑添加集成测试（使用真实 VSCode 环境）
- 配置 CI/CD 自动运行测试和覆盖率检查
- 探索快照测试用于数据转换验证

## 12. 结论

本设计采用一次性完全迁移方案，将测试框架从 Mocha 迁移到 Jest。通过精心设计的 VSCode API mock 和完整的测试转换，确保迁移后测试质量不降低，同时获得 Jest 的性能优势和更好的开发体验。
