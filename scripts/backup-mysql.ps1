param(
  [string]$ComposeEnvFile = ".env.prod",
  [string]$OutputDirectory = "backups"
)

$ErrorActionPreference = "Stop"
$workspaceRoot = Split-Path -Parent $PSScriptRoot
$resolvedOutput = [System.IO.Path]::GetFullPath((Join-Path $workspaceRoot $OutputDirectory))
$allowedRoot = [System.IO.Path]::GetFullPath($workspaceRoot) + [System.IO.Path]::DirectorySeparatorChar
if (-not $resolvedOutput.StartsWith($allowedRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
  throw "El directorio de backup debe estar dentro del workspace"
}

$envPath = [System.IO.Path]::GetFullPath((Join-Path $workspaceRoot $ComposeEnvFile))
if (-not (Test-Path -LiteralPath $envPath -PathType Leaf)) {
  throw "No existe el archivo de entorno indicado"
}

New-Item -ItemType Directory -Force -Path $resolvedOutput | Out-Null
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$temporaryFile = Join-Path $resolvedOutput "sicsa-$timestamp.sql.tmp"
$finalFile = Join-Path $resolvedOutput "sicsa-$timestamp.sql"

try {
  docker compose --env-file $envPath -f (Join-Path $workspaceRoot "docker-compose.prod.yml") exec -T mysql sh -c 'exec mysqldump --single-transaction --routines --triggers -uroot -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE"' | Set-Content -LiteralPath $temporaryFile -Encoding utf8
  if ($LASTEXITCODE -ne 0) { throw "mysqldump terminó con error" }
  $backup = Get-Item -LiteralPath $temporaryFile
  if ($backup.Length -le 0) { throw "El backup generado está vacío" }
  Move-Item -LiteralPath $temporaryFile -Destination $finalFile
  Get-FileHash -Algorithm SHA256 -LiteralPath $finalFile | Format-List
  Write-Output "Backup creado: $finalFile"
} finally {
  if (Test-Path -LiteralPath $temporaryFile) { Remove-Item -LiteralPath $temporaryFile }
}
