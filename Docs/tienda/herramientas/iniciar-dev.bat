@echo off
rem El "#" de la carpeta "#EMPRESAS PERSONALIZADO" rompe Vite, los tests y PGlite.
rem Este script monta el repositorio como unidad S: (sin "#") y trabaja desde ahi.
rem Usa S: porque R: lo usa el iniciar-dev.bat de la carpeta TIENDA ONLINE: asi se pueden tener los dos a la vez.
rem
rem Uso:
rem   doble clic                      = servidor de desarrollo
rem   iniciar-dev.bat test            = los tests de Renzo (npx vitest run --root S:\app)
rem   iniciar-dev.bat build           = compilar
rem   iniciar-dev.bat demo            = compila y abre la demostracion local en http://localhost:4300 (tienda y /admin)
rem   iniciar-dev.bat node Docs\tienda\herramientas\probar-herramientas.mjs
subst S: /d >nul 2>&1
for %%I in ("%~dp0..\..\..") do subst S: "%%~fI"
cd /d S:\
if "%~1"=="" (
  cd /d S:\app
  npx vite S:\app
) else if /I "%~1"=="test" (
  cd /d S:\app
  npx vitest run --root S:\app
) else if /I "%~1"=="build" (
  cd /d S:\app
  npx vite build S:\app
) else if /I "%~1"=="demo" (
  cd /d S:\app
  set VITE_SUPABASE_URL=http://localhost:4300
  set VITE_SUPABASE_ANON_KEY=clave-publica-de-demostracion
  call npx vite build S:\app --outDir dist-demo --emptyOutDir
  set VITE_SUPABASE_URL=
  set VITE_SUPABASE_ANON_KEY=
  echo.
  echo Demostracion local: http://localhost:4300   (sistema: http://localhost:4300/admin)
  echo Ctrl+C para apagarla.
  echo.
  node S:\app\scripts\servidor-demo.mjs
) else (
  %*
)
