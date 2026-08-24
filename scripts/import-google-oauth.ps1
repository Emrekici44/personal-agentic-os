$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$downloadRoot = Join-Path $env:USERPROFILE "Downloads"
$credentialFile = Get-ChildItem -LiteralPath $downloadRoot -Filter "client_secret*.json" -File |
  Sort-Object LastWriteTime -Descending |
  Select-Object -First 1

if (-not $credentialFile) {
  throw "Keine Google-Datei client_secret*.json im Downloads-Ordner gefunden. Bitte zuerst in Google Cloud 'JSON herunterladen' wählen."
}

$credential = Get-Content -LiteralPath $credentialFile.FullName -Raw | ConvertFrom-Json
$web = $credential.web
if (-not $web.client_id -or -not $web.client_secret) {
  throw "Die Datei ist kein gültiger Google-Web-OAuth-Client."
}

$requiredCallback = "http://localhost:3000/api/calendar/callback"
if ($web.redirect_uris -notcontains $requiredCallback) {
  throw "Der Google-Client enthält nicht die erwartete lokale Callback-URL. Import wurde abgebrochen."
}

$envPath = Join-Path $projectRoot ".env.local"
$values = [ordered]@{}
if (Test-Path -LiteralPath $envPath) {
  foreach ($line in Get-Content -LiteralPath $envPath) {
    if ($line -match '^([^#=]+)=(.*)$') {
      $values[$matches[1].Trim()] = $matches[2]
    }
  }
}

if (-not $values.Contains("AUTH_SECRET")) {
  $bytes = New-Object byte[] 48
  $random = [System.Security.Cryptography.RandomNumberGenerator]::Create()
  try {
    $random.GetBytes($bytes)
  } finally {
    $random.Dispose()
  }
  $values["AUTH_SECRET"] = [Convert]::ToBase64String($bytes)
}
$values["APP_URL"] = "http://localhost:3000"
$values["GOOGLE_CLIENT_ID"] = [string]$web.client_id
$values["GOOGLE_CLIENT_SECRET"] = [string]$web.client_secret

$lines = foreach ($entry in $values.GetEnumerator()) {
  "{0}={1}" -f $entry.Key, $entry.Value
}
[System.IO.File]::WriteAllLines($envPath, $lines, [System.Text.UTF8Encoding]::new($false))

Write-Host "Google OAuth wurde sicher lokal in .env.local eingerichtet." -ForegroundColor Green
Write-Host "Es wurden keine Zugangsdaten angezeigt oder an Git übergeben."
Write-Host "Bitte löschen Sie die heruntergeladene JSON-Datei anschließend selbst aus Downloads."
