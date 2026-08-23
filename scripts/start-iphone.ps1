$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$mobileRoot = Join-Path $projectRoot "apps\mobile"
$npm = (Get-Command npm.cmd -ErrorAction Stop).Source

$lanAddress = Get-NetIPConfiguration |
  Where-Object { $_.IPv4DefaultGateway -and $_.NetAdapter.Status -eq "Up" } |
  ForEach-Object { $_.IPv4Address.IPAddress } |
  Where-Object { $_ -and $_ -notlike "169.254.*" } |
  Select-Object -First 1

if (-not $lanAddress) {
  throw "Keine aktive WLAN/LAN-Adresse gefunden. Bitte zuerst mit dem WLAN verbinden."
}

$webUrl = "http://${lanAddress}:3000"
$env:EXPO_PUBLIC_AGENTIC_OS_URL = $webUrl
$env:AGENTIC_OS_LAN_HOST = $lanAddress
$startedWeb = $null

Write-Host ""
Write-Host "  AGENTIC OS - IPHONE COMPANION" -ForegroundColor Cyan
Write-Host "  Lokale Adresse: $webUrl" -ForegroundColor DarkCyan
Write-Host ""
Write-Host "  1. Laptop und iPhone muessen im selben WLAN sein."
Write-Host "  2. Expo Go auf dem iPhone oeffnen."
Write-Host "  3. Den gleich erscheinenden QR-Code mit der Kamera scannen."
Write-Host "  4. Dieses Fenster waehrend der Nutzung offen lassen."
Write-Host ""

try {
  $existing = $false
  try {
    $response = Invoke-WebRequest -Uri $webUrl -UseBasicParsing -TimeoutSec 2
    $existing = $response.StatusCode -ge 200 -and $response.StatusCode -lt 500
  } catch {
    $existing = $false
  }

  if (-not $existing) {
    $startedWeb = Start-Process -FilePath $npm -ArgumentList @("run", "dev:lan") -WorkingDirectory $projectRoot -WindowStyle Hidden -PassThru
    $ready = $false
    for ($attempt = 0; $attempt -lt 40; $attempt++) {
      Start-Sleep -Milliseconds 500
      try {
        $response = Invoke-WebRequest -Uri $webUrl -UseBasicParsing -TimeoutSec 2
        if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500) {
          $ready = $true
          break
        }
      } catch {
        # The local web server is still starting.
      }
    }
    if (-not $ready) {
      throw "Die lokale Web-App konnte nicht gestartet werden."
    }
  }

  Write-Host "  Falls Windows fragt: Zugriff nur fuer private Netzwerke erlauben." -ForegroundColor Yellow
  Write-Host ""
  & $npm --prefix $mobileRoot run start -- --lan
} finally {
  if ($startedWeb -and -not $startedWeb.HasExited) {
    & "$env:SystemRoot\System32\taskkill.exe" /pid $startedWeb.Id /t /f 2>$null | Out-Null
  }
}
