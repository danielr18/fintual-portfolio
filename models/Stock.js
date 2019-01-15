import _ from 'lodash';
import isSameDay from 'date-fns/is_same_day';
import isWithinRange from 'date-fns/is_within_range';
import isBefore from 'date-fns/is_before';
import { isSameDayOrBefore } from '../utils/date';
import StockService from '../services/stock.service';

class Stock {
  constructor(id, { name, symbol } = {}) {
    this.id = id;
    this.name = name;
    this.symbol = symbol;
    this._history = { dates: [] };
  }

  /**
   * "Private" methods
   */

  async _priceByDate(date) {
    if (isWithinRange(date, this._history.from, this._history.to)) {
      // Get price from cached history
      const histObj = this._history.dates.find(day => isSameDay(day.date, date));
      if (histObj) {
        return histObj.price;
      }
    } else {
      const dayHist = await StockService.getHistory(this.id, { date });
      if (dayHist[0]) {
        return dayHist[0].attributes.price;
      }
    }
  }

  async _previousPrice(date) {
    if (isWithinRange(date, this._history.from, this._history.to)) {
      // Get hist range from cached history
      const filteredHistDates = this._history.dates.filter(day => isBefore(day.date, date));
      const sortedHistDates = _.orderBy(filteredHistDates, 'date', ['desc']);
      if (sortedHistDates[0]) {
        return sortedHistDates[0].price;
      }
    } else {
      const hist = await StockService.getHistory(this.id, { to_date: date });
      const sortedHist = _.orderBy(hist, histDay => histDay.attributes.date, ['desc']);
      if (sortedHist[0]) {
        return sortedHist[0].attributes.price;
      }
    }
  }

  async _firstPrice(from = new Date(0), to = new Date()) {
    const isHistoryCached =
      isSameDayOrBefore(this._history.from, from) && isSameDayOrBefore(to, this._history.to);

    if (isHistoryCached) {
      // Get hist range from cached history
      const sortedHistDates = _.orderBy(this._history.dates, 'date', ['asc']);
      if (sortedHistDates[0]) {
        return sortedHistDates[0].price;
      }
    } else {
      const hist = await StockService.getHistory(this.id, {
        from_date: from,
        to_date: to
      });
      const sortedHist = _.orderBy(hist, histDay => histDay.attributes.date, ['asc']);
      if (sortedHist[0]) {
        return sortedHist[0].attributes.price;
      }
    }
  }

  /**
   * Public getters
   */

  async getHistory(from, to) {
    return this._history.dates.filter(day => isWithinRange(day.date, from, to));
  }

  /**
   * Public methods
   */

  async fetchInfo() {
    const info = await StockService.getInfo(this.id);
    const { name, symbol } = info.attributes;
    this.name = name;
    this.symbol = symbol;
  }

  async fetchHistory(from, to) {
    const history = await StockService.getHistory(this.id, {
      from_date: from,
      to_date: to
    });

    const dates = history.map(histDay => {
      const { date, price } = histDay.attributes;
      return { date, price };
    });

    this._history = {
      from: from || new Date(0),
      to: to || new Date(),
      dates: dates
    };
  }

  async getPrice(date, { allowFirstPrice = false, firstPriceMaxDate = new Date() } = {}) {
    const price = await this._priceByDate(date);
    if (price) return price;

    // Some stocks might not have a price on weekends or no longer exist, get price from latest date
    const previousPrice = await this._previousPrice(date);
    if (previousPrice) return previousPrice;

    // Get first price if there's no price before date
    const firstPrice = allowFirstPrice && (await this._firstPrice(undefined, firstPriceMaxDate));
    if (firstPrice) return firstPrice;
  }
}

export default Stock;
