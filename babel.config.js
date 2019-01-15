const env = process.env.NODE_ENV;

module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        modules: 'auto',
      }
    ]
  ],
  plugins: [
    '@babel/plugin-proposal-class-properties',
    [
      '@babel/plugin-transform-runtime',
      {
        helpers: true,
        regenerator: true,
        useESModules: false
      }
    ]
  ],
  env: {
    test: {
      // plugins: [
      //   // '@babel/plugin-transform-modules-commonjs',
      // ],
    }
  }
};
