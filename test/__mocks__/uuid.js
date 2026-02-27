"use strict";
/**
 * UUID Mock for Jest
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.v5 = exports.v3 = exports.v1 = exports.v4 = void 0;
exports.v4 = jest.fn(() => '00000000-0000-0000-0000-000000000000');
exports.v1 = jest.fn(() => '00000000-0000-0000-0000-000000000001');
exports.v3 = jest.fn(() => '00000000-0000-0000-0000-000000000003');
exports.v5 = jest.fn(() => '00000000-0000-0000-0000-000000000005');
exports.default = {
    v4: exports.v4,
    v1: exports.v1,
    v3: exports.v3,
    v5: exports.v5
};
//# sourceMappingURL=uuid.js.map