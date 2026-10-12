<#
.SYNOPSIS
  Build+start the standby color with IMAGE_TAG=git SHA, healthcheck, then switch edge.
#>
param(
  [string]$ImageTag = "",
  [switch]$SkipSwitch,
  [switch]$StopPrevious
)

. "$PSScriptRoot\bg-common.ps1"

if (-not $ImageTag) { $ImageTag = Get-ImageTag }
$active = Get-ActiveColor
$standby = Get-StandbyColor -Active $active
$project = Get-AppProject $standby

Write-Host "Active=$active  Standby=$standby  IMAGE_TAG=$ImageTag"

Ensure-Network

# Ensure data + edge exist (idempotent).
Invoke-Compose -Project $DataProject -File "docker-compose.data.yml" `
  -ComposeArgs @("up", "-d") -EnvVars @{ IMAGE_TAG = $ImageTag }

$envVars = @{
  IMAGE_TAG    = $ImageTag
  DEPLOY_COLOR = $standby
}

Write-Host "==> Build & up $standby"
Invoke-Compose -Project $project -File "docker-compose.app.yml" `
  -ComposeArgs @("up", "-d", "--build") -EnvVars $envVars

Wait-ContainerHealthz -ContainerName "$standby-api-gateway" -Port 8080 -TimeoutSec 180
Wait-ContainerHealthz -ContainerName "$standby-demo-ui" -Path "/" -Port 80 -TimeoutSec 60

if (-not $SkipSwitch) {
  Write-Host "==> Switch edge -> $standby"
  & "$PSScriptRoot\bg-switch.ps1" -Color $standby

  if ($StopPrevious) {
    Write-Host "==> Stopping previous color $active"
    Invoke-Compose -Project (Get-AppProject $active) -File "docker-compose.app.yml" `
      -ComposeArgs @("stop") -EnvVars @{ DEPLOY_COLOR = $active; IMAGE_TAG = $ImageTag }
  } else {
    Write-Host "Previous color '$active' left running (standby). Rollback: .\deploy\scripts\bg-switch.ps1 -Color $active"
  }
} else {
  Write-Host "SkipSwitch: standby is up but edge still points to $active"
}

Write-Host "Deploy complete. Public traffic -> $(Get-ActiveColor) IMAGE_TAG=$ImageTag"
