import React from 'react';
import ReactDOM from 'react-dom';
import App from '.';
import { createServices } from '../../../services';

it('renders without crashing', () => {
  const div = document.createElement('div');
  ReactDOM.render(<App services={createServices({backend: 'memory'})} />, div);
  ReactDOM.unmountComponentAtNode(div);
})
