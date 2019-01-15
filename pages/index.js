import React from 'react';
import { Button, Header, Icon, Segment, Container } from 'semantic-ui-react';
import PortfolioContext from '../contexts/PortfolioContext/PortfolioContext';
import LayoutHeader from '../components/shared/Header';
import Footer from '../components/shared/Footer';
import AddTransactionModal from '../components/shared/Modals/AddTransaction';
import PortfolioCharts from '../components/shared/PortfolioCharts';
import Transactions from '../components/shared/Transactions';
import '../styles/pages/index.scss';

export default class Index extends React.Component {
  static contextType = PortfolioContext;

  constructor(props, context) {
    super(props, context);
    this.portfolio = context.portfolio;
  }

  componentDidMount() {
    window.portfolio = this.portfolio
  }

  render() {
    const hasTransactions = this.portfolio.hasTransactions();
    return (
      <div>
        <LayoutHeader className="mb4 mt2" />
        <Container className="grow">
          {!hasTransactions ? (
            <Segment placeholder>
              <Header icon>
                <Icon name="dollar sign" />
                Begin building your portfolio
              </Header>
              <AddTransactionModal trigger={<Button primary>Add a Transaction</Button>} />
            </Segment>
          ) : (
            <PortfolioCharts />
          )}
          <Transactions className="mt3" />
        </Container>
        <Footer className="mt4 mb4" />
      </div>
    );
  }
}
