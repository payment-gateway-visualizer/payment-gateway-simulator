# One-time setup for a new computer.
# Creates .env (with random passwords) and the RS256 key pair in keys\.
# Safe to run again: it never overwrites a .env that already exists.
# Keep the variable list below in sync with .env.example.

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

function New-RandomSecret([int]$length) {
    $chars = [char[]]'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    $bytes = New-Object byte[] $length
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
    -join ($bytes | ForEach-Object { $chars[$_ % $chars.Length] })
}

# ---------- 1. the .env file ----------
$adminPassword = $null
if (Test-Path (Join-Path $root ".env")) {
    Write-Host ".env already exists - leaving it alone."
} else {
    $adminPassword = New-RandomSecret 16
    $lines = @(
        "POSTGRES_ADMIN_USER=pgadmin",
        "POSTGRES_ADMIN_PASSWORD=$(New-RandomSecret 24)",
        "AUTH_DB_PASSWORD=$(New-RandomSecret 24)",
        "WALLET_DB_PASSWORD=$(New-RandomSecret 24)",
        "SETTLEMENT_DB_PASSWORD=$(New-RandomSecret 24)",
        "ADMIN_EMAIL=admin@paygateway.local",
        "ADMIN_PASSWORD=$adminPassword"
    )
    $utf8NoBom = New-Object System.Text.UTF8Encoding $false
    [System.IO.File]::WriteAllText((Join-Path $root ".env"), ($lines -join "`n") + "`n", $utf8NoBom)
    Write-Host "Created .env with random passwords."
}

# ---------- 2. the signing keys ----------
$private = Join-Path $root "keys\private.pem"
$public  = Join-Path $root "keys\public.pem"

if ((Test-Path $private) -and (Test-Path $public)) {
    Write-Host "keys already exist - leaving them alone."
} else {
    $openssl = $null
    $found = Get-Command openssl -ErrorAction SilentlyContinue
    if ($found) { $openssl = $found.Source }
    foreach ($p in @("C:\Program Files\Git\usr\bin\openssl.exe", "C:\Program Files (x86)\Git\usr\bin\openssl.exe")) {
        if (-not $openssl -and (Test-Path $p)) { $openssl = $p }
    }
    if (-not $openssl) {
        Write-Host "Could not find OpenSSL. Install Git for Windows (it includes OpenSSL) and run this again." -ForegroundColor Red
        exit 1
    }

    New-Item -ItemType Directory -Force -Path (Join-Path $root "keys") | Out-Null

    & $openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out $private
    if ($LASTEXITCODE -ne 0) { Write-Host "Creating the private key failed." -ForegroundColor Red; exit 1 }

    & $openssl pkey -in $private -pubout -out $public
    if ($LASTEXITCODE -ne 0) { Write-Host "Creating the public key failed." -ForegroundColor Red; exit 1 }

    Write-Host "Created keys\private.pem and keys\public.pem."
}

# ---------- 3. what next ----------
Write-Host ""
Write-Host "Setup done. Next step:  docker compose up -d --build" -ForegroundColor Green
if ($adminPassword) {
    Write-Host ""
    Write-Host "Your admin login (for your computer only, write it down):"
    Write-Host "  email:    admin@paygateway.local"
    Write-Host "  password: $adminPassword"
}