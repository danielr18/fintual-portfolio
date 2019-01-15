import axios from 'axios';
import { API_URL } from '../utils/constants';

const baseURL = `${API_URL}/conceptual_assets`;
const axiosInstance = axios.create({ baseURL });

export default {
  _cache: {
    stocks: {}
  },
  getList: function() {
    if (this._cache.list) {
      return Promise.resolve(this._cache.list);
    }
    return axiosInstance.get('/').then(res => {
      // Filter out funds in other currencies to avoid conversions
      const validFunds = res.data.data.filter(fund => fund.attributes.currency === 'CLP');
      this._cache.list = validFunds;
      return validFunds;
    });
  },
  getStocks: function(fundId) {
    if (this._cache.stocks[fundId]) {
      return Promise.resolve(this._cache.stocks[fundId]);
    }
    return axiosInstance.get(`/${fundId}/real_assets`).then(res => {
      const stocks = res.data.data;
      this._cache.stocks[fundId] = stocks;
      return stocks;
    });
  }
};
