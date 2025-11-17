<#
PowerShell packaging script for YouTube URL Copier extension
Usage:
  Open PowerShell, cd to the extension folder and run:
    .\package.ps1

This script will create a ZIP file at the parent folder named
youtube_url_copier_extension.zip (overwrites if exists).
#>

param(
    [string]$Version = ''
)

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$ParentDir = Split-Path -Parent $ScriptDir

# ZIPファイル名にバージョンまたはタイムスタンプを付与
if ([string]::IsNullOrEmpty($Version)) {
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $zipName = "youtube_url_copier_extension_$timestamp.zip"
} else {
    # バージョン文字列を安全にファイル名化
    $safeVersion = $Version -replace '[^0-9A-Za-z._-]', '_'
    $zipName = "youtube_url_copier_extension_$safeVersion.zip"
}

$ZipPath = Join-Path $ParentDir $zipName

Write-Host "Packaging extension from: $ScriptDir"
Write-Host "Destination ZIP: $ZipPath"

# Remove existing ZIP if exists (shouldn't normally match because name contains timestamp/version)
if (Test-Path $ZipPath) {
    Write-Host "Removing existing ZIP: $ZipPath"
    Remove-Item $ZipPath -Force
}

# Build list of files to include, excluding common unwanted files and folders
$excludeDirPatterns = @('\\.git\\', '\\node_modules\\')
$excludeExtensions = @('.zip', '.log')

# Read optional .packageignore in script directory for additional patterns
$packageIgnorePath = Join-Path $ScriptDir '.packageignore'
$userPatterns = @()
if (Test-Path $packageIgnorePath) {
    Write-Host "Reading .packageignore: $packageIgnorePath"
    $lines = Get-Content $packageIgnorePath | ForEach-Object { $_.Trim() } | Where-Object { $_ -and -not ($_.StartsWith('#')) }
    foreach ($ln in $lines) {
        # normalize slashes
        $p = $ln -replace '/','\\'
        $userPatterns += $p
    }
}

$all = Get-ChildItem -Path $ScriptDir -Recurse -File | Where-Object {
    $full = $_.FullName

    # Exclude by directory pattern (e.g. .git, node_modules)
    foreach ($pat in $excludeDirPatterns) {
        if ($full -match $pat) { return $false }
    }

    # Exclude by user-specified patterns from .packageignore
    foreach ($pat in $userPatterns) {
        try {
            # If pattern contains wildcards, use -like on full path
            if ($pat -like '*[*?]*') {
                if ($full -like "*$pat*") { return $false }
            } else {
                if ($full -like "*$pat*") { return $false }
            }
        } catch {
            # ignore pattern errors
        }
    }

    # Exclude by extension
    if ($excludeExtensions -contains $_.Extension) { return $false }

    # Exclude the output ZIP (just in case)
    if ($full -eq $ZipPath) { return $false }

    return $true
}

# Create temporary staging folder to avoid including extraneous files
$staging = Join-Path $env:TEMP ([System.IO.Path]::GetRandomFileName())
New-Item -ItemType Directory -Path $staging | Out-Null

foreach ($f in $all) {
    $relative = $f.FullName.Substring($ScriptDir.Length).TrimStart('\')
    $dest = Join-Path $staging $relative
    $destDir = Split-Path -Parent $dest
    if (-not (Test-Path $destDir)) { New-Item -ItemType Directory -Path $destDir | Out-Null }
    Copy-Item -Path $f.FullName -Destination $dest -Force
}

# Create ZIP from staging directory
Compress-Archive -Path (Join-Path $staging '*') -DestinationPath $ZipPath -Force

# Clean up staging
Remove-Item -Path $staging -Recurse -Force

Write-Host "Created ZIP:" (Get-Item $ZipPath).FullName
Write-Host "Size(bytes):" (Get-Item $ZipPath).Length

Write-Host "To create another package with an explicit version, run:"
Write-Host "  powershell -ExecutionPolicy Bypass -File .\package.ps1 -Version 1.0.0"

exit 0
