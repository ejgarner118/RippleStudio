# Run BoardCAD. Execute from this folder so shapebot.properties, STL tools, and *.py scripts resolve.
# Uses an explicit classpath so JOGL/GlueGen native jars load (java -jar ignores -cp).

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot
Set-Location $root

$javaExe = $null
if (Get-Command java -ErrorAction SilentlyContinue) {
    $javaExe = (Get-Command java).Source
} elseif ($env:JAVA_HOME) {
    $cand = Join-Path $env:JAVA_HOME "bin\java.exe"
    if (Test-Path $cand) { $javaExe = $cand }
}
if (-not $javaExe) {
    Write-Error "java not found. Install a JRE/JDK and add to PATH or set JAVA_HOME."
}

$mainJar = if (Test-Path (Join-Path $root "BoardCAD-dev.jar")) { "BoardCAD-dev.jar" } elseif (Test-Path (Join-Path $root "BoardCAD.jar")) { "BoardCAD.jar" } else { $null }
if (-not $mainJar) {
    Write-Error "No BoardCAD.jar or BoardCAD-dev.jar found. Run .\build.ps1 first."
}

$jars = @(
    ".",
    $mainJar,
    "gluegen-rt.jar",
    "j3dcore.jar",
    "j3dutils.jar",
    "jogl-all.jar",
    "vecmath.jar",
    "jython.jar",
    "Lib.jar",
    "jythonconsole.jar",
    "gluegen-rt-natives-windows-amd64.jar",
    "jogl-all-natives-windows-amd64.jar"
)
$parts = @()
foreach ($j in $jars) {
    if ($j -eq ".") { $parts += $root; continue }
    $p = Join-Path $root $j
    if (Test-Path $p) { $parts += $p }
}
$cp = $parts -join ";"

& $javaExe -cp $cp boardcad.gui.jdk.BoardCAD @args
