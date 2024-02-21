"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatDebug = exports.formatErrDetails = exports.formatErrMessage = exports.typed = exports.obj = exports.arr = exports.func = void 0;
var ansi_colors_1 = __importDefault(require("ansi-colors"));
var func = function (type, name) {
    return name ?
        [
            "".concat(ansi_colors_1.default.cyan('[')),
            "".concat(ansi_colors_1.default.cyanBright(type)),
            "".concat(ansi_colors_1.default.dim(':')),
            "".concat(ansi_colors_1.default.bold.cyanBright(String(name))),
            "".concat(ansi_colors_1.default.cyan(']')),
        ].join('')
        :
            "".concat(ansi_colors_1.default.cyan("[".concat(type, "]")));
};
exports.func = func;
var arr = function (items, left, indent, step) {
    if (indent === void 0) { indent = 0; }
    if (step === void 0) { step = 2; }
    var width = String(items.length).length, output = ["".concat(ansi_colors_1.default.green('Array'))], pre = ''.padStart(indent + step);
    if (items.length <= 5)
        return output.concat(items.map(function (_, i) { return [
            "".concat(left, " "),
            "".concat(pre).concat(ansi_colors_1.default.gray(String(i).padStart(width))),
            "".concat(ansi_colors_1.default.dim(':'), " "),
            "".concat((0, exports.typed)(_, left, indent + step, step)),
        ].join(''); })).join('\n');
    else {
        var out = items.
            slice(0, 2).
            map(function (_, i) { return [
            "".concat(left, " "),
            "".concat(pre).concat(ansi_colors_1.default.gray(String(i).padStart(width))),
            "".concat(ansi_colors_1.default.dim(':'), " "),
            "".concat((0, exports.typed)(_, left, indent + step, step)),
        ].join(''); });
        out.push("".concat(left, " ").concat(pre).concat(ansi_colors_1.default.dim("".concat(' '.padStart(width), "  ..."))));
        return output.concat(out.concat(items.
            slice(items.length - 2, items.length).
            map(function (_, i) { return [
            "".concat(left, " "),
            "".concat(pre).concat(ansi_colors_1.default.gray(String(i + (items.length - 2)).padStart(width))),
            "".concat(ansi_colors_1.default.dim(':'), " "),
            "".concat((0, exports.typed)(_, left, indent + step, step)),
        ].join(''); }))).join('\n');
    }
};
exports.arr = arr;
var obj = function (data, left, indent, step) {
    if (indent === void 0) { indent = 0; }
    if (step === void 0) { step = 2; }
    var name = data.constructor.name === 'Object' ?
        'object literal'
        :
            data.constructor.name;
    var output = ["".concat(ansi_colors_1.default.green(name))], pre = ''.padStart(indent);
    for (var _i = 0, _a = Object.entries(data); _i < _a.length; _i++) {
        var _b = _a[_i], k = _b[0], v = _b[1];
        output.push("".concat(left, " ").concat(pre).concat(ansi_colors_1.default.white(k)).concat(ansi_colors_1.default.dim(':'), " ").concat((0, exports.typed)(v, left, indent, step)));
    }
    return output.join('\n');
};
exports.obj = obj;
var typed = function (value, left, indent, step) {
    if (left === void 0) { left = ''; }
    if (indent === void 0) { indent = 0; }
    if (step === void 0) { step = 2; }
    switch (typeof value) {
        case 'string': return "".concat(ansi_colors_1.default.white(value));
        case 'bigint':
        case 'number':
            if (String(value).includes('.'))
                return "".concat(ansi_colors_1.default.magentaBright(String(value)));
            else
                return "".concat(ansi_colors_1.default.magentaBright(String(value)));
        case 'object':
            if (value === null)
                return "".concat(ansi_colors_1.default.blueBright(String(value)));
            else if (Array.isArray(value))
                return (0, exports.arr)(value, left, indent, step);
            else
                return (0, exports.obj)(value, left, indent + step, step);
        case 'undefined':
        case 'boolean': return "".concat(ansi_colors_1.default.blueBright(String(value)));
        case 'function':
            return (0, exports.func)(value.constructor.name, value._wrapped);
        default: return '';
    }
};
exports.typed = typed;
var dim = ansi_colors_1.default.dim, fun = ansi_colors_1.default.bold.whiteBright, line = ansi_colors_1.default.magentaBright, madul = ansi_colors_1.default.bold.cyanBright, name = ansi_colors_1.default.whiteBright;
var seperator = dim('---=========---');
var error = ansi_colors_1.default.redBright, eLabel = ansi_colors_1.default.bgRedBright.whiteBright, eParam = ansi_colors_1.default.bgRed.whiteBright;
var eKey = function (text) {
    if (text === void 0) { text = ''; }
    return "   ".concat(eLabel("".concat(text.padStart(8), " ")));
}, eArg = function (text) {
    if (text === void 0) { text = ''; }
    return "   ".concat(eParam("".concat(text.padStart(8), " ")));
};
var formatErrMessage = function (value) {
    return "\uD83D\uDEA8 ".concat(eLabel('   Error '), " ").concat(error(value), "\n");
};
exports.formatErrMessage = formatErrMessage;
var formatErrDetails = function (state) {
    var _a, _b, _c;
    var _ = [seperator];
    var details = state.params ? state.params : state.param;
    for (var _i = 0, _d = details; _i < _d.length; _i++) {
        var d = _d[_i];
        _.push("".concat(eKey('Mädūl'), " ").concat(madul(d.madul)));
        _.push("".concat(eKey('fun'), " ").concat(fun(d.fun), " ").concat(dim('line'), " ").concat(line(String(d.line))));
        var index = 0;
        if (((_a = state.context) === null || _a === void 0 ? void 0 : _a.madul) === d.madul &&
            ((_b = state.context) === null || _b === void 0 ? void 0 : _b.fun) === d.fun &&
            ((_c = state.context) === null || _c === void 0 ? void 0 : _c.line) === d.line) {
            for (var _e = 0, _f = Object.entries(state.context.params); _e < _f.length; _e++) {
                var _g = _f[_e], k = _g[0], v = _g[1];
                var _k = eArg(index++ === 0 ? 'context' : undefined);
                _.push("".concat(_k, " ").concat(name(k)).concat(dim(':'), " ").concat((0, exports.typed)(v, eArg())));
            }
        }
        index = 0;
        var key = Object.keys(d.params).length > 1 ? 'params' : 'param';
        for (var _h = 0, _j = Object.entries(d.params); _h < _j.length; _h++) {
            var _l = _j[_h], k = _l[0], v = _l[1];
            var _k = eArg(index++ === 0 ? key : undefined);
            _.push("".concat(_k, " ").concat(name(k)).concat(dim(':'), " ").concat((0, exports.typed)(v, eArg())));
        }
        _.push(seperator);
    }
    return _.join('\n');
};
exports.formatErrDetails = formatErrDetails;
var dLabel = ansi_colors_1.default.bgBlueBright.whiteBright, dParam = ansi_colors_1.default.bgBlue.whiteBright;
var dKey = function (text) {
    if (text === void 0) { text = ''; }
    return "   ".concat(dLabel("".concat(text.padStart(8), " ")));
}, dArg = function (text) {
    if (text === void 0) { text = ''; }
    return "   ".concat(dParam("".concat(text.padStart(8), " ")));
};
var formatDebug = function (details) {
    var _ = ["\uD83D\uDCA1 ".concat(dLabel('   Debug '))];
    _.push(seperator);
    for (var _i = 0, details_1 = details; _i < details_1.length; _i++) {
        var d = details_1[_i];
        _.push("".concat(dKey('Mädūl'), " ").concat(madul(d.madul)));
        _.push("".concat(dKey('fun'), " ").concat(fun(d.fun), " ").concat(dim('line'), " ").concat(line(String(d.line))));
        var n = Object.keys(d.params).length === 1 ? '  param' : ' params';
        var index = 0;
        for (var _a = 0, _b = Object.entries(d.params); _a < _b.length; _a++) {
            var _c = _b[_a], k = _c[0], v = _c[1];
            var _k = dArg(index++ === 0 ? n : undefined);
            _.push("".concat(_k, " ").concat(name(k)).concat(dim(':'), " ").concat((0, exports.typed)(v, dArg())));
        }
        _.push(seperator);
    }
    return _.join('\n');
};
exports.formatDebug = formatDebug;
