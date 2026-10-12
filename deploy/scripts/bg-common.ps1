# Shared helpers for blue-green scripts. Dot-source from bg-*.ps1

$ErrorActionPreference = "Stop"

$Script:RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$Script:ComposeDir = (Resolve-Path (Join-Path $PSScriptRoot "..\compose")).Path
$Script:EdgeDir = Join-Path $ComposeDir "edge"
$Script:ActiveColorFile = Join-Path $EdgeDir "active-color"
$Script:NginxTemplate = Join-Path $EdgeDir "nginx.conf.template"
$Script:NginxConf = Join-Path $EdgeDir "nginx.conf"
$Script:NetworkName = "nebulastack-net"
$Script:DataProject = "nebulastack-data"
$Script:EdgeProject = "nebulastack-edge"

function Get-ImageTag {
  Push-Location $Script:RepoRoot
  try {
    $sha = (git rev-parse --short HEAD 2>$null)
    if (-not $sha) { return "local" }
    return $sha.Trim()
  } finally {
    Pop-Location
  }
}

function Get-ActiveColor {
  if (-not (Test-Path $Script:ActiveColorFile)) { return "blue" }
  $c = (Get-Content -Raw $Script:ActiveColorFile).Trim().ToLowerInvariant()
  if ($c -ne "blue" -and $c -ne "green") {
    throw "Invalid active color '$c' (expected blue|green)"
  }
  return $c
}

function Get-StandbyColor {
  param([string]$Active)
  if ($Active -eq "blue") { return "green" }
  return "blue"
}

function Get-AppProject {
  param([string]$Color)
  return "nebulastack-$Color"
}

function Ensure-Network {
  $exists = docker network ls --format "{{.Name}}" | Where-Object { $_ -eq $Script:NetworkName }
  if (-not $exists) {
    Write-Host "Creating network $($Script:NetworkName)..."
    docker network create $Script:NetworkName | Out-Null
  }
}

function Write-Utf8NoBom {
  param([string]$Path, [string]$Content)
  $utf8 = New-Object System.Text.UTF8Encoding $false
  [System.IO.File]::WriteAllText($Path, $Content, $utf8)
}

function Write-NginxConfig {
  param([Parameter(Mandatory)][ValidateSet("blue", "green")][string]$Color)
  $tpl = Get-Content -Raw $Script:NginxTemplate
  $conf = $tpl.Replace("ACTIVE_COLOR", $Color)
  Write-Utf8NoBom -Path $Script:NginxConf -Content $conf
  Write-Utf8NoBom -Path $Script:ActiveColorFile -Content "$Color`n"
  Write-Host "Edge config -> active=$Color"
}

function Invoke-Compose {
  param(
    [Parameter(Mandatory)][string]$Project,
    [Parameter(Mandatory)][string]$File,
    [Parameter(Mandatory)][string[]]$ComposeArgs,
    [hashtable]$EnvVars = @{}
  )
  Push-Location $Script:ComposeDir
  try {
    foreach ($k in $EnvVars.Keys) {
      Set-Item -Path "Env:$k" -Value $EnvVars[$k]
    }
    & docker compose -p $Project -f $File @ComposeArgs
    if ($LASTEXITCODE -ne 0) {
      throw "docker compose -p $Project -f $File $($ComposeArgs -join ' ') failed (exit $LASTEXITCODE)"
    }
  } finally {
    Pop-Location
  }
}

function Wait-ContainerHealthz {
  param(
    [Parameter(Mandatory)][string]$ContainerName,
    [string]$Path = "/healthz",
    [int]$Port = 8080,
    [int]$TimeoutSec = 120
  )
  $deadline = (Get-Date).AddSeconds($TimeoutSec)
  Write-Host "Waiting for $ContainerName http://127.0.0.1:${Port}${Path} ..."
  while ((Get-Date) -lt $deadline) {
    $running = docker inspect -f "{{.State.Running}}" $ContainerName 2>$null
    if ($running -eq "true") {
      docker exec $ContainerName wget -qO- "http://127.0.0.1:${Port}${Path}" 2>$null | Out-Null
      if ($LASTEXITCODE -eq 0) {
        Write-Host "  OK $ContainerName"
        return
      }
    }
    Start-Sleep -Seconds 3
  }
  throw "Timeout waiting for $ContainerName"
}

function Wait-Http {
  param(
    [Parameter(Mandatory)][string]$Url,
    [int]$TimeoutSec = 60
  )
  $deadline = (Get-Date).AddSeconds($TimeoutSec)
  Write-Host "Waiting for $Url ..."
  while ((Get-Date) -lt $deadline) {
    try {
      $r = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 5
      if ($r.StatusCode -ge 200 -and $r.StatusCode -lt 500) {
        Write-Host "  OK $Url ($($r.StatusCode))"
        return
      }
    } catch {
      # retry
    }
    Start-Sleep -Seconds 2
  }
  throw "Timeout waiting for $Url"
}
