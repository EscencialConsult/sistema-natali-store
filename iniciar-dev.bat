@echo off
rem El "#" de la carpeta "#EMPRESAS PERSONALIZADO" rompe Vite (dev y tests).
rem Se monta esta carpeta como unidad R: (sin "#") y se trabaja desde ahi.
rem Uso: doble clic = servidor de desarrollo. Con argumentos: iniciar-dev.bat npm test  /  iniciar-dev.bat npm run build
subst R: /d >nul 2>&1
for %%I in ("%~dp0.") do subst R: "%%~fI"
cd /d R:\app
if "%~1"=="" (npm run dev) else (%*)
