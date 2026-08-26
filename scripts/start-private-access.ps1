param([switch]$Refresh, [switch]$NoPrompt)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$tailscale = Join-Path $env:ProgramFiles "Tailscale\tailscale.exe"
$npm = (Get-Command npm.cmd -ErrorAction Stop).Source
$localUrl = "http://127.0.0.1:3211"
$runtimeRoot = Join-Path $env:LOCALAPPDATA "AgenticOS"
$pidFile = Join-Path $runtimeRoot "private-web.pid"
$authSecretFile = Join-Path $runtimeRoot "auth-secret"
$privateBuildDir = ".next-private"
$defaultVault = Join-Path $env:USERPROFILE "Documents\Obsidian Vault\Emre"
if (-not $env:AGENTIC_OS_OBSIDIAN_VAULT -and (Test-Path -LiteralPath $defaultVault)) {
  $env:AGENTIC_OS_OBSIDIAN_VAULT = $defaultVault
}

function Test-Endpoint([string]$Uri) {
  try {
    $response = Invoke-WebRequest -Uri $Uri -UseBasicParsing -TimeoutSec 3
    return $response.StatusCode -ge 200 -and $response.StatusCode -lt 500
  } catch {
    return $false
  }
}

if (-not (Test-Path -LiteralPath $tailscale)) {
  throw "Tailscale ist nicht installiert. Bitte zuerst die offizielle Windows-App installieren."
}

$status = (& $tailscale status --json | ConvertFrom-Json)
if ($status.BackendState -ne "Running" -or -not $status.Self.Online) {
  throw "Tailscale ist auf Windows noch nicht Connected. Bitte im Tailscale-Symbol auf Log in/Connect klicken."
}

$dnsName = [string]$status.Self.DNSName
$dnsName = $dnsName.TrimEnd(".")
if (-not $dnsName) {
  throw "Tailscale hat noch keinen MagicDNS-Namen geliefert."
}

$privateUrl = "https://${dnsName}"
$env:AGENTIC_OS_PRIVATE_HOST = $dnsName
$env:AGENTIC_OS_BUILD_DIR = $privateBuildDir
New-Item -ItemType Directory -Path $runtimeRoot -Force | Out-Null

# The private API requires a stable signing key. Keep it outside the repository
# and create it once for this Windows user when no explicit secret is supplied.
if (-not $env:AUTH_SECRET) {
  $localEnv = Join-Path $projectRoot ".env.local"
  if (Test-Path -LiteralPath $localEnv) {
    $configuredSecret = Get-Content -LiteralPath $localEnv |
      Where-Object { $_ -match '^AUTH_SECRET=(.+)$' } |
      Select-Object -First 1
    if ($configuredSecret -and $configuredSecret -match '^AUTH_SECRET=(.+)$') {
      $env:AUTH_SECRET = $matches[1]
    }
  }
}

if ($Refresh) {
  $listener = Get-NetTCPConnection -State Listen -LocalPort 3211 -ErrorAction SilentlyContinue |
    Select-Object -First 1
  if ($listener) {
    $runningServer = Get-CimInstance Win32_Process -Filter "ProcessId=$($listener.OwningProcess)"
    $escapedRoot = [regex]::Escape($projectRoot)
    if ($runningServer.CommandLine -notmatch $escapedRoot -or $runningServer.CommandLine -notmatch 'next.+3211') {
      throw "Port 3211 wird von einem anderen Prozess verwendet; sicherer Refresh wurde abgebrochen."
    }
    Stop-Process -Id $runningServer.ProcessId
    Start-Sleep -Seconds 1
  }
}
if (-not $env:AUTH_SECRET) {
  if (-not (Test-Path -LiteralPath $authSecretFile)) {
    $secretBytes = New-Object byte[] 48
    [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($secretBytes)
    [Convert]::ToBase64String($secretBytes) |
      Set-Content -LiteralPath $authSecretFile -Encoding ascii -NoNewline
  }
  $env:AUTH_SECRET = (Get-Content -LiteralPath $authSecretFile -Raw).Trim()
}
$env:APP_URL = $privateUrl

if (-not (Test-Endpoint $localUrl)) {
  if ($Refresh -or -not (Test-Path -LiteralPath (Join-Path $projectRoot "$privateBuildDir\BUILD_ID"))) {
    & $npm run build
    if ($LASTEXITCODE -ne 0) {
      throw "Der private Produktions-Build konnte nicht erstellt werden."
    }
    # Next rewrites this generated pointer to the active distDir. Keep the
    # tracked source pointer stable for normal desktop/CI builds.
    $nextEnv = Join-Path $projectRoot "next-env.d.ts"
    $nextEnvSource = @(
      '/// <reference types="next" />',
      '/// <reference types="next/image-types/global" />',
      'import "./.next/types/routes.d.ts";',
      '',
      '// NOTE: This file should not be edited',
      '// see https://nextjs.org/docs/app/api-reference/config/typescript for more information.',
      ''
    ) -join [Environment]::NewLine
    [IO.File]::WriteAllText($nextEnv, $nextEnvSource, [Text.UTF8Encoding]::new($false))
  }

  $server = Start-Process -FilePath $npm -ArgumentList @("run", "start:private-web") -WorkingDirectory $projectRoot -WindowStyle Hidden -PassThru
  Set-Content -LiteralPath $pidFile -Value $server.Id -Encoding ascii

  $ready = $false
  for ($attempt = 0; $attempt -lt 40; $attempt++) {
    Start-Sleep -Milliseconds 500
    if (Test-Endpoint $localUrl) {
      $ready = $true
      break
    }
  }
  if (-not $ready) {
    throw "Der lokale private Webdienst konnte nicht gestartet werden."
  }
}

& $tailscale serve --bg --yes $localUrl
if ($LASTEXITCODE -ne 0) {
  throw "Tailscale Serve konnte nicht privat aktiviert werden. Funnel wurde nicht verwendet."
}

$serveReady = $false
for ($attempt = 0; $attempt -lt 30; $attempt++) {
  Start-Sleep -Milliseconds 500
  if (Test-Endpoint $privateUrl) {
    $serveReady = $true
    break
  }
}
if (-not $serveReady) {
  throw "Die private HTTPS-Adresse ist noch nicht erreichbar. Pruefe MagicDNS/HTTPS in Tailscale."
}

Write-Host ""
Write-Host "  AGENTIC OS - PRIVATER FERNZUGRIFF" -ForegroundColor Cyan
Write-Host "  Privat erreichbar: $privateUrl" -ForegroundColor Green
Write-Host "  Ziel auf diesem Laptop: $localUrl" -ForegroundColor DarkCyan
Write-Host ""
Write-Host "  Nur Tailnet-Geraete koennen zugreifen. Funnel ist AUS." -ForegroundColor Yellow
Write-Host "  Der Laptop muss eingeschaltet, wach und am Strom bleiben."
Write-Host "  Run Unattended wird nicht automatisch aktiviert."
Write-Host ""
if (-not $NoPrompt) { Read-Host "Enter schliesst nur dieses Hinweisfenster" }
