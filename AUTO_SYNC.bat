@echo off
echo ==========================================
echo       COD GOLF APP - AUTO SYNC
echo ==========================================
echo 📦 Staging changes...
git add .
echo ✅ Committing (v%DATE% %TIME%)...
git commit -m "Auto-sync update from Antigravity session (%DATE% %TIME%)"
echo 🚀 Pushing to GitHub...
git push origin main
echo.
echo ==========================================
echo ALL UPDATES COMPLETE!
echo ==========================================
timeout /t 3
