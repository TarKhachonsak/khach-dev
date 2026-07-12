param(
  [string]$VaultPath = $env:OBSIDIAN_VAULT_PATH,
  [string]$Message = "sync: vault update $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
)

# 1. Sync vault
& "$PSScriptRoot\scripts\sync-vault.ps1" -VaultPath $VaultPath
if ($LASTEXITCODE -ne 0) { exit 1 }

# 2. Check if there are changes
git add content/
$status = git status --porcelain content/
if (-not $status) {
  Write-Host "No changes detected. Nothing to deploy." -ForegroundColor Yellow
  exit 0
}

# 3. Commit and push -> Vercel auto-builds
git commit -m $Message
git push origin main

Write-Host "Pushed. Vercel will rebuild in ~1-2 minutes." -ForegroundColor Green
Write-Host "Track build at: https://vercel.com/dashboard" -ForegroundColor Cyan
