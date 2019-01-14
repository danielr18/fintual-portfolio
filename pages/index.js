import React from 'react';
import 'semantic-ui-css/semantic.min.css';
import Highcharts from 'highcharts/highstock';
import HighchartsReact from 'highcharts-react-official';
import Portfolio from '../models/Portfolio';

export default class Index extends React.Component {
  constructor(props) {
    super(props);
    this.options = {};
  }

  componentDidMount() {
    // init the module
  }

  render() {
    return (
      <div>
        <HighchartsReact
          highcharts={Highcharts}
          constructorType={'stockChart'}
          options={this.options}
        />
      </div>
    );
  }
}
