[CmdletBinding()]
param([string]$Port = 'COM8', [int]$StabilityMinutes = 35)

$ErrorActionPreference = 'Stop'
$principal = [Security.Principal.WindowsPrincipal]::new([Security.Principal.WindowsIdentity]::GetCurrent())
if (!$principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    $arguments = "-NoLogo -NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`" -Port `"$Port`" -StabilityMinutes $StabilityMinutes"
    $child = Start-Process -FilePath 'powershell.exe' -ArgumentList $arguments -Verb RunAs -Wait -PassThru
    exit $child.ExitCode
}
$createdNew = $false
$commissioningMutex = [Threading.Mutex]::new($true, 'Global\VELYQUA-FIREBEETLE2-COMMISSIONING', [ref]$createdNew)
if (!$createdNew) { throw 'A VELYQUA FireBeetle 2 commissioning runner is already active.' }
$expectedHost = 'DESKTOP-IPV4PH9'
$fqbn = 'esp32:esp32:dfrobot_firebeetle2_esp32s3:FlashSize=16M,PSRAM=opi,USBMode=hwcdc,CDCOnBoot=cdc'
$cli = 'C:\Users\User\AppData\Local\Programs\Arduino IDE\resources\app\lib\backend\resources\arduino-cli.exe'
$sketch = Join-Path $PSScriptRoot 'firebeetle2_esp32s3_commissioning'
$secrets = Join-Path $sketch 'secrets.h'
$evidenceRoot = Join-Path $PSScriptRoot 'commissioning-evidence'
$runId = (Get-Date).ToUniversalTime().ToString('yyyyMMddTHHmmssZ')
$evidence = Join-Path $evidenceRoot $runId

function Escape-CString([string]$Value) {
    return $Value.Replace('\', '\\').Replace('"', '\"').Replace("`r", '').Replace("`n", '')
}

if ($env:COMPUTERNAME -ne $expectedHost) { throw "Wrong host: expected $expectedHost" }
if (!(Test-Path -LiteralPath $cli)) { throw 'Installed Arduino CLI not found.' }
if (!(Test-Path -LiteralPath $sketch)) { throw 'Commissioning sketch not found.' }
New-Item -ItemType Directory -Path $evidence -Force | Out-Null

$pnp = pnputil /enum-devices /connected /class Ports 2>&1 | Out-String
$pnp | Set-Content -LiteralPath (Join-Path $evidence 'ports-before.txt') -Encoding utf8
if ($pnp -notmatch [regex]::Escape("($Port)")) { throw "$Port is not a connected Windows serial device." }
if ($pnp -notmatch 'VID_303A&PID_1001') { throw 'Espressif USB VID/PID was not detected.' }

if (!(Test-Path -LiteralPath $secrets)) {
    $interfaces = netsh wlan show interfaces 2>$null | Out-String
    $ssidMatch = [regex]::Match($interfaces, '(?m)^\s*SSID\s*:\s*(.+?)\s*$')
    $ssid = if ($ssidMatch.Success) { $ssidMatch.Groups[1].Value } else { '' }
    $password = ''
    if ($ssid) {
        $profile = netsh wlan show profile name="$ssid" key=clear 2>$null | Out-String
        $keyMatch = [regex]::Match($profile, '(?m)^\s*Key Content\s*:\s*(.+?)\s*$')
        if ($keyMatch.Success) { $password = $keyMatch.Groups[1].Value }
    }
    if (!$ssid) { $ssid = Read-Host 'Wi-Fi SSID (2.4 GHz)' }
    if (!$password) {
        $securePassword = Read-Host 'Wi-Fi password' -AsSecureString
        $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
        try { $password = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr) }
        finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
    }
    $content = @"
#pragma once
#define VELYQUA_WIFI_CONFIGURED 1
#define VELYQUA_WIFI_SSID "$(Escape-CString $ssid)"
#define VELYQUA_WIFI_PASSWORD "$(Escape-CString $password)"
"@
    [IO.File]::WriteAllText($secrets, $content, [Text.UTF8Encoding]::new($false))
    $password = $null
}

& $cli version 2>&1 | Tee-Object -FilePath (Join-Path $evidence 'arduino-cli-version.txt')
if ($LASTEXITCODE -ne 0) { throw 'Arduino CLI version query failed.' }
& $cli core list 2>&1 | Tee-Object -FilePath (Join-Path $evidence 'core-list.txt')
if ($LASTEXITCODE -ne 0) { throw 'Arduino core inventory failed.' }
& $cli board list 2>&1 | Tee-Object -FilePath (Join-Path $evidence 'board-list-before.txt')
if ($LASTEXITCODE -ne 0) { throw 'Arduino board discovery failed.' }

& $cli compile --fqbn $fqbn --warnings all --export-binaries $sketch 2>&1 | Tee-Object -FilePath (Join-Path $evidence 'compile.log')
if ($LASTEXITCODE -ne 0) { throw 'Firmware compilation failed. See compile.log.' }

