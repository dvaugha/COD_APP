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

:: --- GIT UPDATE ---
echo Auto-updating GitHub for %LATEST_WIP%...
git add "%LATEST_WIP%"
git commit -m "Auto-save: Latest iteration of %LATEST_WIP%"
git push origin main
echo Update complete.
