@echo off
rem El "#" de la carpeta "#EMPRESAS PERSONALIZADO" rompe Vite, los tests y PGlite.
rem Este script monta el repositorio como unidad S: (sin "#") y trabaja desde ahi.
rem Usa S: porque R: lo usa el iniciar-dev.bat de la carpeta TIENDA ONLINE: asi se pueden tener los dos a la vez.
rem
rem Uso:
rem   doble clic                      = servidor de desarrollo
rem   iniciar-dev.bat test            = los tests de Renzo (npx vitest run --root S:\app)
rem   iniciar-dev.bat build           = compilar
rem   iniciar-dev.bat node Docs\tienda\herramientas\probar-herramientas.mjs
subst S: /d >nul 2>&1
for %%I in ("%~dp0..\..\..") do subst S: "%%~fI"
cd /d S:\
if "%~1"=="" (
  cd /d S:\app
  npx vite --root S:\app
) else if /I "%~1"=="test" (
  cd /d S:\app
  npx vitest run --root S:\app
) else if /I "%~1"=="build" (
  cd /d S:\app
  npx vite build --root S:\app
) else (
  %*
)
