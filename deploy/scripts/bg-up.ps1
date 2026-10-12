<#
.SYNOPSIS
  Bootstrap local blue-green: network + data plane + blue (active) + edge.
#>
param(
  [string]$ImageTag = ""
)

. "$PSScriptRoot\bg-common.ps1"

if (-not $ImageTag) { $ImageTag = Get-ImageTag }
Write-Host "IMAGE_TAG=$ImageTag"
Write-Host "ComposeDir=$ComposeDir"

# Avoid port clashes with the single-stack compose.
$conflict = docker ps --format "{{.Names}} {{.Ports}}" 2>$null | Select-String -Pattern "nebulastack-api-gateway|0\.0\.0\.0:8080|0\.0\.0\.0:3000"
if ($conflict) {
  Write-Warning "Host ports 3000/8080 may already be in use. Stop single-stack with: docker compose -f deploy/compose/docker-compose.yml down"
}

Ensure-Network
Write-NginxConfig -Color "blue"

$envCommon = @{
  IMAGE_TAG    = $ImageTag
  DEPLOY_COLOR = "blue"
}

Write-Host "==> Data plane"
Invoke-Compose -Project $DataProject -File "docker-compose.data.yml" -ComposeArgs @("up", "-d", "--build") -EnvVars $envCommon
Wait-ContainerHealthz -ContainerName "nebulastack-external-mocks" -Port 8090
$deadline = (Get-Date).AddSeconds(90)
$h = ""
while ((Get-Date) -lt $deadline) {
  $h = docker inspect -f "{{.State.Health.Status}}" nebulastack-postgres 2>$null
  if ($h -eq "healthy") { break }
  Start-Sleep -Seconds 2
}
if ($h -ne "healthy") { throw "postgres not healthy" }
Write-Host "  OK postgres"

Write-Host "==> App plane (blue / active)"
Invoke-Compose -Project (Get-AppProject "blue") -File "docker-compose.app.yml" `
  -ComposeArgs @("up", "-d", "--build") -EnvVars $envCommon
Wait-ContainerHealthz -ContainerName "blue-api-gateway" -Port 8080 -TimeoutSec 180
Wait-ContainerHealthz -ContainerName "blue-demo-ui" -Path "/" -Port 80 -TimeoutSec 60

Write-Host "==> Edge"
Invoke-Compose -Project $EdgeProject -File "docker-compose.edge.yml" -ComposeArgs @("up", "-d", "--force-recreate")
Wait-Http -Url "http://localhost:8080/healthz" -TimeoutSec 60
Wait-Http -Url "http://localhost:3000/" -TimeoutSec 60

Write-Host ""
Write-Host "Blue-green ready. Active=blue IMAGE_TAG=$ImageTag"
Write-Host "  UI  http://localhost:3000"
Write-Host "  API http://localhost:8080/healthz"
Write-Host "Next: .\deploy\scripts\bg-deploy.ps1   # build standby, switch"
Write-Host "      .\deploy\scripts\bg-status.ps1"
