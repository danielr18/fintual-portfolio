import React from 'react';
import _ from 'lodash';
import { Header, Modal, Dropdown, Grid, Input, Button, Message } from 'semantic-ui-react';
import FundsService from '../../../../services/funds.service';
import DatePicker from 'react-datepicker';
import PortfolioContext from '../../../../contexts/PortfolioContext/PortfolioContext';
import { isAfter } from 'date-fns';

class AddTransactionModal extends React.Component {
  static contextType = PortfolioContext;

  constructor(props, context) {
    super(props);
    this.state = {
      funds: [],
      stocks: [],
      selectedFundId: null,
      selectedStockId: null,
      date: new Date(),
      quantity: 0,
      error: null,
      saving: false
    };
    this.fundsOptions = _.memoize(this._fundsOptions);
    this.stocksOptions = _.memoize(this._stocksOptions);
    this.portfolio = context.portfolio;
  }

  _fundsOptions = () => {
    return this.state.funds.map(fund => ({
      key: fund.attributes.symbol,
      text: fund.attributes.name,
      value: fund.id,
      content: (
        <Header icon="money" content={fund.attributes.name} subheader={fund.attributes.symbol} />
      )
    }));
  };

  _stocksOptions = () => {
    return this.state.stocks.map(stock => ({
      key: stock.attributes.symbol,
      text: stock.attributes.symbol,
      value: stock.id,
      content: (
        <Header icon="money" content={stock.attributes.symbol} subheader={stock.attributes.name} />
      )
    }));
  };

  async componentDidMount() {
    const funds = await FundsService.getList();
    this.fundsOptions.cache.delete();
    this.setState({ funds });
  }

  onFundChange = async (e, { value }) => {
    if (value !== this.state.selectedFundId) {
      this.setState({ stocks: [], selectedFundId: value, selectedStockId: null });
      const stocks = await FundsService.getStocks(value);
      this.stocksOptions.cache.delete();
      this.setState({
        stocks
      });
    }
  };

  onStockChange = async (e, { value }) => {
    this.setState({ selectedStockId: value });
  };

  onDateChange = date => {
    this.setState({ date });
  };

  onQuantityChange = e => {
    this.setState({ quantity: e.target.value });
  };

  onSaveTransaction = async () => {
    const { date, quantity, selectedStockId } = this.state;
    this.setState({
      saving: true
    });
    try {
      await this.portfolio.addTransaction(date, selectedStockId, Number(quantity));
      this.setState({
        error: null,
        saving: false
      });
    } catch (e) {
      this.setState({
        error: e.message,
        saving: false
      });
    }
  };

  isSaveDisabled = () => {
    const { selectedStockId, date } = this.state;
    return (!selectedStockId && selectedStockId !== 0) || isAfter(date, new Date());
  };

  render() {
    return (
      <Modal trigger={this.props.trigger}>
        <Modal.Header>Add New Transaction</Modal.Header>
        <Modal.Content>
          <Grid>
            <Grid.Row columns="2">
              <Grid.Column>
                <Header as="h3" content="Fund" />
                <Dropdown
                  onChange={this.onFundChange}
                  value={this.state.selectedFundId}
                  placeholder="Select Fund"
                  fluid
                  search
                  selection
                  options={this.fundsOptions()}
                />
              </Grid.Column>
              <Grid.Column>
                <Header as="h3" content="Stock" />
                <Dropdown
                  onChange={this.onStockChange}
                  value={this.state.selectedStockId}
                  placeholder="Select Stock"
                  fluid
                  selection
                  options={this.stocksOptions()}
                />
              </Grid.Column>
            </Grid.Row>
            <Grid.Row columns="3">
              <Grid.Column>
                <Input
                  onChange={this.onQuantityChange}
                  label="Quantity"
                  type="number"
                  value={this.state.quantity}
                />
              </Grid.Column>
              <Grid.Column>
                <div className="ui labeled input">
                  <div className="ui label label">Traded On</div>
                  <DatePicker
                    // startDate={this.state.startDate}
                    minDate={new Date(2018, 0, 1)}
                    maxDate={new Date()}
                    customInput={<Input />}
                    selected={this.state.date}
                    onChange={this.onDateChange}
                  />
                </div>
              </Grid.Column>
            </Grid.Row>
            <Grid.Row columns="equal">
              <Grid.Column>
                {this.state.error && (
                  <Message negative>
                    <Message.Header>Invalid transaction</Message.Header>
                    <p>{this.state.error}</p>
                  </Message>
                )}
                <Button onClick={this.onSaveTransaction} primary disabled={this.state.saving || this.isSaveDisabled()}>
                  Save
                </Button>
              </Grid.Column>
            </Grid.Row>
          </Grid>
        </Modal.Content>
      </Modal>
    );
  }
}

export default AddTransactionModal;
