@echo off
echo ========================================
echo   RESTART BACKEND SERVER
echo ========================================
echo.

echo [1/3] Dung server hien tai...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo.
echo [2/3] Kiem tra Reminder Service...
node check-reminder-service.js

echo.
echo [3/3] Khoi dong server moi...
echo.
echo Server dang chay tai: http://localhost:3000
echo Nhan Ctrl+C de dung server
echo.
node server.js
