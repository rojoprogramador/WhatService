# Whaticket - Configuración del Proyecto

## Requisitos Previos
- Docker Desktop
- Node Version Manager (NVM)
- PostgreSQL
- Redis (via Docker)

## Configuración del Entorno

### 1. Configuración de Redis
```bash
# Instalar Redis usando Docker
docker pull redis
docker run --name redis-whaticket -p 6379:6379 -d redis

# Verificar la instalación
docker ps
docker exec -it redis-whaticket redis-cli ping
```

### 2. Configuración de PostgreSQL
```bash
# Configurar las siguientes variables en el archivo .env:
DB_DIALECT=postgres
DB_HOST=localhost
DB_PORT=5432
DB_USER=<tu_usuario>
DB_PASS=<tu_contraseña>
DB_NAME=<nombre_base_datos>
```

### 3. Configuración del Backend

#### Configuración Inicial
1. Copiar el archivo de ejemplo:
```bash
cp .env.example .env
```

2. Editar el archivo `.env` con tus configuraciones:
```env
NODE_ENV=development
BACKEND_URL=http://localhost:8080
FRONTEND_URL=http://localhost:3000
PORT=8080

# Configurar las credenciales de la base de datos
DB_DIALECT=postgres
DB_HOST=localhost
DB_PORT=5432
DB_USER=<tu_usuario>
DB_PASS=<tu_contraseña>
DB_NAME=<nombre_base_datos>

# Generar tus propias claves secretas
JWT_SECRET=<tu_jwt_secret>
JWT_REFRESH_SECRET=<tu_jwt_refresh_secret>

# Configuración de Redis
REDIS_URI=redis://localhost:6379
REDIS_OPT_LIMITER_MAX=1
REDIS_OPT_LIMITER_DURATION=3000
```

#### Instalación y Ejecución
```bash
# Instalar dependencias
cd backend
npm install

# Usar Node.js v16 para el backend (importante para compatibilidad)
nvm install 16
nvm use 16

# Compilar TypeScript
npm run build

# Crear la base de datos (si no existe)
npx sequelize db:create

# Ejecutar migraciones
npx sequelize db:migrate

# Crear el primer usuario administrador
npx sequelize db:seed:all

# Iniciar el servidor
npm start
```

### 4. Configuración del Frontend

#### Gestión de Versiones de Node.js
```bash
# Verificar versiones instaladas
nvm list

# Instalar Node.js 14 para el frontend
nvm install 14.21.3

# Cambiar a Node.js 14
nvm use 14.21.3
```

#### Configuración del Frontend
1. Copiar y configurar el archivo de entorno:
```bash
cp .env.example .env
```

2. Editar `.env` con la URL correcta del backend:
```env
REACT_APP_BACKEND_URL=http://localhost:8080
REACT_APP_HOURS_CLOSE_TICKETS_AUTO=24
```

3. Instalar dependencias:
```bash
cd frontend
npm install --legacy-peer-deps
```

4. Instalar dependencias adicionales que pueden faltar:
```bash
npm install --save @emotion/react material-ui-popup-state webrtc-adapter react-redux
```

5. Instalar react-scripts localmente:
```bash
npm install --save react-scripts@3.4.3
```

6. Iniciar el servidor de desarrollo:
```bash
# El frontend debe ejecutarse en el puerto 3000 para coincidir con la configuración CORS del backend
npm start
```

## Solución de Problemas Comunes

### Problemas con react-scripts
Si encuentras errores relacionados con react-scripts:
```bash
# Instalar react-scripts globalmente
npm install -g react-scripts

# O instalar localmente en el proyecto
npm install --save react-scripts@3.4.3

# Modificar package.json para usar npx
# "start": "npx react-scripts start"
```

### Problemas de CORS
Si encuentras errores de CORS (Cross-Origin Resource Sharing):
```
Access to XMLHttpRequest has been blocked by CORS policy
```

Asegúrate de que:
1. El backend esté configurado con `FRONTEND_URL=http://localhost:3000` en el archivo `.env`
2. El frontend se esté ejecutando en el puerto 3000 (el puerto predeterminado)
3. Si necesitas cambiar el puerto del frontend, también debes actualizar la variable `FRONTEND_URL` en el backend

### Error de sintaxis en el backend (||=)
Si encuentras un error como `SyntaxError: Unexpected token '||='`:
```bash
# Cambiar a Node.js v16 para el backend
nvm install 16
nvm use 16
npm start
```

### Conflictos de Versiones de Node.js
El frontend funciona mejor con Node.js 14.x. Si tienes problemas:
```bash
# Asegúrate de estar usando la versión correcta
nvm use 14.21.3

# Limpia la caché de npm
npm cache clean --force

# Reinstala las dependencias
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

### Problemas de Memoria en Node.js
Si encuentras errores de memoria:
```bash
# Modifica el script de inicio en package.json
# "start": "set \"NODE_OPTIONS=--max_old_space_size=4096\" && react-scripts start"
```

### Vulnerabilidades en Paquetes
El proyecto puede tener vulnerabilidades debido a paquetes desactualizados:
```bash
# Ver vulnerabilidades
npm audit

