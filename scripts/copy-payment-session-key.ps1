$ErrorActionPreference = 'Stop'
# This key never appears in terminal output, chat or tracked files.
$aisleSessionBytes = New-Object byte[] 32
$aisleRng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
try { $aisleRng.GetBytes($aisleSessionBytes) } finally { $aisleRng.Dispose() }
Set-Clipboard -Value ([BitConverter]::ToString($aisleSessionBytes).Replace('-', '').ToLowerInvariant())
Write-Output 'A new PAYMENT_SESSION_KEY is in your clipboard. Paste into Vercel, save, then clear your clipboard. Do not send it in chat.'
