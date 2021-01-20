module.exports = (api) => {
  api.cache(false);
  const presets = [
    [
      '@babel/preset-env',
      {
        corejs: { version: 3, proposals: true },
        useBuiltIns: 'entry',
        bugfixes: true,
        targets: {
          browsers: ['last 2 versions']
        }
      }
    ]
  ];
  const plugins = [
    ['@babel/plugin-transform-runtime', {
      regenerator: true
    }]
  ];
  return {
    presets,
    plugins
  };
};
