@echo off
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start-iphone.ps1"
if errorlevel 1 (
  echo.
  echo Der Start wurde nicht abgeschlossen. Hinweise stehen in docs\MOBILE.md.
  pause
)