# Intentar corregir automáticamente (puede no funcionar para todas)
npm audit fix --force
```

## Solución a Problemas Específicos

### Problema con el módulo crypto en Node.js v16
Si encuentras errores relacionados con "crypto is not defined" al ejecutar el backend en Node.js v16, puedes usar la siguiente solución:

1. Crear un archivo `start-backend.js` en la carpeta raíz del backend:
```javascript
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
```

2. Modificar el script de inicio en `package.json`:
```json
"scripts": {
  "start": "set \"NODE_OPTIONS=--max_old_space_size=4096\" && node start-backend.js",
  // otros scripts...
}
```

3. Instalar la dependencia de OpenAI si es necesaria:
```bash
npm install openai
```

### Configuración Recomendada para el Proyecto
- **Backend**: Node.js v16.20.2
- **Frontend**: Node.js v14.21.3
- **PostgreSQL**: Puerto 5432
- **Redis**: Puerto 6379
- **Backend URL**: http://localhost:8080
- **Frontend URL**: http://localhost:3000

## Estructura del Proyecto

El proyecto Whaticket está dividido en dos partes principales: backend y frontend.

### Estructura del Backend

El backend está desarrollado en Node.js con TypeScript y utiliza Express como framework web. La estructura de carpetas es la siguiente:

- **src/**: Contiene todo el código fuente del backend
  - **@types/**: Definiciones de tipos TypeScript personalizados
  - **config/**: Configuraciones del sistema (base de datos, autenticación, etc.)
  - **controllers/**: Controladores que manejan las peticiones HTTP
  - **database/**: Configuración de la base de datos, migraciones y seeders
  - **errors/**: Definiciones de errores personalizados
  - **helpers/**: Funciones auxiliares
  - **libs/**: Bibliotecas y utilidades (como configuración de socket.io)
  - **middleware/**: Middleware de Express para autenticación, validación, etc.
  - **models/**: Modelos de Sequelize para interactuar con la base de datos
  - **routes/**: Definición de rutas de la API
  - **services/**: Servicios que contienen la lógica de negocio
    - **WbotServices/**: Servicios relacionados con la conexión a WhatsApp
    - **AuthServices/**: Servicios de autenticación y gestión de tokens
  - **utils/**: Utilidades generales
  - **app.ts**: Configuración de la aplicación Express
  - **server.ts**: Punto de entrada principal que inicia el servidor
  - **bootstrap.ts**: Carga las variables de entorno
  - **queues.ts**: Configuración de colas para procesamiento en segundo plano

### Estructura del Frontend

El frontend está desarrollado en React y utiliza Material-UI como biblioteca de componentes. La estructura de carpetas es la siguiente:

- **src/**: Contiene todo el código fuente del frontend
  - **assets/**: Recursos estáticos como imágenes y estilos
  - **components/**: Componentes React reutilizables
    - **ContactDrawer/**: Componentes para el panel lateral de contactos
    - **MessageInput/**: Componentes para la entrada de mensajes
    - **MessagesList/**: Componentes para mostrar la lista de mensajes
    - **TicketsList/**: Componentes para mostrar la lista de tickets
  - **context/**: Contextos de React para gestión de estado global
  - **hooks/**: Hooks personalizados de React
  - **layout/**: Componentes de diseño como barras laterales y cabeceras
  - **pages/**: Páginas principales de la aplicación
    - **Chat/**: Página principal de chat
    - **Login/**: Página de inicio de sesión
    - **Settings/**: Páginas de configuración
  - **routes/**: Configuración de rutas del frontend
  - **services/**: Servicios para comunicación con la API del backend
  - **translate/**: Configuración de internacionalización
  - **utils/**: Utilidades generales

### Flujo de Trabajo Principal

1. El backend se conecta a WhatsApp mediante la biblioteca Baileys
2. Los mensajes entrantes de WhatsApp se procesan y se convierten en tickets
3. El frontend muestra estos tickets y permite a los agentes responderlos
4. Las respuestas se envían de vuelta a WhatsApp a través del backend

### Bases de Datos

- **PostgreSQL**: Almacena todos los datos persistentes (usuarios, tickets, mensajes, etc.)
- **Redis**: Utilizado para gestión de sesiones y colas de procesamiento

## Acceso Inicial
- URL del Frontend: http://localhost:3000
- URL del Backend: http://localhost:8080
- Credenciales por defecto:
  - Usuario: admin@admin.com
  - Contraseña: 123456

## Estado Actual
- Redis funcionando en puerto 6379
- PostgreSQL configurado en puerto 5432
- Backend ejecutándose en puerto 8080 (Node.js v16)
- Frontend ejecutándose en puerto 3000 (Node.js v14)

## Notas de Seguridad
- Cambiar todas las contraseñas y secretos por defecto
- Generar nuevas claves JWT
- Modificar las credenciales del administrador después del primer inicio de sesión
- Configurar correctamente los permisos de la base de datos
