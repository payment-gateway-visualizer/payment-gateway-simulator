# Payment Gateway Simulator: Setup Notes (Backend)

These notes explain how the backend was set up, one step at a time, and how
to check that each step works. Written for teammates who are new to the backend.

## 1. Project folders

**What it is:** the project is split into folders, one per part of the system.

- `auth-services/`: the service that handles registration and login
- `wallet-services/`: the service that holds wallets and payments (not built yet)
- `settlement-services/`: the service that settles money to merchants (not built yet)
- `web/`: the Next.js website (Tenye's part)
- `docs/`: notes like this one
- `infra/`: setup files for the things the services depend on, such as the database

**Why we need it:** each service stays separate, so a change in one doesn't break the others.

**How to check it works:** open the project in VS Code and see the folders in the Explorer.

## 2. The database setup script (infra/postgres/init/01-create-databases.sh)

**What it is:** a short script that runs once, the first time the database starts.
It creates three databases (`auth_db`, `wallet_db`, `settlement_db`) and one login
for each (`auth_user`, `wallet_user`, `settlement_user`). Each login owns only its
own database, and everyone else is blocked from entering it.

**Why we need it:** if one service is hacked or has a bug, it can't read or change
another service's data. This is called least privilege.

**How to check it works:**
`docker compose exec postgres psql -U postgres_admin! -c "\l"` lists the three databases.

## 3. Docker Compose (docker-compose.yml)

**What it is:** an instruction sheet that tells Docker how to run our database.
It says: use PostgreSQL 16, set these passwords, open door 5433 on my computer,
keep the data on a saved disk, and run my setup script on first start.

**Why we need it:** everyone on the team gets the same database with one command,
without installing PostgreSQL on their own computer.

**How to check it works:**
`docker compose up -d` then `docker compose ps` should show "healthy".

## 4. Secrets (.env and .env.example)

**What it is:** `.env` is a private file that holds the real passwords. Docker
reads it when it starts the database. `.env.example` is a copy with fake
placeholder values, so teammates know which values they need to fill in.

**Why we need it:** passwords must never be stored in code that goes to GitHub.

**How to check it works:** run `git ls-files`. `.env.example` should be listed
and `.env` should not.

## 5. Ignoring files (.gitignore)

**What it is:** a list of files and folders Git should never save, such as `.env`,
`target/` (built files) and `node_modules/`.

**Why we need it:** it keeps secrets and generated clutter out of the repository.

**How to check it works:** run `git status`. Ignored files don't appear.

## 6. The Auth service project (Spring Boot and Maven)

**What it is:** the project was generated on start.spring.io, a website that builds
an empty Spring Boot project with the libraries we picked: Web, Security, JPA,
Validation, PostgreSQL Driver and Flyway.

- **Maven** is the tool that downloads those libraries and builds the project.
  You can think of it as a shopper, and Maven Central as the supermarket.
- **pom.xml** is the shopping list of everything the service needs.
- **mvnw.cmd** is a small script that fetches the right Maven version, so nobody
  has to install Maven by hand.

**Why we need it:** we don't write code for logins, web servers or database
access from scratch. We use well-tested libraries.

**How to check it works:** inside `auth-services`, run `.\mvnw.cmd -v`. It should
print a Maven version and Java 21.

## 7. Connecting the service to its database (application.properties)

**What it is:** a settings file at `auth-services/src/main/resources/application.properties`.
It tells the service its own port (8081), the database address
(`localhost:5433/auth_db`), the login to use (`auth_user`), and where to find the
password. The password isn't written in the file. It is read from the
`AUTH_DB_PASSWORD` environment variable.

The PostgreSQL driver library does the actual talking to the database, and
Spring Boot reads these settings to know where to connect.

**Why we need it:** it keeps the connection details in one place and the password out of Git.

**How to check it works:**
```
$env:AUTH_DB_PASSWORD='<your auth password from .env>'
.\mvnw.cmd spring-boot:run
```
The log should end with `Started AuthServiceApplication`.

## 8. The users table (Flyway migration V1)

**What it is:** a numbered SQL file,
`auth-services/src/main/resources/db/migration/V1__create_users_table.sql`.
When the service starts, Flyway runs it once and builds the `users` table.
The table is the shape of the data. Each person who registers later will add one row.

| Column | What it holds |
|---|---|
| id | a random unique ID for the user |
| email, phone | each must be unique across all users |
| password_hash | the scrambled password. We never store the real one. |
| full_name | the person's name |
| role | CUSTOMER, MERCHANT or ADMIN |
| created_at | when the account was made |

**Why we need it:** the table's structure is saved in Git, so everyone's database
ends up identical. A migration file is never edited after it has run. Changes go
in a new file (`V2__...`).

**How to check it works:**
`docker compose exec postgres psql -U postgres_admin! -d auth_db -c "\d users"`