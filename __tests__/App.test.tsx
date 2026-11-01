/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: jest.fn(),
  },
  statusCodes: {},
}));

jest.mock('react-native-sound', () => {
  const Sound = jest.fn();
  Sound.setCategory = jest.fn();

  return {
    __esModule: true,
    default: Sound,
  };
});

test('renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });
});
