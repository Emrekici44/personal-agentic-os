$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$mobileRoot = Join-Path $projectRoot "apps\mobile"
$tailscale = Join-Path $env:ProgramFiles "Tailscale\tailscale.exe"
$npm = (Get-Command npm.cmd -ErrorAction Stop).Source

if (-not (Test-Path -LiteralPath $tailscale)) {
  throw "Tailscale ist nicht installiert."
}

$status = (& $tailscale status --json | ConvertFrom-Json)
if ($status.BackendState -ne "Running" -or -not $status.Self.Online) {
  throw "Tailscale ist auf Windows noch nicht Connected."
}

$dnsName = ([string]$status.Self.DNSName).TrimEnd(".")
$tailscaleIp = @($status.TailscaleIPs | Where-Object { $_ -match "^\d+\.\d+\.\d+\.\d+$" }) | Select-Object -First 1
if (-not $dnsName -or -not $tailscaleIp) {
  throw "MagicDNS-Name oder private Tailscale-IP fehlt."
}

$privateUrl = "https://${dnsName}"
$env:AGENTIC_OS_PRIVATE_HOST = $dnsName

function Test-InteractivePrivateOrigin([string]$Url) {
  try {
    $htmlResponse = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 8
    $scriptMatch = [regex]::Match($htmlResponse.Content, '<script[^>]+src="([^"]+)"')
    if (-not $scriptMatch.Success) {
      return $false
    }

    $scriptUrl = [Uri]::new([Uri]$Url, $scriptMatch.Groups[1].Value).AbsoluteUri
    $scriptResponse = Invoke-WebRequest -Uri $scriptUrl -Headers @{ Origin = $Url } -UseBasicParsing -TimeoutSec 8
    return $scriptResponse.StatusCode -eq 200 -and [string]$scriptResponse.Headers."Content-Type" -match "javascript"
  } catch {
    return $false
  }
}

try {
  $response = Invoke-WebRequest -Uri $privateUrl -UseBasicParsing -TimeoutSec 5
  if ($response.StatusCode -lt 200 -or $response.StatusCode -ge 500) {
    throw "Private URL nicht bereit"
  }
} catch {
  throw "Der private Serve-Endpunkt ist nicht erreichbar. Starte zuerst 'Agentic OS - Privat unterwegs starten'."
}

if (-not (Test-InteractivePrivateOrigin $privateUrl)) {
  throw "Die sichtbare Seite ist nicht interaktiv: Der Next-Server wurde ohne den privaten Tailscale-Host gestartet. Schließe den Agentic-OS-Webserver und starte den Tailscale-iPhone-Launcher erneut."
}

$env:EXPO_PUBLIC_AGENTIC_OS_URL = $privateUrl
$env:REACT_NATIVE_PACKAGER_HOSTNAME = $tailscaleIp

Write-Host ""
Write-Host "  AGENTIC OS - EXPO UEBER TAILSCALE" -ForegroundColor Cyan
Write-Host "  WebView: $privateUrl" -ForegroundColor Green
Write-Host "  Metro:   exp://${tailscaleIp}:8081" -ForegroundColor DarkCyan
Write-Host ""
Write-Host "  Tailscale muss auf iPhone und Laptop Connected bleiben."
Write-Host "  Kein Funnel, kein oeffentlicher Tunnel, keine Portfreigabe."
Write-Host ""

& $npm --prefix $mobileRoot run start -- --lan
