param(
  [string]$GatewayUrl = "http://localhost:8080",
  [string]$ServiceId = "11111111-1111-1111-1111-111111111111",
  [string]$ExpectedStatus = "CONFIRMED"
)

$ErrorActionPreference = "Stop"

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

Write-Host "==> issue JWT"
$tokenRes = Invoke-RestMethod -Method POST "$GatewayUrl/api/v1/auth/token" -ContentType "application/json" -Body (@{
  grant_type = "client_credentials"
  tenant_slug = "demo-salon"
  client_id = "demo-client"
  client_secret = "demo-secret"
} | ConvertTo-Json)
$token = $tokenRes.access_token
$headers = @{
  Authorization = "Bearer $token"
  "Idempotency-Key" = [guid]::NewGuid().ToString()
  "Content-Type" = "application/json"
}

$start = (Get-Date).ToUniversalTime().AddDays(1).ToString("yyyy-MM-ddT15:00:00Z")
Write-Host "==> hold slot service=$ServiceId start=$start"
$hold = Invoke-RestMethod -Method POST "$GatewayUrl/api/v1/schedules/hold" -Headers $headers -Body (@{
  service_id = $ServiceId
  start_time = $start
  customer_email = "customer@example.com"
  customer_phone = "+573001234567"
} | ConvertTo-Json)
$hold | ConvertTo-Json -Depth 5
$holdId = $hold.hold_id

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
Write-Host "E2E OK status=$final"
