module.exports = {
  preset: '@react-native/jest-preset',
  transform: {
    '^.+\\.(js|mjs|ts|tsx)$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native[^/]*|@react-navigation[^/]*|@firebase|firebase)/)',
  ],
};
