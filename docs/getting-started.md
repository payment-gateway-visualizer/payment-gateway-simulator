# Getting PesaPay running on your computer

Three commands set up the backend. The first time takes about 15 minutes, mostly waiting for the first Docker build.

## Before you start

You need Docker Desktop (running), Git for Windows, and the repo cloned.

## Step 1: Get the latest code

```powershell
git switch main
git pull
```

## Step 2: Reset your old database (once only)

We moved from Flyway to Liquibase for database setup. Your old local database was built the Flyway way, so it must be thrown away once. It only holds test accounts.

```powershell
docker compose down -v
```

## Step 3: Run the setup script (once per computer)

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\setup.ps1
```

This does two things:
- creates your `.env` file with random passwords (never commit this file),
- creates your signing keys in the `keys` folder (never share `private.pem`).

At the end it prints your **admin login**. Write it down. If `.env` or the keys already exist, the script leaves them alone, so it is safe to run again.

## Step 4: Start the backend

```powershell
docker compose up -d --build
```

The first build takes several minutes. Later ones are much faster. Check that it is ready:

```powershell
docker compose logs auth-service --tail 15
```

Wait until you see `Started AuthServiceApplication`.

## Step 5: Check that it works

A request with no token should be refused (prints `401`):

```powershell
try { Invoke-RestMethod http://localhost:8081/api/v1/auth/me } catch { $_.Exception.Response.StatusCode.value__ }
```

Log in as the admin (type the login the script printed):

```powershell
$email = Read-Host "Admin email"
$pw = Read-Host "Admin password"
$login = @{ email = $email; password = $pw } | ConvertTo-Json
$r = Invoke-RestMethod -Method Post -Uri http://localhost:8081/api/v1/auth/login -ContentType "application/json" -Body $login
Invoke-RestMethod http://localhost:8081/api/v1/auth/me -Headers @{ Authorization = "Bearer $($r.token)" }
```

You should see an `id` and the role `ADMIN`.

## Step 6: Start the website

```powershell
cd frontend
npm install
npm run dev
```

Open **http://localhost:3000**. Use exactly this address, because the backend only accepts requests from it.

Sign-up creates a CUSTOMER or MERCHANT. The admin cannot be registered. It exists only because of `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env`.

**Old logins stop working after the switch to RS256.** If the site acts oddly, clear the saved session: in the browser's developer tools go to Application, then Local Storage, and delete `pp_session`. Then log in again.

## Every day after that

```powershell
docker compose up -d     # start
docker compose down      # stop, keep the database
docker compose down -v   # stop and wipe the database
```

## If something goes wrong

| What you see | Why | Fix |
|---|---|---|
| `ports are not available ... 8081` | Something else is using port 8081 | Stop it, then `docker compose up -d` |
| `variable is not set`, or the service exits at start | `.env` is missing or incomplete | Run Step 3 |
| Log says file not found for `/keys/private.pem` | The `keys` folder is missing | Run Step 3 from the repo's top folder |
| 403 where you expect 401 | An old container is running old code | `docker compose up -d --build` |
| Login always fails with INVALID_CREDENTIALS | Wrong admin email or password | Use the login printed by the script (it is also in `.env`) |
| Database login errors after changing `.env` passwords | The database was created with the old passwords | `docker compose down -v`, then start again |
| `failed to read dockerfile` | Your branch is older than the Docker merge | `git switch main`, then `git pull` |

## Doing the setup by hand instead

If the script doesn't work on your computer: copy `.env.example` to `.env` and fill in every value yourself (admin password 12+ characters), then make the keys:

```powershell
mkdir keys
$openssl = "C:\Program Files\Git\usr\bin\openssl.exe"
& $openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out keys\private.pem
& $openssl pkey -in keys\private.pem -pubout -out keys\public.pem
```