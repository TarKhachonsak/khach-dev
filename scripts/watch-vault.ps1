param(
  [string]$VaultPath = $env:OBSIDIAN_VAULT_PATH,
  [int]$PollSeconds = 5,
  [int]$DebounceSeconds = 15
)

if (-not $VaultPath) {
  Write-Error "VaultPath is required. Set OBSIDIAN_VAULT_PATH env var or pass -VaultPath"
  exit 1
}

$projectRoot = Split-Path $PSScriptRoot -Parent
$deployScript = Join-Path $projectRoot "deploy.ps1"
$folders = @("Knowledge Base", "Bug fixes", "Interview Notes", "System Design", "Daily Notes")

Write-Host "Watching vault at: $VaultPath (polling every ${PollSeconds}s)" -ForegroundColor Cyan
Write-Host "Debounce: ${DebounceSeconds}s -- will deploy ${DebounceSeconds}s after last change" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop." -ForegroundColor Gray

# Build initial snapshot of all .md files and their LastWriteTime
function Get-Snapshot {
  $snapshot = @{}
  foreach ($folder in $folders) {
    $path = Join-Path $VaultPath $folder
    if (Test-Path $path) {
      Get-ChildItem $path -Recurse -Filter "*.md" | ForEach-Object {
        $snapshot[$_.FullName] = $_.LastWriteTime
      }
    }
  }
  return $snapshot
}

$lastSnapshot = Get-Snapshot
$lastChangeTime = $null
$deployPending = $false

foreach ($folder in $folders) {
  $path = Join-Path $VaultPath $folder
  if (Test-Path $path) {
    Write-Host "  Watching: $folder" -ForegroundColor Green
  }
}

try {
  while ($true) {
    Start-Sleep -Seconds $PollSeconds

    # Get current snapshot and compare
    $currentSnapshot = Get-Snapshot
    $changed = $false

    # Check for new or modified files
    foreach ($key in $currentSnapshot.Keys) {
      if (-not $lastSnapshot.ContainsKey($key) -or $lastSnapshot[$key] -ne $currentSnapshot[$key]) {
        Write-Host "[DEBUG] Changed: $key" -ForegroundColor Magenta
        $changed = $true
      }
    }

    # Check for deleted files
    foreach ($key in $lastSnapshot.Keys) {
      if (-not $currentSnapshot.ContainsKey($key)) {
        Write-Host "[DEBUG] Deleted: $key" -ForegroundColor Magenta
        $changed = $true
      }
    }

    if ($changed) {
      $lastChangeTime = Get-Date
      $deployPending = $true
      $lastSnapshot = $currentSnapshot
    }

    # Deploy after debounce
    if ($deployPending -and $lastChangeTime) {
      $elapsed = (Get-Date) - $lastChangeTime
      if ($elapsed.TotalSeconds -ge $DebounceSeconds) {
        $deployPending = $false
        $lastChangeTime = $null
        Write-Host "`n[$(Get-Date -Format 'HH:mm:ss')] Changes detected -- deploying..." -ForegroundColor Yellow
        & $deployScript -VaultPath $VaultPath
        Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Done. Watching for changes..." -ForegroundColor Cyan
      }
    }
  }
} finally {
  Write-Host "Watcher stopped." -ForegroundColor Gray
}