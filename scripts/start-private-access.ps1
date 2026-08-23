$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$tailscale = Join-Path $env:ProgramFiles "Tailscale\tailscale.exe"
$npm = (Get-Command npm.cmd -ErrorAction Stop).Source
$localUrl = "http://127.0.0.1:3211"
$runtimeRoot = Join-Path $env:LOCALAPPDATA "AgenticOS"
$pidFile = Join-Path $runtimeRoot "private-web.pid"

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
New-Item -ItemType Directory -Path $runtimeRoot -Force | Out-Null

if (-not (Test-Endpoint $localUrl)) {
  if (-not (Test-Path -LiteralPath (Join-Path $projectRoot ".next\BUILD_ID"))) {
    throw "Der Produktions-Build fehlt. Bitte im Projekt einmal npm run build ausfuehren."
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
Read-Host "Enter schliesst nur dieses Hinweisfenster"
