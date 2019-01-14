import _ from 'lodash';
import { format as dateFormat, isBefore } from 'date-fns';

export const valueFromAmountAndPrices = (date, stockAmounts, stocksPriceByDate) => {
  return Object.entries(stockAmounts).reduce((acc, [stockId, amount]) => {
    const price = stocksPriceByDate[stockId][date] || 0;
    return acc + amount * price;
  }, 0);
};

export const cashflowFromAmountAndPrices = (
  date,
  stockAmounts,
  stocksPriceByDate,
  previousPeriod
) => {
  if (!previousPeriod) {
    return 0;
  }
  return Object.keys(stockAmounts).reduce((acc, stockId) => {
    const current = stockAmounts[stockId] || 0;
    const previous = previousPeriod.stockAmounts[stockId] || 0;
    const amountDiff = current - previous;
    const price = stocksPriceByDate[stockId][date] || 0;
    return acc + amountDiff * price;
  }, 0);
};

const stockAmountsFromTransactions = transactions => {
  return transactions.reduce((acc, { stockId, end }) => {
    acc[stockId] = end;
    return acc;
  }, {});
};

const holdingPeriod = (date, stockAmounts, stocksPriceByDate, previousPeriod) => {
  const value = valueFromAmountAndPrices(
    date,
    previousPeriod ? previousPeriod.stockAmounts : stockAmounts,
    stocksPriceByDate
  );
  const cashflow = cashflowFromAmountAndPrices(
    date,
    stockAmounts,
    stocksPriceByDate,
    previousPeriod
  );
  let returnRate = 0;
  if (previousPeriod && previousPeriod.valueAfterCashflow !== 0) {
    returnRate = value / previousPeriod.valueAfterCashflow - 1;
  }
  return {
    date,
    value,
    valueAfterCashflow: value + cashflow,
    stockAmounts,
    returnRate
  };
};

export const holdingPeriods = (passedTransactions, stocksPriceByDate, from, to) => {
  if (passedTransactions.length > 0 && isBefore(passedTransactions[0].date, from.date)) {
    throw new Error("First transaction can't occur before the initial date");
  }
  const transactions = [...passedTransactions];
  const periods = {};
  const initialPeriod = holdingPeriod(from.date, from.previousStockAmounts, stocksPriceByDate)
  const groupedTransactions = Object.entries(
    _.groupBy(transactions, t => dateFormat(t.date, 'YYYY-MM-DD'))
  );
  groupedTransactions.forEach(([date, dayTransactions], i) => {
    const previousDate = i > 0 && groupedTransactions[i - 1][0];
    const dayStocksAmounts = stockAmountsFromTransactions(dayTransactions);
    const previousPeriod = previousDate ? periods[previousDate] : initialPeriod;
    const stockAmounts = {
      ...(previousPeriod && previousPeriod.stockAmounts),
      ...dayStocksAmounts
    };
    periods[date] = holdingPeriod(date, stockAmounts, stocksPriceByDate, previousPeriod);
  });

  const lastIndex = groupedTransactions.length - 1;
  const lastDate = lastIndex >= 0 && groupedTransactions[lastIndex][0];
  const previousPeriod = lastDate ? periods[lastDate] : initialPeriod;
  periods[to.date] = holdingPeriod(
    to.date,
    previousPeriod.stockAmounts,
    stocksPriceByDate,
    previousPeriod
  );
  return { [from.date]: initialPeriod, ...periods };
};

export const timeWeightedReturnRate = (...args) => {
  const periods = holdingPeriods(...args);
  // console.log(periods);
  const hprs = Object.values(periods).map(period => period.returnRate);
  return hprs.reduce((acc, hpr) => acc * (1 + hpr), 1) - 1;
};
