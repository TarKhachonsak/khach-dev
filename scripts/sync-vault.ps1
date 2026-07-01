param(
  [string]$VaultPath = $env:OBSIDIAN_VAULT_PATH
)

if (-not $VaultPath) {
  Write-Error "VaultPath is required. Set OBSIDIAN_VAULT_PATH env var or pass -VaultPath"
  exit 1
}

$projectRoot = Split-Path $PSScriptRoot -Parent

$targetMap = [ordered]@{
  "Knowledge Base"  = "content/knowledge-base"
  "Bug fixes"       = "content/bug-fixes"
  "Interview Notes" = "content/interview-notes"
  "System Design"   = "content/system-design"
  "Daily Notes"     = "content/daily-notes"
}

Write-Host "Syncing vault from: $VaultPath" -ForegroundColor Cyan

foreach ($folder in $targetMap.Keys) {
  $src = Join-Path $VaultPath $folder
  $dst = Join-Path $projectRoot $targetMap[$folder]

  if (Test-Path $src) {
    New-Item -ItemType Directory -Force -Path $dst | Out-Null
    robocopy $src $dst "*.md" /MIR /NFL /NDL /NJH /NJS | Out-Null
    Write-Host "  Synced: $folder" -ForegroundColor Green
  } else {
    New-Item -ItemType Directory -Force -Path $dst | Out-Null
    Write-Host "  Skipped (not found): $folder" -ForegroundColor Yellow
  }
}

Write-Host "Sync complete." -ForegroundColor Cyan
