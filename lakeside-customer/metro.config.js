const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add polyfills for Node.js modules in React Native
config.resolver = {
  ...config.resolver,
  alias: {
    buffer: require.resolve('buffer'),
  },
};

module.exports = config;
