@echo off
echo Ejecutando migraciones y seeders de Whaticket...
echo.

echo [1/4] Creando base de datos...
call npx sequelize db:create
if %errorlevel% neq 0 (
    echo ERROR: No se pudo crear la base de datos
    echo Asegurate de que PostgreSQL este corriendo en puerto 5432
    pause
    exit /b 1
)

echo.
echo [2/4] Ejecutando migraciones...
call npx sequelize db:migrate
if %errorlevel% neq 0 (
    echo ERROR: Fallo en las migraciones
    pause
    exit /b 1
)

echo.
echo [3/4] Ejecutando seeders...
call npx sequelize db:seed:all
if %errorlevel% neq 0 (
    echo ERROR: Fallo en los seeders
    pause
    exit /b 1
)

echo.
echo [4/4] Verificando instalacion...
call npx sequelize db:migrate:status
call npx sequelize db:seed:status

echo.
echo ========================================
echo ✅ Base de datos configurada exitosamente!
echo ========================================
echo.
echo Login por defecto:
echo Email: admin@yourcompany.com
echo Password: 123456
echo.
echo URLs de acceso:
echo Frontend: http://localhost:3000
echo Backend: http://localhost:8080
echo.
pause