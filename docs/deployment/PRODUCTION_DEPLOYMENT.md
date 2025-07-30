# 🚀 Guía de Despliegue en Producción - Colombia

## 📋 Modelo de Administración Manual

Este sistema está configurado para funcionar sin pagos automáticos, ideal para Colombia con gestión manual de clientes.

## 🔧 Configuración del Entorno de Producción

### 1. Variables de Entorno (.env)

```env
# Base de datos - Configurar con tus datos reales
DB_HOST=localhost
DB_DIALECT=postgres
DB_USER=whaticket_prod
DB_PASS=[TU_PASSWORD_SEGURO]
DB_NAME=whaticket_prod
DB_PORT=5432

# JWT - GENERAR NUEVOS TOKENS SEGUROS
JWT_SECRET=[GENERAR_32_CARACTERES]
JWT_REFRESH_SECRET=[GENERAR_32_CARACTERES_DIFERENTES]

# Redis (recomendado para producción)
REDIS_URI=redis://localhost:6379
REDIS_OPT_LIMITER_MAX=10
REDIS_OPT_LIMITER_DURATION=60000

# URLs de producción
FRONTEND_URL=https://tudominio.com
BACKEND_URL=https://api.tudominio.com

# Configuración de producción
NODE_ENV=production
PORT=8080

# Límites para Colombia (ajustar según necesidades)
USER_LIMIT=100
CONNECTIONS_LIMIT=50

# Sistema de pagos DESHABILITADO para Colombia
PAYMENT_ENABLED=false
GERENCIANET_SANDBOX=true
GERENCIANET_CLIENT_ID=disabled
GERENCIANET_CLIENT_SECRET=disabled
GERENCIANET_PIX_CERT=disabled

# Configuración adicional
VERIFY_TOKEN=[GENERAR_TOKEN_VERIFICACION]
```

### 2. Generar Tokens Seguros

```bash
# Generar JWT secrets (ejecutar en servidor)
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('VERIFY_TOKEN=' + require('crypto').randomBytes(16).toString('hex'))"

# O usar OpenSSL
openssl rand -hex 32
```

## 👑 Configuración del Super Usuario

### Método 1: Via Base de Datos (Recomendado)

```sql
-- 1. Crear empresa principal (ID: 1)
INSERT INTO "Companies" (id, name, email, status, "createdAt", "updatedAt", "planId") 
VALUES (1, 'Administración Sistema', 'admin@tuempresa.com', true, NOW(), NOW(), 1);

-- 2. Crear super usuario
-- IMPORTANTE: Cambiar email y generar hash de password seguro
INSERT INTO "Users" (
  name, 
  email, 
  password, 
  profile, 
  "super", 
  "companyId",
  "createdAt",
  "updatedAt"
) VALUES (
  'Super Admin', 
  'admin@tuempresa.com',
  '[HASH_DE_PASSWORD_SEGURO]',
  'admin', 
  true, 
  1,
  NOW(),
  NOW()
);
```

### Método 2: Script de Configuración

```javascript
// scripts/createSuperUser.js
const bcrypt = require('bcrypt');

const createSuperUser = async () => {
  const password = 'TU_PASSWORD_TEMPORAL'; // Cambiar después del primer login
  const hashedPassword = await bcrypt.hash(password, 8);
  
  console.log('Hash para la base de datos:');
  console.log(hashedPassword);
};

createSuperUser();
```

## 🏢 Gestión de Empresas y Usuarios

### Panel de Administración

El super usuario puede:

#### 1. **Crear Empresas**
- Acceder a **Empresas** en el menú lateral
- Botón **Nueva Empresa**
- Configurar límites específicos por cliente

#### 2. **Gestionar Usuarios**
- Dentro de cada empresa: **Usuarios**
- Crear/editar/deshabilitar usuarios
- Asignar permisos y colas

#### 3. **Configurar WhatsApp**
- **Conexiones > WhatsApp**
- Múltiples números por empresa
- QR codes independientes

#### 4. **Controlar Límites**
- Usuarios por empresa
- Conexiones WhatsApp
- Colas de atención

## 🗄️ Base de Datos de Producción

### Configuración PostgreSQL

```sql
-- Crear usuario de base de datos
CREATE USER whaticket_prod WITH PASSWORD 'password_super_seguro_colombia';

-- Crear base de datos
CREATE DATABASE whaticket_prod OWNER whaticket_prod;

-- Otorgar permisos
GRANT ALL PRIVILEGES ON DATABASE whaticket_prod TO whaticket_prod;
```

### Migración de Datos

```bash
# En el servidor de producción
cd /path/to/whaticket

# Ejecutar migraciones
NODE_ENV=production npx sequelize db:migrate

# Ejecutar seeders (datos iniciales)
NODE_ENV=production npx sequelize db:seed:all
```

