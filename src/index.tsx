import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import { Wallet } from './Wallet';

const RenderApp = () => (
  <Wallet>
    <App />
  </Wallet>
);

ReactDOM.render(
  <RenderApp />,
  document.getElementById('stake-button-root') as HTMLElement
);
