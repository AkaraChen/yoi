# Install the client-world `yoi` CLI from the latest GitHub Release.
# Usage: irm https://raw.githubusercontent.com/AkaraChen/yoi/main/install-yoi.ps1 | iex
$ErrorActionPreference = "Stop"
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$Name = "yoi"
$ReleaseBase = "https://github.com/AkaraChen/yoi/releases/latest/download"

switch ($env:PROCESSOR_ARCHITECTURE) {
    "AMD64" { $Arch = "amd64" }
    "ARM64" { $Arch = "arm64" }
    default { throw "unsupported architecture: $($env:PROCESSOR_ARCHITECTURE)" }
}

$Asset = "${Name}_windows_${Arch}.zip"
if ($env:YOI_INSTALL_DIR -and $env:YOI_INSTALL_DIR.Trim() -ne "") {
    $Dest = $env:YOI_INSTALL_DIR
} else {
    $Dest = Join-Path $env:LOCALAPPDATA "yoi\bin"
}

$Tmp = Join-Path ([System.IO.Path]::GetTempPath()) ("yoi-install-" + [guid]::NewGuid().ToString("N"))
New-Item -ItemType Directory -Path $Tmp | Out-Null
try {
    $ZipPath = Join-Path $Tmp $Asset
    $SumsPath = Join-Path $Tmp "checksums.txt"
    try {
        Invoke-WebRequest -Uri "$ReleaseBase/$Asset" -OutFile $ZipPath -UseBasicParsing
        Invoke-WebRequest -Uri "$ReleaseBase/checksums.txt" -OutFile $SumsPath -UseBasicParsing
    } catch {
        throw "download failed (404 means no GitHub Release yet — push a v* tag). $($_.Exception.Message)"
    }

    $Line = Get-Content -LiteralPath $SumsPath | Where-Object { $_ -match ("\s" + [regex]::Escape($Asset) + "\s*$") } | Select-Object -First 1
    if (-not $Line) { throw "checksums.txt has no entry for $Asset" }
    $Expected = (($Line -split "\s+")[0]).ToLowerInvariant()
    $Actual = (Get-FileHash -LiteralPath $ZipPath -Algorithm SHA256).Hash.ToLowerInvariant()
    if ($Actual -ne $Expected) { throw "sha256 mismatch for $Asset" }

    Expand-Archive -LiteralPath $ZipPath -DestinationPath $Tmp -Force
    $Bin = Join-Path $Tmp "${Name}.exe"
    if (-not (Test-Path -LiteralPath $Bin)) { throw "archive missing ${Name}.exe" }

    New-Item -ItemType Directory -Path $Dest -Force | Out-Null
    $Target = Join-Path $Dest "${Name}.exe"
    $Staged = Join-Path $Dest ".${Name}.new.exe"
    Copy-Item -LiteralPath $Bin -Destination $Staged -Force
    Move-Item -LiteralPath $Staged -Destination $Target -Force
    Write-Host "installed $Name to $Target"
    Write-Host "add $Dest to PATH if $Name is not found"
} finally {
    Remove-Item -LiteralPath $Tmp -Recurse -Force -ErrorAction SilentlyContinue
}
