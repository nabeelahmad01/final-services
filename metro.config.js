// Metro Bundler Configuration for Size Optimization
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Enable minification
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    compress: {
      // Drop console statements in production
      drop_console: true,
    },
  },
};

// Optimize asset resolution
config.resolver = {
  ...config.resolver,
  assetExts: [...config.resolver.assetExts.filter((ext) => ext !== 'svg'), 'webp'],
  sourceExts: [...config.resolver.sourceExts, 'svg'],
};

module.exports = config;
