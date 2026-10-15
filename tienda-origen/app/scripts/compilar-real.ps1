# Compila la tienda en MODO REAL (con servidor) en dist-real/, para scripts/servidor-local.mjs.
# La URL del proyecto y la clave pública (anon, la que va en el navegador) se toman de un .env.local que ya las tenga
# y solo viven en el entorno de este proceso: no se escriben en ningún archivo ni se muestran.
#   powershell -File scripts/compilar-real.ps1 [-Origen "ruta\al\.env.local"]
param(
  [string]$Origen = 'C:\Users\PERSONAL\Documents\PROYECTOS\#EMPRESAS PERSONALIZADO\MODAS NATALI\SISTEMA DE NOTA\app\.env.local'
)
$ErrorActionPreference = 'Stop'
if (-not (Test-Path -LiteralPath $Origen)) { throw "No encuentro $Origen" }
$vars = @{}
foreach ($linea in Get-Content -LiteralPath $Origen) {
  if ($linea -match '^\s*(VITE_SUPABASE_URL|VITE_SUPABASE_ANON_KEY)\s*=\s*(.+?)\s*$') { $vars[$Matches[1]] = $Matches[2].Trim('"', "'") }
}
if (-not $vars['VITE_SUPABASE_URL'] -or -not $vars['VITE_SUPABASE_ANON_KEY']) { throw 'Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en el origen.' }
$env:VITE_SUPABASE_URL = $vars['VITE_SUPABASE_URL']
$env:VITE_SUPABASE_ANON_KEY = $vars['VITE_SUPABASE_ANON_KEY']
Write-Output ("Proyecto de la base: " + ([uri]$env:VITE_SUPABASE_URL).Host)
npx vite build --outDir dist-real --emptyOutDir
Remove-Item Env:\VITE_SUPABASE_URL, Env:\VITE_SUPABASE_ANON_KEY
