"use strict";
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _Err_context, _Err_message, _Err_mode, _Err_params, _Err_stack, _Err_throws;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Err = exports.print = exports.debug = exports.handle = exports.details = exports.filterExtraneous = exports.build = exports.extract = exports.unhandled = void 0;
var node_fs_1 = require("node:fs");
var node_path_1 = __importDefault(require("node:path"));
var _Context_1 = require("#Context");
var _err;
var unhandled = function () {
    return _err.throws === 4;
};
exports.unhandled = unhandled;
var extract = function (mapped) { return function (trace) {
    var tokens = trace.split(' ');
    var fun = tokens[0] === '<anonymous>' ? tokens[0].substring(1, tokens[0].length - 1) : tokens[0], loc = tokens[1].substring(1, tokens[1].length - 1).split(':'), __m = Object.keys(mapped).find(function (m) { return loc[0].startsWith(m); }), mad = loc[0].replace("".concat(__m, "/"), mapped[__m]);
    return {
        fun: fun,
        line: loc[1],
        madul: mad.substring(0, mad.length - 3),
    };
}; };
exports.extract = extract;
var build = function (params) { return function (s, i) { return ({
    fun: s.fun,
    line: Number(s.line),
    madul: s.madul,
    params: params[i],
}); }; };
exports.build = build;
var filterExtraneous = function (stack, mapped) {
    return stack.
        split(/\s+at\s+/).
        filter(function (s) { return s.includes('Bootstrap.ts') === false; }).
        filter(function (s) { return s.includes(__filename) === false; }).
        filter(function (s) { return Object.keys(mapped).find(function (m) { return s.includes(m); }) !== undefined; });
};
exports.filterExtraneous = filterExtraneous;
var details = function (params, e) {
    var _a, _b;
    if (e === void 0) { e = _err; }
    var file = "".concat(process.cwd(), "/tsconfig.json"), config = (0, node_fs_1.readFileSync)(file, { encoding: 'utf8' }), paths = (_b = (_a = JSON.
        parse(config)) === null || _a === void 0 ? void 0 : _a.compilerOptions) === null || _b === void 0 ? void 0 : _b.paths;
    var mapped = {};
    for (var _i = 0, _c = Object.entries(paths); _i < _c.length; _i++) {
        var _d = _c[_i], k = _d[0], v = _d[1];
        for (var _e = 0, _f = v; _e < _f.length; _e++) {
            var p = _f[_e];
            var m = node_path_1.default.normalize("".concat(process.cwd(), "/").concat(p.substring(0, p.length - 2)));
            mapped[m] = k.substring(0, k.length - 1);
        }
    }
    return (0, exports.filterExtraneous)(e.stack, mapped).
        map((0, exports.extract)(mapped)).
        map((0, exports.build)(params));
};
exports.details = details;
var handle = function (params) {
    if (params)
        _err.add(params);
    console.error(String(_err));
    if (process.env.NODE_ENV !== 'test')
        process.exit(1);
};
exports.handle = handle;
var debug = function (config) {
    config.debug[config.env.current]((0, exports.details)(_err.params, _err));
};
exports.debug = debug;
var err = function (params) { return function (message, context) {
    _err = new Err(message, params || {}, context);
    throw _err;
}; };
var print = function () { return function (params, context) {
    _err = new Err('', params, context, 0, 'DEBUGGING');
    throw _err;
}; };
exports.print = print;
var Err = /** @class */ (function () {
    function Err(message, params, context, throws, mode, stack) {
        if (throws === void 0) { throws = 0; }
        if (mode === void 0) { mode = 'ERROR'; }
        if (stack === void 0) { stack = new Error(message).stack || ''; }
        _Err_context.set(this, {});
        _Err_message.set(this, void 0);
        _Err_mode.set(this, void 0);
        _Err_params.set(this, []);
        _Err_stack.set(this, void 0);
        _Err_throws.set(this, 0);
        __classPrivateFieldSet(this, _Err_message, message, "f");
        __classPrivateFieldSet(this, _Err_mode, mode, "f");
        __classPrivateFieldSet(this, _Err_stack, stack, "f");
        __classPrivateFieldSet(this, _Err_throws, throws, "f");
        __classPrivateFieldGet(this, _Err_params, "f").push(params);
        if (context)
            __classPrivateFieldSet(this, _Err_context, context, "f");
    }
    Err.from = function (e, params) {
        var message = e instanceof Error === false ?
            String(e)
            :
                e.message;
        var stack = e instanceof Error ?
            e.stack
            :
                undefined;
        var _ = new Err(message, params || {}, undefined, 3, 'ERROR', stack);
        _err = _;
        return _;
    };
    Err.prototype.add = function (params) { __classPrivateFieldGet(this, _Err_params, "f").push(params); };
    Err.prototype.toString = function () {
        var _a;
        var p = Object.keys(__classPrivateFieldGet(this, _Err_params, "f")).length > 1 ? 'params' : 'param';
        var state = (_a = {
                context: (0, exports.details)([__classPrivateFieldGet(this, _Err_context, "f")])[0]
            },
            _a[p] = (0, exports.details)(__classPrivateFieldGet(this, _Err_params, "f")),
            _a);
        return "".concat((0, _Context_1.formatErrMessage)(__classPrivateFieldGet(this, _Err_message, "f"))).concat((0, _Context_1.formatErrDetails)(state));
    };
    Object.defineProperty(Err.prototype, "throws", {
        get: function () { var _a; return __classPrivateFieldSet(this, _Err_throws, (_a = __classPrivateFieldGet(this, _Err_throws, "f"), ++_a), "f"); },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Err.prototype, "context", {
        get: function () { return __classPrivateFieldGet(this, _Err_context, "f"); },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Err.prototype, "message", {
        get: function () { return __classPrivateFieldGet(this, _Err_message, "f"); },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Err.prototype, "mode", {
        get: function () { return __classPrivateFieldGet(this, _Err_mode, "f"); },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Err.prototype, "params", {
        get: function () { return __classPrivateFieldGet(this, _Err_params, "f"); },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Err.prototype, "stack", {
        get: function () { return __classPrivateFieldGet(this, _Err_stack, "f"); },
        enumerable: false,
        configurable: true
    });
    return Err;
}());
exports.Err = Err;
_Err_context = new WeakMap(), _Err_message = new WeakMap(), _Err_mode = new WeakMap(), _Err_params = new WeakMap(), _Err_stack = new WeakMap(), _Err_throws = new WeakMap();
exports.default = err;
