const { withAppBuildGradle } = require('expo/config-plugins');

/**
 * Config plugin to reduce APK size by enabling ABI splits
 * This builds separate APKs for each architecture (arm64-v8a only for modern phones)
 * 
 * NOTE: Does NOT enable ProGuard/minification to avoid breaking the app
 */

const withAbiSplits = (config) => {
  config = withAppBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      let contents = config.modResults.contents;
      
      // Check if splits already configured
      if (!contents.includes('splits {')) {
        // Find the android { block and add splits configuration after it
        const androidBlockMatch = contents.match(/android\s*\{/);
        if (androidBlockMatch) {
          const insertPos = androidBlockMatch.index + androidBlockMatch[0].length;
          
          const splitsConfig = `
    // ABI Splits - Build only for arm64-v8a (modern phones)
    splits {
        abi {
            reset()
            enable true
            universalApk false
            include "arm64-v8a"
        }
    }
`;
          contents = contents.slice(0, insertPos) + splitsConfig + contents.slice(insertPos);
          config.modResults.contents = contents;
        }
      }
    }
    return config;
  });

  return config;
};

module.exports = withAbiSplits;
