import React from 'react';
import _ from 'lodash';
import { format as dateFormat } from 'date-fns';
import { Button, Table, Header, Icon, Placeholder } from 'semantic-ui-react';
import PortfolioContext from '../../../contexts/PortfolioContext/PortfolioContext';
import AddTransactionModal from '../Modals/AddTransaction';
import { toast } from 'react-toastify';

class Transactions extends React.Component {
  static contextType = PortfolioContext;

  constructor(props, context) {
    super(props);
    this.portfolio = context.portfolio;
    this.state = {
      transactions: null
    };
  }

  async componentDidMount() {
    if (this.portfolio.isInited()) {
      this.setState({
        transactions: await this.processTransactions(this.portfolio.getTransactions())
      });
    }
  }

  async componentDidUpdate() {
    if (this._lastPortfolioUpdate !== this.context.lastUpdate && this.portfolio.isInited()) {
      this._lastPortfolioUpdate = this.context.lastUpdate;
      this.setState({
        transactions: await this.processTransactions(this.portfolio.getTransactions())
      });
    }
  }

  processTransactions = async transactions => {
    return Promise.all(
      transactions
        .slice(0)
        .reverse()
        .map(async t => {
          const stocks = this.portfolio.getStocks();
          const stock = stocks[t.stockId];
          const price = (await stock.getPrice(t.date)) || 0;
          const value = t.quantity * price || 0;
          return {
            date: dateFormat(t.date, 'YYYY-MM-DD'),
            type: t.quantity >= 0 ? 'Buy' : 'Sell',
            symbol: stock.symbol,
            quantity: t.quantity,
            price: `$${price.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')}`,
            value: `$${value.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')}`
          };
        })
    );
  };

  deleteTransaction = async i => {
    try {
      this.portfolio.deleteTransaction(i);
    } catch (e) {
      toast.error(e.message);
    }
  };

  render() {
    const { className } = this.props;
    const { transactions } = this.state;
    return (
      <div className={className}>
        <Header content="Transactions" />
        {this.state.transactions ? (
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Date</Table.HeaderCell>
                <Table.HeaderCell>Stock</Table.HeaderCell>
                <Table.HeaderCell>Type</Table.HeaderCell>
                <Table.HeaderCell>Quantity</Table.HeaderCell>
                <Table.HeaderCell>Price</Table.HeaderCell>
                <Table.HeaderCell>Value</Table.HeaderCell>
                <Table.HeaderCell>Delete</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {transactions.map((t, i) => {
                return (
                  <Table.Row key={i}>
                    <Table.Cell>{t.date}</Table.Cell>
                    <Table.Cell>{t.symbol}</Table.Cell>
                    <Table.Cell>{t.type}</Table.Cell>
                    <Table.Cell>{t.quantity}</Table.Cell>
                    <Table.Cell>{t.price}</Table.Cell>
                    <Table.Cell>{t.value}</Table.Cell>
                    <Table.Cell>
                      <Button
                        negative
                        icon
                        onClick={() => {
                          this.deleteTransaction(transactions.length - i - 1);
                        }}
                      >
                        <Icon name="close" />
                      </Button>
                    </Table.Cell>
                  </Table.Row>
                );
              })}
            </Table.Body>
            <Table.Footer fullWidth>
              <Table.Row>
                <Table.HeaderCell colSpan="7">
                  <AddTransactionModal
                    trigger={
                      <Button primary floated="right">
                        Add Transaction
                      </Button>
                    }
                  />
                </Table.HeaderCell>
              </Table.Row>
            </Table.Footer>
          </Table>
        ) : (
          <Placeholder fluid>
            {_.range(0, this.portfolio.getTransactions().length || 5).map(i => (
              <Placeholder.Line length="full" key={i} style={{ height: 20 }} />
            ))}
          </Placeholder>
        )}
      </div>
    );
  }
}

export default Transactions;
