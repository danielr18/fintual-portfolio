import { TaskQueue } from 'cwait';
import _ from 'lodash';
import { differenceInDays, isWithinRange, subDays, format as dateFormat, isBefore } from 'date-fns';
import Stock from './Stock';
import { isSameDayOrAfter, isSameDayOrBefore } from './utils/date';
import * as portfolioUtils from './utils/portfolio';

class Portfolio {
  constructor(transactions = []) {
    /**
     * "Private" attributes
     */

    this._isInited = false;
    this._listeners = [];
    this._transactions = _.orderBy(transactions, 'date', ['asc']);
    this._stocks = {};

    for (const transaction of transactions) {
      transaction.date = dateFormat(transaction.date, 'YYYY-MM-DD');
      const { stockId } = transaction;
      if (!this._stocks[stockId]) {
        this._stocks[stockId] = new Stock(stockId);
      }
    }
  }

  /**
   * "Private" methods
   */

  _memoizedStockPricesByDate = _.memoize(async date => {
    const stocksPrices = {};
    await Promise.all(
      Object.keys(this._stocks).map(async stockId => {
        const price = await this._stocks[stockId].getPrice(date);
        stocksPrices[stockId] = price || 0;
      })
    );
    return stocksPrices;
  });

  /**
   * Public getters
   */

  isInited() {
    return this._isInited;
  }

  getTransactions() {
    return this._transactions.slice();
  }

  getStocks() {
    return _.clone(this._stocks);
  }

  firstDate = () => {
    if (this._transactions.length > 0) {
      return this._transactions[0].date;
    }
  };

  lastDate() {
    if (this._transactions.length > 0) {
      return this._transactions[this._transactions.length - 1].date;
    }
  }

  hasTransactions() {
    return this._transactions.length > 0;
  }

  /**
   * Public methods
   */

  async init() {
    const queue = new TaskQueue(Promise, 20); // 20 concurrent requests
    await Promise.all([
      ...Object.values(this._stocks).map(queue.wrap(stock => stock.fetchInfo())),
      ...Object.values(this._stocks).map(queue.wrap(stock => stock.fetchHistory()))
    ]);
    this._isInited = true;
    this.notify();
  }

  async addTransaction(date, stockId, quantity) {
    const holdingQuantities = this.holdingQuantitiesOnDate(this.lastDate());
    const prevQuantity = holdingQuantities[stockId] || 0;
    if (quantity + prevQuantity < 0) {
      throw new Error("Can't sell more stocks than owned");
    }
    if (!this._stocks[stockId]) {
      const stock = new Stock(stockId);
      await Promise.all([stock.fetchHistory(), stock.fetchInfo()]);
      this._stocks[stockId] = stock;
    }
    this._transactions.push({
      date: dateFormat(date, 'YYYY-MM-DD'),
      stockId: String(stockId),
      quantity: Number(quantity)
    });
    this._transactions = _.orderBy(this._transactions, 'date', ['asc']);
    this._memoizedStockPricesByDate.cache.clear();
    this.notify();
  }

  deleteTransaction(index) {
    const prevTransactions = [...this._transactions];
    const transaction = this._transactions[index];
    _.pullAt(this._transactions, [index]);
    const firstTransaction = this._transactions.find(t => t.stockId === transaction.stockId);
    if (firstTransaction) {
      if (firstTransaction.quantity < 0) {
        this._transactions = prevTransactions;
        throw new Error('Would result in negative stocks owned at the beginning');
      }
      const holdingQuantities = this.holdingQuantitiesOnDate(this.lastDate());
      const quantity = holdingQuantities[transaction.stockId];
      if (quantity < 0) {
        this._transactions = prevTransactions;
        throw new Error('Would result in negative stocks owned');
      }
    } else {
      delete this._stocks[transaction.stockId];
    }
    this.notify();
  }

  subscribe(cb) {
    this._listeners.push(cb);
  }

  unsubscribe(cb) {
    this._listeners = this._listeners.filter(subscriber => subscriber !== cb);
  }

