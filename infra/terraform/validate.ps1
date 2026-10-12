<#
.SYNOPSIS
  Classroom-safe Terraform check: init without remote backend + validate.
  Does not require AWS credentials or a paid apply.
#>
$ErrorActionPreference = "Stop"
$TfDir = $PSScriptRoot
Push-Location $TfDir
try {
  if (-not (Get-Command terraform -ErrorAction SilentlyContinue)) {
    throw "terraform CLI not found on PATH. Install Terraform to run validate."
  }
  Write-Host "==> terraform init -backend=false"
  terraform init -backend=false -input=false
  if ($LASTEXITCODE -ne 0) { throw "terraform init failed (exit $LASTEXITCODE)" }
  Write-Host "==> terraform validate"
  terraform validate
  if ($LASTEXITCODE -ne 0) { throw "terraform validate failed (exit $LASTEXITCODE)" }
  Write-Host "OK: Terraform configuration is syntactically valid."
  Write-Host "Optional (needs AWS creds, may show costs): terraform plan -var-file=env/local.tfvars.example"
  Write-Host "Do NOT run a full paid apply for classroom Free Tier - see README.md"
} finally {
  Pop-Location
}
