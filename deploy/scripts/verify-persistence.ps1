param(
  [Parameter(Mandatory = $true)][string]$HoldId,
  [string]$ComposeDir = ""
)

$ErrorActionPreference = "Stop"

if (-not $ComposeDir) {
  $ComposeDir = Join-Path $PSScriptRoot "..\compose"
}
$ComposeDir = (Resolve-Path $ComposeDir).Path

function Get-ComposeOutput {
  param([string[]]$ComposeArgs)
  Push-Location $ComposeDir
  try {
    $out = & docker compose @ComposeArgs 2>&1 | Out-String
    if ($LASTEXITCODE -ne 0) {
      throw "docker compose $($ComposeArgs -join ' ') failed: $out"
    }
    return $out.Trim()
  } finally {
    Pop-Location
  }
}

Write-Host "==> appointment $HoldId"
Get-ComposeOutput -ComposeArgs @(
  "exec", "-T", "postgres", "psql", "-U", "nebulastack", "-d", "nebulastack", "-c",
  "SELECT id, tenant_id, service_id, status, customer_email, customer_phone, amount, currency, start_time, updated_at FROM appointments WHERE id = '$HoldId';"
)

Write-Host "`n==> outbox_events"
Get-ComposeOutput -ComposeArgs @(
  "exec", "-T", "postgres", "psql", "-U", "nebulastack", "-d", "nebulastack", "-c",
  "SELECT id, event_type, processed, created_at FROM outbox_events WHERE aggregate_id = '$HoldId' ORDER BY created_at;"
)

Write-Host "`n==> conversation_logs (Mongo)"
Get-ComposeOutput -ComposeArgs @(
  "exec", "-T", "mongo", "mongosh", "nebulastack", "--quiet", "--eval",
  "db.conversation_logs.find({appointment_id:'$HoldId'}).sort({created_at:-1}).limit(5).toArray()"
)

$row = Get-ComposeOutput -ComposeArgs @(
  "exec", "-T", "postgres", "psql", "-U", "nebulastack", "-d", "nebulastack", "-At", "-F", "|", "-c",
  "SELECT tenant_id::text, service_id::text, to_char(start_time AT TIME ZONE 'UTC', 'YYYY-MM-DD""T""HH24:MI:SS""Z""') FROM appointments WHERE id = '$HoldId';"
)
if ($row) {
  $p = $row -split "\|"
  $redisKey = "tenant:$($p[0].Trim()):slot:$($p[1].Trim()):$($p[2].Trim())"
  Write-Host "`n==> Redis EXISTS $redisKey"
  Get-ComposeOutput -ComposeArgs @("exec", "-T", "redis", "redis-cli", "EXISTS", $redisKey)
}
