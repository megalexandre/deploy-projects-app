module.exports = {
  default: {
    paths: ['tests/e2e/features/**/*.feature'],
    requireModule: ['tsx/cjs'],
    require: ['tests/e2e/support/**/*.ts', 'tests/e2e/steps/**/*.ts'],
    format: ['progress-bar', 'summary'],
    formatOptions: {
      colorsEnabled: true
    }
  }
};
