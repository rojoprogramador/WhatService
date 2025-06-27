@echo off
echo Verificando estado del sistema Whaticket...
echo.

echo [1/4] Verificando Node.js...
node --version
if %errorlevel% neq 0 (
    echo ERROR: Node.js no está instalado
    pause
    exit /b 1
)

echo.
echo [2/4] Verificando PostgreSQL...
pg_isready -h localhost -p 5432
if %errorlevel% neq 0 (
    echo ERROR: PostgreSQL no está corriendo en puerto 5432
    echo Ejecuta: net start postgresql-x64-13
    pause
    exit /b 1
)

echo.
echo [3/4] Verificando Backend...
cd backend
if exist "dist\app.js" (
    echo ✅ Backend compilado
) else (
    echo ❌ Backend no compilado - ejecuta: npm run build
)

echo.
echo [4/4] Verificando Frontend...
cd ..\frontend
if exist "node_modules" (
    echo ✅ Frontend dependencies instaladas
) else (
    echo ❌ Frontend dependencies no instaladas - ejecuta: npm install --legacy-peer-deps
)

echo.
echo ========================================
echo Sistema listo para ejecutar migraciones
echo ========================================
pause