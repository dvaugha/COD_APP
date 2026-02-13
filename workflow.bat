@echo off
setlocal

:: --- CONFIGURATION ---
set "REPO_ROOT=c:\Users\Dan\.gemini\antigravity\scratch\cod-golf\COD_APP"

:: Move to the repository root
cd /d "%REPO_ROOT%"

:: --- GET CURRENT WIP FILE ---
:: Finds the file with the highest version number in the format CODv###_WIP.html
for /f "delims=" %%F in ('dir /b /o:n CODv*_WIP.html') do set "LATEST_WIP=%%F"

if "%LATEST_WIP%"=="" (
    echo Error: No WIP file found!
    pause
    exit /b 1
)

:: Extract version number (e.g., 262 from CODv262_WIP.html)
set "VER_NUM=%LATEST_WIP:~4,3%"

echo.
echo ========================================================
echo      COD GOLF APP - AUTOMATED WORKFLOW
echo ========================================================
echo Current Active File: %LATEST_WIP% (v%VER_NUM%)
echo.
echo Select an action:
echo.
echo   [1] UPDATE WIP  : Commit & push current %LATEST_WIP% changes to GitHub.
echo   [2] TEST LIVE   : Copy %LATEST_WIP% to index.html for testing.
echo   [3] GOLD STATUS : Promote %LATEST_WIP% to GOLD, create v%VER_NUM%+1 WIP.
echo.
set /p "CHOICE=Enter choice (1, 2, or 3): "

if "%CHOICE%"=="1" goto update_wip
if "%CHOICE%"=="2" goto test_live
if "%CHOICE%"=="3" goto process_gold
echo Invalid choice. Exiting.
pause
exit /b 0

:update_wip
echo.
echo --- Updating WIP on GitHub ---
git add %LATEST_WIP%
set /p "MSG=Commit Message (Optional - Press Enter for default): "
if "%MSG%"=="" set "MSG=WIP Update v%VER_NUM%"
git commit -m "%MSG%"
git push origin main
echo Done.
pause
exit /b 0

:test_live
echo.
echo --- Promoting %LATEST_WIP% to index.html for Testing ---
copy /Y "%LATEST_WIP%" index.html
git add index.html
git commit -m "Testing v%VER_NUM% on index.html"
git push origin main
echo Done. Live site updated.
pause
exit /b 0

:process_gold
echo.
echo --- PROMOTING TO GOLD STANDARD ---
set /a NEXT_VER=%VER_NUM% + 1
set "GOLD_FILE=CODv%VER_NUM%_GOLD.html"
set "NEXT_WIP=CODv%NEXT_VER%_WIP.html"

echo 1. Creating %GOLD_FILE%...
copy /Y "%LATEST_WIP%" "%GOLD_FILE%"

echo 2. Creating next version: %NEXT_WIP%...
copy /Y "%LATEST_WIP%" "%NEXT_WIP%"

echo 3. Updating GitHub...
git add "%GOLD_FILE%" "%NEXT_WIP%"
git commit -m "Promoted v%VER_NUM% to GOLD. Started v%NEXT_VER%."
git push origin main

echo.
echo SUCCESS!
echo - v%VER_NUM% is now GOLD.
echo - You are now working on v%NEXT_VER%.
pause
exit /b 0
