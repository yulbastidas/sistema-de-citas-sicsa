param(
  [Parameter(Mandatory = $true)][string]$BackupFile,
  [string]$ComposeEnvFile = ".env.prod",
  [switch]$AllowProductionDatabase
)

$ErrorActionPreference = "Stop"
$workspaceRoot = Split-Path -Parent $PSScriptRoot
$backupPath = [System.IO.Path]::GetFullPath((Join-Path $workspaceRoot $BackupFile))
$allowedRoot = [System.IO.Path]::GetFullPath($workspaceRoot) + [System.IO.Path]::DirectorySeparatorChar
if (-not $backupPath.StartsWith($allowedRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
  throw "El backup debe estar dentro del workspace"
}
if (-not (Test-Path -LiteralPath $backupPath -PathType Leaf)) { throw "Backup inexistente" }
if ((Get-Item -LiteralPath $backupPath).Length -le 0) { throw "Backup vacío" }
if (-not $AllowProductionDatabase) {
  throw "Restore bloqueado por defecto. Use una base temporal y -AllowProductionDatabase solo tras verificar explícitamente el destino."
}

$envPath = [System.IO.Path]::GetFullPath((Join-Path $workspaceRoot $ComposeEnvFile))
Get-Content -Raw -LiteralPath $backupPath | docker compose --env-file $envPath -f (Join-Path $workspaceRoot "docker-compose.prod.yml") exec -T mysql sh -c 'exec mysql -uroot -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE"'
if ($LASTEXITCODE -ne 0) { throw "mysql restore terminó con error" }
Write-Output "Restore finalizado; ejecute comprobaciones de tablas y datos antes de habilitar escrituras."
