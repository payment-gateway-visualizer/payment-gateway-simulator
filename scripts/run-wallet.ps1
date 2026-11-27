# Starts the wallet service. Reads the DB password from the repo's .env at run time.
$root = Split-Path -Parent $PSScriptRoot
$line = Get-Content "$root\.env" | Where-Object { $_ -match '^WALLET_DB_PASSWORD=' }
$env:WALLET_DB_PASSWORD = ($line -replace '^WALLET_DB_PASSWORD=','').Trim()
Set-Location "$root\wallet-services"
.\mvnw.cmd spring-boot:run