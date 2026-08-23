@echo off
cd /d "%~dp0"
if not defined AGENTIC_OS_OBSIDIAN_VAULT set "AGENTIC_OS_OBSIDIAN_VAULT=%USERPROFILE%\Documents\Obsidian Vault\Emre"
call npm.cmd --prefix apps\desktop start
if errorlevel 1 (
  echo.
  echo Der Desktop-Start wurde nicht abgeschlossen. Hinweise stehen in docs\DESKTOP.md.
  pause
)
