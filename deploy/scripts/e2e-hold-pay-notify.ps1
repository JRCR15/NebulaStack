param(
  [string]$GatewayUrl = "http://localhost:8080",
  [string]$TenantSlug = "cda",
  [string]$ServiceId = "cda11111-1111-4111-8111-111111111111",
  [string]$ExpectedStatus = "CONFIRMED",
  [string]$ComposeDir = "",
  [switch]$SkipDbAsserts
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

function Assert-Persistence {
  param(
    [string]$HoldId,
    [string]$ServiceId,
    [string]$ExpectedStatus,
    [string]$CustomerEmail,
    [string]$StartIso
  )

  Write-Host "==> assert Postgres appointments + outbox"
  $apptSql = "SELECT status, customer_email, service_id::text FROM appointments WHERE id = '$HoldId';"
  $apptOut = Get-ComposeOutput -ComposeArgs @(
    "exec", "-T", "postgres", "psql", "-U", "nebulastack", "-d", "nebulastack", "-At", "-F", "|", "-c", $apptSql
  )
  if (-not $apptOut) { throw "appointment $HoldId not found in Postgres" }
  $parts = $apptOut -split "\|"
  $dbStatus = $parts[0].Trim()
  $dbEmail = $parts[1].Trim()
  $dbService = $parts[2].Trim()
  if ($dbStatus -ne $ExpectedStatus) {
    throw "Postgres status expected $ExpectedStatus got $dbStatus"
  }
  if ($dbEmail -ne $CustomerEmail) {
    throw "Postgres customer_email expected $CustomerEmail got $dbEmail"
  }
  if ($dbService -ne $ServiceId) {
    throw "Postgres service_id expected $ServiceId got $dbService"
  }
  Write-Host "  appointments OK status=$dbStatus"

  $outboxSql = "SELECT COUNT(*)::text FROM outbox_events WHERE aggregate_id = '$HoldId' AND event_type = 'nebula.scheduling.hold.created' AND processed = true;"
  $outboxCount = (Get-ComposeOutput -ComposeArgs @(
    "exec", "-T", "postgres", "psql", "-U", "nebulastack", "-d", "nebulastack", "-At", "-c", $outboxSql
  )).Trim()
  if ([int]$outboxCount -lt 1) {
    throw "outbox_events: expected processed nebula.scheduling.hold.created for $HoldId"
  }
  Write-Host "  outbox_events OK processed=$outboxCount"

  if ($ExpectedStatus -eq "CONFIRMED") {
    Write-Host "==> assert Mongo conversation_logs"
    $mongoEval = "const n=db.conversation_logs.countDocuments({appointment_id:'$HoldId',status:'SENT'}); print(n);"
    $mongoCount = (Get-ComposeOutput -ComposeArgs @(
      "exec", "-T", "mongo", "mongosh", "nebulastack", "--quiet", "--eval", $mongoEval
    )).Trim()
    if ([int]$mongoCount -lt 1) {
      throw "Mongo conversation_logs: expected SENT log for appointment_id=$HoldId"
    }
    Write-Host "  conversation_logs OK count=$mongoCount"
  } else {
    Write-Host "==> skip Mongo SENT assert (expected $ExpectedStatus)"
  }

  Write-Host "==> assert Redis slot lock"
  $tenantId = (Get-ComposeOutput -ComposeArgs @(
    "exec", "-T", "postgres", "psql", "-U", "nebulastack", "-d", "nebulastack", "-At", "-c",
    "SELECT tenant_id::text FROM appointments WHERE id = '$HoldId';"
  )).Trim()
  $startKey = ([datetime]::Parse($StartIso, [System.Globalization.CultureInfo]::InvariantCulture)).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
  $redisKey = "tenant:${tenantId}:slot:${ServiceId}:${startKey}"
  $exists = (Get-ComposeOutput -ComposeArgs @("exec", "-T", "redis", "redis-cli", "EXISTS", $redisKey)).Trim()
  if ($ExpectedStatus -eq "CANCELLED") {
    if ($exists -ne "0") {
      throw "Redis: expected lock released for CANCELLED key=$redisKey"
    }
    Write-Host "  Redis OK lock released ($redisKey)"
  } else {
    Write-Host "  Redis note: key=$redisKey exists=$exists (CONFIRMED may keep lock until HOLD TTL)"
  }
}

Write-Host "==> waiting for gateway"
$ok = $false
for ($i = 1; $i -le 90; $i++) {
  try {
    Invoke-RestMethod "$GatewayUrl/healthz" | Out-Null
    $ok = $true
    break
  } catch {
    Start-Sleep -Seconds 2
  }
}
if (-not $ok) { throw "gateway not healthy" }

Write-Host "==> issue JWT tenant=$TenantSlug"
$tokenRes = Invoke-RestMethod -Method POST "$GatewayUrl/api/v1/auth/token" -ContentType "application/json" -Body (@{
  grant_type = "client_credentials"
  tenant_slug = $TenantSlug
  client_id = "demo-client"
  client_secret = "demo-secret"
} | ConvertTo-Json)
$token = $tokenRes.access_token
$headers = @{
  Authorization = "Bearer $token"
  "Idempotency-Key" = [guid]::NewGuid().ToString()
  "Content-Type" = "application/json"
}

$customerEmail = "customer@$TenantSlug.example"
$start = (Get-Date).ToUniversalTime().AddDays(1)
$start = Get-Date -Year $start.Year -Month $start.Month -Day $start.Day -Hour 15 -Minute (Get-Random -Maximum 50) -Second 0
$startIso = $start.ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
Write-Host "==> hold slot service=$ServiceId start=$startIso"
$hold = Invoke-RestMethod -Method POST "$GatewayUrl/api/v1/schedules/hold" -Headers $headers -Body (@{
  service_id = $ServiceId
  start_time = $startIso
  customer_email = $customerEmail
  customer_phone = "+573001234567"
} | ConvertTo-Json)
$hold | ConvertTo-Json -Depth 5
$holdId = $hold.hold_id
if (-not $holdId) { throw "hold failed: missing hold_id" }

$final = $null
for ($i = 1; $i -le 30; $i++) {
  $appt = Invoke-RestMethod "$GatewayUrl/api/v1/schedules/appointments/$holdId" -Headers @{ Authorization = "Bearer $token" }
  Write-Host "  try $i status=$($appt.status)"
  if ($appt.status -eq "CONFIRMED" -or $appt.status -eq "CANCELLED") {
    $final = $appt.status
    $appt | ConvertTo-Json -Depth 5
    break
  }
  Start-Sleep -Seconds 2
}

if (-not $final) { throw "E2E timeout" }
if ($final -ne $ExpectedStatus) { throw "expected $ExpectedStatus got $final" }

if (-not $SkipDbAsserts) {
  Assert-Persistence -HoldId $holdId -ServiceId $ServiceId -ExpectedStatus $ExpectedStatus -CustomerEmail $customerEmail -StartIso $startIso
} else {
  Write-Host "==> SkipDbAsserts enabled"
}

Write-Host "E2E OK status=$final tenant=$TenantSlug hold_id=$holdId"
