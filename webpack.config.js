const path = require('path');

module.exports = {
  // Tryb budowania: 'development' dla deweloperki, 'production' dla produkcji
  mode: 'development',

  // Plik wejściowy aplikacji
  entry: './src/index.js',

  // Konfiguracja wynikowego pliku
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
  },

  // Konfiguracja serwera deweloperskiego
  devServer: {
    static: './dist',
  },

  // Konfiguracja modułów
  module: {
    rules: [
      {
        test: /\.css$/, // Ładowanie plików CSS
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.scss$/, // Ładowanie plików SCSS/SASS
        use: ['style-loader', 'css-loader', 'sass-loader'],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/, // Ładowanie obrazów
        type: 'asset/resource',
      },
    ],
  },
};
