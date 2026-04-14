@echo off
echo.
echo === COD GOLF DEPLOYMENT ===
echo.
echo [1/3] Updating Cache Buster in index.html...
powershell -Command "$t = Get-Date -Format 'yyyyMMddHHmm'; $d = Get-Date -Format 'yyyy-MM-dd hh:mm tt'; (Get-Content index.html) -replace '\?v=[0-9A-Za-z\.]+', '?v='+$t -replace 'Deployment Nudge: [^<]+', 'Deployment Nudge: '+$d | Set-Content index.html"

echo [2/3] Staging changes...
git add .

set /p msg="Enter commit message (default: Update): "
if "%msg%"=="" set msg=Update

echo [3/3] Committing and Pushing to GitHub...
git commit -m "%msg%"
git push origin main

echo.
echo === DEPLOYMENT COMPLETE! ===
echo index.html cache has been force-cleared.
echo.
pause
