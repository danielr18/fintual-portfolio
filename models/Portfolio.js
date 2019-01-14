import { TaskQueue } from 'cwait';
import _ from 'lodash';
import {
  differenceInDays,
  isWithinRange,
  eachDay,
  subDays,
  format as dateFormat,
  isBefore,
  isAfter,
  addDays
} from 'date-fns';
import Stock from './Stock';
import { isSameDayOrBefore } from '../utils/date';
import * as portfolioUtils from '../utils/portfolio';

class Portfolio {
  constructor(transactions = []) {
    this.transactions = _.orderBy(transactions, 'date', ['asc']);
    this.stocks = {};
    for (const transaction of transactions) {
      const { stockId } = transaction;
      if (!this.stocks[stockId]) {
        this.stocks[stockId] = new Stock(stockId);
      }
    }
  }

  _fromDate = date => {
    let from = date;
    if (this.transactions.length > 0) {
      from = this.transactions[0].date;
    }
    return from;
  };

  addTransaction(date, stockId, quantity) {
    const nextStockTransaction = this.transactions.find();
  }

  init = async () => {
    const queue = new TaskQueue(Promise, 20); // 20 concurrent requests
    await Promise.all([
      ...Object.values(this.stocks).map(queue.wrap(stock => stock.fetchInfo())),
      ...Object.values(this.stocks).map(queue.wrap(stock => stock.fetchHistory()))
    ]);
  };

  profitHistory = async (from, to) => {
    const history = await Promise.all(
      eachDay(addDays(from, 1), to).map(async date => {
        const formattedDate = dateFormat(date, 'YYYY-MM-DD');
        const profit = await this.profitToDate(formattedDate);
        return { date: date.getTime(), profit, stocks: this.stocksToDate(date) };
      })
    );
    return history;
  };

  valueHistory = async (from, to) => {
    const dates = eachDay(from, to);
    const stocksPrice = await this.stocksPriceByDate(dates);
    const history = await dates.map(date => ({
      date,
      value: portfolioUtils.getStocksValue(date, this.stocksToDate(date), stocksPrice)
    }));
    return history;
  };

  stocksToDate = date => {
    const transactions = this.transactions.filter(t => isSameDayOrBefore(t.date, date));
    return portfolioUtils.getStockQuantities(transactions);
  };

  stocksPriceByDate = async dates => {
    const stocksPrices = {};
    await Promise.all(
      dates.map(
        async date =>
          await Promise.all(
            Object.keys(this.stocks).map(async stockId => {
              const price = await this.stocks[stockId].price(date);
              stocksPrices[stockId] = stocksPrices[stockId] || {};
              stocksPrices[stockId][date] = price || 0;
            })
          )
      )
    );
    return stocksPrices;
  };

  profitOnPeriod = async (from, to) => {
    const transactionsInRange = this.transactions.filter(
      t => (from ? isWithinRange(t.date, from, subDays(to, 1)) : isBefore(t.date, to))
    );
    const transactionDates = transactionsInRange.map(t => t.date);
    if (from) {
      transactionDates.push(from);
    }
    transactionDates.push(to);
    const stockPrices = await this.stocksPriceByDate(_.uniq(transactionDates));
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
    const from = this._fromDate(date);
    if (isBefore(date, from)) {
      return 0;
    }
    const profit = this.profitOnPeriod(from, date);
    return profit;
  };

  annualizedProfitOnPeriod = async (from, to) => {
    const profit = await this.profitOnPeriod(from, to);
    const days = differenceInDays(to, from);
    return ((1 + profit / 100) ** (365 / days) - 1) * 100;
  };

  annualizedProfitToDate = async date => {
    const from = this._fromDate(date);
    const profit = await this.profitToDate(date);
    const days = differenceInDays(date, from);
    return ((1 + profit / 100) ** (365 / days) - 1) * 100;
  };
}

export default Portfolio;
