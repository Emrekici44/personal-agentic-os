$ErrorActionPreference = "Stop"

$runtimeRoot = Join-Path $env:LOCALAPPDATA "AgenticOS"
$pidFile = Join-Path $runtimeRoot "private-web.pid"

if (Test-Path -LiteralPath $pidFile) {
  $storedPid = (Get-Content -LiteralPath $pidFile -Raw).Trim()
  if ($storedPid -match "^\d+$") {
    $process = Get-Process -Id ([int]$storedPid) -ErrorAction SilentlyContinue
    if ($process) {
      & "$env:SystemRoot\System32\taskkill.exe" /pid $process.Id /t 2>$null | Out-Null
    }
  }
  Remove-Item -LiteralPath $pidFile -Force
}

Write-Host "Der private Agentic-OS-Webdienst wurde gestoppt." -ForegroundColor Green
Write-Host "Die private Tailscale-Serve-Regel bleibt ohne Backend inaktiv."
Write-Host "Sie wird absichtlich nicht pauschal zurueckgesetzt, damit keine andere Serve-Regel geloescht wird."
Read-Host "Enter zum Schliessen"
