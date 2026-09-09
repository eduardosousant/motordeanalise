@echo off
cd /d "%~dp0"

:: Executa o npm run dev oculto em segundo plano via PowerShell
powershell -WindowStyle Hidden -Command "Start-Process cmd -ArgumentList '/c npm run dev' -WindowStyle Hidden"

:: Aguarda 3 segundos e abre o navegador
timeout /t 3 /nobreak >nul
start http://localhost:3000