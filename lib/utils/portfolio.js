"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getTimeWeightedReturnRate = exports.getHoldingPeriods = exports.getHoldingQuantities = exports.getDateCashflow = exports.getValue = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));

var _objectSpread3 = _interopRequireDefault(require("@babel/runtime/helpers/objectSpread"));

var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));

var _lodash = _interopRequireDefault(require("lodash"));

var _dateFns = require("date-fns");

var getValue = function getValue(date, holdingQuantities, stocksPriceByDate) {
  var formattedDate = (0, _dateFns.format)(date, 'YYYY-MM-DD');
  return Object.entries(holdingQuantities).reduce(function (acc, _ref) {
    var _ref2 = (0, _slicedToArray2.default)(_ref, 2),
        stockId = _ref2[0],
        quantity = _ref2[1];

    var price = stocksPriceByDate[formattedDate][stockId] || 0;
    return acc + quantity * price;
  }, 0);
};

exports.getValue = getValue;

var getDateCashflow = function getDateCashflow(date, holdingQuantities, stocksPriceByDate, previousPeriod) {
  if (!previousPeriod) {
    return 0;
  }

  return Object.keys(holdingQuantities).reduce(function (acc, stockId) {
    var current = holdingQuantities[stockId] || 0;
    var previous = previousPeriod.holdingQuantities[stockId] || 0;
    var tradedQuantity = current - previous;
    var price = stocksPriceByDate[date] && stocksPriceByDate[date][stockId] || 0;
    return acc + tradedQuantity * price;
  }, 0);
};

exports.getDateCashflow = getDateCashflow;

var getHoldingQuantities = function getHoldingQuantities(transactions, initial) {
  return transactions.reduce(function (acc, _ref3) {
    var stockId = _ref3.stockId,
        quantity = _ref3.quantity;
    var previousQuantity = acc[stockId] || 0;
    acc[stockId] = previousQuantity + quantity;
    return acc;
  }, (0, _objectSpread3.default)({}, initial));
};

exports.getHoldingQuantities = getHoldingQuantities;

var HoldingPeriod = function HoldingPeriod(date, holdingQuantities, stocksPriceByDate, previousPeriod) {
  var value = getValue(date, previousPeriod ? previousPeriod.holdingQuantities : holdingQuantities, stocksPriceByDate);
  var cashflow = getDateCashflow(date, holdingQuantities, stocksPriceByDate, previousPeriod);
  var returnRate = 0;

  if (previousPeriod && previousPeriod.valueAfterCashflow !== 0) {
    returnRate = value / previousPeriod.valueAfterCashflow - 1;
  }

  return {
    date: date,
    value: value,
    valueAfterCashflow: value + cashflow,
    holdingQuantities: holdingQuantities,
    returnRate: returnRate
  };
};

var getHoldingPeriods = function getHoldingPeriods(passedTransactions, stocksPriceByDate, from, to) {
  if (passedTransactions.length > 0 && (0, _dateFns.isBefore)(passedTransactions[0].date, from.date)) {
    throw new Error("First transaction can't occur before the initial date");
  }

  var transactions = (0, _toConsumableArray2.default)(passedTransactions);
  var periods = {};
  var initialPeriod = HoldingPeriod((0, _dateFns.format)(from.date, 'YYYY-MM-DD'), from.previousHoldingQuantities, stocksPriceByDate);
  var groupedTransactions = Object.entries(_lodash.default.groupBy(transactions, function (t) {
    return (0, _dateFns.format)(t.date, 'YYYY-MM-DD');
  }));
  groupedTransactions.forEach(function (_ref4, i) {
    var _ref5 = (0, _slicedToArray2.default)(_ref4, 2),
        date = _ref5[0],
        dayTransactions = _ref5[1];

    var previousDate = i > 0 && groupedTransactions[i - 1][0];
    var previousPeriod = previousDate ? periods[previousDate] : initialPeriod;
    var dayStocksQuantities = getHoldingQuantities(dayTransactions, previousPeriod.holdingQuantities);
    var holdingQuantities = (0, _objectSpread3.default)({}, previousPeriod && previousPeriod.holdingQuantities, dayStocksQuantities);
    periods[date] = HoldingPeriod(date, holdingQuantities, stocksPriceByDate, previousPeriod);
  });
  var lastIndex = groupedTransactions.length - 1;
  var lastDate = lastIndex >= 0 && groupedTransactions[lastIndex][0];
  var previousPeriod = lastDate ? periods[lastDate] : initialPeriod;
  periods[to.date] = HoldingPeriod((0, _dateFns.format)(to.date, 'YYYY-MM-DD'), previousPeriod.holdingQuantities, stocksPriceByDate, previousPeriod);
  return (0, _objectSpread3.default)((0, _defineProperty2.default)({}, from.date, initialPeriod), periods);
};

exports.getHoldingPeriods = getHoldingPeriods;

var getTimeWeightedReturnRate = function getTimeWeightedReturnRate() {
  var periods = getHoldingPeriods.apply(void 0, arguments);
  var hprs = Object.values(periods).map(function (period) {
    return period.returnRate;
  });
  return hprs.reduce(function (acc, hpr) {
    return acc * (1 + hpr);
  }, 1) - 1;
};

exports.getTimeWeightedReturnRate = getTimeWeightedReturnRate;