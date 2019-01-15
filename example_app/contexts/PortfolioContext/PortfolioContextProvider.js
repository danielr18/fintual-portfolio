import React from 'react';
import PortfolioContext from './PortfolioContext';
import { Portfolio } from '../../..';

class PortfolioContextProvider extends React.Component {
  constructor(props) {
    super(props);
    this.portfolio = new Portfolio([
      { stockId: '186', quantity: 1, date: '2018-05-05' },
      { stockId: '187', quantity: 2, date: '2018-06-05' },
      { stockId: '188', quantity: 3, date: '2018-07-05' },
      { stockId: '258', quantity: 4, date: '2018-08-05' }
    ]);
  }

  async componentDidMount() {
    this.portfolio.subscribe(this.onPortfolioChange);
    await this.portfolio.init();
  }

  componentWillUnmount() {
    this.portfolio.unsubscribe(this.onPortfolioChange);
  }

  onPortfolioChange = () => {
    this.forceUpdate();
  };

  render() {
    return (
      // Use literal object to force context updates
      <PortfolioContext.Provider
        value={{ lastUpdate: new Date().getTime(), portfolio: this.portfolio }}
      >
        {this.props.children}
      </PortfolioContext.Provider>
    );
  }
}

export default PortfolioContextProvider;
