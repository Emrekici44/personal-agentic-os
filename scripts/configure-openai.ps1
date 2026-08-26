$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$envPath = Join-Path $projectRoot ".env.local"
$confirmation = Read-Host "Zum Aktivieren kostenpflichtiger API-Aufrufe exakt OPENAI_API_KOSTEN_AKTIVIEREN eingeben"
if ($confirmation -ne "OPENAI_API_KOSTEN_AKTIVIEREN") {
  throw "OpenAI API wurde nicht aktiviert."
}

$secureKey = Read-Host "OpenAI API-Key (wird nicht angezeigt)" -AsSecureString
$pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureKey)
try {
  $apiKey = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
} finally {
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
}
if ($apiKey -notmatch '^sk-') { throw "Der API-Key hat kein erwartetes OpenAI-Format." }

$daily = [decimal](Read-Host "Maximales Tagesbudget in EUR")
$monthly = [decimal](Read-Host "Maximales Monatsbudget in EUR")
$perRun = [decimal](Read-Host "Maximales Budget pro Agentenlauf in EUR")
$estimate = [decimal](Read-Host "Konservative Kostenschätzung pro Lauf in EUR")
if ($daily -le 0 -or $monthly -le 0 -or $perRun -le 0 -or $estimate -le 0 -or $estimate -gt $perRun) {
  throw "Budgets müssen positiv sein; die Schätzung darf das Laufbudget nicht überschreiten."
}

$values = [ordered]@{}
if (Test-Path -LiteralPath $envPath) {
  foreach ($line in Get-Content -LiteralPath $envPath) {
    if ($line -match '^([^#=]+)=(.*)$') { $values[$matches[1].Trim()] = $matches[2] }
  }
}
$values["OPENAI_MODE"] = "api"
$values["OPENAI_PROVIDER_ENABLED"] = "true"
$values["OPENAI_KILL_SWITCH"] = "off"
$values["OPENAI_DAILY_LIMIT_EUR"] = [string]$daily
$values["OPENAI_MONTHLY_LIMIT_EUR"] = [string]$monthly
$values["OPENAI_MAX_COST_PER_RUN_EUR"] = [string]$perRun
$values["OPENAI_ESTIMATED_COST_PER_RUN_EUR"] = [string]$estimate
$values["OPENAI_MODEL"] = "gpt-5.4"
$values["OPENAI_API_KEY"] = $apiKey

$lines = foreach ($entry in $values.GetEnumerator()) { "{0}={1}" -f $entry.Key, $entry.Value }
[IO.File]::WriteAllLines($envPath, $lines, [Text.UTF8Encoding]::new($false))
Write-Host "OpenAI API wurde ausschließlich lokal mit expliziten Kostenlimits konfiguriert." -ForegroundColor Green
Write-Host "Starte Agentic OS anschließend neu. Der Key wurde nicht ausgegeben und bleibt von Git ausgeschlossen."
