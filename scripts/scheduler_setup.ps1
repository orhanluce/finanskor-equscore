# EquScore — register a daily Tadawul refresh in Windows Task Scheduler.
# Runs the free Yahoo fetch Sun-Thu (Tadawul trading days) at 16:30 (after the 15:00 close).
# User-level task — no admin required. Re-run to update (Force).

$ErrorActionPreference = "Stop"
$bat  = "C:\Users\orhan\finanskor-equscore\scripts\run_fetch.bat"
$name = "EquScore Tadawul Daily Fetch"

$action  = New-ScheduledTaskAction -Execute $bat
$trigger = New-ScheduledTaskTrigger -Weekly `
  -DaysOfWeek Sunday, Monday, Tuesday, Wednesday, Thursday -At 4:30PM
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable `
  -DontStopOnIdleEnd -ExecutionTimeLimit (New-TimeSpan -Hours 1)

Register-ScheduledTask -TaskName $name -Action $action -Trigger $trigger `
  -Settings $settings -Description "Refresh EquScore's free Tadawul dataset from Yahoo Finance (Sun-Thu 16:30)." -Force | Out-Null

Write-Host "Registered scheduled task: '$name' (Sun-Thu 16:30)."
Get-ScheduledTask -TaskName $name | Select-Object TaskName, State | Format-Table -AutoSize
