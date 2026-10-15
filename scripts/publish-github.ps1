$ErrorActionPreference = 'Stop'
$aisleRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
Set-Location -LiteralPath $aisleRoot
if (-not (Test-Path -LiteralPath '.git')) { throw 'Run this script from the Aisle repository.' }
gh auth status
if ($LASTEXITCODE -ne 0) { throw 'Sign into GitHub CLI in this terminal first: gh auth login -h github.com' }
$aisleLogin = (gh api user --jq .login).Trim()
if ($LASTEXITCODE -ne 0 -or $aisleLogin -ne 'kagankurubas') { throw 'Expected GitHub account kagankurubas. No repository was created.' }
$aisleRepo = "$aisleLogin/Aisle"
$aisleTracked = @(git ls-files)
if ($LASTEXITCODE -ne 0) { throw 'Cannot read tracked files.' }
if ($aisleTracked | Where-Object { $_ -match '(^|/)\.env($|\.)' -and $_ -notmatch '\.env\.example$' }) { throw 'An environment file is tracked. Remove it from Git before publishing.' }
if ($aisleTracked | Where-Object { $_ -match '(^|/)\.capture-state/' }) { throw 'Private capture snapshots must not be tracked.' }
if (-not (Test-Path -LiteralPath 'CAPTURE-TEST.md')) { throw 'Missing capture verification.' }
$aisleChanges = @(git status --porcelain)
$aisleSourceChanges = @($aisleChanges | Where-Object { $_.Substring(3) -notlike '.agent-logs/*' })
if ($aisleSourceChanges.Count -gt 0) { throw 'There are uncommitted source changes. Ask Codex to commit them, then rerun.' }
git add -- .agent-logs
if ($LASTEXITCODE -ne 0) { throw 'Cannot stage agent logs.' }
$aisleStaged = @(git diff --cached --name-only)
if ($aisleStaged | Where-Object { $_ -notlike '.agent-logs/*' }) { throw 'Unexpected staged source. No automatic commit was made.' }
if ($aisleStaged.Count -gt 0) {
  git commit -m 'Capture latest agent exchanges before publication'
  if ($LASTEXITCODE -ne 0) { throw 'Cannot commit agent logs.' }
}
$aisleRemotes = @(git remote)
if ($aisleRemotes -contains 'origin') {
  $aisleRemote = (git remote get-url origin).Trim()
  if ($aisleRemote -notin @("https://github.com/$aisleRepo.git", "https://github.com/$aisleRepo", "git@github.com:$aisleRepo.git")) { throw 'Origin points elsewhere. No remote was changed.' }
  $aisleVisibility = (gh repo view $aisleRepo --json visibility --jq .visibility).Trim()
  if ($LASTEXITCODE -ne 0 -or $aisleVisibility -ne 'PUBLIC') { throw 'Expected an existing public Aisle repository.' }
  git push -u origin main
  if ($LASTEXITCODE -ne 0) { throw 'Git push failed. No force push was attempted.' }
} else {
  $aisleVisibility = (gh repo view $aisleRepo --json visibility --jq .visibility).Trim()
  if ($LASTEXITCODE -ne 0 -or $aisleVisibility -ne 'PUBLIC') { throw 'Expected your existing public Aisle repository.' }
  git remote add origin "https://github.com/$aisleRepo.git"
  if ($LASTEXITCODE -ne 0) { throw 'Cannot add origin.' }
  git push -u origin main
  if ($LASTEXITCODE -ne 0) { throw 'Push failed. No force push was attempted; ask Codex to inspect the remote history.' }
}
# Windows PowerShell 5 treats redirected native stderr as terminating with Stop.
# A 404 is expected before Pages is enabled; inspect the native exit code.
$aislePreviousPreference = $ErrorActionPreference
try {
  $ErrorActionPreference = 'Continue'
  $aislePagesMode = gh api "repos/$aisleRepo/pages" --jq .build_type 2>$null
  $aislePagesExitCode = $LASTEXITCODE
} finally {
  $ErrorActionPreference = $aislePreviousPreference
}
if ($LASTEXITCODE -ne 0) {
  gh api --method POST "repos/$aisleRepo/pages" -f build_type=workflow --silent
  if ($LASTEXITCODE -ne 0) { throw 'Enable GitHub Actions under repository Settings > Pages, then rerun this script.' }
} elseif ($aislePagesMode -ne 'workflow') {
  gh api --method PUT "repos/$aisleRepo/pages" -f build_type=workflow --silent
  if ($LASTEXITCODE -ne 0) { throw 'Cannot select GitHub Actions as the Pages source.' }
}
if (Test-Path -LiteralPath '.env.local') {
  $aisleAllowedConfig = @('VITE_FIREBASE_API_KEY','VITE_FIREBASE_AUTH_DOMAIN','VITE_FIREBASE_PROJECT_ID','VITE_FIREBASE_STORAGE_BUCKET','VITE_FIREBASE_MESSAGING_SENDER_ID','VITE_FIREBASE_APP_ID')
  foreach ($aisleLine in (Get-Content -LiteralPath '.env.local')) {
    if ($aisleLine -match '^([A-Z_]+)=(.+)$' -and $aisleAllowedConfig -contains $Matches[1]) {
      $aisleVariableName = $Matches[1]
      $aisleVariableValue = $Matches[2].Trim().Trim('"').Trim("'")
      gh variable set $aisleVariableName --repo $aisleRepo --body $aisleVariableValue
      if ($LASTEXITCODE -ne 0) { throw "Cannot configure public browser variable $aisleVariableName" }
    }
  }
}
gh workflow run deploy.yml --repo $aisleRepo --ref main
if ($LASTEXITCODE -ne 0) { throw 'Source pushed. Workflow may not be indexed yet; rerun this script shortly or use the Actions tab.' }
Write-Output "Repository: https://github.com/$aisleRepo"
Write-Output "Expected site after successful deployment: https://$aisleLogin.github.io/Aisle/"
Write-Output "Check deployment: gh run list --repo $aisleRepo --workflow deploy.yml --limit 3"



