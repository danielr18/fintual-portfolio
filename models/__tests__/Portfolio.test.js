import Portfolio from '../Portfolio';
import StockService from '../../services/stock.service';

jest.mock('../../services/stock.service', () => ({
  getInfo: jest.fn(stockId => ({
    id: stockId,
    type: 'real_asset',
    attributes: {
      name: stockId,
      symbol: stockId
    }
  })),
  getHistory: jest.fn()
}));

const fakeHistory = (...prices) => {
  return prices.map(([date, price]) => ({
    type: 'real_asset_day',
    attributes: {
      date,
      price,
      fixed_fee: 0,
      variable_fee: 0
    }
  }));
};

const mockHistory = mockedHistory => {
  StockService.getHistory.mockImplementation(stockId => Promise.resolve(mockedHistory[stockId]));
};

describe('Portfolio Model', () => {
  describe('events', () => {
    it('can subscribe to change events', async () => {
      // Fixture setup
      mockHistory({
        187: fakeHistory(['2018-01-01', 100], ['2018-12-31', 150])
      });
      // Exercise SUT
      const portfolio = new Portfolio();
      const mock = jest.fn();
      await portfolio.subscribe(mock);
      // Verify profit is calculated correctly
      await portfolio.addTransaction('2018-12-31', '187', 5);
      expect(mock).toHaveBeenCalled();
    });

    it('can unsubscribe', async () => {
      // Fixture setup
      mockHistory({
        187: fakeHistory(['2018-01-01', 100], ['2018-12-31', 150])
      });
      // Exercise SUT
      const portfolio = new Portfolio();
      const mock = jest.fn();
      portfolio.subscribe(mock);
      // Verify profit is calculated correctly
      await portfolio.addTransaction('2018-11-31', '187', 5);
      portfolio.unsubscribe(mock);
      await portfolio.addTransaction('2018-12-31', '187', 5);
      expect(mock).toHaveBeenCalledTimes(1);
    });
  });

  describe('change transactions', () => {
    it('can add transaction', async () => {
      const portfolio = new Portfolio();
      // Verify there are no transactions
      expect(portfolio.hasTransactions()).toBe(false);
      await portfolio.addTransaction('2018-11-31', '187', 5);
      // Verify profit is calculated correctly
      expect(portfolio.hasTransactions()).toBe(true);
    });

    it('can delete transaction', async () => {
      const portfolio = new Portfolio([{ date: '2018-01-01', stockId: '187', quantity: 5 }]);
      // Verify there are no transactions
      expect(portfolio.hasTransactions()).toBe(true);
      portfolio.deleteTransaction(0);
      // Verify profit is calculated correctly
      expect(portfolio.hasTransactions()).toBe(false);
    });

    it('transactions remain ordered after insertion', async () => {
      const portfolio = new Portfolio([
        { date: '2018-01-01', stockId: '187', quantity: 5 },
        { date: '2018-07-01', stockId: '187', quantity: 20 },
        { date: '2018-12-01', stockId: '187', quantity: -10 }
      ]);
      await portfolio.addTransaction(new Date(2018, 1, 2), '187', 5);
      // Verify transaction is in the right position
      expect(portfolio.getTransactions()[1].date).toBe('2018-02-02');
    });

    it('transaction fails if selling more stocks than owned', async () => {
      const portfolio = new Portfolio([{ date: '2018-01-01', stockId: '187', quantity: 5 }]);
      // Verify transaction fails
      await expect(portfolio.addTransaction('2018-02-02', '187', -6)).rejects.toThrow();
    });

    it('transaction fails if selling non owned stock', async () => {
      const portfolio = new Portfolio();
      // Verify transaction fails
      await expect(portfolio.addTransaction('2018-02-02', '187', -6)).rejects.toThrow();
    });

    it('transaction fails if it would result in negative stocks owned', async () => {
      // Fixture setup
      mockHistory({
        187: fakeHistory(['2018-01-01', 100], ['2018-07-01', 125])
      });
      // Exercise SUT
      const portfolio = new Portfolio();
      // Verify profit is calculated correctly
      await portfolio.addTransaction('2017-01-01', '187', 5);
      await portfolio.addTransaction('2017-01-05', '187', -5);
      // Verify transaction fails
      expect(() => {
        portfolio.deleteTransaction(0);
      }).toThrow();
    });

    it('transaction fails if it would result in a first stock transaction of sell type', async () => {
      // Fixture setup
      mockHistory({
        187: fakeHistory(['2018-01-01', 100], ['2018-07-01', 125])
      });
      // Exercise SUT
      const portfolio = new Portfolio();
      // Verify profit is calculated correctly
      await portfolio.addTransaction('2017-01-01', '187', 5);
      await portfolio.addTransaction('2017-01-05', '187', -5);
      await portfolio.addTransaction('2017-01-05', '187', 5);
      // Verify transaction fails
      expect(() => {
        portfolio.deleteTransaction(0);
      }).toThrow();
    });
  });

  describe('profit edge cases', () => {
    it('profit is 0 if no transactions / inital state', async () => {
      // Exercise SUT
      const portfolio = new Portfolio();
      await portfolio.init();
      // Verify profit is calculated correctly
      const profit = await portfolio.profitToDate('2018-12-31');
      expect(profit).toBe(0);
    });
    it('profit is 0 if range is before transactions and no inital state', async () => {
      // Fixture setup
      mockHistory({
        187: fakeHistory(['2018-01-01', 100], ['2018-12-31', 150])
      });
      // Exercise SUT
      const portfolio = new Portfolio([{ date: '2018-01-01', stockId: '187', quantity: 100 }]);
      await portfolio.init();
      // Verify profit is calculated correctly
      let profit = await portfolio.profitToDate('2017-12-31');
      expect(profit).toBe(0);
      profit = await portfolio.profitToDate('2017-01-30', '2017-02-30');
      expect(profit).toBe(0);
    });
  });

  describe('single stock portfolio - one transaction', () => {
    it('profit to date', async () => {
      // Fixture setup
      mockHistory({
        187: fakeHistory(['2018-01-01', 100], ['2018-12-31', 150])
      });
      // Exercise SUT
      const portfolio = new Portfolio([{ date: '2018-01-01', stockId: '187', quantity: 100 }]);
      await portfolio.init();
      // Verify profit is calculated correctly
      const profit = await portfolio.profitToDate('2018-12-31');
      expect(profit).toBe(50);
    });

    it('annualized profit to date', async () => {
      // Fixture setup
      mockHistory({
        187: fakeHistory(['2018-01-01', 100], ['2018-07-01', 125])
      });
      // Exercise SUT
      const portfolio = new Portfolio([{ date: '2018-01-01', stockId: '187', quantity: 100 }]);
      await portfolio.init();
      // Verify profit is calculated correctly
      const profit = await portfolio.annualizedProfitToDate('2018-07-01');
      expect(profit).toBeCloseTo(56.829, 3);
    });

    it('profit on period', async () => {
      // Fixture setup
      mockHistory({
        187: fakeHistory(
          ['2018-01-01', 150],
          ['2018-07-01', 75],
          ['2018-12-01', 150],
          ['2018-12-12', 600]
        )
      });
      // Exercise SUT
      const portfolio = new Portfolio([{ date: '2018-01-01', stockId: '187', quantity: 1 }]);
      await portfolio.init();
      // Verify profit is calculated correctly
      const profit = await portfolio.profitOnPeriod('2018-06-25', '2018-12-30');
      expect(profit).toBe(300);
    });

    it('profit on period is inclusive', async () => {
      // Fixture setup
      mockHistory({
        187: fakeHistory(
          ['2018-01-01', 150],
          ['2018-07-01', 75],
          ['2018-12-01', 150],
          ['2018-12-12', 600]
        )
      });
      // Exercise SUT
      const portfolio = new Portfolio([{ date: '2018-01-01', stockId: '187', quantity: 1 }]);
      await portfolio.init();
      // Verify profit is calculated correctly
      const profit = await portfolio.profitOnPeriod('2018-07-01', '2018-12-12');
      expect(profit).toBe(700);
    });
  });

  describe('single stock portfolio - multiple transactions', () => {
    beforeEach(() => {
      // Fixture setup
      mockHistory({
        187: fakeHistory(
          ['2018-01-01', 150],
          ['2018-07-01', 75],
          ['2018-09-05', 80],
          ['2018-11-15', 130],
          ['2018-12-01', 150],
          ['2018-12-12', 600],
          ['2019-01-10', 700]
        )
      });
    });

    it('profit to date', async () => {
      // Exercise SUT
      const portfolio = new Portfolio([
        { date: '2018-01-01', stockId: '187', quantity: 5 },
        { date: '2018-07-01', stockId: '187', quantity: 20 },
        { date: '2018-12-01', stockId: '187', quantity: -10 },
        { date: '2018-12-12', stockId: '187', quantity: -15 }
      ]);
      await portfolio.init();
      // Verify profit is calculated correctly
      const profit = await portfolio.profitToDate('2018-12-31');
      expect(profit).toBe(300);
    });

    it('annualized profit to date', async () => {
      // Exercise SUT
      const portfolio = new Portfolio([
        { date: '2018-01-01', stockId: '187', quantity: 5 },
        { date: '2018-07-01', stockId: '187', quantity: 20 },
        { date: '2018-12-01', stockId: '187', quantity: -10 },
        { date: '2018-12-12', stockId: '187', quantity: -15 }
      ]);
      await portfolio.init();
      // Verify profit is calculated correctly
      const profit = await portfolio.annualizedProfitToDate('2018-08-29');
      expect(profit).toBeCloseTo(-65.1515, 4);
    });

    it('profit on period', async () => {
      // Exercise SUT
      const portfolio = new Portfolio([
        { date: '2018-01-01', stockId: '187', quantity: 5 },
        { date: '2018-07-01', stockId: '187', quantity: 20 },
        { date: '2018-12-01', stockId: '187', quantity: -10 },
        { date: '2018-12-12', stockId: '187', quantity: -15 }
      ]);
      await portfolio.init();
      // Verify profit is calculated correctly
      const profit = await portfolio.profitOnPeriod('2018-06-30', '2018-12-05');
      expect(profit).toBe(0);
    });

    it('profit on period is inclusive', async () => {
      // Exercise SUT
      const portfolio = new Portfolio([{ date: '2018-01-01', stockId: '187', quantity: 1 }]);
      await portfolio.init();
      // Verify profit is calculated correctly
      const profit = await portfolio.profitOnPeriod('2018-07-01', '2018-12-01');
      expect(profit).toBe(100);
    });

    it('profit on period within transactions', async () => {
      // Exercise SUT
      const portfolio = new Portfolio([
        { date: '2018-01-01', stockId: '187', quantity: 5 },
        { date: '2018-07-01', stockId: '187', quantity: 20 },
        { date: '2018-12-01', stockId: '187', quantity: -10 },
        { date: '2018-12-12', stockId: '187', quantity: -15 }
      ]);
      await portfolio.init();
      // Verify profit is calculated correctly
      const profit = await portfolio.profitOnPeriod('2018-09-05', '2018-11-15');
      expect(profit).toBe(62.5);
    });

    it('profit on period between transactions and later', async () => {
      // Exercise SUT
      const portfolio = new Portfolio([
        { date: '2018-01-01', stockId: '187', quantity: 5 },
        { date: '2018-07-01', stockId: '187', quantity: 20 },
        { date: '2018-12-01', stockId: '187', quantity: -10 },
        { date: '2018-12-12', stockId: '187', quantity: -9 }
      ]);
      await portfolio.init();
      // Verify profit is calculated correctly
      const profit = await portfolio.profitOnPeriod('2018-09-05', '2019-01-10');
      expect(profit).toBe(775);
    });
  });

  describe('multiple stocks portfolio', () => {
    beforeEach(() => {
      // Fixture setup
      mockHistory({
        187: fakeHistory(
          ['2018-01-01', 150],
          ['2018-03-01', 75],
          ['2018-05-01', 150],
          ['2018-12-12', 600]
        ),
        186: fakeHistory(
          ['2018-01-01', 300],
          ['2018-03-01', 315],
          ['2018-05-01', 221],
          ['2018-12-12', 199]
        ),
        185: fakeHistory(
          ['2018-05-01', 15.15],
          ['2018-05-02', 14.99],
          ['2018-05-03', 15.01],
          ['2018-12-12', 15.99]
        ),
        184: fakeHistory(
          ['2018-01-01', 750],
          ['2018-06-01', 795.4],
          ['2018-06-15', 810],
          ['2018-06-30', 800.1]
        )
      });
    });

    it('profit to date', async () => {
      // Exercise SUT
      const portfolio = new Portfolio([
        { date: '2018-01-01', stockId: '187', quantity: 5 },
        { date: '2018-01-01', stockId: '186', quantity: 7 },
        { date: '2018-03-01', stockId: '187', quantity: 19 },
        { date: '2018-05-01', stockId: '186', quantity: 23 },
        { date: '2018-05-01', stockId: '187', quantity: -14 },
        { date: '2018-12-12', stockId: '186', quantity: -25 }
      ]);
      await portfolio.init();
      // Verify profit is calculated correctly
      const profit = await portfolio.profitToDate('2018-12-15');
      expect(profit).toBeCloseTo(71.2892, 4);
    });

    it('annualized profit to date', async () => {
      // Exercise SUT
      const portfolio = new Portfolio([
        { date: '2018-01-01', stockId: '187', quantity: 5 },
        { date: '2018-01-01', stockId: '186', quantity: 7 },
        { date: '2018-03-01', stockId: '187', quantity: 19 },
        { date: '2018-05-01', stockId: '186', quantity: 23 },
        { date: '2018-05-01', stockId: '187', quantity: -14 },
        { date: '2018-12-12', stockId: '186', quantity: -25 }
      ]);
      await portfolio.init();
      // Verify profit is calculated correctly
      const profit = await portfolio.annualizedProfitToDate('2018-12-15');
      expect(profit).toBeCloseTo(75.8523, 4);
    });

    it('profit on period', async () => {
      // Exercise SUT
      const portfolio = new Portfolio([
        { date: '2018-01-01', stockId: '187', quantity: 5 },
        { date: '2018-01-01', stockId: '186', quantity: 7 },
        { date: '2018-03-01', stockId: '187', quantity: 19 },
        { date: '2018-05-01', stockId: '186', quantity: 23 },
        { date: '2018-05-01', stockId: '187', quantity: -14 },
        { date: '2018-05-01', stockId: '185', quantity: 36 },
        { date: '2018-05-02', stockId: '185', quantity: 4 },
        { date: '2018-05-03', stockId: '185', quantity: 10 },
        { date: '2018-06-15', stockId: '184', quantity: 12 },
        { date: '2018-12-12', stockId: '186', quantity: -25 }
      ]);
      await portfolio.init();
      // Verify profit is calculated correctly
      const profit = await portfolio.profitOnPeriod('2018-02-01', '2018-11-29');
      expect(profit).toBeCloseTo(15.5301);
    });
  });
});
