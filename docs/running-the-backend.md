# Running the backend locally

You need: Docker Desktop, Java 21, Git, and Node.js (for the frontend).

## 1. Get the code and start the database
1. Clone the repository and open the folder.
2. Copy `.env.example` to `.env` and choose any passwords you like for local use.
   Never commit `.env`: it is ignored by Git on purpose.
3. Start the database: `docker compose up -d`
   Check it: `docker compose ps` should say "healthy".
   The database listens on your computer at port 5433.

## 2. Start the Auth service
Open a PowerShell terminal in the project folder and run:

```
cd auth-services
$env:AUTH_DB_PASSWORD='<the AUTH_DB_PASSWORD you put in .env>'
$env:JWT_SECRET='<any random text, at least 32 characters>'
.\mvnw.cmd spring-boot:run
```

Wait for "Started AuthServiceApplication". It is now listening at http://localhost:8081.

### The settings (environment variables)
| Name | Required | What it is |
|---|---|---|
| AUTH_DB_PASSWORD | yes | The auth database password from your `.env` |
| JWT_SECRET | yes | Secret used to sign login tokens. At least 32 characters. Choose your own, never share it. |
| ADMIN_EMAIL | no | Email for an admin account created on the first start |
| ADMIN_PASSWORD | no | Admin password, at least 12 characters. Only used if ADMIN_EMAIL is set. |

Tip: to make a random secret, run this in PowerShell:
`-join ((48..57)+(65..90)+(97..122) | Get-Random -Count 48 | ForEach-Object {[char]$_})`

Tip: put the four `$env:` lines and `.\mvnw.cmd spring-boot:run` in a file called
`auth-services/run-local.ps1`. Git ignores that file, so your passwords stay on your computer.

Admin accounts live in your own local database. Each person's database is separate,
so your admin account is not shared with anyone else.

## 3. Start the frontend
```
cd frontend
npm install
npm run dev
```
Open http://localhost:3000. Register an account, then sign in.

## 4. Endpoints
Everything is described in `docs/api-contract.md`.
Register and login are real: they save users in the database and return a signed token.

## If something goes wrong
- "Can't reach the server": the Auth service is not running. Check step 2.
- "Connection refused" on port 5433: the database is not running. Run `docker compose up -d`.
- "password authentication failed": AUTH_DB_PASSWORD is not set in this terminal, or does not match `.env`.
- Login gives 403: JWT_SECRET is missing or shorter than 32 characters.
- "Port 8081 was already in use": an old copy of the service is still running. Stop it with Ctrl+C.