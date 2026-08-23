@echo off
setlocal
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\import-google-oauth.ps1"
if errorlevel 1 (
  echo.
  echo Import nicht abgeschlossen. Die Meldung oben erklaert den sicheren naechsten Schritt.
)
echo.
pause
