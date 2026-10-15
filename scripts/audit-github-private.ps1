$ErrorActionPreference = 'Continue'
$aisleRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
Set-Location -LiteralPath $aisleRoot
gh auth status
if ($LASTEXITCODE -ne 0) { throw 'Sign into GitHub CLI in your terminal first.' }
$aisleLogin = gh api user --jq .login
if ($LASTEXITCODE -ne 0 -or $aisleLogin -ne 'kagankurubas') { throw 'Expected kagankurubas.' }
$aisleRepo = 'kagankurubas/Aisle'
$aisleReport = [ordered]@{ alerts = @(); jobs = @(); errors = @() }
# Deliberately project only metadata: the API's secret value is never printed or saved.
$aisleAlertJson = gh api "repos/$aisleRepo/secret-scanning/alerts?per_page=100" --paginate --slurp --jq '[.[][] | {number,state,secret_type,html_url,resolution}]' 2>$null
if ($LASTEXITCODE -eq 0) { $aisleReport.alerts = @($aisleAlertJson | ConvertFrom-Json) }
else { $aisleReport.errors += 'Secret scanning metadata was not accessible.' }
$aisleRunJson = gh api "repos/$aisleRepo/actions/runs?per_page=5" --jq '.workflow_runs | map({id,status,conclusion})'
if ($LASTEXITCODE -ne 0) { throw 'Cannot list workflow runs.' }
$aislePatterns = [ordered]@{
  firebase_web_key = 'AIza[0-9A-Za-z_-]{35}'
  iyzico_key = '\bsandbox-[0-9A-Za-z]{20,}'
  github_token = '\b(?:gh[pousr]_[0-9A-Za-z]{30,}|github_pat_[0-9A-Za-z_]{30,})'
  private_key = '-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----'
  openai_key = '\bsk-(?:proj-|svcacct-)?[0-9A-Za-z_-]{30,}'
  jwt = '\beyJ[0-9A-Za-z_-]{10,}\.eyJ[0-9A-Za-z_-]{10,}\.[0-9A-Za-z_-]{30,}'
}
foreach ($aisleRun in ($aisleRunJson | ConvertFrom-Json)) {
  $aisleJobsJson = gh api "repos/$aisleRepo/actions/runs/$($aisleRun.id)/jobs" --jq '.jobs | map({id,name,status,conclusion})'
  if ($LASTEXITCODE -ne 0) { $aisleReport.errors += "Cannot list jobs for run $($aisleRun.id)."; continue }
  foreach ($aisleJob in ($aisleJobsJson | ConvertFrom-Json)) {
    if ($aisleJob.status -ne 'completed') { continue }
    # Keep raw logs in memory only. Never echo matching lines or credential values.
    $aisleRawLog = gh run view $aisleRun.id --repo $aisleRepo --job $aisleJob.id --log 2>$null
    if ($LASTEXITCODE -ne 0) { $aisleReport.errors += "Cannot read job $($aisleJob.id)."; continue }
    $aisleLog = $aisleRawLog -join "`n"
    $aisleCounts = [ordered]@{}
    foreach ($aislePattern in $aislePatterns.GetEnumerator()) {
      $aisleCounts[$aislePattern.Key] = [regex]::Matches($aisleLog,$aislePattern.Value).Count
    }
    $aisleReport.jobs += [ordered]@{run=$aisleRun.id;job=$aisleJob.id;name=$aisleJob.name;counts=$aisleCounts}
    $aisleRawLog = $null; $aisleLog = $null
  }
}
$aisleDirectory = Join-Path $aisleRoot '.capture-state/security-audit'
New-Item -ItemType Directory -Force -Path $aisleDirectory | Out-Null
$aisleJson = $aisleReport | ConvertTo-Json -Depth 8
Set-Content -LiteralPath (Join-Path $aisleDirectory 'github-private-summary.json') -Value $aisleJson
Write-Output $aisleJson
Write-Output 'Only alert metadata and pattern counts are shown. No secret values or raw logs were saved.'
