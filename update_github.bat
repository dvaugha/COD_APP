@echo off
echo Updating GitHub...
git add .
set /p msg="Enter commit message (default: Update): "
if "%msg%"=="" set msg=Update
git commit -m "%msg%"
git push origin main
echo Done!
pause
