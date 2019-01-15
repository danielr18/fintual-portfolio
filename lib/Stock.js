"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _lodash = _interopRequireDefault(require("lodash"));

var _is_same_day = _interopRequireDefault(require("date-fns/is_same_day"));

var _is_within_range = _interopRequireDefault(require("date-fns/is_within_range"));

var _is_before = _interopRequireDefault(require("date-fns/is_before"));

var _date = require("./utils/date");

var _stock = _interopRequireDefault(require("./services/stock.service"));

var Stock =
/*#__PURE__*/
function () {
  function Stock(id) {
    var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
        name = _ref.name,
        symbol = _ref.symbol;

    (0, _classCallCheck2.default)(this, Stock);
    this.id = id;
    this.name = name;
    this.symbol = symbol;
    this._history = {
      dates: []
    };
  }
  /**
   * "Private" methods
   */


  (0, _createClass2.default)(Stock, [{
    key: "_priceByDate",
    value: function () {
      var _priceByDate2 = (0, _asyncToGenerator2.default)(
      /*#__PURE__*/
      _regenerator.default.mark(function _callee(date) {
        var histObj, dayHist;
        return _regenerator.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                if (!(0, _is_within_range.default)(date, this._history.from, this._history.to)) {
                  _context.next = 6;
                  break;
                }

                // Get price from cached history
                histObj = this._history.dates.find(function (day) {
                  return (0, _is_same_day.default)(day.date, date);
                });

                if (!histObj) {
                  _context.next = 4;
                  break;
                }

                return _context.abrupt("return", histObj.price);

              case 4:
                _context.next = 11;
                break;

              case 6:
                _context.next = 8;
                return _stock.default.getHistory(this.id, {
                  date: date
                });

              case 8:
                dayHist = _context.sent;

                if (!dayHist[0]) {
                  _context.next = 11;
                  break;
                }

                return _context.abrupt("return", dayHist[0].attributes.price);

              case 11:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function _priceByDate(_x) {
        return _priceByDate2.apply(this, arguments);
      }

      return _priceByDate;
    }()
  }, {
    key: "_previousPrice",
    value: function () {
      var _previousPrice2 = (0, _asyncToGenerator2.default)(
      /*#__PURE__*/
      _regenerator.default.mark(function _callee2(date) {
        var filteredHistDates, sortedHistDates, hist, sortedHist;
        return _regenerator.default.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                if (!(0, _is_within_range.default)(date, this._history.from, this._history.to)) {
                  _context2.next = 7;
                  break;
                }

                // Get hist range from cached history
                filteredHistDates = this._history.dates.filter(function (day) {
                  return (0, _is_before.default)(day.date, date);
                });
                sortedHistDates = _lodash.default.orderBy(filteredHistDates, 'date', ['desc']);

                if (!sortedHistDates[0]) {
                  _context2.next = 5;
                  break;
                }

                return _context2.abrupt("return", sortedHistDates[0].price);

              case 5:
                _context2.next = 13;
                break;

              case 7:
                _context2.next = 9;
                return _stock.default.getHistory(this.id, {
                  to_date: date
                });

              case 9:
                hist = _context2.sent;
                sortedHist = _lodash.default.orderBy(hist, function (histDay) {
                  return histDay.attributes.date;
                }, ['desc']);

                if (!sortedHist[0]) {
                  _context2.next = 13;
                  break;
                }

                return _context2.abrupt("return", sortedHist[0].attributes.price);

              case 13:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function _previousPrice(_x2) {
        return _previousPrice2.apply(this, arguments);
      }

      return _previousPrice;
    }()
  }, {
    key: "_firstPrice",
    value: function () {
      var _firstPrice2 = (0, _asyncToGenerator2.default)(
      /*#__PURE__*/
      _regenerator.default.mark(function _callee3() {
        var from,
            to,
            isHistoryCached,
            sortedHistDates,
            hist,
            sortedHist,
            _args3 = arguments;
        return _regenerator.default.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                from = _args3.length > 0 && _args3[0] !== undefined ? _args3[0] : new Date(0);
                to = _args3.length > 1 && _args3[1] !== undefined ? _args3[1] : new Date();
                isHistoryCached = (0, _date.isSameDayOrBefore)(this._history.from, from) && (0, _date.isSameDayOrBefore)(to, this._history.to);

                if (!isHistoryCached) {
                  _context3.next = 9;
                  break;
                }

                // Get hist range from cached history
                sortedHistDates = _lodash.default.orderBy(this._history.dates, 'date', ['asc']);

                if (!sortedHistDates[0]) {
                  _context3.next = 7;
                  break;
                }

                return _context3.abrupt("return", sortedHistDates[0].price);

              case 7:
                _context3.next = 15;
                break;

              case 9:
                _context3.next = 11;
                return _stock.default.getHistory(this.id, {
                  from_date: from,
                  to_date: to
                });

              case 11:
                hist = _context3.sent;
                sortedHist = _lodash.default.orderBy(hist, function (histDay) {
                  return histDay.attributes.date;
                }, ['asc']);

                if (!sortedHist[0]) {
                  _context3.next = 15;
                  break;
                }

                return _context3.abrupt("return", sortedHist[0].attributes.price);

              case 15:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function _firstPrice() {
        return _firstPrice2.apply(this, arguments);
      }

      return _firstPrice;
    }()
    /**
     * Public getters
     */

  }, {
    key: "getHistory",
    value: function () {
      var _getHistory = (0, _asyncToGenerator2.default)(
      /*#__PURE__*/
      _regenerator.default.mark(function _callee4(from, to) {
        return _regenerator.default.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                return _context4.abrupt("return", this._history.dates.filter(function (day) {
                  return (0, _is_within_range.default)(day.date, from, to);
                }));

              case 1:
              case "end":
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function getHistory(_x3, _x4) {
        return _getHistory.apply(this, arguments);
      }

      return getHistory;
    }()
    /**
     * Public methods
     */

  }, {
    key: "fetchInfo",
    value: function () {
      var _fetchInfo = (0, _asyncToGenerator2.default)(
      /*#__PURE__*/
      _regenerator.default.mark(function _callee5() {
        var info, _info$attributes, name, symbol;

        return _regenerator.default.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                _context5.next = 2;
                return _stock.default.getInfo(this.id);

              case 2:
                info = _context5.sent;
                _info$attributes = info.attributes, name = _info$attributes.name, symbol = _info$attributes.symbol;
                this.name = name;
                this.symbol = symbol;

              case 6:
              case "end":
                return _context5.stop();
            }
          }
        }, _callee5, this);
      }));

      function fetchInfo() {
        return _fetchInfo.apply(this, arguments);
      }

      return fetchInfo;
    }()
  }, {
    key: "fetchHistory",
    value: function () {
      var _fetchHistory = (0, _asyncToGenerator2.default)(
      /*#__PURE__*/
      _regenerator.default.mark(function _callee6(from, to) {
        var history, dates;
        return _regenerator.default.wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                _context6.next = 2;
                return _stock.default.getHistory(this.id, {
                  from_date: from,
                  to_date: to
                });

              case 2:
                history = _context6.sent;
                dates = history.map(function (histDay) {
                  var _histDay$attributes = histDay.attributes,
                      date = _histDay$attributes.date,
                      price = _histDay$attributes.price;
                  return {
                    date: date,
                    price: price
                  };
                });
                this._history = {
                  from: from || new Date(0),
                  to: to || new Date(),
                  dates: dates
                };

              case 5:
              case "end":
                return _context6.stop();
            }
          }
        }, _callee6, this);
      }));

      function fetchHistory(_x5, _x6) {
        return _fetchHistory.apply(this, arguments);
      }

      return fetchHistory;
    }()
  }, {
    key: "getPrice",
    value: function () {
      var _getPrice = (0, _asyncToGenerator2.default)(
      /*#__PURE__*/
      _regenerator.default.mark(function _callee7(date) {
        var _ref2,
            _ref2$allowFirstPrice,
            allowFirstPrice,
            _ref2$firstPriceMaxDa,
            firstPriceMaxDate,
            price,
            previousPrice,
            firstPrice,
            _args7 = arguments;

        return _regenerator.default.wrap(function _callee7$(_context7) {
          while (1) {
            switch (_context7.prev = _context7.next) {
              case 0:
                _ref2 = _args7.length > 1 && _args7[1] !== undefined ? _args7[1] : {}, _ref2$allowFirstPrice = _ref2.allowFirstPrice, allowFirstPrice = _ref2$allowFirstPrice === void 0 ? false : _ref2$allowFirstPrice, _ref2$firstPriceMaxDa = _ref2.firstPriceMaxDate, firstPriceMaxDate = _ref2$firstPriceMaxDa === void 0 ? new Date() : _ref2$firstPriceMaxDa;
                _context7.next = 3;
                return this._priceByDate(date);

              case 3:
                price = _context7.sent;

                if (!price) {
                  _context7.next = 6;
                  break;
                }

                return _context7.abrupt("return", price);

              case 6:
                _context7.next = 8;
                return this._previousPrice(date);

              case 8:
                previousPrice = _context7.sent;

                if (!previousPrice) {
                  _context7.next = 11;
                  break;
                }

                return _context7.abrupt("return", previousPrice);

              case 11:
                _context7.t0 = allowFirstPrice;

                if (!_context7.t0) {
                  _context7.next = 16;
                  break;
                }

                _context7.next = 15;
                return this._firstPrice(undefined, firstPriceMaxDate);

              case 15:
                _context7.t0 = _context7.sent;

              case 16:
                firstPrice = _context7.t0;

                if (!firstPrice) {
                  _context7.next = 19;
                  break;
                }

                return _context7.abrupt("return", firstPrice);

              case 19:
              case "end":
                return _context7.stop();
            }
          }
        }, _callee7, this);
      }));

      function getPrice(_x7) {
        return _getPrice.apply(this, arguments);
      }

      return getPrice;
    }()
  }]);
  return Stock;
}();

var _default = Stock;
exports.default = _default;