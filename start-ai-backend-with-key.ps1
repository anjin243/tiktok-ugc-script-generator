$ErrorActionPreference = 'Stop'

$repoRoot = $PSScriptRoot
$shortRoot = 'Z:\'

if (-not (Test-Path -LiteralPath (Join-Path $shortRoot 'backend'))) {
  if (Test-Path -LiteralPath $shortRoot) {
    throw 'Z: is already in use. Close this window and ask Codex to choose another short drive.'
  }
  subst Z: $repoRoot
  if ($LASTEXITCODE -ne 0) {
    throw 'Unable to create the temporary Z: path mapping.'
  }
}

Write-Host ''
Write-Host 'OpenAI Videos API backend setup' -ForegroundColor Cyan
Write-Host 'The key is used only by this backend process.'
Write-Host 'It will not be saved to .env, source files, browser storage, or logs.' -ForegroundColor Yellow
Write-Host ''

$secureKey = Read-Host 'Paste OPENAI_API_KEY here (input is hidden)' -AsSecureString
$keyPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureKey)
try {
  $apiKey = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($keyPointer)
} finally {
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($keyPointer)
}

if ([string]::IsNullOrWhiteSpace($apiKey)) {
  throw 'No API key was entered.'
}

$listener = Get-NetTCPConnection -State Listen -LocalPort 3000 -ErrorAction SilentlyContinue | Select-Object -First 1
if ($listener) {
  $listenerProcess = Get-Process -Id $listener.OwningProcess -ErrorAction Stop
  if ($listenerProcess.ProcessName -ne 'node') {
    throw "Port 3000 is being used by $($listenerProcess.ProcessName), so it was not stopped."
  }
  Stop-Process -Id $listener.OwningProcess
  Start-Sleep -Seconds 1
}

$esbuild = 'Z:\backend\node_modules\.pnpm\@esbuild+win32-x64@0.27.4\node_modules\@esbuild\win32-x64\esbuild.exe'
if (-not (Test-Path -LiteralPath $esbuild)) {
  throw 'The backend esbuild dependency is missing. Run pnpm install in backend first.'
}

$env:OPENAI_API_KEY = $apiKey
$apiKey = $null
$env:SKIP_DOTENV = '1'
$env:NODE_ENV = 'development'
$env:PORT = '3000'
$env:ESBUILD_BINARY_PATH = $esbuild

# Node fetch does not use the Windows Internet proxy unless environment-proxy
# support is enabled before Node starts. Prefer an explicitly supplied proxy;
# otherwise safely mirror the current WinINET proxy without displaying it.
$proxyUrl = $env:HTTPS_PROXY
if ([string]::IsNullOrWhiteSpace($proxyUrl)) {
  $internetSettings = Get-ItemProperty -LiteralPath 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Internet Settings' -ErrorAction SilentlyContinue
  if ($internetSettings.ProxyEnable -eq 1 -and -not [string]::IsNullOrWhiteSpace($internetSettings.ProxyServer)) {
    $proxyEntries = @($internetSettings.ProxyServer -split ';')
    $selectedProxy = $proxyEntries | Where-Object { $_ -match '^https=' } | Select-Object -First 1
    if (-not $selectedProxy) {
      $selectedProxy = $proxyEntries | Where-Object { $_ -match '^http=' } | Select-Object -First 1
    }
    if (-not $selectedProxy -and $proxyEntries.Count -eq 1) {
      $selectedProxy = $proxyEntries[0]
    }
    if ($selectedProxy) {
      $selectedProxy = $selectedProxy -replace '^[a-zA-Z]+=', ''
      $proxyUrl = if ($selectedProxy -match '^[a-zA-Z]+://') { $selectedProxy } else { "http://$selectedProxy" }
    }
  }
}

if (-not [string]::IsNullOrWhiteSpace($proxyUrl)) {
  $env:HTTPS_PROXY = $proxyUrl
  $env:HTTP_PROXY = $proxyUrl
  $env:NO_PROXY = 'localhost,127.0.0.1'
  $env:NODE_USE_ENV_PROXY = '1'
  Write-Host 'Windows proxy detected and enabled for Node/OpenAI requests.' -ForegroundColor Green
} else {
  Write-Host 'No proxy was detected; Node will connect directly.' -ForegroundColor Yellow
}

Set-Location -LiteralPath 'Z:\backend'
Write-Host ''
Write-Host 'Starting backend on http://localhost:3000/api ...' -ForegroundColor Green
Write-Host 'Keep this window open while using the AI video page.' -ForegroundColor Green
Write-Host 'No paid API call occurs until you confirm cost and generate a scene in the browser.' -ForegroundColor Yellow
Write-Host ''

pnpm dev
