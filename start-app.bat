@echo off
setlocal

cd /d "%~dp0"

echo [1/4] Checking for any existing frontend dev server on port 5173...
for /f "tokens=5" %%p in ('netstat -ano ^| findstr /R /C:":5173 .*LISTENING"') do (
    echo        Terminating PID %%p
    taskkill /PID %%p /F >nul 2>&1
)

echo [2/4] Starting the frontend dev server...
start "Frontend Dev Server" cmd /k "cd /d ""%~dp0"" && yarn dev:frontend"

echo [3/4] Waiting for http://localhost:5173 to become available...
powershell -NoProfile -Command "while (-not (Test-NetConnection -ComputerName '127.0.0.1' -Port 5173 -WarningAction SilentlyContinue).TcpTestSucceeded) { Start-Sleep -Milliseconds 500 }"

echo [4/4] Opening the app in your default browser...
start "" http://localhost:5173

echo All set!

endlocal