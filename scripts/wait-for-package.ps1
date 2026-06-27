# Waits for `npm run package` to finish.
# - Success: ChampionsLab-Portable-*.exe appears in dist-electron.
# - Stuck:  no file changes in dist-electron for $stuckMinutes -> kill node/electron, rerun `npm run package` once, keep waiting.
# - Hard cap: $hardCapMinutes total before giving up.

param(
  [int]$stuckMinutes   = 5,
  [int]$hardCapMinutes = 45,
  [int]$pollSeconds    = 15,
  [string]$artifactPattern = "ChampionsLab-Portable-*.exe"
)

$ErrorActionPreference = "Stop"
$root    = "C:\Users\stark\IdeaProjects\ChampionsLab"
$distDir = Join-Path $root "dist-electron"
$started = Get-Date
$lastChange = Get-Date
$lastSig = ""
$restarted = $false

function Get-DistSignature {
  if (-not (Test-Path $distDir)) { return "" }
  $items = Get-ChildItem $distDir -Recurse -File -ErrorAction SilentlyContinue
  if (-not $items) { return "" }
  ($items | ForEach-Object { "$($_.FullName)|$($_.Length)|$($_.LastWriteTimeUtc.Ticks)" }) -join ";"
}

function Test-Done {
  Test-Path (Join-Path $distDir $artifactPattern)
}

function Kill-Builders {
  Get-Process -ErrorAction SilentlyContinue |
    Where-Object { $_.ProcessName -match '^(electron|electron-builder|node|next)$' } |
    ForEach-Object { try { Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue } catch {} }
  Start-Sleep -Seconds 3
}

while ($true) {
  if (Test-Done) {
    $exe = Get-ChildItem (Join-Path $distDir $artifactPattern) | Select-Object -First 1
    Write-Output "DONE: $($exe.FullName) ($([math]::Round($exe.Length/1MB,1)) MB)"
    exit 0
  }

  $sig = Get-DistSignature
  if ($sig -ne $lastSig) {
    $lastSig    = $sig
    $lastChange = Get-Date
  }

  $stuckFor = (New-TimeSpan -Start $lastChange -End (Get-Date)).TotalMinutes
  $total    = (New-TimeSpan -Start $started    -End (Get-Date)).TotalMinutes

  if ($total -ge $hardCapMinutes) {
    Write-Output "TIMEOUT after $([math]::Round($total,1)) min. Killing builders."
    Kill-Builders
    exit 2
  }

  if ($stuckFor -ge $stuckMinutes) {
    if ($restarted) {
      Write-Output "STUCK again after restart. Killing builders and giving up."
      Kill-Builders
      exit 3
    }
    Write-Output "STUCK $([math]::Round($stuckFor,1)) min with no file changes. Restarting package..."
    Kill-Builders
    Push-Location $root
    Start-Process -FilePath "npm.cmd" -ArgumentList "run","package" -WorkingDirectory $root -WindowStyle Hidden
    Pop-Location
    $restarted  = $true
    $lastChange = Get-Date
    $started    = Get-Date  # reset hard cap window after restart
  }

  Start-Sleep -Seconds $pollSeconds
}

