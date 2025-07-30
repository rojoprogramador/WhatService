# 🗄️ Configuración de Base de Datos

## 1. Iniciar PostgreSQL

### Windows - Servicio:
```bash
net start postgresql-x64-13
# o
net start postgresql-x64-14
# o
net start postgresql-x64-15
```

### Windows - Docker:
```bash
docker run --name whaticket-postgres \
  -e POSTGRES_PASSWORD=camilodev1993 \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_DB=whatcrmviper \
  -p 5432:5432 -d postgres:13
```

### Verificar que PostgreSQL está corriendo:
```bash
# Test de conexión
telnet localhost 5432
# O
pg_isready -h localhost -p 5432
```

## 2. Crear Base de Datos

```bash
cd backend

# Crear la base de datos
npx sequelize db:create

# Ejecutar migraciones (estructura de tablas)
npx sequelize db:migrate

# Ejecutar seeders (datos iniciales)
npx sequelize db:seed:all
```

## 3. Verificar Instalación

```bash
# Verificar tablas creadas
npx sequelize db:migrate:status

# Verificar seeders ejecutados  
npx sequelize db:seed:status
```

## 4. Login por Defecto

Después de los seeders:
- **Email**: `admin@yourcompany.com`  
- **Password**: `123456`

## 5. Reiniciar Base de Datos (si es necesario)

```bash
# Eliminar base de datos
npx sequelize db:drop

# Recrear todo desde cero
npx sequelize db:create
npx sequelize db:migrate  
npx sequelize db:seed:all
```

## Troubleshooting

### Error "database does not exist":
```bash
# Crear manualmente con psql
psql -U postgres -h localhost
CREATE DATABASE whatcrmviper;
\q
```

### Error de permisos:
```bash
# Conectar como superuser y dar permisos
psql -U postgres -h localhost
GRANT ALL PRIVILEGES ON DATABASE whatcrmviper TO postgres;
\q
```