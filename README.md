# Stocks Portfolio Tracker - Powered by Fintual

A JavaScript module to help with calculations of stocks and portfolios in an object oriented way.

## Usage

```js
(async function() {
  // Previous transactions in the portfolio
  const transactions = [{ date: '2018-08-01', quantity: 10, stockId: '187' }];

  // Build the portfolio.
  const portfolio = new Portfolio(transactions);
  // Initialize the stocks data
  await portfolio.init();
  // Add more transactions
  await portfolio.addTransaction('2018-12-01', '187', 15);
  // Calculate the profit
  const profit = await portfolio.profitToDate('2018-12-01');
  console.log(profit);
})()
```

## Example
Check out [example app](/example_app).

Demo: https://fintual-portfolio.netlify.com

## API

To be documented, meanwhile check out [Portfolio](/src/Portfolio.js) and [Stock](/src/Stock.js).
