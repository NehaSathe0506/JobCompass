# Quick smoke test. Run while "npm start" is running in another terminal:
#   powershell -ExecutionPolicy Bypass -File .\test-api.ps1
$ErrorActionPreference = "Stop"; $base = "http://localhost:3000/api"
$json = "application/json"
$email = "test$(Get-Random)@test.com"

$r = Invoke-RestMethod -Method Post -Uri "$base/auth/register" -ContentType $json -Body (@{name="Neha";email=$email;password="secret123"} | ConvertTo-Json)
$h = @{ Authorization = "Bearer $($r.token)" }
Write-Host "1. Registered:" $r.user.email

$c = Invoke-RestMethod -Method Post -Uri "$base/companies" -Headers $h -ContentType $json -Body (@{name="Google";location="Bengaluru"} | ConvertTo-Json)
Write-Host "2. Company id:" $c.id

$a = Invoke-RestMethod -Method Post -Uri "$base/applications" -Headers $h -ContentType $json -Body (@{company_id=$c.id;role="SDE Intern";type="Internship"} | ConvertTo-Json)
Write-Host "3. Application id:" $a.id

$d = (Get-Date).AddDays(3).ToString("yyyy-MM-dd")
Invoke-RestMethod -Method Post -Uri "$base/deadlines" -Headers $h -ContentType $json -Body (@{application_id=$a.id;title="Submit resume";due_date=$d} | ConvertTo-Json) | Out-Null
Write-Host "4. Deadline added"

$s = Invoke-RestMethod -Uri "$base/dashboard" -Headers $h
Write-Host "5. Dashboard total:" $s.total "| upcoming deadlines:" $s.upcomingDeadlines.Count
Write-Host "ALL GOOD - backend works." -ForegroundColor Green
