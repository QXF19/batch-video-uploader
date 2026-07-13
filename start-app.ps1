$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$port = 4173

function Test-Port($Port) {
  try {
    $client = New-Object System.Net.Sockets.TcpClient
    $client.Connect('127.0.0.1', $Port)
    $client.Close()
    return $true
  } catch { return $false }
}

if (-not (Test-Port $port)) {
  $python = Get-Command python -ErrorAction SilentlyContinue
  if ($python) {
    Start-Process -FilePath $python.Source -ArgumentList '-m', 'http.server', $port, '--bind', '127.0.0.1', '--directory', $root -WindowStyle Hidden
  } else {
    $node = Get-Command node -ErrorAction SilentlyContinue
    if ($node) {
      $serverScript = Join-Path $root 'server.mjs'
      Start-Process -FilePath $node.Source -ArgumentList "`"$serverScript`"", $port -WindowStyle Hidden
    } else {
      Start-Process (Join-Path $root 'index.html')
      exit 0
    }
  }
  Start-Sleep -Milliseconds 900
}

$edgeCommand = Get-Command msedge -ErrorAction SilentlyContinue
$edgeExe = if ($edgeCommand) { $edgeCommand.Source } else { $null }
if (-not $edgeExe) {
  $edgePath = Join-Path ${env:ProgramFiles(x86)} 'Microsoft\Edge\Application\msedge.exe'
  if (Test-Path $edgePath) { $edgeExe = $edgePath }
}

$url = "http://127.0.0.1:$port"
if ($edgeExe) {
  Start-Process -FilePath $edgeExe -ArgumentList "--app=$url", '--start-maximized'
} else {
  Start-Process $url
}
