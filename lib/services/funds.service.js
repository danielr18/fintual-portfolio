"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _axios = _interopRequireDefault(require("axios"));

var _constants = require("../utils/constants");

var baseURL = "".concat(_constants.API_URL, "/conceptual_assets");

var axiosInstance = _axios.default.create({
  baseURL: baseURL
});

var _default = {
  _cache: {
    stocks: {}
  },
  getList: function getList() {
    var _this = this;

    if (this._cache.list) {
      return Promise.resolve(this._cache.list);
    }

    return axiosInstance.get('/').then(function (res) {
      // Filter out funds in other currencies to avoid conversions
      var validFunds = res.data.data.filter(function (fund) {
        return fund.attributes.currency === 'CLP';
      });
      _this._cache.list = validFunds;
      return validFunds;
    });
  },
  getStocks: function getStocks(fundId) {
    var _this2 = this;

    if (this._cache.stocks[fundId]) {
      return Promise.resolve(this._cache.stocks[fundId]);
    }

    return axiosInstance.get("/".concat(fundId, "/real_assets")).then(function (res) {
      var stocks = res.data.data;
      _this2._cache.stocks[fundId] = stocks;
      return stocks;
    });
  }
};
exports.default = _default;