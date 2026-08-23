@echo off
cd /d "%~dp0"
call npm.cmd --prefix apps\desktop start
if errorlevel 1 (
  echo.
  echo Der Desktop-Start wurde nicht abgeschlossen. Hinweise stehen in docs\DESKTOP.md.
  pause
)
