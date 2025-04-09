// Polyfill para el módulo crypto en Node.js
if (typeof global.crypto === 'undefined') {
  const crypto = require('crypto');
  
  // Implementar getRandomValues similar a la API Web Crypto
  global.crypto = {
    getRandomValues: function(buffer) {
      return crypto.randomFillSync(buffer);
    },
    
    // Agregar otras funciones que puedan ser necesarias
    subtle: {
      digest: async function(algorithm, data) {
        const hash = crypto.createHash(algorithm.replace('-', '').toLowerCase());
        hash.update(typeof data === 'string' ? Buffer.from(data) : data);
        return hash.digest();
      }
    }
  };
}

module.exports = global.crypto;
