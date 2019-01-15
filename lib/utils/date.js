"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isSameDayOrBefore = exports.isSameDayOrAfter = void 0;

var _is_after = _interopRequireDefault(require("date-fns/is_after"));

var _is_before = _interopRequireDefault(require("date-fns/is_before"));

var _is_same_day = _interopRequireDefault(require("date-fns/is_same_day"));

var isSameDayOrAfter = function isSameDayOrAfter(date, compareDate) {
  return (0, _is_same_day.default)(date, compareDate) || (0, _is_after.default)(date, compareDate);
};

exports.isSameDayOrAfter = isSameDayOrAfter;

var isSameDayOrBefore = function isSameDayOrBefore(date, compareDate) {
  return (0, _is_same_day.default)(date, compareDate) || (0, _is_before.default)(date, compareDate);
};

exports.isSameDayOrBefore = isSameDayOrBefore;