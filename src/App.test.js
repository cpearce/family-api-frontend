import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import { getYear } from './Utils.js';

var assert = require('assert');

it('renders without crashing', () => {
  const div = document.createElement('div');
  ReactDOM.render(<App />, div);
  ReactDOM.unmountComponentAtNode(div);
});

it('parses dates...', () => {
  assert(getYear('17 APR 1920'), 1920);
});