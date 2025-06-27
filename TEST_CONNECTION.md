# 🔗 Test de Conexión Frontend-Backend

## Verificar Comunicación

### 1. Test de API Backend
```bash
# Verificar que el backend responde
curl http://localhost:8080/api/auth/refresh

# Debería devolver error 401 (sin token) - esto confirma que responde
```

### 2. Test desde Frontend
En el navegador (F12 Console):
```javascript
// Test básico de API
fetch('http://localhost:8080/api/auth/refresh')
  .then(r => r.json())
  .then(data => console.log('API Response:', data))
  .catch(err => console.log('Connection Error:', err));
```

### 3. Test de Socket.IO
En el navegador:
```javascript
// Verificar conexión WebSocket
const socket = io('http://localhost:8080');
socket.on('connect', () => console.log('✅ Socket.IO conectado'));
socket.on('disconnect', () => console.log('❌ Socket.IO desconectado'));
```

## Configuración de Base de Datos

### Iniciar PostgreSQL
```bash
# Windows
net start postgresql-x64-13

# O usar pgAdmin para iniciar el servicio
```

### Crear Base de Datos
```sql
-- Conectar a PostgreSQL como superuser
CREATE DATABASE whatcrmviper;
CREATE USER postgres WITH PASSWORD 'camilodev1993';
GRANT ALL PRIVILEGES ON DATABASE whatcrmviper TO postgres;
```

### Ejecutar Migraciones
```bash
cd backend
npm run db:migrate        # Ejecutar migraciones
npm run db:seed          # Datos iniciales (usuarios, configuración)
```

## URLs de Acceso Final

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080/api
- **Backend Socket.IO**: ws://localhost:8080

## Login por Defecto
Después de ejecutar seeds:
- **Email**: `admin@yourcompany.com`
- **Password**: `123456`