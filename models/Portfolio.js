import { TaskQueue } from 'cwait';
import _ from 'lodash';
import { differenceInDays, isWithinRange, subDays, format as dateFormat, isBefore } from 'date-fns';
import Stock from './Stock';
import { isSameDayOrAfter, isSameDayOrBefore } from '../utils/date';
import * as portfolioUtils from '../utils/portfolio';

class Portfolio {
  constructor(transactions = []) {
    this._isInited = false;
    this.listeners = [];
    this.transactions = _.orderBy(transactions, 'date', ['asc']);
    this.stocks = {};
    for (const transaction of transactions) {
      transaction.date = dateFormat(transaction.date, 'YYYY-MM-DD');
      const { stockId } = transaction;
      if (!this.stocks[stockId]) {
        this.stocks[stockId] = new Stock(stockId);
      }
    }
    this._memoizedStockPricesByDate = _.memoize(this._stocksPriceByDate);
    this.stocksPriceByDate = date => {
      return this._memoizedStockPricesByDate(dateFormat(date, 'YYYY-MM-DD'));
    };
  }

  isInited = () => this._isInited;

  firstDate = () => {
    if (this.transactions.length > 0) {
      return this.transactions[0].date;
    }
  };

  lastDate = () => {
    if (this.transactions.length > 0) {
      return this.transactions[this.transactions.length - 1].date;
    }
  };

  subscribe(cb) {
    this.listeners.push(cb);
  }

  unsubscribe(cb) {
    this.listeners = this.listeners.filter(subscriber => subscriber !== cb);
  }

  notify(data) {
    this.listeners.forEach(subscriber => subscriber(data));
  }

  hasTransactions = () => {
    return this.transactions.length > 0;
  };

  addTransaction = async (date, stockId, quantity) => {
    const stocksToDate = this.stocksToDate(this.lastDate());
    const prevQuantity = stocksToDate[stockId] || 0;
    if (quantity + prevQuantity < 0) {
      throw new Error("Can't sell more stocks than owned");
    }
    if (!this.stocks[stockId]) {
      const stock = new Stock(stockId);
      await Promise.all([stock.fetchHistory(), stock.fetchInfo()]);
      this.stocks[stockId] = stock;
    }
    this.transactions.push({
      date: dateFormat(date, 'YYYY-MM-DD'),
      stockId: String(stockId),
      quantity: Number(quantity)
    });
    this.transactions = _.orderBy(this.transactions, 'date', ['asc']);
    this._memoizedStockPricesByDate.cache.clear();
    this.notify();
  };

  deleteTransaction = index => {
    const prevTransactions = [...this.transactions];
    const transaction = this.transactions[index];
    _.pullAt(this.transactions, [index]);
    const firstTransaction = this.transactions.find(t => t.stockId === transaction.stockId);
    if (firstTransaction) {
      if (firstTransaction.quantity < 0) {
        this.transactions = prevTransactions;
        throw new Error('Would result in negative stocks owned at the beginning');
      }
      const stocksToDate = this.stocksToDate(this.lastDate());
      const quantity = stocksToDate[transaction.stockId];
      if (quantity < 0) {
        this.transactions = prevTransactions;
        throw new Error('Would result in negative stocks owned');
      }
    } else {
      delete this.stocks[transaction.stockId];
    }
    this.notify();
  };

  init = async () => {
    const queue = new TaskQueue(Promise, 20); // 20 concurrent requests
    await Promise.all([
      ...Object.values(this.stocks).map(queue.wrap(stock => stock.fetchInfo())),
      ...Object.values(this.stocks).map(queue.wrap(stock => stock.fetchHistory()))
    ]);
    this._isInited = true;
    this.notify();
  };

  valueOnDate = async (date, stocksPrice) => {
    if (!stocksPrice) {
      stocksPrice = await this.stocksPriceByDates([date]);
    }
    return portfolioUtils.getStocksValue(date, this.stocksToDate(date), stocksPrice);
  };

  growthOnPeriod = async (from, to) => {
    const initialDate = isBefore(from, this.firstDate()) ? this.firstDate() : from;
    const [initialValue, endValue] = await Promise.all([
      this.valueOnDate(initialDate),
      this.valueOnDate(to)
    ]);
    return initialValue !== 0 ? (endValue / initialValue - 1) * 100 : undefined;
  };

  stocksToDate = date => {
    const transactions = this.transactions.filter(t => isSameDayOrBefore(t.date, date));
    return portfolioUtils.getStockQuantities(transactions);
  };

  _stocksPriceByDate = async date => {
    const stocksPrices = {};
    await Promise.all(
      Object.keys(this.stocks).map(async stockId => {
        const price = await this.stocks[stockId].price(date);
        stocksPrices[stockId] = price || 0;
      })
    );
    return stocksPrices;
  };

  stocksPriceByDates = async dates => {
    const stocksPrices = {};
    await Promise.all(
      dates.map(async date => {
        const formattedDate = dateFormat(date, 'YYYY-MM-DD');
        stocksPrices[formattedDate] = await this.stocksPriceByDate(date);
      })
    );
    return stocksPrices;
  };

  profitOnPeriod = async (from, to) => {
    let transactionsInRange = [];
    if (!isSameDayOrAfter(from, to)) {
      transactionsInRange = this.transactions.filter(
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
        previousStockQuantities: from ? this.stocksToDate(subDays(from, 1)) : undefined
      },
      {
        date: to
      }
    );
    return returnRate * 100;
  };

  profitToDate = async date => {
    const firstDate = this.firstDate(date);
    const from = firstDate || date;
    if (isBefore(date, from)) {
      return 0;
    }
    const profit = this.profitOnPeriod(from, date);
    return profit;
  };

  annualizedGrowthOnPeriod = async (from, to) => {
    const profit = await this.growthOnPeriod(from, to);
    const days = differenceInDays(to, from);
    return ((1 + profit / 100) ** (365 / days) - 1) * 100;
  };

  annualizedProfitOnPeriod = async (from, to) => {
    const profit = await this.profitOnPeriod(from, to);
    const days = differenceInDays(to, from);
    return ((1 + profit / 100) ** (365 / days) - 1) * 100;
  };

  annualizedProfitToDate = async date => {
    const firstDate = this.firstDate(date);
    const from = firstDate || date;
    const profit = await this.profitToDate(date);
    const days = differenceInDays(date, from);
    return ((1 + profit / 100) ** (365 / days) - 1) * 100;
  };
}

export default Portfolio;
