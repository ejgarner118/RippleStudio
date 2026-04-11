# Build BoardCAD from source (Windows). Run from this directory after JDK is installed.
# Requires: JDK 11+ on PATH or JAVA_HOME pointing to a JDK.

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot
Set-Location $root

$javacExe = $null
if (Get-Command javac -ErrorAction SilentlyContinue) {
    $javacExe = (Get-Command javac).Source
} elseif ($env:JAVA_HOME) {
    $cand = Join-Path $env:JAVA_HOME "bin\javac.exe"
    if (Test-Path $cand) { $javacExe = $cand }
}
if (-not $javacExe) {
    Write-Error "javac not found. Install a JDK (e.g. Microsoft OpenJDK 17 or Temurin 11), then add bin to PATH or set JAVA_HOME."
}

$depJars = @(
    "gluegen-rt.jar",
    "j3dcore.jar",
    "j3dutils.jar",
    "jogl-all.jar",
    "vecmath.jar",
    "jython.jar",
    "Lib.jar",
    "jythonconsole.jar"
)
foreach ($j in $depJars) {
    if (-not (Test-Path (Join-Path $root $j))) {
        Write-Error "Missing dependency jar: $j (expected next to this script)."
    }
}
$compileCp = ($depJars | ForEach-Object { Join-Path $root $_ }) -join ";"

$out = Join-Path $root "target\classes"
if (Test-Path $out) { Remove-Item -Recurse -Force $out }
New-Item -ItemType Directory -Path $out -Force | Out-Null

$sources = Get-ChildItem -Path $root -Recurse -Filter "*.java" |
    Where-Object { $_.FullName -notmatch "[\\/]\.git[\\/]" } |
    ForEach-Object { $_.FullName }

$argFile = Join-Path $root "target\javac-args.txt"
$argLines = New-Object System.Collections.Generic.List[string]
[void]$argLines.Add("-encoding")
[void]$argLines.Add("UTF-8")
[void]$argLines.Add("--release")
[void]$argLines.Add("11")
[void]$argLines.Add("-d")
[void]$argLines.Add($out)
[void]$argLines.Add("-cp")
[void]$argLines.Add($compileCp)
foreach ($s in $sources) { [void]$argLines.Add($s) }
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllLines($argFile, $argLines.ToArray(), $utf8NoBom)

Write-Host "Compiling $($sources.Count) Java sources with $javacExe ..."
& $javacExe "@$argFile"
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

# Resource bundles
$i18nSrc = Join-Path $root "boardcad\i18n"
$i18nDst = Join-Path $out "boardcad\i18n"
New-Item -ItemType Directory -Path $i18nDst -Force | Out-Null
Copy-Item -Path (Join-Path $i18nSrc "*.properties") -Destination $i18nDst -Force

$jarExe = Join-Path (Split-Path $javacExe) "jar.exe"
if (-not (Test-Path $jarExe)) {
    Write-Warning "jar.exe not found beside javac; skip packaging."
    exit 0
}

$outJar = Join-Path $root "BoardCAD-dev.jar"
& $jarExe --create --file $outJar --manifest (Join-Path $root "mymanifest") -C $out .
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Built $outJar"
Write-Host "Run from this directory: .\run.ps1   (or: java -jar BoardCAD-dev.jar)"
