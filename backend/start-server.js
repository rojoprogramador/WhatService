// Polyfill para el módulo crypto
global.crypto = require('crypto-browserify');

// Iniciar el servidor
require('./dist/server.js');
