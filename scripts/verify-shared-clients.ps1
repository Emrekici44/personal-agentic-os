param([switch]$RequireTailscale)

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
$npm = (Get-Command npm.cmd -ErrorAction Stop).Source

function Invoke-Check([string[]]$Arguments) {
  & $npm @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "Prüfung fehlgeschlagen: npm $($Arguments -join ' ')"
  }
}

Push-Location $projectRoot
try {
  Invoke-Check @("run", "lint")
  Invoke-Check @("test")
  Invoke-Check @("run", "build")
  Invoke-Check @("run", "desktop:check")
  Invoke-Check @("run", "mobile:check")

  if ($RequireTailscale) {
    $tailscale = Join-Path $env:ProgramFiles "Tailscale\tailscale.exe"
    if (-not (Test-Path -LiteralPath $tailscale)) {
      throw "Tailscale ist nicht installiert."
    }
    $status = (& $tailscale status --json | ConvertFrom-Json)
    if ($status.BackendState -ne "Running" -or -not $status.Self.Online) {
      throw "Tailscale ist nicht verbunden."
    }
    $dnsName = ([string]$status.Self.DNSName).TrimEnd(".")
    if (-not $dnsName) { throw "Tailscale hat keinen MagicDNS-Namen geliefert." }
    & powershell.exe -NoProfile -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot "start-private-access.ps1") -Refresh -NoPrompt
    if ($LASTEXITCODE -ne 0) { throw "Der private Tailscale-Server konnte nicht aktualisiert werden." }
    $privateUrl = "https://${dnsName}"
    $page = Invoke-WebRequest -Uri $privateUrl -UseBasicParsing -TimeoutSec 15
    if ($page.StatusCode -ne 200) { throw "Die private Web-App ist nicht erreichbar." }

    $assets = [regex]::Matches($page.Content, '(?:src|href)="([^"]+\.(?:js|css)[^"]*)"')
    foreach ($match in $assets) {
      $assetUrl = [Uri]::new([Uri]$privateUrl, $match.Groups[1].Value).AbsoluteUri
      $asset = Invoke-WebRequest -Uri $assetUrl -UseBasicParsing -TimeoutSec 15
      if ($asset.StatusCode -ne 200) { throw "Mobiles UI-Asset ist nicht erreichbar: $assetUrl" }
    }

    $webSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession
    $session = Invoke-WebRequest -Uri "$privateUrl/api/state/session" -Method Post -Headers @{ Origin = $privateUrl } -WebSession $webSession -UseBasicParsing -TimeoutSec 15
    $state = Invoke-WebRequest -Uri "$privateUrl/api/state/status" -WebSession $webSession -UseBasicParsing -TimeoutSec 15
    if ($session.StatusCode -ne 200 -or $state.StatusCode -ne 200) {
      throw "Die private mobile Sitzung oder der gemeinsame Datenkern ist nicht funktionsfähig."
    }
    Write-Host "Tailscale, private HTTPS-Assets und Shared Store sind erreichbar." -ForegroundColor Green
  }

  Write-Host "Web, Desktop und Expo verwenden eine geprüfte gemeinsame Oberfläche." -ForegroundColor Green
} finally {
  Pop-Location
}
