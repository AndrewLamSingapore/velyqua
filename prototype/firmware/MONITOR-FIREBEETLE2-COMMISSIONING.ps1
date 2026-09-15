[CmdletBinding()]
param(
    [string]$Port = 'COM8',
    [int]$StabilityMinutes = 35,
    [string]$EvidenceDirectory = ''
)

$ErrorActionPreference = 'Stop'
if (!$EvidenceDirectory) {
    $runId = (Get-Date).ToUniversalTime().ToString('yyyyMMddTHHmmssZ')
    $EvidenceDirectory = Join-Path $PSScriptRoot "commissioning-evidence\$runId"
}
$createdNew = $false
$monitorMutex = [Threading.Mutex]::new($true, 'Global\VELYQUA-FIREBEETLE2-MONITOR', [ref]$createdNew)
if (!$createdNew) { throw 'A VELYQUA commissioning monitor is already active.' }

$esptool = 'C:\Users\User\AppData\Local\Temp\jarvis-esp32-tooling\data\packages\esp32\tools\esptool_py\5.3.1\esptool.exe'
$serialLog = Join-Path $EvidenceDirectory 'repair-serial.ndjson'
$monitorLog = Join-Path $EvidenceDirectory 'repair-monitor.log'
$resetLog = Join-Path $EvidenceDirectory 'repair-reset.log'
New-Item -ItemType Directory -Path $EvidenceDirectory -Force | Out-Null

& $esptool --chip esp32s3 --port $Port --before default-reset --after hard-reset run 2>&1 |
    Tee-Object -FilePath $resetLog
if ($LASTEXITCODE -ne 0) { throw 'Pre-monitor firmware reset failed.' }

$serial = $null
$serialTextLive = ''
$networkPassed = $false
$lastNetworkAttempt = [datetime]::MinValue
$deadline = (Get-Date).AddMinutes($StabilityMinutes)

function Open-MonitorPort {
    $candidate = [IO.Ports.SerialPort]::new($Port, 115200, 'None', 8, 'One')
    $candidate.DtrEnable = $false
    $candidate.RtsEnable = $false
    $candidate.ReadTimeout = 250
    $candidate.Open()
    return $candidate
}

try {
    while ((Get-Date) -lt $deadline) {
        if ($null -eq $serial -or !$serial.IsOpen) {
            try {
                $serial = Open-MonitorPort
                Add-Content -LiteralPath $monitorLog -Value "$(Get-Date -Format o) SERIAL_OPEN"
            } catch {
                Start-Sleep -Milliseconds 500
                continue
            }
        }
        try {
            $chunk = $serial.ReadExisting()
            if ($chunk) {
                [IO.File]::AppendAllText($serialLog, $chunk)
                $serialTextLive += $chunk
            }
        } catch {
            Add-Content -LiteralPath $monitorLog -Value "$(Get-Date -Format o) SERIAL_REOPEN"
            try { $serial.Close() } catch { }
            $serial.Dispose()
            $serial = $null
            Start-Sleep -Milliseconds 500
            continue
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
                        } | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $EvidenceDirectory 'repair-network-test.json') -Encoding utf8
                    }
                } catch {
                    Add-Content -LiteralPath $monitorLog -Value "$(Get-Date -Format o) NETWORK_RETRY"
                }
            }
        }
        Start-Sleep -Milliseconds 100
    }
} finally {
    if ($null -ne $serial) {
        try { if ($serial.IsOpen) { $serial.Close() } } catch { }
        $serial.Dispose()
    }
}

$serialText = if (Test-Path $serialLog) { Get-Content -LiteralPath $serialLog -Raw } else { '' }
$required = @(
    'VELYQUA_NODE_ONLINE', 'COMMISSIONING_BOOT', 'HARDWARE_INVENTORY',
    'BENCHMARK_COMPLETE', 'MEMORY_ENVELOPE', 'CONCURRENCY_BENCHMARK',
    'WIFI_CONNECTED', 'WIFI_RECOVERY_PASS', 'NETWORK_HEALTH_READY',
    'NETWORK_HEALTH_REQUEST', 'STABILITY_PASS'
)
$missing = @($required | Where-Object { $serialText -notmatch ('"event":"' + [regex]::Escape($_) + '"') })
$restartPasses = ([regex]::Matches($serialText, '"event":"RESTART_PERSISTENCE_PASS"')).Count
$unexpectedFaults = ([regex]::Matches($serialText, '(?im)panic|watchdog|guru meditation|exception')).Count
$artifacts = Get-ChildItem -LiteralPath $EvidenceDirectory -File | Where-Object { $_.Name -ne 'repair-commissioning-receipt.json' } | ForEach-Object {
    [ordered]@{ name = $_.Name; bytes = $_.Length; sha256 = (Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash }
}
$status = if ($missing.Count -eq 0 -and $networkPassed -and $restartPasses -ge 2 -and $unexpectedFaults -eq 0) { 'PASS' } else { 'FAIL' }
$receipt = [ordered]@{
    schema_version = 'velyqua.firebeetle2.commissioning.v1'
    captured_at_utc = (Get-Date).ToUniversalTime().ToString('o')
    host = $env:COMPUTERNAME
    port = $Port
    usb_identity = 'VID_303A&PID_1001'
    fqbn = 'esp32:esp32:dfrobot_firebeetle2_esp32s3:FlashSize=16M,PSRAM=opi,USBMode=hwcdc,CDCOnBoot=cdc'
    stability_minutes = $StabilityMinutes
    required_events = $required
    missing_events = $missing
    dell_network_retrieval = if ($networkPassed) { 'PASS' } else { 'FAIL' }
    restart_persistence_events = $restartPasses
    unexpected_fault_markers = $unexpectedFaults
    credential_values_included = $false
    sensors_connected = $false
    status = $status
    artifacts = @($artifacts)
}
$receipt | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath (Join-Path $EvidenceDirectory 'repair-commissioning-receipt.json') -Encoding utf8
$receipt | ConvertTo-Json -Depth 8
if ($status -ne 'PASS') { exit 2 }
