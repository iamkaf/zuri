[CmdletBinding()]
param(
  [string]$Version,
  [string]$Repo = "iamkaf/zuri",
  [switch]$Silent
)

$ErrorActionPreference = "Stop"

if (-not $IsWindows) {
  throw "This installer currently supports Windows only."
}

$apiBase = "https://api.github.com/repos/$Repo/releases"
$releaseUrl = if ($Version) {
  $tag = if ($Version.StartsWith("v")) { $Version } else { "v$Version" }
  "$apiBase/tags/$tag"
} else {
  "$apiBase/latest"
}

Write-Host "Fetching release metadata from $Repo..."
$release = Invoke-RestMethod -Uri $releaseUrl -Headers @{ "User-Agent" = "zuri-install-script" }

$asset = $release.assets |
  Where-Object { $_.name -match '\\.Setup\\.exe$' } |
  Select-Object -First 1

if (-not $asset) {
  $asset = $release.assets |
    Where-Object { $_.name -match '\\.exe$' } |
    Select-Object -First 1
}

if (-not $asset) {
  throw "No Windows .exe installer asset found for release '$($release.tag_name)'."
}

$installerPath = Join-Path $env:TEMP $asset.name

Write-Host "Downloading $($asset.name)..."
Invoke-WebRequest -Uri $asset.browser_download_url -OutFile $installerPath

$arguments = @()
if ($Silent) {
  $arguments += "/S"
}

Write-Host "Starting installer..."
$proc = Start-Process -FilePath $installerPath -ArgumentList $arguments -PassThru -Wait

if ($proc.ExitCode -ne 0) {
  throw "Installer exited with code $($proc.ExitCode)."
}

Write-Host "Zuri installed successfully."
