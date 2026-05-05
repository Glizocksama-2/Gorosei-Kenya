param(
  [string]$SourceDir = "C:\Users\trapc\Pictures\Gorosei Kenya\Fit check",
  [string]$PublicDir = "public",
  [int]$MaxWidth = 1100,
  [int]$Quality = 74
)

$ErrorActionPreference = "Stop"

if (-not (Get-Command ffmpeg -ErrorAction SilentlyContinue)) {
  throw "ffmpeg is required to optimize fit-check images."
}

if (-not (Test-Path -LiteralPath $SourceDir)) {
  throw "Source directory not found: $SourceDir"
}

if (-not (Test-Path -LiteralPath $PublicDir)) {
  New-Item -ItemType Directory -Path $PublicDir | Out-Null
}

$sourceFiles = Get-ChildItem -LiteralPath $SourceDir -File |
  Where-Object { $_.Extension -match '^\.(jpg|jpeg|png|webp)$' } |
  Sort-Object Name

$seenHashes = @{}
$uniqueFiles = @()

foreach ($file in $sourceFiles) {
  $hash = (Get-FileHash -LiteralPath $file.FullName).Hash
  if (-not $seenHashes.ContainsKey($hash)) {
    $seenHashes[$hash] = $true
    $uniqueFiles += $file
  }
}

Get-ChildItem -LiteralPath $PublicDir -Filter "fit-check-*.webp" -File |
  Remove-Item -Force

$index = 1
foreach ($file in $uniqueFiles) {
  $outputPath = Join-Path $PublicDir ("fit-check-{0}.webp" -f $index)
  & ffmpeg `
    -y `
    -hide_banner `
    -loglevel error `
    -i $file.FullName `
    -vf "scale='min($MaxWidth,iw)':-2" `
    -c:v libwebp `
    -quality $Quality `
    -compression_level 6 `
    -preset picture `
    $outputPath

  $index += 1
}

$totalBytes = (Get-ChildItem -LiteralPath $PublicDir -Filter "fit-check-*.webp" -File |
  Measure-Object -Property Length -Sum).Sum

[pscustomobject]@{
  SourceFiles = $sourceFiles.Count
  UniqueFiles = $uniqueFiles.Count
  OutputDir = (Resolve-Path -LiteralPath $PublicDir).Path
  OutputSizeMB = [math]::Round(($totalBytes / 1MB), 2)
}
