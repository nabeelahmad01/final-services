const { withAppBuildGradle, withGradleProperties } = require('expo/config-plugins');

/**
 * Config plugin to reduce APK size by:
 * 1. Enabling ProGuard/R8 minification
 * 2. Enabling resource shrinking  
 * 3. Building only for arm64-v8a architecture (99% of modern phones)
 */

const withReducedApkSize = (config) => {
  // Modify app/build.gradle
  config = withAppBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      let contents = config.modResults.contents;
      
      // Find the android { block and add splits configuration
      if (!contents.includes('splits {')) {
        const androidBlockRegex = /android\s*\{/;
        const splitsConfig = `android {
    splits {
        abi {
            reset()
            enable true
            universalApk false
            include "arm64-v8a"
        }
    }
`;
        contents = contents.replace(androidBlockRegex, splitsConfig);
      }
      
      // Enable minification for release builds
      if (!contents.includes('minifyEnabled true')) {
        contents = contents.replace(
          /buildTypes\s*\{\s*release\s*\{/g,
          `buildTypes {
        release {
            minifyEnabled true
            shrinkResources true`
        );
      }
      
      config.modResults.contents = contents;
    }
    return config;
  });

  // Add gradle properties for optimization
  config = withGradleProperties(config, (config) => {
    // Remove any existing android.enableR8 property
    config.modResults = config.modResults.filter(
      item => item.key !== 'android.enableR8'
    );
    
    // Add optimized properties
    config.modResults.push({
      type: 'property',
      key: 'android.enableR8',
      value: 'true'
    });
    
    return config;
  });

  return config;
};

module.exports = withReducedApkSize;
