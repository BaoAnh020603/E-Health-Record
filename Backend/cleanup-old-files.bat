@echo off
echo ========================================
echo Cleanup Old Files
echo ========================================
echo.

cd /d "%~dp0"

echo Running cleanup script...
node cleanup-old-files.js

echo.
echo ========================================
echo Cleanup completed!
echo ========================================
echo.
pause