& $cli upload --port $Port --fqbn $fqbn $sketch 2>&1 | Tee-Object -FilePath (Join-Path $evidence 'upload.log')
if ($LASTEXITCODE -ne 0) { throw 'Firmware upload failed. See upload.log.' }

Start-Sleep -Seconds 3
$serialLog = Join-Path $evidence 'serial.ndjson'
$serial = [IO.Ports.SerialPort]::new($Port, 115200, 'None', 8, 'One')
$serial.DtrEnable = $false
$serial.RtsEnable = $false
$serial.ReadTimeout = 250
$deadline = (Get-Date).AddMinutes($StabilityMinutes)
$serialTextLive = ''
$networkPassed = $false
$lastNetworkAttempt = [datetime]::MinValue
try {
    $serial.Open()
    while ((Get-Date) -lt $deadline) {
        $chunk = $serial.ReadExisting()
        if ($chunk) {
            [IO.File]::AppendAllText($serialLog, $chunk)
            $serialTextLive += $chunk
        }
        if (!$networkPassed -and (Get-Date) -gt $lastNetworkAttempt.AddSeconds(10)) {
            $ipMatch = [regex]::Match($serialTextLive, '"event":"WIFI_CONNECTED"[^\r\n]*"ip":"([0-9.]+)"')
            if ($ipMatch.Success) {
                $lastNetworkAttempt = Get-Date
                $ip = $ipMatch.Groups[1].Value
                try {
                    $stopwatch = [Diagnostics.Stopwatch]::StartNew()
                    $response = Invoke-RestMethod -Uri "http://$ip/health" -TimeoutSec 3
                    $stopwatch.Stop()
                    if ($response.status -eq 'ok' -and $response.node -eq 'velyqua-firebeetle2-s3') {
                        $networkPassed = $true
                        [ordered]@{
                            tested_at_utc = (Get-Date).ToUniversalTime().ToString('o')
                            target_ip = $ip
                            endpoint = '/health'
                            status = $response.status
                            node = $response.node
                            build = $response.build
                            latency_ms = $stopwatch.ElapsedMilliseconds
                            dell_to_esp32 = 'PASS'
                        } | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $evidence 'network-test.json') -Encoding utf8
                    }
                } catch { }
            }
        }
        Start-Sleep -Milliseconds 100
    }
} finally {
    if ($serial.IsOpen) { $serial.Close() }
    $serial.Dispose()
}

$serialText = if (Test-Path $serialLog) { Get-Content -LiteralPath $serialLog -Raw } else { '' }
$required = @('VELYQUA_NODE_ONLINE','COMMISSIONING_BOOT','HARDWARE_INVENTORY','BENCHMARK_COMPLETE','MEMORY_ENVELOPE','CONCURRENCY_BENCHMARK','WIFI_CONNECTED','WIFI_RECOVERY_PASS','NETWORK_HEALTH_READY','NETWORK_HEALTH_REQUEST','STABILITY_PASS')
$missing = @($required | Where-Object {
    $pattern = '"event":"' + [regex]::Escape($_) + '"'
    $serialText -notmatch $pattern
})
$restartPasses = ([regex]::Matches($serialText, '"event":"RESTART_PERSISTENCE_PASS"')).Count
$unexpectedFaults = ([regex]::Matches($serialText, '(?im)panic|watchdog|guru meditation|exception')).Count
$files = Get-ChildItem -LiteralPath $evidence -File | ForEach-Object {
    [ordered]@{ name = $_.Name; bytes = $_.Length; sha256 = (Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash }
}
$receipt = [ordered]@{
    schema_version = 'velyqua.firebeetle2.commissioning.v1'
    captured_at_utc = (Get-Date).ToUniversalTime().ToString('o')
    host = $env:COMPUTERNAME
    port = $Port
    usb_identity = 'VID_303A&PID_1001'
    fqbn = $fqbn
    stability_minutes = $StabilityMinutes
    required_events = $required
    missing_events = $missing
    credential_values_included = $false
    sensors_connected = $false
    rs485_attempted = $false
    dell_network_retrieval = if ($networkPassed) { 'PASS' } else { 'FAIL' }
    restart_persistence_events = $restartPasses
    unexpected_fault_markers = $unexpectedFaults
    status = if ($missing.Count -eq 0 -and $networkPassed -and $restartPasses -ge 2 -and $unexpectedFaults -eq 0) { 'PASS' } else { 'FAIL' }
    artifacts = @($files)
}
$receiptPath = Join-Path $evidence 'commissioning-receipt.json'
$receipt | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $receiptPath -Encoding utf8
$receipt | ConvertTo-Json -Depth 8
if ($receipt.status -ne 'PASS') { exit 2 }
exit 0
