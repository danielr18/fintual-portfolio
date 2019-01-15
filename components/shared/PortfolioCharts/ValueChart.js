import React from 'react';
import _ from 'lodash';
import Highcharts from 'highcharts/highstock';
import HighchartsReact from 'highcharts-react-official';
import { Header } from 'semantic-ui-react';
import { startOfYear, subDays, addDays, eachDay, isAfter, differenceInDays } from 'date-fns';
import PortfolioContext from '../../../contexts/PortfolioContext/PortfolioContext';
import PlaceholderChart from './PlaceholderChart';

class ValueChart extends React.Component {
  static contextType = PortfolioContext;

  constructor(props, context) {
    super(props);
    this.state = {
      chartOptions: null,
      startDate: null,
      endDate: null
    };
    this._lastPortfolioUpdate = context.lastUpdate;
    this.portfolio = context.portfolio;
  }

  async componentDidMount() {
    if (this.portfolio.isInited()) {
      this.updateChart();
      this.setState({
        growth: await this.portfolio.growthOnPeriod(...this.periodDates()),
        annualizedGrowth: await this.portfolio.annualizedGrowthOnPeriod(...this.periodDates())
      });
    }
  }

  async componentDidUpdate() {
    if (this._lastPortfolioUpdate !== this.context.lastUpdate && this.portfolio.isInited()) {
      this._lastPortfolioUpdate = this.context.lastUpdate;
      this.updateChart();
      this.setState({
        growth: await this.portfolio.growthOnPeriod(...this.periodDates()),
        annualizedGrowth: await this.portfolio.annualizedGrowthOnPeriod(...this.periodDates())
      });
    }
  }

  defaultPeriodDates = () => {
    return [this.portfolio.firstDate() || startOfYear(new Date()), new Date()];
  };

  periodDates = () => {
    if (this.state.startDate && this.state.endDate) {
      return [this.state.startDate, this.state.endDate];
    }
    return this.defaultPeriodDates();
  };

  updatePeriodDates = async e => {
    this.setState({
      startDate: e.min,
      endDate: e.max,
      growth: await this.portfolio.growthOnPeriod(e.min, e.max),
      annualizedGrowth: await this.portfolio.annualizedGrowthOnPeriod(e.min, e.max)
    });
  };

  valueHistory = async (from, to) => {
    const firstDate = this.portfolio.firstDate();
    let adjustedFrom = from;
    const history = [];

    if (isAfter(firstDate, from)) {
      eachDay(from, subDays(firstDate, 1)).forEach(date => {
        history.push({ date: date.getTime(), value: 0 });
      });
      adjustedFrom = firstDate;
    }

    await new Promise(async resolve => {
      let stepFrom = adjustedFrom;
      let stepTo;
      const onFrame = async ts => {
        const days = Math.min(differenceInDays(to, stepFrom), 2);
        stepTo = addDays(stepFrom, days);
        const dates = eachDay(stepFrom, stepTo);
        const stocksPrice = await this.portfolio.stocksPriceByDates(dates);
        await Promise.all(
          dates.map(async date => {
            const value = await this.portfolio.valueOnDate(date, stocksPrice);
            history.push({ date: date.getTime(), value });
          })
        );
        stepFrom = addDays(stepFrom, days + 1);

        if (isAfter(stepFrom, to)) {
          resolve();
        } else {
          window.requestAnimationFrame(onFrame);
        }
      };
      window.requestAnimationFrame(onFrame);
    });

    return _.sortBy(history, ['date']);
  };

  updateChart = async () => {
    const history = await this.valueHistory(...this.defaultPeriodDates());
    if (this._unmounted) {
      return;
    }
    const data = history.map(histDate => [histDate.date, histDate.value]);
    this.setState({
      chartOptions: {
        title: {
          text: 'Portfolio Value'
        },
        series: [
          {
            name: 'Value',
            data
          }
        ],
        xAxis: {
          events: {
            afterSetExtremes: this.updatePeriodDates
          }
        },
        yAxis: {
          labels: {
            format: '${value:,.0f}'
          }
        },
        tooltip: {
          pointFormat: '{series.name}: <b>${point.y:,.2f}</b><br/>'
        },
        time: {
          useUTC: false
        }
      }
    });
  };

  componentWillUnmount() {
    this._unmounted = true;
  }

  render() {
    return this.state.chartOptions ? (
      <>
        <HighchartsReact
          highcharts={Highcharts}
          constructorType={'stockChart'}
          options={this.state.chartOptions}
        />
        {this.state.growth !== undefined && (
          <Header
            className="center"
            content={`Growth on period: ${this.state.growth.toFixed(4)}%`}
          />
        )}
        {this.state.annualizedGrowth !== undefined && (
          <Header
            as="h5"
            className="center"
            style={{ marginTop: 0 }}
            content={`Annualized growth on period: ${this.state.annualizedGrowth.toFixed(4)}%`}
          />
        )}
      </>
    ) : (
      <PlaceholderChart />
    );
  }
}

export default ValueChart;
