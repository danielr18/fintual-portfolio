import _ from 'lodash';
import { format as dateFormat, isBefore } from 'date-fns';

export const getValue = (date, holdingQuantities, stocksPriceByDate) => {
  const formattedDate = dateFormat(date, 'YYYY-MM-DD')
  return Object.entries(holdingQuantities).reduce((acc, [stockId, quantity]) => {
    const price = stocksPriceByDate[formattedDate][stockId] || 0;
    return acc + quantity * price;
  }, 0);
};

export const getDateCashflow = (date, holdingQuantities, stocksPriceByDate, previousPeriod) => {
  if (!previousPeriod) {
    return 0;
  }
  return Object.keys(holdingQuantities).reduce((acc, stockId) => {
    const current = holdingQuantities[stockId] || 0;
    const previous = previousPeriod.holdingQuantities[stockId] || 0;
    const tradedQuantity = current - previous;
    const price = stocksPriceByDate[date] && stocksPriceByDate[date][stockId] || 0;
    return acc + tradedQuantity * price;
  }, 0);
};

export const getHoldingQuantities = (transactions, initial) => {
  return transactions.reduce(
    (acc, { stockId, quantity }) => {
      const previousQuantity = acc[stockId] || 0;
      acc[stockId] = previousQuantity + quantity;
      return acc;
    },
    { ...initial }
  );
};

const HoldingPeriod = (date, holdingQuantities, stocksPriceByDate, previousPeriod) => {
  const value = getValue(
    date,
    previousPeriod ? previousPeriod.holdingQuantities : holdingQuantities,
    stocksPriceByDate
  );
  const cashflow = getDateCashflow(date, holdingQuantities, stocksPriceByDate, previousPeriod);
  let returnRate = 0;
  if (previousPeriod && previousPeriod.valueAfterCashflow !== 0) {
    returnRate = value / previousPeriod.valueAfterCashflow - 1;
  }
  return {
    date,
    value,
    valueAfterCashflow: value + cashflow,
    holdingQuantities,
    returnRate
  };
};

export const getHoldingPeriods = (passedTransactions, stocksPriceByDate, from, to) => {
  if (passedTransactions.length > 0 && isBefore(passedTransactions[0].date, from.date)) {
    throw new Error("First transaction can't occur before the initial date");
  }
  const transactions = [...passedTransactions];
  const periods = {};
  const initialPeriod = HoldingPeriod(dateFormat(from.date, 'YYYY-MM-DD'), from.previousHoldingQuantities, stocksPriceByDate);
  const groupedTransactions = Object.entries(
    _.groupBy(transactions, t => dateFormat(t.date, 'YYYY-MM-DD'))
  );
  groupedTransactions.forEach(([date, dayTransactions], i) => {
    const previousDate = i > 0 && groupedTransactions[i - 1][0];
    const previousPeriod = previousDate ? periods[previousDate] : initialPeriod;
    const dayStocksQuantities = getHoldingQuantities(dayTransactions, previousPeriod.holdingQuantities);
    const holdingQuantities = {
      ...(previousPeriod && previousPeriod.holdingQuantities),
      ...dayStocksQuantities
    };
    periods[date] = HoldingPeriod(date, holdingQuantities, stocksPriceByDate, previousPeriod);
  });

  const lastIndex = groupedTransactions.length - 1;
  const lastDate = lastIndex >= 0 && groupedTransactions[lastIndex][0];
  const previousPeriod = lastDate ? periods[lastDate] : initialPeriod;
  periods[to.date] = HoldingPeriod(
    dateFormat(to.date, 'YYYY-MM-DD'),
    previousPeriod.holdingQuantities,
    stocksPriceByDate,
    previousPeriod
  );
  return { [from.date]: initialPeriod, ...periods };
};

export const getTimeWeightedReturnRate = (...args) => {
  const periods = getHoldingPeriods(...args);
  const hprs = Object.values(periods).map(period => period.returnRate);
  return hprs.reduce((acc, hpr) => acc * (1 + hpr), 1) - 1;
};
