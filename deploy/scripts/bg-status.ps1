<#
.SYNOPSIS
  Show active color, fleet health, and image tags.
#>
. "$PSScriptRoot\bg-common.ps1"

$active = Get-ActiveColor
$tagHint = Get-ImageTag

Write-Host "=== NebulaStack blue-green status ==="
Write-Host "Active color (edge): $active"
Write-Host "Repo HEAD (short):   $tagHint"
Write-Host ""

function Show-Container {
  param([string]$Name)
  $exists = docker inspect $Name 2>$null
  if (-not $exists) {
    Write-Host ("  {0,-36} missing" -f $Name)
    return
  }
  $running = docker inspect -f "{{.State.Running}}" $Name
  $health = docker inspect -f "{{if .State.Health}}{{.State.Health.Status}}{{else}}n/a{{end}}" $Name
  $image = docker inspect -f "{{.Config.Image}}" $Name
  Write-Host ("  {0,-36} running={1,-5} health={2,-10} image={3}" -f $Name, $running, $health, $image)
}

Write-Host "Data plane"
@(
  "nebulastack-postgres",
  "nebulastack-redis",
  "nebulastack-rabbitmq",
  "nebulastack-mongo",
  "nebulastack-external-mocks"
) | ForEach-Object { Show-Container $_ }

Write-Host ""
Write-Host "App blue"
@(
  "blue-api-gateway",
  "blue-scheduling-engine",
  "blue-payment-orchestrator",
  "blue-notification-service",
  "blue-demo-ui"
) | ForEach-Object { Show-Container $_ }

Write-Host ""
Write-Host "App green"
@(
  "green-api-gateway",
  "green-scheduling-engine",
  "green-payment-orchestrator",
  "green-notification-service",
  "green-demo-ui"
) | ForEach-Object { Show-Container $_ }

Write-Host ""
Write-Host "Edge"
Show-Container "nebulastack-edge"

Write-Host ""
try {
  $r = Invoke-WebRequest -Uri "http://localhost:8080/healthz" -UseBasicParsing -TimeoutSec 5
  Write-Host "Public API /healthz -> $($r.StatusCode) $($r.Content)"
} catch {
  Write-Host "Public API /healthz -> unreachable ($($_.Exception.Message))"
}
