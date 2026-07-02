@echo off
rem EquScore - gunluk veri pipeline'i (fetch -> bekci -> build -> commit -> push).
rem Task Scheduler bunu tetikler; log scripts/logs/pipeline_YYYY-MM-DD.log
setlocal
set KOK=C:\Users\orhan\finanskor-equscore
cd /d %KOK%
if not exist "%KOK%\scripts\logs" mkdir "%KOK%\scripts\logs"
for /f %%i in ('powershell -NoProfile -Command "Get-Date -Format yyyy-MM-dd"') do set "BUGUN=%%i"
echo ==== %DATE% %TIME% ==== >> "%KOK%\scripts\logs\pipeline_%BUGUN%.log"
py -u "%KOK%\scripts\pipeline_gunluk.py" 1>>"%KOK%\scripts\logs\pipeline_%BUGUN%.log" 2>&1
endlocal