  notify(data) {
    this._listeners.forEach(subscriber => subscriber(data));
  }

  /**
   * Public calculation methods -
   */

  holdingQuantitiesOnDate(date) {
    const transactions = this._transactions.filter(t => isSameDayOrBefore(t.date, date));
    return portfolioUtils.getHoldingQuantities(transactions);
  }

  async valueOnDate(date, stocksPrice) {
    if (!stocksPrice) {
      stocksPrice = await this.stocksPriceByDates([date]);
    }
    return portfolioUtils.getValue(date, this.holdingQuantitiesOnDate(date), stocksPrice);
  };

  stocksPriceByDate(date) {
    return this._memoizedStockPricesByDate(dateFormat(date, 'YYYY-MM-DD'));
  };

  async stocksPriceByDates (dates) {
    const stocksPrices = {};
    await Promise.all(
      dates.map(async date => {
        const formattedDate = dateFormat(date, 'YYYY-MM-DD');
        stocksPrices[formattedDate] = await this._memoizedStockPricesByDate(date);
      })
    );
    return stocksPrices;
  };

  /**
   * Public calculation methods - growth
   */

  async growthOnPeriod (from, to) {
    const initialDate = isBefore(from, this.firstDate()) ? this.firstDate() : from;
    const [initialValue, endValue] = await Promise.all([
      this.valueOnDate(initialDate),
      this.valueOnDate(to)
    ]);
    return initialValue !== 0 ? (endValue / initialValue - 1) * 100 : undefined;
  };

  async annualizedGrowthOnPeriod (from, to) {
    const profit = await this.growthOnPeriod(from, to);
    const days = differenceInDays(to, from);
    return ((1 + profit / 100) ** (365 / days) - 1) * 100;
  };

  growthToDate (date) {
    const firstDate = this.firstDate(date);
    const from = firstDate || date;
    if (isBefore(date, from)) {
      return 0;
    }
    return this.growthOnPeriod(from, date);
  };

  async annualizedGrowthToDate (date) {
    const from = this.firstDate(date) || date;
    const profit = await this.growthToDate(date);
    const days = differenceInDays(date, from);
    return ((1 + profit / 100) ** (365 / days) - 1) * 100;
  };

  /**
   * Public calculation methods - profit
   */

  async profitOnPeriod (from, to) {
    let transactionsInRange = [];
    if (!isSameDayOrAfter(from, to)) {
      transactionsInRange = this._transactions.filter(
        t => (from ? isWithinRange(t.date, from, subDays(to, 1)) : isBefore(t.date, to))
      );
    }
    const transactionDates = transactionsInRange.map(t => t.date);
    if (from) {
      transactionDates.push(from);
    }
    transactionDates.push(to);
    const stockPrices = await this.stocksPriceByDates(_.uniq(transactionDates));
    const returnRate = portfolioUtils.getTimeWeightedReturnRate(
      transactionsInRange,
      stockPrices,
      {
        date: from,
        previousHoldingQuantities: from ? this.holdingQuantitiesOnDate(subDays(from, 1)) : undefined
      },
      {
        date: to
      }
    );
    return returnRate * 100;
  };

  async profitToDate (date) {
    const firstDate = this.firstDate(date);
    const from = firstDate || date;
    if (isBefore(date, from)) {
      return 0;
    }
    const profit = await this.profitOnPeriod(from, date);
    return profit;
  };

  async annualizedProfitOnPeriod (from, to) {
    const profit = await this.profitOnPeriod(from, to);
    const days = differenceInDays(to, from);
    return ((1 + profit / 100) ** (365 / days) - 1) * 100;
  };

  async annualizedProfitToDate (date) {
    const firstDate = this.firstDate(date);
    const from = firstDate || date;
    const profit = await this.profitToDate(date);
    const days = differenceInDays(date, from);
    return ((1 + profit / 100) ** (365 / days) - 1) * 100;
  };
}

export default Portfolio;
