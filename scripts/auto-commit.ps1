# Hourly unattended commit/push for the TransitOps repo.
# Registered as the "TransitOps-AutoCommit" Windows scheduled task.
# Invokes the Claude Code CLI headlessly so commit messages describe what
# actually changed, instead of a generic templated message.

$repoRoot = 'c:\Users\pooja\OneDrive\Desktop\transitops'
$promptFile = Join-Path $repoRoot 'scripts\auto-commit-prompt.txt'
$logDir = Join-Path $repoRoot 'logs'
$logFile = Join-Path $logDir 'auto-commit.log'

if (-not (Test-Path $logDir)) {
    New-Item -ItemType Directory -Path $logDir -Force | Out-Null
}

$timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
Add-Content -Path $logFile -Value "`n===== $timestamp ====="

try {
    # Route through cmd.exe with "< NUL" so the claude process sees an
    # immediately-closed stdin instead of waiting ~3s to detect there's
    # nothing piped in. Prompt is passed via a temp file to avoid quoting
    # issues with cmd.exe's argument parsing.
    $tmpPrompt = Join-Path $env:TEMP "transitops-autocommit-prompt-$PID.txt"
    Copy-Item -Path $promptFile -Destination $tmpPrompt -Force

    $cmdLine = 'claude -p --allowedTools "Bash(git *)" --disallowedTools "Write,Edit,NotebookEdit" --permission-mode bypassPermissions --output-format text < "' + $tmpPrompt + '"'
    $output = cmd /c $cmdLine 2>$null

    Remove-Item -Path $tmpPrompt -Force -ErrorAction SilentlyContinue

    $output | Add-Content -Path $logFile
}
catch {
    "ERROR: $($_.Exception.Message)" | Add-Content -Path $logFile
}
