import React from 'react';
import NextApp, { Container } from 'next/app';
import Head from 'next/head';
import { ToastContainer } from 'react-toastify';
import 'react-datepicker/dist/react-datepicker.css';
import 'semantic-ui-css/semantic.min.css';
import 'basscss/css/basscss.min.css';
import 'react-toastify/dist/ReactToastify.css';
import PortfolioContextProvider from '../contexts/PortfolioContext/PortfolioContextProvider';
import '../styles/main.scss';

export class App extends NextApp {
  componentDidCatch(error, info) {
    // Ain't no time to handle more errors :)
    window.location.reload();
  }

  render() {
    const { Component, pageProps } = this.props;
    return (
      <Container>
        <Head>
          <title>Stock Portfolio Tracker - Powered by Fintual</title>
        </Head>
        <PortfolioContextProvider>
          <Component {...pageProps} />
          <ToastContainer />
        </PortfolioContextProvider>
      </Container>
    );
  }
}

export default App;
