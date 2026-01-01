@echo off
echo ========================================
echo Installing Sharp for Image Processing
echo ========================================
echo.

cd /d "%~dp0"

echo Installing sharp package...
call npm install sharp

echo.
echo ========================================
echo Installation complete!
echo ========================================
echo.
echo Sharp is now installed and ready to use.
echo The OCR system can now handle:
echo   - Blurry images
echo   - Poor lighting
echo   - Skewed images
echo   - Low contrast
echo   - Noise
echo.
pause
