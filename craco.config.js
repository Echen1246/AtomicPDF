module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Ignore source map warnings for PDF.js files
      webpackConfig.ignoreWarnings = [
        function ignoreSourcemapsloaderWarnings(warning) {
          return (
            warning.module &&
            warning.module.resource &&
            warning.module.resource.includes('node_modules') &&
            warning.module.resource.includes('pdfjs-dist')
          );
        },
      ];
      
      // Disable source map loader for PDF.js files
      webpackConfig.module.rules.forEach((rule) => {
        if (rule.loader && rule.loader.includes('source-map-loader')) {
          rule.exclude = /node_modules\/.*pdfjs-dist/;
        }
        if (rule.use) {
          rule.use.forEach((useRule) => {
            if (useRule.loader && useRule.loader.includes('source-map-loader')) {
              if (!useRule.exclude) {
                useRule.exclude = /node_modules\/.*pdfjs-dist/;
              }
            }
          });
        }
      });
      
      return webpackConfig;
    },
  },
}; 