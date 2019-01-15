import React from 'react';
import { Header, Container, Flag } from 'semantic-ui-react';

export default ({ className }) => {
  return (
    <header className={className}>
      <Container textAlign="center">
        <Header as="h1" content="Stock Portfolio Tracker" />
        <Header color="grey" as="h3">
          <Header.Content>Currency: </Header.Content>
          <Flag style={{ marginLeft: '1rem' }} name="cl" />
        </Header>
      </Container>
    </header>
  );
};
