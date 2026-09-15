@echo off
setlocal
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0RUN-FIREBEETLE2-COMMISSIONING.ps1"
set "exit_code=%ERRORLEVEL%"
echo.
if "%exit_code%"=="0" (
  echo VELYQUA FIREBEETLE 2 ESP32-S3 COMMISSIONING: PASS
) else (
  echo VELYQUA FIREBEETLE 2 ESP32-S3 COMMISSIONING: STOPPED ^(exit %exit_code%^)
)
pause
exit /b %exit_code%
