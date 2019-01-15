"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _axios = _interopRequireDefault(require("axios"));

var _constants = require("../utils/constants");

var baseURL = "".concat(_constants.API_URL, "/real_assets");

var axiosInstance = _axios.default.create({
  baseURL: baseURL
});

var _default = {
  getInfo: function getInfo(stockId) {
    return axiosInstance.get("/".concat(stockId)).then(function (res) {
      return res.data.data;
    });
  },
  getHistory: function getHistory(stockId, params) {
    return axiosInstance.get("/".concat(stockId, "/days"), {
      params: params
    }).then(function (res) {
      return res.data.data;
    });
  }
};
exports.default = _default;