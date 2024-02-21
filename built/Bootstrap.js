"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DoWrapSync = exports.DoWrapAsync = exports.WrapSync = exports.WrapAsync = exports.ExecuteInitializers = exports.ExtractFunctions = exports.HydrateDecorators = exports.HydrateDependencies = exports.ToObjectLiteral = exports.Path = void 0;
var promises_1 = require("node:fs/promises");
var node_path_1 = __importDefault(require("node:path"));
var comment_json_1 = require("comment-json");
var _Collection_1 = require("#Collection");
var _Context_1 = require("#Context");
var _Decorator_1 = __importStar(require("#Decorator"));
var _Err_1 = __importStar(require("#Err"));
var _types_1 = require("#types");
var tsconfig;
var Path = function (spec, root) {
    if (root === void 0) { root = process.cwd(); }
    return __awaiter(void 0, void 0, void 0, function () {
        var _a, e_1, paths, prefix;
        var _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (!(spec[0] === '!')) return [3 /*break*/, 1];
                    return [2 /*return*/, node_path_1.default.normalize("".concat(root, "/").concat(spec.substring(1)))];
                case 1:
                    if (!(tsconfig === undefined)) return [3 /*break*/, 5];
                    _c.label = 2;
                case 2:
                    _c.trys.push([2, 4, , 5]);
                    _a = comment_json_1.parse;
                    return [4 /*yield*/, (0, promises_1.readFile)("".concat(root, "/tsconfig.json"), { encoding: 'utf8' })];
                case 3:
                    tsconfig = _a.apply(void 0, [_c.sent()]);
                    return [3 /*break*/, 5];
                case 4:
                    e_1 = _c.sent();
                    console.error('Could not load your tsconfig.json file:', e_1.message);
                    process.exit(1);
                    return [3 /*break*/, 5];
                case 5:
                    paths = (_b = tsconfig === null || tsconfig === void 0 ? void 0 : tsconfig.compilerOptions) === null || _b === void 0 ? void 0 : _b.paths;
                    if (paths) {
                        prefix = Object.keys(paths).find(function (p) { return p.substring(0, p.length - 1) === spec[0]; });
                        if (prefix)
                            return [2 /*return*/, node_path_1.default.normalize("".concat(root, "/").concat(paths[prefix][0].replace('*', spec.substring(1))))];
                        else if (spec.charCodeAt(0) > 96 && spec.charCodeAt(0) < 123)
                            return [2 /*return*/, spec];
                        else
                            throw new Error("Could not find ".concat(spec[0], " in compilerOptions.paths: ").concat(JSON.stringify(paths, null, 2)));
                    }
                    else
                        throw new Error("No compilerOptions.paths defined in tsconfig.json");
                    return [2 /*return*/];
            }
        });
    });
};
exports.Path = Path;
var ToObjectLiteral = function (input) {
    return __spreadArray([], input.entries(), true).reduce(function (f, _a) {
        var k = _a[0], v = _a[1];
        return (f[k] = v, f);
    }, {});
};
exports.ToObjectLiteral = ToObjectLiteral;
var HydrateDependencies = function (dependencies, params, root) { return __awaiter(void 0, void 0, void 0, function () {
    var deps, boostrapped, output, _i, _a, d, use, _b, _c, _d, _e, _f, _g, _h, k, v, use, _j, v_1, d;
    return __generator(this, function (_k) {
        switch (_k.label) {
            case 0:
                deps = dependencies(), boostrapped = {}, output = {};
                _i = 0, _a = Object.keys(deps);
                _k.label = 1;
            case 1:
                if (!(_i < _a.length)) return [3 /*break*/, 6];
                d = _a[_i];
                if (!d.endsWith('!')) return [3 /*break*/, 3];
                use = d.substring(0, d.length - 1);
                _b = boostrapped;
                _c = use;
                return [4 /*yield*/, Promise.resolve("".concat(use)).then(function (s) { return __importStar(require(s)); })];
            case 2:
                _b[_c] = _k.sent();
                return [3 /*break*/, 5];
            case 3:
                _d = boostrapped;
                _e = d;
                return [4 /*yield*/, Bootstrap(d, params, root)];
            case 4:
                _d[_e] = _k.sent();
                _k.label = 5;
            case 5:
                _i++;
                return [3 /*break*/, 1];
            case 6:
                for (_f = 0, _g = Object.entries(deps); _f < _g.length; _f++) {
                    _h = _g[_f], k = _h[0], v = _h[1];
                    use = k;
                    for (_j = 0, v_1 = v; _j < v_1.length; _j++) {
                        d = v_1[_j];
                        output[d] = d.charCodeAt(0) > 64 && d.charCodeAt(0) < 91 ?
                            boostrapped[use].default
                            :
                                output[d] = boostrapped[use][d];
                    }
                }
                return [2 /*return*/, output];
        }
    });
}); };
exports.HydrateDependencies = HydrateDependencies;
var HydrateDecorators = function (spec, decorators, params, root) { return __awaiter(void 0, void 0, void 0, function () {
    var _i, _a, _b, fun, decs, _c, _d, _e, mode, mads, _f, _g, _h, mad, fns, _j, fns_1, fn, _k, _l;
    return __generator(this, function (_m) {
        switch (_m.label) {
            case 0:
                _i = 0, _a = Object.entries(decorators());
                _m.label = 1;
            case 1:
                if (!(_i < _a.length)) return [3 /*break*/, 10];
                _b = _a[_i], fun = _b[0], decs = _b[1];
                _c = 0, _d = Object.entries(decs);
                _m.label = 2;
            case 2:
                if (!(_c < _d.length)) return [3 /*break*/, 9];
                _e = _d[_c], mode = _e[0], mads = _e[1];
                _f = 0, _g = Object.entries(mads);
                _m.label = 3;
            case 3:
                if (!(_f < _g.length)) return [3 /*break*/, 8];
                _h = _g[_f], mad = _h[0], fns = _h[1];
                _j = 0, fns_1 = fns;
                _m.label = 4;
            case 4:
                if (!(_j < fns_1.length)) return [3 /*break*/, 7];
                fn = fns_1[_j];
                _k = _Decorator_1.add;
                _l = [spec, fun, mode];
                return [4 /*yield*/, Bootstrap(mad, params, root)];
            case 5:
                _k.apply(void 0, _l.concat([(_m.sent())[fn]]));
                _m.label = 6;
            case 6:
                _j++;
                return [3 /*break*/, 4];
            case 7:
                _f++;
                return [3 /*break*/, 3];
            case 8:
                _c++;
                return [3 /*break*/, 2];
            case 9:
                _i++;
                return [3 /*break*/, 1];
            case 10: return [2 /*return*/];
        }
    });
}); };
exports.HydrateDecorators = HydrateDecorators;
var ExtractFunctions = function (mod, output) {
    return new Map(Object.
        entries(__assign(__assign({}, mod), output)).
        filter(function (_a) {
        var k = _a[0], v = _a[1];
        return typeof v === 'function';
    }).
        filter(function (_a) {
        var k = _a[0], _ = _a[1];
        return k !== 'dependencies' && k !== 'decorators';
    }));
};
exports.ExtractFunctions = ExtractFunctions;
var ExecuteInitializers = function (spec, mod, fns, params) { return __awaiter(void 0, void 0, void 0, function () {
    var asyncInits, _i, asyncInits_1, i, inits, _a, inits_1, i;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                asyncInits = Object.
                    keys(mod).
                    filter(function (i) { var _a, _b; return ((_b = (_a = mod[i]) === null || _a === void 0 ? void 0 : _a.constructor) === null || _b === void 0 ? void 0 : _b.name) === 'AsyncFunction' && i[0] === '$'; });
                _i = 0, asyncInits_1 = asyncInits;
                _b.label = 1;
            case 1:
                if (!(_i < asyncInits_1.length)) return [3 /*break*/, 4];
                i = asyncInits_1[_i];
                return [4 /*yield*/, (0, exports.DoWrapAsync)(spec, fns, i)(params)];
            case 2:
                _b.sent();
                _b.label = 3;
            case 3:
                _i++;
                return [3 /*break*/, 1];
            case 4:
                inits = Object.
                    keys(mod).
                    filter(function (i) { var _a, _b; return ((_b = (_a = mod[i]) === null || _a === void 0 ? void 0 : _a.constructor) === null || _b === void 0 ? void 0 : _b.name) === 'Function' && i[0] === '$'; });
                _a = 0, inits_1 = inits;
                _b.label = 5;
            case 5:
                if (!(_a < inits_1.length)) return [3 /*break*/, 8];
                i = inits_1[_a];
                return [4 /*yield*/, (0, exports.DoWrapSync)(fns, i)(params)];
            case 6:
                _b.sent();
                _b.label = 7;
            case 7:
                _a++;
                return [3 /*break*/, 5];
            case 8: return [2 /*return*/];
        }
    });
}); };
exports.ExecuteInitializers = ExecuteInitializers;
var WrapAsync = function (spec, mod, fns) {
    var output = {}, asyncFns = new Map(Object.
        entries(mod).
        filter(function (_a) {
        var _ = _a[0], v = _a[1];
        return v.constructor.name === 'AsyncFunction';
    }).
        filter(function (_a) {
        var k = _a[0], _ = _a[1];
        return !k.startsWith('$');
    }).
        filter(function (_a) {
        var k = _a[0], _ = _a[1];
        return k !== 'dependencies' && k !== 'decorators';
    }));
    for (var _i = 0, _a = asyncFns.keys(); _i < _a.length; _i++) {
        var k = _a[_i];
        output[k] = (0, exports.DoWrapAsync)(spec, fns, k, output);
    }
    return output;
};
exports.WrapAsync = WrapAsync;
var WrapSync = function (mod, fns) {
    var output = {}, syncFns = new Map(Object.
        entries(mod).
        filter(function (_a) {
        var _ = _a[0], v = _a[1];
        return v.constructor.name === 'Function';
    }).
        filter(function (_a) {
        var k = _a[0], _ = _a[1];
        return !k.startsWith('$');
    }).
        filter(function (_a) {
        var k = _a[0], _ = _a[1];
        return k !== 'dependencies' && k !== 'decorators';
    }));
    for (var _i = 0, _a = syncFns.keys(); _i < _a.length; _i++) {
        var k = _a[_i];
        output[k] = (0, exports.DoWrapSync)(fns, k, output);
    }
    return output;
};
exports.WrapSync = WrapSync;
var _handle = function (error, params, reject) {
    var _ = error instanceof _Err_1.Err === false ?
        _Err_1.Err.from(error, params)
        :
            error;
    if (_.mode === 'DEBUGGING')
        (0, _Err_1.debug)(CONFIG);
    else if ((0, _Err_1.unhandled)())
        (0, _Err_1.handle)(params);
    else if (reject)
        reject(_);
    else
        throw _;
};
var DoWrapAsync = function (spec, functions, fun, self) {
    var fn = function (params) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve, reject) { return __awaiter(void 0, void 0, void 0, function () {
                    var input, fn_1, output, e_2;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                input = __assign(__assign(__assign({}, params), (0, exports.ToObjectLiteral)(functions)), { self: self, err: (0, _Err_1.default)(params), print: (0, _Err_1.print)() });
                                _a.label = 1;
                            case 1:
                                _a.trys.push([1, 5, , 6]);
                                return [4 /*yield*/, (0, _Decorator_1.default)(spec, fun, _types_1.Mode.before, input)];
                            case 2:
                                _a.sent();
                                fn_1 = functions.get(fun);
                                return [4 /*yield*/, fn_1.call(undefined, input)];
                            case 3:
                                output = _a.sent();
                                return [4 /*yield*/, (0, _Decorator_1.default)(spec, fun, _types_1.Mode.after, output)];
                            case 4:
                                _a.sent();
                                resolve(output);
                                return [3 /*break*/, 6];
                            case 5:
                                e_2 = _a.sent();
                                _handle(e_2, params, reject);
                                return [3 /*break*/, 6];
                            case 6: return [2 /*return*/];
                        }
                    });
                }); })];
        });
    }); };
    fn._wrapped = fun;
    fn.toString = function () { return (0, _Context_1.func)('AsyncFunction', fun); };
    return fn;
};
exports.DoWrapAsync = DoWrapAsync;
var DoWrapSync = function (functions, fun, self) {
    var fn = function (params) {
        try {
            var delegate = functions.get(fun);
            return delegate.call(undefined, __assign(__assign(__assign({}, params), (0, exports.ToObjectLiteral)(functions)), { self: self, err: (0, _Err_1.default)(params), print: (0, _Err_1.print)() }));
        }
        catch (e) {
            _handle(e, params);
        }
    };
    fn._wrapped = fun;
    fn.toString = function () { return (0, _Context_1.func)('Function', fun); };
    return fn;
};
exports.DoWrapSync = DoWrapSync;
var available = {};
var CONFIG;
var Bootstrap = function (spec, params, root) {
    if (params === void 0) { params = {}; }
    if (root === void 0) { root = process.cwd(); }
    return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve, reject) { return __awaiter(void 0, void 0, void 0, function () {
                    var listeners, cb, item, _a, conf, from, mod, proxy, output, deps, _i, _b, _c, k, v, fns, aWrapped, sWrapped, _d, _e, _f, k, v, _g, _h, _j, k, v, callbacks, _k, callbacks_1, done, e_3, msg;
                    var _l;
                    return __generator(this, function (_m) {
                        switch (_m.label) {
                            case 0:
                                listeners = "".concat(spec, "::BOOTSTRAP_LISTENERS"), cb = function () { return resolve(available[spec]); }, item = { key: null, value: cb };
                                _a = available[spec];
                                switch (_a) {
                                    case undefined: return [3 /*break*/, 1];
                                    case null: return [3 /*break*/, 21];
                                }
                                return [3 /*break*/, 22];
                            case 1:
                                available[spec] = null;
                                (0, _Collection_1.manage)(listeners, item);
                                _m.label = 2;
                            case 2:
                                _m.trys.push([2, 19, , 20]);
                                if (!(CONFIG === undefined)) return [3 /*break*/, 7];
                                return [4 /*yield*/, Promise.resolve().then(function () { return __importStar(require('./Config')); })];
                            case 3:
                                conf = _m.sent();
                                _l = {};
                                return [4 /*yield*/, conf.env()];
                            case 4:
                                _l.env = _m.sent();
                                return [4 /*yield*/, conf.debug()];
                            case 5:
                                _l.debug = _m.sent();
                                return [4 /*yield*/, conf.report()];
                            case 6:
                                CONFIG = (_l.report = _m.sent(),
                                    _l);
                                _m.label = 7;
                            case 7: return [4 /*yield*/, (0, exports.Path)(spec, root)];
                            case 8:
                                from = _m.sent();
                                return [4 /*yield*/, Promise.resolve("".concat(from)).then(function (s) { return __importStar(require(s)); })];
                            case 9:
                                mod = _m.sent(), proxy = {}, output = {};
                                if (!(typeof mod.dependencies === 'function')) return [3 /*break*/, 11];
                                return [4 /*yield*/, (0, exports.HydrateDependencies)(mod.dependencies, params, root)];
                            case 10:
                                deps = _m.sent();
                                for (_i = 0, _b = Object.entries(deps); _i < _b.length; _i++) {
                                    _c = _b[_i], k = _c[0], v = _c[1];
                                    proxy[k] = v;
                                }
                                _m.label = 11;
                            case 11:
                                if (!(typeof mod.decorators === 'function')) return [3 /*break*/, 13];
                                return [4 /*yield*/, (0, exports.HydrateDecorators)(spec, mod.decorators, params, root)];
                            case 12:
                                _m.sent();
                                _m.label = 13;
                            case 13:
                                fns = (0, exports.ExtractFunctions)(mod, proxy);
                                return [4 /*yield*/, (0, exports.ExecuteInitializers)(spec, mod, fns, params)];
                            case 14:
                                _m.sent();
                                aWrapped = (0, exports.WrapAsync)(spec, mod, fns);
                                sWrapped = (0, exports.WrapSync)(mod, fns);
                                for (_d = 0, _e = Object.entries(aWrapped); _d < _e.length; _d++) {
                                    _f = _e[_d], k = _f[0], v = _f[1];
                                    output[k] = v;
                                }
                                for (_g = 0, _h = Object.entries(sWrapped); _g < _h.length; _g++) {
                                    _j = _h[_g], k = _j[0], v = _j[1];
                                    output[k] = v;
                                }
                                available[spec] = output;
                                callbacks = (0, _Collection_1.items)(listeners);
                                if (!Array.isArray(callbacks)) return [3 /*break*/, 18];
                                _k = 0, callbacks_1 = callbacks;
                                _m.label = 15;
                            case 15:
                                if (!(_k < callbacks_1.length)) return [3 /*break*/, 18];
                                done = callbacks_1[_k];
                                return [4 /*yield*/, done()];
                            case 16:
                                _m.sent();
                                _m.label = 17;
                            case 17:
                                _k++;
                                return [3 /*break*/, 15];
                            case 18:
                                (0, _Collection_1.uninit)(listeners);
                                return [3 /*break*/, 20];
                            case 19:
                                e_3 = _m.sent();
                                msg = e_3.message;
                                reject("Error loading ".concat(spec).concat(msg ? ": ".concat(msg) : ''));
                                return [3 /*break*/, 20];
                            case 20: return [3 /*break*/, 23];
                            case 21:
                                (0, _Collection_1.manage)(listeners, item);
                                return [3 /*break*/, 23];
                            case 22:
                                cb();
                                _m.label = 23;
                            case 23: return [2 /*return*/];
                        }
                    });
                }); })];
        });
    });
};
exports.default = Bootstrap;
