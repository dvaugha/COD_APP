@echo off
echo ==========================================
3: echo       COD GOLF APP - FULL SYNC
echo ==========================================
echo 🛠️  Updating cache busters in index.html...
powershell -Command "$t = Get-Date -Format 'yyyyMMddHHmm'; $d = Get-Date -Format 'yyyy-MM-dd hh:mm tt'; (Get-Content index.html) -replace '\?v=[0-9A-Za-z\.]+', ('?v='+$t) -replace 'Deployment Nudge: [^<]+', ('Deployment Nudge: '+$d) | Set-Content index.html"

echo 📦 Staging changes...
git add .

echo ✅ Committing changes...
git commit -m "Full sync (v%DATE% %TIME%) - fixes for dashboard data binding"

echo 🚀 Pushing to GitHub...
git push origin main

echo ==========================================
echo ALL UPDATES COMPLETE!
echo ==========================================
timeout /t 3
