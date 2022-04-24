"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useToken = exports.AuthProvider = exports.useAuth = void 0;
var useAuth_1 = require("./src/hooks/useAuth");
Object.defineProperty(exports, "useAuth", { enumerable: true, get: function () { return __importDefault(useAuth_1).default; } });
var AuthProvider_1 = require("./src/providers/AuthProvider");
Object.defineProperty(exports, "AuthProvider", { enumerable: true, get: function () { return __importDefault(AuthProvider_1).default; } });
__exportStar(require("./src/interfaces"), exports);
var useToken_1 = require("./src/hooks/useToken");
Object.defineProperty(exports, "useToken", { enumerable: true, get: function () { return __importDefault(useToken_1).default; } });
