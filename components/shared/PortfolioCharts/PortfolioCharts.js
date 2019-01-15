import React from 'react';
import _ from 'lodash';
import { Grid } from 'semantic-ui-react';
import ProfitChart from './ProfitChart';
import ValueChart from './ValueChart';

class PortfolioCharts extends React.Component {
  render() {
    return (
      <Grid stackable>
        <Grid.Row columns={2}>
          <Grid.Column>
            <ValueChart />
          </Grid.Column>
          <Grid.Column>
            <ProfitChart />
          </Grid.Column>
        </Grid.Row>
      </Grid>
    );
  }
}

export default PortfolioCharts;
