<#
.SYNOPSIS
  Point edge nginx at blue or green (rollback = switch back to previous color).
#>
param(
  [Parameter(Mandatory)]
  [ValidateSet("blue", "green")]
  [string]$Color
)

. "$PSScriptRoot\bg-common.ps1"

$gw = "$Color-api-gateway"
$running = docker inspect -f "{{.State.Running}}" $gw 2>$null
if ($running -ne "true") {
  throw "Container $gw is not running. Deploy that color first (bg-deploy / bg-up)."
}

Write-NginxConfig -Color $Color

# Recreate or reload edge so the mounted nginx.conf is re-read.
$edgeRunning = docker inspect -f "{{.State.Running}}" nebulastack-edge 2>$null
if ($edgeRunning -eq "true") {
  # Bind-mount updates are visible; reload picks up new upstreams.
  docker exec nebulastack-edge nginx -s reload
  if ($LASTEXITCODE -ne 0) {
    Write-Host "Reload failed; recreating edge..."
    Invoke-Compose -Project $EdgeProject -File "docker-compose.edge.yml" -ComposeArgs @("up", "-d", "--force-recreate")
  }
} else {
  Invoke-Compose -Project $EdgeProject -File "docker-compose.edge.yml" -ComposeArgs @("up", "-d")
}

Wait-Http -Url "http://localhost:8080/healthz" -TimeoutSec 45
Write-Host "Switched active color -> $Color"
