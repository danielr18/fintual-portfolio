import React from 'react';
import { Header, Container } from 'semantic-ui-react';

const Footer = ({ className }) => {
  return (
    <footer className={className}>
      <Container textAlign="center">
        <Header as="h2" image="/static/fintual.png" content="Powered by Fintual" />
        <Header color="grey" as="h4" content="Profit is calculted using Time-Weighted Return method." />
      </Container>
    </footer>
  );
};

export default Footer;
