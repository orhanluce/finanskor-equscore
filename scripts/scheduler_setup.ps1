# EquScore — günlük veri pipeline'ını Windows Task Scheduler'a kaydeder.
# Paz-Per (Tadawul işlem günleri) 16:30'da run_pipeline.bat çalışır:
# fetch zinciri → veri bekçisi → build → data-only commit → push (Hostinger deploy).
# Perşembe koşusu haftalıkları da içerir (Argaam Şeriat + SerpAPI youtube/trends).
# Kullanıcı-seviyesi görev — admin gerekmez. Tekrar çalıştırmak günceller (Force).

$ErrorActionPreference = "Stop"
$bat  = "C:\Users\orhan\finanskor-equscore\scripts\run_pipeline.bat"
$name = "EquScore Daily Pipeline"

# Eski dar-kapsamli gorevi kaldir (sadece tadawul+news cekiyordu, bekci/push yoktu)
Unregister-ScheduledTask -TaskName "EquScore Tadawul Daily Fetch" -Confirm:$false -ErrorAction SilentlyContinue

$action  = New-ScheduledTaskAction -Execute $bat
$trigger = New-ScheduledTaskTrigger -Weekly `
  -DaysOfWeek Sunday, Monday, Tuesday, Wednesday, Thursday -At 4:30PM
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable `
  -DontStopOnIdleEnd -ExecutionTimeLimit (New-TimeSpan -Hours 2)

Register-ScheduledTask -TaskName $name -Action $action -Trigger $trigger `
  -Settings $settings -Description "EquScore veri pipeline'i: fetch -> bekci -> build -> commit -> push (Paz-Per 16:30; Persembe haftaliklar dahil)." -Force | Out-Null

Write-Host "Kaydedildi: '$name' (Paz-Per 16:30, 2 saat limit)."
Get-ScheduledTask -TaskName $name | Select-Object TaskName, State | Format-Table -AutoSize
