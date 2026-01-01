@echo off
echo Checking for processes using port 8081...

REM Find and kill processes using port 8081
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8081') do (
    echo Killing process %%a using port 8081...
    taskkill /PID %%a /F >nul 2>&1
)

echo Starting Expo on port 8081...
set EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0
npx expo start --port 8081 --clear