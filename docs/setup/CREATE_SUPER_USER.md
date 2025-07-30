# 👑 Crear Super Usuario - Guía Rápida

## 🎯 Método Recomendado para Producción

### 1. Generar Hash de Contraseña

```javascript
// Ejecutar en Node.js para generar hash seguro
const bcrypt = require('bcrypt');

const generateHash = async () => {
  const password = 'TU_PASSWORD_TEMPORAL_SEGURO'; // Cambiar por tu password
  const hash = await bcrypt.hash(password, 8);
  console.log('Hash para BD:', hash);
};

generateHash();
```

### 2. Ejecutar en Base de Datos

```sql
-- 1. Crear empresa principal (si no existe)
INSERT INTO "Companies" (
  id, 
  name, 
  email, 
  status, 
  "planId",
  "createdAt", 
  "updatedAt"
) VALUES (
  1, 
  'Administración Colombia', 
  'admin@tuempresa.com', 
  true, 
  1,
  NOW(), 
  NOW()
);

-- 2. Crear super usuario
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
  'Super Admin Colombia', 
  'admin@tuempresa.com',
  '$2b$08$HASH_GENERADO_EN_PASO_1',  -- Reemplazar con el hash real
  'admin', 
  true, 
  1,
  NOW(),
  NOW()
);
```

### 3. Verificar Creación

```sql
-- Verificar que se creó correctamente
SELECT id, name, email, profile, super, "companyId" 
FROM "Users" 
WHERE "super" = true;
```

## 🔐 Cambiar Contraseña Después del Primer Login

1. **Login** con credenciales temporales
2. Ir a **Perfil/Configuración**
3. **Cambiar contraseña** por una definitiva
4. **Logout** y login con nueva contraseña

## ⚙️ Configurar Sistema para Colombia

### En el Panel Super Admin:

#### 1. **Configuración General**
- Ir a **Configuraciones**
- Establecer límites por defecto:
  - Usuarios por empresa: 50
  - Conexiones WhatsApp: 10

#### 2. **Crear Primera Empresa Cliente**
- **Empresas** > **Nueva Empresa**
- Nombre: "Cliente Prueba"
- Email: cliente@ejemplo.com
- Límites personalizados

#### 3. **Gestión de Usuarios**
- Dentro de la empresa: **Usuarios**
- Crear admin para el cliente
- Asignar permisos adecuados

## 🚀 Flujo de Trabajo Productivo

### Para Cada Cliente Nuevo:

1. **Crear Empresa** desde super admin
2. **Configurar límites** según plan contratado
3. **Crear usuario admin** del cliente
4. **Entregar credenciales** al cliente
5. **Cliente configura** sus WhatsApp y usuarios

### Planes Sugeridos Colombia:

```
Plan Básico:
- 5 usuarios
- 1 WhatsApp
- Soporte básico

Plan Profesional:
- 20 usuarios  
- 3 WhatsApp
- Soporte prioritario

Plan Empresarial:
- 100 usuarios
- 10 WhatsApp
- Soporte 24/7
```

## 🔧 Script de Automatización (Opcional)

```bash
#!/bin/bash
# create_client.sh

echo "=== Crear Cliente Nuevo ==="
read -p "Nombre de la empresa: " company_name
read -p "Email de contacto: " company_email
read -p "Usuarios límite: " user_limit
read -p "WhatsApp límite: " whatsapp_limit

# Ejecutar SQL para crear empresa y usuario
psql -U whaticket_prod -d whaticket_prod -c "
INSERT INTO \"Companies\" (name, email, status, \"planId\", \"createdAt\", \"updatedAt\") 
VALUES ('$company_name', '$company_email', true, 1, NOW(), NOW());
"

echo "✅ Cliente '$company_name' creado exitosamente"
echo "📧 Email: $company_email"
echo "👥 Límite usuarios: $user_limit"
echo "📱 Límite WhatsApp: $whatsapp_limit"
```

---

**⚠️ Importante:**
- Cambiar **TODAS** las contraseñas temporales
- Usar emails reales para recuperación
- Configurar backup antes de crear usuarios
- Documentar credenciales de forma segura

**🇨🇴 Listo para Colombia!**