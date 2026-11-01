# Running the backend locally

You need: Docker Desktop, Java 21, Git.

1. Clone the repository and open the folder.
2. Copy `.env.example` to `.env` and choose any passwords you like for local use.
3. Start the database: `docker compose up -d`
   Check it: `docker compose ps` should say "healthy".
4. Start the Auth service:
   ```
   cd auth-services
   $env:AUTH_DB_PASSWORD='<the AUTH_DB_PASSWORD you put in .env>'
   .\mvnw.cmd spring-boot:run
   ```
5. Wait for "Started AuthServiceApplication". It's now listening at http://localhost:8081.
6. Endpoints are described in `docs/api-contract.md`.
   For now register and login return fake answers.
   Password "wrong" on login returns 401, so you can test the error screen.