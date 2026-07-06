@echo off
chcp 65001 >nul
title elgoharyX - Local Server
cd /d "%~dp0"
echo.
echo ========================================
echo   تشغيل موقع elgoharyX محلياً
echo ========================================
echo.
echo يفتح المتصفح تلقائياً على العنوان:
echo   http://localhost:5500
echo.
echo لإيقاف الخادم: اغلق هذه النافذة.
echo.
start "" http://localhost:5500/index.html
where py >nul 2>nul && ( py -m http.server 5500 ) || ( python -m http.server 5500 )
pause
