import React from 'react';
import { Placeholder } from 'semantic-ui-react';

const PlaceholderChart = () => (
  <Placeholder fluid>
    <Placeholder.Line length="full" />
    <Placeholder.Image style={{ height: 300 }} />
    <Placeholder.Image style={{ height: 70 }} />
    <Placeholder.Line length="full" />
    <Placeholder.Line length="full" />
  </Placeholder>
);

export default PlaceholderChart;
