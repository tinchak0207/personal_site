@echo off
setlocal

if "%~1"=="" (
  echo Usage: scripts\open-render-blueprint.bat https://github.com/yourname/your-repo
  exit /b 1
)

python "%~dp0open-render-blueprint.py" "%~1"
