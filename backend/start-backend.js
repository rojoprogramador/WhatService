// Configuración para resolver problemas de crypto en Node.js v16 en Windows
console.log('Iniciando el backend de Whaticket...');

// Importar el módulo Module para poder hacer monkey patching
const Module = require('module');

// Polyfill para el módulo crypto
if (typeof global.crypto === 'undefined') {
  console.log('Aplicando polyfill para crypto...');
  const crypto = require('crypto');
  global.crypto = {
    getRandomValues: function(buffer) {
      return crypto.randomFillSync(buffer);
    }
  };
  console.log('Polyfill para crypto aplicado correctamente.');
}

// Desactivar la verificación de certificados SSL (solo para desarrollo)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Monkey patch para manejar errores específicos
const originalRequire = Module.prototype.require;
Module.prototype.require = function() {
  try {
    // Intentar cargar el módulo normalmente
    return originalRequire.apply(this, arguments);
  } catch (error) {
    // Manejar errores específicos
    if (error.code === 'MODULE_NOT_FOUND') {
      const moduleName = arguments[0];
      
      // Manejar el error de crypto-polyfill
      if (moduleName === './crypto-polyfill') {
        console.log('Interceptando intento de cargar crypto-polyfill...');
        return global.crypto;
      }
      
      // Registrar el error para depuración
      console.error(`Error al cargar el módulo: ${moduleName}`);
    }
    
    // Propagar el error original
    throw error;
  }
};

// Configurar manejo de excepciones no capturadas
process.on('uncaughtException', (error) => {
  console.error('Excepción no capturada:', error);
  // No terminamos el proceso para permitir que el servidor continúe funcionando
});

// Configurar manejo de promesas rechazadas no capturadas
process.on('unhandledRejection', (reason, promise) => {
  console.error('Promesa rechazada no manejada:', reason);
  // No terminamos el proceso para permitir que el servidor continúe funcionando
});

// Iniciar el servidor
try {
  console.log('Cargando el servidor...');
  require('./dist/server.js');
  console.log('Servidor cargado correctamente.');
} catch (error) {
  console.error('Error al iniciar el servidor:', error);
  process.exit(1);
}
