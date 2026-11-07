# Windows Built-In Zero-Dependency Web Server
# Runs natively on Windows using .NET HttpListener.
# NO Node.js, NO npm, NO Python, NO dependencies required!

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$carDist = Join-Path $scriptDir "dist"
$twinDist = Join-Path $scriptDir "Digital Twin\dist"

if (-not (Test-Path $carDist)) {
    Write-Host "[ERROR] Could not find dist folder. Please verify the repository files." -ForegroundColor Red
    pause
    exit 1
}

$mimeTypes = @{
    ".html" = "text/html; charset=utf-8"
    ".js"   = "application/javascript; charset=utf-8"
    ".css"  = "text/css; charset=utf-8"
    ".json" = "application/json"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".jpeg" = "image/jpeg"
    ".svg"  = "image/svg+xml"
    ".ico"  = "image/x-icon"
    ".woff" = "font/woff"
    ".woff2"= "font/woff2"
    ".map"  = "application/json"
}

function Start-StaticListener {
    param([int]$Port, [string]$RootDir, [string]$Name)

    $listener = New-Object System.Net.HttpListener
    $listener.Prefixes.Add("http://localhost:$Port/")
    try {
        $listener.Start()
        Write-Host "[OK] $Name started at http://localhost:$Port/" -ForegroundColor Green
    } catch {
        Write-Host "[WARN] Port $Port in use or access denied. Error: $_" -ForegroundColor Yellow
        return $null
    }

    $runspace = [PowerShell]::Create().AddScript({
        param($listener, $RootDir, $mimeTypes)
        while ($listener.IsListening) {
            try {
                $context = $listener.GetContext()
                $request = $context.Request
                $response = $context.Response

                $urlPath = $request.Url.LocalPath
                if ($urlPath -eq "/" -or [string]::IsNullOrWhiteSpace($urlPath)) {
                    $urlPath = "/index.html"
                }

                $cleanRelPath = $urlPath.TrimStart("/").Replace("/", [System.IO.Path]::DirectorySeparatorChar)
                $filePath = [System.IO.Path]::Combine($RootDir, $cleanRelPath)

                if ([System.IO.File]::Exists($filePath)) {
                    $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
                    $contentType = "application/octet-stream"
                    if ($mimeTypes.ContainsKey($ext)) {
                        $contentType = $mimeTypes[$ext]
                    }

                    $bytes = [System.IO.File]::ReadAllBytes($filePath)
                    $response.ContentType = $contentType
                    $response.ContentLength64 = $bytes.Length
                    $response.AddHeader("Access-Control-Allow-Origin", "*")
                    $response.AddHeader("Cache-Control", "no-cache")
                    $response.StatusCode = 200
                    $response.OutputStream.Write($bytes, 0, $bytes.Length)
                } else {
                    $response.StatusCode = 404
                    $msg = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found: $urlPath")
                    $response.ContentLength64 = $msg.Length
                    $response.OutputStream.Write($msg, 0, $msg.Length)
                }
                $response.OutputStream.Close()
            } catch {
                # Listener stopped or client disconnected
            }
        }
    }).AddArgument($listener).AddArgument($RootDir).AddArgument($mimeTypes)

    $asyncHandle = $runspace.BeginInvoke()
    return @{ Listener = $listener; Runspace = $runspace; Handle = $asyncHandle }
}

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "   CONNECTED VEHICLE ECOSYSTEM - WINDOWS ZERO-INSTALL RUNNER" -ForegroundColor Cyan
Write-Host "   No Node.js or libraries required! Powered by Windows Native .NET" -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan

$carServer = Start-StaticListener -Port 3000 -RootDir $carDist -Name "Virtual Car Simulator"
$twinServer = Start-StaticListener -Port 3001 -RootDir $twinDist -Name "Digital Twin Observatory"

Write-Host "`nOpening both dashboards in your browser..." -ForegroundColor Yellow
Start-Process "http://localhost:3000"
Start-Process "http://localhost:3001"

Write-Host "`nBoth dashboards are connected in real-time via Browser BroadcastChannel!" -ForegroundColor Green
Write-Host "Press Ctrl+C or close this window to exit.`n" -ForegroundColor Gray

# Keep script running
try {
    while ($true) {
        Start-Sleep -Seconds 1
    }
} finally {
    if ($carServer) { $carServer.Listener.Stop() }
    if ($twinServer) { $twinServer.Listener.Stop() }
}

