@echo off
echo.
echo ========================================
echo    Service Marketplace App - Testing
echo ========================================
echo.

REM Check if .env exists
if not exist .env (
    echo [ERROR] .env file nahi mili!
    echo.
    echo Pehle .env file banayen:
    echo   1. .env.example ko copy karen
    echo   2. Firebase aur Google Maps keys dalen
    echo.
    pause
    exit /b 1
)

echo [OK] .env file موجود ہے
echo.
echo Starting Expo Development Server...
echo.
echo ========================================
echo  QR Code scan karny ky liye:
echo  1. Mobile par Expo Go app kholen
echo  2. "Scan QR Code" par click karen
echo  3. Screen par dikhaye gaye QR code ko scan karen
echo ========================================
echo.

npm start