## 🌐 Configuración del Servidor

### Nginx (Recomendado)

```nginx
# /etc/nginx/sites-available/whaticket
server {
    listen 80;
    server_name tudominio.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name tudominio.com;
    
    # Certificados SSL
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/private.key;
    
    # Frontend (React build)
    location / {
        root /path/to/whaticket/frontend/build;
        try_files $uri $uri/ /index.html;
    }
    
    # API Backend
    location /api {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # WebSocket para Socket.IO
    location /socket.io {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### PM2 (Gestor de Procesos)

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'whaticket-backend',
    script: 'npm',
    args: 'start',
    cwd: '/path/to/whaticket/backend',
    env: {
      NODE_ENV: 'production',
      PORT: 8080
    },
    instances: 'max',
    exec_mode: 'cluster',
    watch: false,
    max_memory_restart: '1G',
    error_file: '/var/log/whaticket/err.log',
    out_file: '/var/log/whaticket/out.log',
    log_file: '/var/log/whaticket/combined.log',
    time: true
  }]
};
```

```bash
# Iniciar con PM2
pm2 start ecosystem.config.js
pm2 startup
pm2 save
```

## 📊 Modelo de Negocio Manual - Colombia

### Flujo de Trabajo

1. **Cliente Solicita Servicio**
   - Contacto comercial
   - Definir necesidades y límites

2. **Configuración por Super Admin**
   - Crear empresa en el panel
   - Configurar límites (usuarios, WhatsApp)
   - Crear usuario administrador del cliente

3. **Entrega al Cliente**
   - Credenciales de acceso
   - Capacitación básica
   - Soporte inicial

4. **Gestión Continua**
   - Monitoreo desde panel super admin
   - Ajustes de límites según crecimiento
   - Soporte técnico

### Escalabilidad

```env
# Ajustar límites según plan del cliente

# Plan Básico
USER_LIMIT=5
CONNECTIONS_LIMIT=1

# Plan Profesional  
USER_LIMIT=20
CONNECTIONS_LIMIT=3

# Plan Empresarial
USER_LIMIT=100
CONNECTIONS_LIMIT=10
```

## 🔒 Seguridad en Producción

### Checklist de Seguridad

- [ ] Cambiar todas las contraseñas por defecto
- [ ] Generar nuevos JWT secrets
- [ ] Configurar HTTPS con certificados válidos
- [ ] Configurar firewall (puertos 80, 443, 22)
- [ ] Backup automático de base de datos
- [ ] Logs de auditoría activados
- [ ] Rate limiting configurado
- [ ] Actualizaciones de seguridad del sistema

### Backup Automatizado

```bash
#!/bin/bash
# /scripts/backup.sh

# Backup base de datos
pg_dump -U whaticket_prod whaticket_prod > /backups/whaticket_$(date +%Y%m%d_%H%M%S).sql

# Backup archivos de medios
tar -czf /backups/media_$(date +%Y%m%d_%H%M%S).tar.gz /path/to/whaticket/backend/public

# Limpiar backups antiguos (más de 30 días)
find /backups -type f -mtime +30 -delete

# Cron job: 0 2 * * * /scripts/backup.sh
```

## 📈 Monitoreo

### Logs Importantes

```bash
# Ver logs de PM2
pm2 logs whaticket-backend

# Logs de Nginx
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# Logs de PostgreSQL
tail -f /var/log/postgresql/postgresql-13-main.log
```

### Métricas a Monitorear

- Uso de CPU y memoria
- Conexiones activas de WhatsApp
- Número de mensajes procesados
- Tiempo de respuesta de API
- Espacio en disco
- Conexiones a base de datos

## 📞 Soporte Post-Despliegue

### Comandos Útiles

```bash
# Reiniciar servicios
pm2 restart whaticket-backend
systemctl restart nginx
systemctl restart postgresql

# Ver estado
pm2 status
systemctl status nginx
systemctl status postgresql

# Actualizar aplicación
cd /path/to/whaticket
git pull origin main
cd backend && npm run build
pm2 restart whaticket-backend
```

### Resolución de Problemas

1. **Backend no inicia**: Verificar logs de PM2 y variables .env
2. **WhatsApp no conecta**: Verificar puertos y firewall
3. **Frontend no carga**: Verificar configuración Nginx
4. **DB no conecta**: Verificar credenciales y permisos PostgreSQL

---

**📝 Notas Importantes:**
- Cambiar TODAS las contraseñas por defecto antes de producción
- Generar tokens JWT únicos y seguros
- Configurar backup automático
- Monitorear logs regularmente
- Mantener el sistema actualizado

**🇨🇴 Contacto Colombia:**
- Email: admin@tuempresa.com
- Soporte: WhatsApp configurado en el sistema

> Última actualización: 27-06-2025  
> Versión: Producción Colombia - Manual Administration