"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));

var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _cwait = require("cwait");

var _lodash = _interopRequireDefault(require("lodash"));

var _dateFns = require("date-fns");

var _Stock = _interopRequireDefault(require("./Stock"));

var _date = require("./utils/date");

var portfolioUtils = _interopRequireWildcard(require("./utils/portfolio"));

var Portfolio =
/*#__PURE__*/
function () {
  function Portfolio() {
    var _this = this;

    var transactions = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
    (0, _classCallCheck2.default)(this, Portfolio);
    (0, _defineProperty2.default)(this, "_memoizedStockPricesByDate", _lodash.default.memoize(
    /*#__PURE__*/
    function () {
      var _ref = (0, _asyncToGenerator2.default)(
      /*#__PURE__*/
      _regenerator.default.mark(function _callee2(date) {
        var stocksPrices;
        return _regenerator.default.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                stocksPrices = {};
                _context2.next = 3;
                return Promise.all(Object.keys(_this._stocks).map(
                /*#__PURE__*/
                function () {
                  var _ref2 = (0, _asyncToGenerator2.default)(
                  /*#__PURE__*/
                  _regenerator.default.mark(function _callee(stockId) {
                    var price;
                    return _regenerator.default.wrap(function _callee$(_context) {
                      while (1) {
                        switch (_context.prev = _context.next) {
                          case 0:
                            _context.next = 2;
                            return _this._stocks[stockId].getPrice(date);

                          case 2:
                            price = _context.sent;
                            stocksPrices[stockId] = price || 0;

                          case 4:
                          case "end":
                            return _context.stop();
                        }
                      }
                    }, _callee, this);
                  }));

                  return function (_x2) {
                    return _ref2.apply(this, arguments);
                  };
                }()));

              case 3:
                return _context2.abrupt("return", stocksPrices);

              case 4:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      return function (_x) {
        return _ref.apply(this, arguments);
      };
    }()));
    (0, _defineProperty2.default)(this, "firstDate", function () {
      if (_this._transactions.length > 0) {
        return _this._transactions[0].date;
      }
    });

    /**
     * "Private" attributes
     */
    this._isInited = false;
    this._listeners = [];
    this._transactions = _lodash.default.orderBy(transactions, 'date', ['asc']);
    this._stocks = {};
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = transactions[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var transaction = _step.value;
        transaction.date = (0, _dateFns.format)(transaction.date, 'YYYY-MM-DD');
        var stockId = transaction.stockId;

        if (!this._stocks[stockId]) {
          this._stocks[stockId] = new _Stock.default(stockId);
        }
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return != null) {
          _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }
  }
  /**
   * "Private" methods
   */


  (0, _createClass2.default)(Portfolio, [{
    key: "isInited",

    /**
     * Public getters
     */
    value: function isInited() {
      return this._isInited;
    }
  }, {
    key: "getTransactions",
    value: function getTransactions() {
      return this._transactions.slice();
    }
  }, {
    key: "getStocks",
    value: function getStocks() {
      return _lodash.default.clone(this._stocks);
    }
  }, {
    key: "lastDate",
    value: function lastDate() {
      if (this._transactions.length > 0) {
        return this._transactions[this._transactions.length - 1].date;
      }
    }
  }, {
    key: "hasTransactions",
    value: function hasTransactions() {
      return this._transactions.length > 0;
    }
    /**
     * Public methods
     */

  }, {
    key: "init",
    value: function () {
      var _init = (0, _asyncToGenerator2.default)(
      /*#__PURE__*/
      _regenerator.default.mark(function _callee3() {
        var queue;
        return _regenerator.default.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                queue = new _cwait.TaskQueue(Promise, 20); // 20 concurrent requests

                _context3.next = 3;
                return Promise.all([].concat((0, _toConsumableArray2.default)(Object.values(this._stocks).map(queue.wrap(function (stock) {
                  return stock.fetchInfo();
                }))), (0, _toConsumableArray2.default)(Object.values(this._stocks).map(queue.wrap(function (stock) {
                  return stock.fetchHistory();
                })))));

              case 3:
                this._isInited = true;
                this.notify();

              case 5:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function init() {
        return _init.apply(this, arguments);
      }

      return init;
    }()
  }, {
    key: "addTransaction",
    value: function () {
      var _addTransaction = (0, _asyncToGenerator2.default)(
      /*#__PURE__*/
      _regenerator.default.mark(function _callee4(date, stockId, quantity) {
        var holdingQuantities, prevQuantity, stock;
        return _regenerator.default.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                holdingQuantities = this.holdingQuantitiesOnDate(this.lastDate());
                prevQuantity = holdingQuantities[stockId] || 0;

                if (!(quantity + prevQuantity < 0)) {
                  _context4.next = 4;
                  break;
                }

                throw new Error("Can't sell more stocks than owned");

              case 4:
                if (this._stocks[stockId]) {
                  _context4.next = 9;
                  break;
                }

                stock = new _Stock.default(stockId);
                _context4.next = 8;
                return Promise.all([stock.fetchHistory(), stock.fetchInfo()]);

              case 8:
                this._stocks[stockId] = stock;

              case 9:
                this._transactions.push({
                  date: (0, _dateFns.format)(date, 'YYYY-MM-DD'),
                  stockId: String(stockId),
                  quantity: Number(quantity)
                });

                this._transactions = _lodash.default.orderBy(this._transactions, 'date', ['asc']);

                this._memoizedStockPricesByDate.cache.clear();

                this.notify();

              case 13:
              case "end":
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function addTransaction(_x3, _x4, _x5) {
        return _addTransaction.apply(this, arguments);
      }

      return addTransaction;
    }()
  }, {
    key: "deleteTransaction",
    value: function deleteTransaction(index) {
      var prevTransactions = (0, _toConsumableArray2.default)(this._transactions);
      var transaction = this._transactions[index];

      _lodash.default.pullAt(this._transactions, [index]);

      var firstTransaction = this._transactions.find(function (t) {
        return t.stockId === transaction.stockId;
      });

      if (firstTransaction) {
        if (firstTransaction.quantity < 0) {
          this._transactions = prevTransactions;
          throw new Error('Would result in negative stocks owned at the beginning');
        }

        var holdingQuantities = this.holdingQuantitiesOnDate(this.lastDate());
        var quantity = holdingQuantities[transaction.stockId];

        if (quantity < 0) {
          this._transactions = prevTransactions;
          throw new Error('Would result in negative stocks owned');
        }
      } else {
        delete this._stocks[transaction.stockId];
      }

      this.notify();
    }
  }, {
    key: "subscribe",
    value: function subscribe(cb) {
      this._listeners.push(cb);
    }
  }, {
    key: "unsubscribe",
    value: function unsubscribe(cb) {
      this._listeners = this._listeners.filter(function (subscriber) {
        return subscriber !== cb;
      });
    }
  }, {
    key: "notify",
    value: function notify(data) {
      this._listeners.forEach(function (subscriber) {
        return subscriber(data);
      });
    }
    /**
     * Public calculation methods -
     */

  }, {
    key: "holdingQuantitiesOnDate",
    value: function holdingQuantitiesOnDate(date) {
      var transactions = this._transactions.filter(function (t) {
        return (0, _date.isSameDayOrBefore)(t.date, date);
      });

      return portfolioUtils.getHoldingQuantities(transactions);
    }
  }, {
    key: "valueOnDate",
    value: function () {
      var _valueOnDate = (0, _asyncToGenerator2.default)(
      /*#__PURE__*/
      _regenerator.default.mark(function _callee5(date, stocksPrice) {
        return _regenerator.default.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                if (stocksPrice) {
                  _context5.next = 4;
                  break;
                }

                _context5.next = 3;
                return this.stocksPriceByDates([date]);

              case 3:
                stocksPrice = _context5.sent;

              case 4:
                return _context5.abrupt("return", portfolioUtils.getValue(date, this.holdingQuantitiesOnDate(date), stocksPrice));

              case 5:
              case "end":
                return _context5.stop();
            }
          }
        }, _callee5, this);
      }));

      function valueOnDate(_x6, _x7) {
        return _valueOnDate.apply(this, arguments);
      }

      return valueOnDate;
    }()
  }, {
    key: "stocksPriceByDate",
    value: function stocksPriceByDate(date) {
      return this._memoizedStockPricesByDate((0, _dateFns.format)(date, 'YYYY-MM-DD'));
    }
  }, {
    key: "stocksPriceByDates",
    value: function () {
      var _stocksPriceByDates = (0, _asyncToGenerator2.default)(
      /*#__PURE__*/
      _regenerator.default.mark(function _callee7(dates) {
        var _this2 = this;

        var stocksPrices;
        return _regenerator.default.wrap(function _callee7$(_context7) {
          while (1) {
            switch (_context7.prev = _context7.next) {
              case 0:
                stocksPrices = {};
                _context7.next = 3;
                return Promise.all(dates.map(
                /*#__PURE__*/
                function () {
                  var _ref3 = (0, _asyncToGenerator2.default)(
                  /*#__PURE__*/
                  _regenerator.default.mark(function _callee6(date) {
                    var formattedDate;
                    return _regenerator.default.wrap(function _callee6$(_context6) {
                      while (1) {
                        switch (_context6.prev = _context6.next) {
                          case 0:
                            formattedDate = (0, _dateFns.format)(date, 'YYYY-MM-DD');
                            _context6.next = 3;
                            return _this2._memoizedStockPricesByDate(date);

                          case 3:
                            stocksPrices[formattedDate] = _context6.sent;

                          case 4:
                          case "end":
                            return _context6.stop();
                        }
                      }
                    }, _callee6, this);
                  }));

                  return function (_x9) {
                    return _ref3.apply(this, arguments);
                  };
                }()));

              case 3:
                return _context7.abrupt("return", stocksPrices);

              case 4:
              case "end":
                return _context7.stop();
            }
          }
        }, _callee7, this);
      }));

      function stocksPriceByDates(_x8) {
        return _stocksPriceByDates.apply(this, arguments);
      }

      return stocksPriceByDates;
    }()
  }, {
    key: "growthOnPeriod",

    /**
     * Public calculation methods - growth
     */
    value: function () {
      var _growthOnPeriod = (0, _asyncToGenerator2.default)(
      /*#__PURE__*/
      _regenerator.default.mark(function _callee8(from, to) {
        var initialDate, _ref4, _ref5, initialValue, endValue;

        return _regenerator.default.wrap(function _callee8$(_context8) {
          while (1) {
            switch (_context8.prev = _context8.next) {
              case 0:
                initialDate = (0, _dateFns.isBefore)(from, this.firstDate()) ? this.firstDate() : from;
                _context8.next = 3;
                return Promise.all([this.valueOnDate(initialDate), this.valueOnDate(to)]);

              case 3:
                _ref4 = _context8.sent;
                _ref5 = (0, _slicedToArray2.default)(_ref4, 2);
                initialValue = _ref5[0];
                endValue = _ref5[1];
                return _context8.abrupt("return", initialValue !== 0 ? (endValue / initialValue - 1) * 100 : undefined);

              case 8:
              case "end":
                return _context8.stop();
            }
          }
        }, _callee8, this);
      }));

      function growthOnPeriod(_x10, _x11) {
        return _growthOnPeriod.apply(this, arguments);
      }

      return growthOnPeriod;
    }()
  }, {
    key: "annualizedGrowthOnPeriod",
    value: function () {
      var _annualizedGrowthOnPeriod = (0, _asyncToGenerator2.default)(
      /*#__PURE__*/
      _regenerator.default.mark(function _callee9(from, to) {
        var profit, days;
        return _regenerator.default.wrap(function _callee9$(_context9) {
          while (1) {
            switch (_context9.prev = _context9.next) {
              case 0:
                _context9.next = 2;
                return this.growthOnPeriod(from, to);

              case 2:
                profit = _context9.sent;
                days = (0, _dateFns.differenceInDays)(to, from);
                return _context9.abrupt("return", (Math.pow(1 + profit / 100, 365 / days) - 1) * 100);

              case 5:
              case "end":
                return _context9.stop();
            }
          }
        }, _callee9, this);
      }));

      function annualizedGrowthOnPeriod(_x12, _x13) {
        return _annualizedGrowthOnPeriod.apply(this, arguments);
      }

      return annualizedGrowthOnPeriod;
    }()
  }, {
    key: "growthToDate",
    value: function growthToDate(date) {
      var firstDate = this.firstDate(date);
      var from = firstDate || date;

      if ((0, _dateFns.isBefore)(date, from)) {
        return 0;
      }

      return this.growthOnPeriod(from, date);
    }
  }, {
    key: "annualizedGrowthToDate",
    value: function () {
      var _annualizedGrowthToDate = (0, _asyncToGenerator2.default)(
      /*#__PURE__*/
      _regenerator.default.mark(function _callee10(date) {
        var from, profit, days;
        return _regenerator.default.wrap(function _callee10$(_context10) {
          while (1) {
            switch (_context10.prev = _context10.next) {
              case 0:
                from = this.firstDate(date) || date;
                _context10.next = 3;
                return this.growthToDate(date);

              case 3:
                profit = _context10.sent;
                days = (0, _dateFns.differenceInDays)(date, from);
                return _context10.abrupt("return", (Math.pow(1 + profit / 100, 365 / days) - 1) * 100);

              case 6:
              case "end":
                return _context10.stop();
            }
          }
        }, _callee10, this);
      }));

      function annualizedGrowthToDate(_x14) {
        return _annualizedGrowthToDate.apply(this, arguments);
      }

      return annualizedGrowthToDate;
    }()
  }, {
    key: "profitOnPeriod",

    /**
     * Public calculation methods - profit
     */
    value: function () {
      var _profitOnPeriod = (0, _asyncToGenerator2.default)(
      /*#__PURE__*/
      _regenerator.default.mark(function _callee11(from, to) {
        var transactionsInRange, transactionDates, stockPrices, returnRate;
        return _regenerator.default.wrap(function _callee11$(_context11) {
          while (1) {
            switch (_context11.prev = _context11.next) {
              case 0:
                transactionsInRange = [];

                if (!(0, _date.isSameDayOrAfter)(from, to)) {
                  transactionsInRange = this._transactions.filter(function (t) {
                    return from ? (0, _dateFns.isWithinRange)(t.date, from, (0, _dateFns.subDays)(to, 1)) : (0, _dateFns.isBefore)(t.date, to);
                  });
                }

                transactionDates = transactionsInRange.map(function (t) {
                  return t.date;
                });

                if (from) {
                  transactionDates.push(from);
                }

                transactionDates.push(to);
                _context11.next = 7;
                return this.stocksPriceByDates(_lodash.default.uniq(transactionDates));

              case 7:
                stockPrices = _context11.sent;
                returnRate = portfolioUtils.getTimeWeightedReturnRate(transactionsInRange, stockPrices, {
                  date: from,
                  previousHoldingQuantities: from ? this.holdingQuantitiesOnDate((0, _dateFns.subDays)(from, 1)) : undefined
                }, {
                  date: to
                });
                return _context11.abrupt("return", returnRate * 100);

              case 10:
              case "end":
                return _context11.stop();
            }
          }
        }, _callee11, this);
      }));

      function profitOnPeriod(_x15, _x16) {
        return _profitOnPeriod.apply(this, arguments);
      }

      return profitOnPeriod;
    }()
  }, {
    key: "profitToDate",
    value: function () {
      var _profitToDate = (0, _asyncToGenerator2.default)(
      /*#__PURE__*/
      _regenerator.default.mark(function _callee12(date) {
        var firstDate, from, profit;
        return _regenerator.default.wrap(function _callee12$(_context12) {
          while (1) {
            switch (_context12.prev = _context12.next) {
              case 0:
                firstDate = this.firstDate(date);
                from = firstDate || date;

                if (!(0, _dateFns.isBefore)(date, from)) {
                  _context12.next = 4;
                  break;
                }

                return _context12.abrupt("return", 0);

              case 4:
                _context12.next = 6;
                return this.profitOnPeriod(from, date);

              case 6:
                profit = _context12.sent;
                return _context12.abrupt("return", profit);

              case 8:
              case "end":
                return _context12.stop();
            }
          }
        }, _callee12, this);
      }));

      function profitToDate(_x17) {
        return _profitToDate.apply(this, arguments);
      }

      return profitToDate;
    }()
  }, {
    key: "annualizedProfitOnPeriod",
    value: function () {
      var _annualizedProfitOnPeriod = (0, _asyncToGenerator2.default)(
      /*#__PURE__*/
      _regenerator.default.mark(function _callee13(from, to) {
        var profit, days;
        return _regenerator.default.wrap(function _callee13$(_context13) {
          while (1) {
            switch (_context13.prev = _context13.next) {
              case 0:
                _context13.next = 2;
                return this.profitOnPeriod(from, to);

              case 2:
                profit = _context13.sent;
                days = (0, _dateFns.differenceInDays)(to, from);
                return _context13.abrupt("return", (Math.pow(1 + profit / 100, 365 / days) - 1) * 100);

              case 5:
              case "end":
                return _context13.stop();
            }
          }
        }, _callee13, this);
      }));

      function annualizedProfitOnPeriod(_x18, _x19) {
        return _annualizedProfitOnPeriod.apply(this, arguments);
      }

      return annualizedProfitOnPeriod;
    }()
  }, {
    key: "annualizedProfitToDate",
    value: function () {
      var _annualizedProfitToDate = (0, _asyncToGenerator2.default)(
      /*#__PURE__*/
      _regenerator.default.mark(function _callee14(date) {
        var firstDate, from, profit, days;
        return _regenerator.default.wrap(function _callee14$(_context14) {
          while (1) {
            switch (_context14.prev = _context14.next) {
              case 0:
                firstDate = this.firstDate(date);
                from = firstDate || date;
                _context14.next = 4;
                return this.profitToDate(date);

              case 4:
                profit = _context14.sent;
                days = (0, _dateFns.differenceInDays)(date, from);
                return _context14.abrupt("return", (Math.pow(1 + profit / 100, 365 / days) - 1) * 100);

              case 7:
              case "end":
                return _context14.stop();
            }
          }
        }, _callee14, this);
      }));

      function annualizedProfitToDate(_x20) {
        return _annualizedProfitToDate.apply(this, arguments);
      }

      return annualizedProfitToDate;
    }()
  }]);
  return Portfolio;
}();

var _default = Portfolio;
exports.default = _default;