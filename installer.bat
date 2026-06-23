@echo off
title Roblox Discord RPC - Studio Plugin Installer

echo.
echo  Roblox Discord RPC - Studio Plugin Installer
echo  =============================================
echo.

set PLUGIN_URL=https://raw.githubusercontent.com/BorzXy/Roblox-Discord-RPC/refs/heads/main/plugin/presence.lua
set PLUGIN_DIR=%LOCALAPPDATA%\Roblox\Plugins
set PLUGIN_FILE=%PLUGIN_DIR%\RobloxDiscordRPC.lua
set STARTUP_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
set STARTUP_FILE=%STARTUP_DIR%\RobloxDiscordRPC.bat
set AUTOSTART=%~dp0autostart.bat

if not exist "%PLUGIN_DIR%" (
    echo [INFO] Creating plugins folder...
    mkdir "%PLUGIN_DIR%"
)

if exist "%PLUGIN_FILE%" (
    echo [INFO] Removing old plugin...
    del /f /q "%PLUGIN_FILE%"
    echo [INFO] Old plugin removed.
)

echo [INFO] Downloading latest plugin...
curl -s -o "%PLUGIN_FILE%" "%PLUGIN_URL%"

if %errorlevel% neq 0 (
    echo [ERROR] Failed to download plugin. Check your internet connection.
    pause
    exit /b 1
)

echo [INFO] Plugin installed successfully!
echo [INFO] Location: %PLUGIN_FILE%
echo.

set /p ADD_STARTUP=[INFO] Add to startup? (y/n): 

if /i "%ADD_STARTUP%"=="y" (
    if not exist "%AUTOSTART%" (
        echo [INFO] autostart.bat not found - creating...
        (
            echo @echo off
            echo title Roblox Discord RPC
            echo cd /d "%%~dp0"
            echo :loop
            echo node main.js
            echo echo [INFO] Process exited - restarting in 5 seconds...
            echo timeout /t 5 /nobreak ^>nul
            echo goto loop
        ) > "%AUTOSTART%"
        echo [INFO] autostart.bat created at: %AUTOSTART%
    )

    echo @echo off > "%STARTUP_FILE%"
    echo cd /d "%~dp0" >> "%STARTUP_FILE%"
    echo start "" /min cmd /c "%AUTOSTART%" >> "%STARTUP_FILE%"

    echo [INFO] Startup entry added!
    echo [INFO] Location: %STARTUP_FILE%
    echo [INFO] RPC will auto-start on next Windows login.
) else (
    echo [INFO] Skipped startup setup.
)

echo.
echo  Run autostart.bat to start the RPC manually.
echo  Open Roblox Studio to activate the plugin.
echo.
pause