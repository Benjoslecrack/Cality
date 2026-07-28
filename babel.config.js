module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    // Doit rester le dernier plugin de la liste (contrainte react-native-worklets/Reanimated).
    plugins: ['react-native-worklets/plugin'],
  };
};
