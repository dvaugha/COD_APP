@echo off
setlocal enabledelayedexpansion

:: --- CONFIGURATION ---
set "REPO_ROOT=c:\Users\Dan\.gemini\antigravity\scratch\cod-golf\COD_APP"
cd /d "%REPO_ROOT%"

:: --- FIND LATEST WIP ---
set "LATEST_WIP="
for /f "delims=" %%F in ('dir /b /o:n CODv*_WIP.html') do set "LATEST_WIP=%%F"

if "%LATEST_WIP%"=="" (
    echo No WIP file found.
    exit /b 1
)

:: --- EXTRACT VERSION ---
:: Assumes format CODv###_WIP.html
set "FILENAME=%LATEST_WIP%"
set "VER_STR=!FILENAME:~4,3!"
set /a VER_NUM=1!VER_STR! - 1000

:: --- CALCULATE NEXT VERSION ---
set /a NEXT_VER_NUM=!VER_NUM! + 1
set "NEXT_WIP=CODv!NEXT_VER_NUM!_WIP.html"
set "GOLD_FILE=CODv!VER_NUM!_GOLD.html"

echo ==========================================
echo PROMOTING v!VER_NUM! TO GOLD STANDARD
echo ==========================================

:: 1. Create GOLD file
copy /Y "%LATEST_WIP%" "%GOLD_FILE%" >nul

:: 2. Create Next WIP file
copy /Y "%LATEST_WIP%" "%NEXT_WIP%" >nul

:: 3. Update Live Site (index.html) to the GOLD version
copy /Y "%GOLD_FILE%" index.html >nul

:: 4. GIT UPDATE
echo Pushing to GitHub...
git add "%GOLD_FILE%" "%NEXT_WIP%" index.html
git commit -m "Promoted v!VER_NUM! to GOLD. Created v!NEXT_VER_NUM! WIP."
git push origin main

echo.
echo DONE.
echo Current Status: v!VER_NUM! is GOLD (and live).
echo New Work File : %NEXT_WIP%
timeout /t 5
