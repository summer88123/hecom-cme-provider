"use strict";
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
//# sourceMappingURL=setup.js.map