param(
  [string]$VaultPath = $env:OBSIDIAN_VAULT_PATH,
  [int]$DebounceSeconds = 10
)

if (-not $VaultPath) {
  Write-Error "VaultPath is required. Set OBSIDIAN_VAULT_PATH env var or pass -VaultPath"
  exit 1
}

$projectRoot = Split-Path $PSScriptRoot -Parent
$deployScript = Join-Path $projectRoot "deploy.ps1"
$folders = @("Knowledge Base", "Bug fixes", "Interview Notes", "System Design", "Daily Notes")

Write-Host "Watching vault at: $VaultPath" -ForegroundColor Cyan
Write-Host "Debounce: ${DebounceSeconds}s -- will deploy ${DebounceSeconds}s after last change" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop." -ForegroundColor Gray

# Setup FileSystemWatcher for each folder
$watchers = @()
foreach ($folder in $folders) {
  $path = Join-Path $VaultPath $folder
  if (Test-Path $path) {
    $watcher = New-Object System.IO.FileSystemWatcher
    $watcher.Path = $path
    $watcher.Filter = "*.md"
    $watcher.IncludeSubdirectories = $true
    $watcher.EnableRaisingEvents = $true
    $watchers += $watcher
    Write-Host "  Watching: $folder" -ForegroundColor Green
  }
}

$script:lastChangeTime = $null
$script:deployPending = $false

# Event handler
$action = {
  $script:lastChangeTime = Get-Date
  $script:deployPending = $true
}

foreach ($watcher in $watchers) {
  Register-ObjectEvent $watcher "Changed" -Action $action | Out-Null
  Register-ObjectEvent $watcher "Created" -Action $action | Out-Null
  Register-ObjectEvent $watcher "Deleted" -Action $action | Out-Null
  Register-ObjectEvent $watcher "Renamed" -Action $action | Out-Null
}

# Main loop: deploy after debounce period
try {
  while ($true) {
    if ($script:deployPending -and $script:lastChangeTime) {
      $elapsed = (Get-Date) - $script:lastChangeTime
      if ($elapsed.TotalSeconds -ge $DebounceSeconds) {
        $script:deployPending = $false
        $script:lastChangeTime = $null
        Write-Host "`n[$(Get-Date -Format 'HH:mm:ss')] Changes detected -- deploying..." -ForegroundColor Yellow
        & $deployScript
        Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Done. Watching for changes..." -ForegroundColor Cyan
      }
    }
    Start-Sleep -Milliseconds 500
  }
} finally {
  foreach ($watcher in $watchers) { $watcher.Dispose() }
  Get-EventSubscriber | Unregister-Event
}
