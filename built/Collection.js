"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.items = exports.item = exports.managed = exports.unmanage = exports.manage = exports.uninit = exports.reinit = exports.init = void 0;
var context = {};
var init = function (collection) {
    if (Array.isArray(context[collection]) === false) {
        context[collection] = [];
        return true;
    }
    else
        return false;
};
exports.init = init;
var reinit = function (colleciton) {
    if (Array.isArray(context[colleciton])) {
        // This is extremely important: We reset the collection[key] array this way so
        // that clients with references obtained via get() and getAll() will behave as expected.
        // If we just did collection[key] = [ ] then all references to this array would immediately
        // become stale, and clients would have no way of knowing that.
        // The connection to clients would be broken, and there would be no way for them to know they
        // needed to call get()/getAll() again to resync their reference(s).
        var count = context[colleciton].length;
        for (var i = 0; i < count; i++)
            context[colleciton].pop();
        return true;
    }
    else
        return false;
};
exports.reinit = reinit;
var uninit = function (collection) {
    if (Array.isArray(context[collection])) {
        delete context[collection];
        return true;
    }
    else
        return false;
};
exports.uninit = uninit;
var manage = function (collection, item) {
    (0, exports.init)(collection);
    if (Array.isArray(item)) {
        var _loop_1 = function (i) {
            if (i.key !== null && context[collection].some(function (d) { return d.key === i.key; }))
                return { value: false };
        };
        for (var _i = 0, item_1 = item; _i < item_1.length; _i++) {
            var i = item_1[_i];
            var state_1 = _loop_1(i);
            if (typeof state_1 === "object")
                return state_1.value;
        }
        for (var _a = 0, item_2 = item; _a < item_2.length; _a++) {
            var i = item_2[_a];
            (0, exports.manage)(collection, i);
        }
        return true;
    }
    else {
        if (item.key !== null && context[collection].some(function (d) { return d.key === item.key; }) === false) {
            context[collection].push({
                key: item.key,
                value: item.value,
            });
            return true;
        }
        else if (item.key === null) {
            context[collection].push({
                key: null,
                value: item.value,
            });
            return true;
        }
        else
            return false;
    }
};
exports.manage = manage;
var unmanage = function (collection, key) {
    if (Array.isArray(context[collection]) && context[collection].some(function (d) { return d.key === key; })) {
        context[collection].splice(context[collection].findIndex(function (d) { return d.key === key; }), 1);
        return true;
    }
    else
        return false;
};
exports.unmanage = unmanage;
var managed = function (collection) {
    if (Array.isArray(context[collection]))
        return context[collection];
    else
        return undefined;
};
exports.managed = managed;
var item = function (collection, key) {
    var _a;
    if (Array.isArray(context[collection]))
        return (_a = context[collection].find(function (m) { return m.key === key; })) === null || _a === void 0 ? void 0 : _a.value;
    else
        return undefined;
};
exports.item = item;
var items = function (collection) {
    if (Array.isArray(context[collection]))
        return context[collection].map(function (c) { return c.value; });
    else
        return undefined;
};
exports.items = items;
