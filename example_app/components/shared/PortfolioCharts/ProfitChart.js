import React from 'react';
import _ from 'lodash';
import Highcharts from 'highcharts/highstock';
import HighchartsReact from 'highcharts-react-official';
import { Header, Placeholder } from 'semantic-ui-react';
import {
  startOfYear,
  eachDay,
  addDays,
  differenceInDays,
  isAfter,
  format as dateFormat
} from 'date-fns';
import PortfolioContext from '../../../contexts/PortfolioContext/PortfolioContext';
import PlaceholderChart from './PlaceholderChart';
import { isSameDayOrBefore } from '../../../../lib/utils/date';

class ProfitChart extends React.Component {
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
        profit: await this.portfolio.profitOnPeriod(...this.periodDates()),
        annualizedProfit: await this.portfolio.annualizedProfitOnPeriod(...this.periodDates())
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

  async componentDidUpdate() {
    if (this._lastPortfolioUpdate !== this.context.lastUpdate && this.portfolio.isInited()) {
      this._lastPortfolioUpdate = this.context.lastUpdate;
      this.updateChart();
      this.setState({
        profit: await this.portfolio.profitOnPeriod(...this.periodDates()),
        annualizedProfit: await this.portfolio.annualizedProfitOnPeriod(...this.periodDates())
      });
    }
  }

  updatePeriodDates = async e => {
    this.setState({
      startDate: e.min,
      endDate: e.max,
      profit: await this.portfolio.profitOnPeriod(e.min, e.max),
      annualizedProfit: await this.portfolio.annualizedProfitOnPeriod(e.min, e.max)
    });
  };

  profitHistory = async (from, to) => {
    const firstDate = this.portfolio.firstDate();
    let adjustedFrom = from;
    const history = [];

    if (isAfter(firstDate, from)) {
      eachDay(from, firstDate).forEach(date => {
        history.push({ date: date.getTime(), profit: 0 });
      });
      adjustedFrom = addDays(firstDate, 1);
    }

    await new Promise(async resolve => {
      let stepFrom = adjustedFrom;
      let stepTo;
      const onFrame = async ts => {
        const days = Math.min(differenceInDays(to, stepFrom), 2);
        stepTo = addDays(stepFrom, days);
        await Promise.all(
          eachDay(stepFrom, stepTo).map(async date => {
            const formattedDate = dateFormat(date, 'YYYY-MM-DD');
            const profit = await this.portfolio.profitToDate(formattedDate);
            history.push({ date: date.getTime(), profit });
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
    const history = await this.profitHistory(...this.defaultPeriodDates());
    if (this._unmounted) {
      return;
    }
    const data = history.map(histDate => [histDate.date, histDate.profit]);

    this.setState({
      chartOptions: {
        title: {
          text: 'Portfolio Profit'
        },
        series: [
          {
            name: 'Profit',
            type: 'area',
            data,
            threshold: 0,
            color: 'green',
            fillColor: {
              linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
              stops: [[0, 'rgba(176, 255, 137, 1)'], [1, 'rgba(176, 255, 137, 0)']]
            },
            negativeColor: 'red',
            negativeFillColor: {
              linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
              stops: [[0, 'rgba(255, 146, 137, 1)'], [1, 'rgba(255, 146, 137, 0)']]
            }
          }
        ],
        xAxis: {
          events: {
            afterSetExtremes: this.updatePeriodDates
          }
        },
        yAxis: {
          plotLines: [
            {
              color: '#ffd1cc',
              width: 2,
              value: 0
            }
          ],
          labels: {
            format: '{value}%'
          }
        },
        tooltip: {
          pointFormat: '{series.name}: <b>{point.y:.4f}%</b><br/>'
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
        {this.state.profit !== undefined ? (
          <Header
            className="center"
            content={`Profit on period: ${this.state.profit.toFixed(4)}%`}
          />
        ) : (
          <Placeholder fluid>
            <Placeholder.Line length="full"/>
          </Placeholder>
        )}

        {this.state.annualizedProfit !== undefined ? (
          <Header
            as="h5"
            className="center"
            style={{ marginTop: 0 }}
            content={`Annualized profit on period: ${this.state.annualizedProfit.toFixed(4)}%`}
          />
        ) : (
          <Placeholder fluid>
            <Placeholder.Line length="full"/>
          </Placeholder>
        )}
      </>
    ) : (
      <PlaceholderChart />
    );
  }
}

export default ProfitChart;
