# Auth API Contract (v2)

Base address (on my computer): http://localhost:8081
Register and `/api/v1/auth/me` use JSON. All their errors look like:
{ "error": "CODE" }

**What changed in v2:** logging in no longer happens by sending an email and password to `/api/v1/auth/login`. The auth service is now an OAuth2 / OpenID Connect authorization server. The user types their password on the auth server's own login page, and the website receives tokens through the authorization-code flow with PKCE. The old login still answers until the website has switched, and then it will be removed.

## Register
POST /api/v1/auth/register

Send:
{ "firstName": "Jane", "lastName": "Doe",
  "email": "jane@example.com", "phone": "+254712345678",
  "role": "CUSTOMER", "password": "StrongPass#1" }

Rules:
- role must be CUSTOMER or MERCHANT. ADMIN is always rejected.
- password: at least 8 characters, with a letter and a number.
- "Confirm password" is checked in the website only. Don't send it.
- phone may contain spaces. The backend cleans it before saving.

Success, 201: { "id": "<uuid>", "email": "jane@example.com",
                "firstName": "Jane", "role": "CUSTOMER" }
Email already used, 409: { "error": "EMAIL_TAKEN" }
Phone already used, 409: { "error": "PHONE_TAKEN" }
Bad input, 400: { "error": "VALIDATION_FAILED" }

Registering does not log the user in. After a 201, send the browser to the website's `/auth/start` route (see Login). The user then types their email and password once on the auth server's login page.

## Login (authorization code flow with PKCE)

The website is a **confidential client**: its server holds a secret, and PKCE is required as well.

| Setting | Value |
|---|---|
| client_id | `pesapay-web` |
| client secret | in `AUTH_CLIENT_SECRET` (website server only, never in the browser) |
| allowed redirect_uri | `http://localhost:3000/auth/callback` (must match exactly) |
| scope | `openid` |
| PKCE | required, method `S256` |

### The steps

1. **The user clicks Sign in.** The website's `/auth/start` route makes a random `code_verifier`, keeps it (HttpOnly cookie), makes the `code_challenge` (SHA-256 of the verifier, base64url) and a random `state`, then sends the browser to:

   `GET http://localhost:8081/oauth2/authorize?response_type=code&client_id=pesapay-web&redirect_uri=http://localhost:3000/auth/callback&scope=openid&code_challenge=<challenge>&code_challenge_method=S256&state=<state>`

2. **The auth server shows its login page** if the user has no session, checks the email and password, and sends the browser back to:

   `http://localhost:3000/auth/callback?code=<one-time code>&state=<state>`

3. **The website's `/auth/callback` route** checks that `state` matches, then swaps the code (server to server):

   `POST http://localhost:8081/oauth2/token`
   Header: `Authorization: Basic base64(pesapay-web:<client secret>)`
   Content type: `application/x-www-form-urlencoded`
   Body: `grant_type=authorization_code&code=<code>&redirect_uri=http://localhost:3000/auth/callback&code_verifier=<verifier>`

   Success, 200:
   ```json
   { "access_token": "<jwt>", "refresh_token": "<random string>", "id_token": "<jwt>",
     "token_type": "Bearer", "expires_in": 599, "scope": "openid" }
   ```
   A code works once and expires quickly.

4. **The website stores the tokens in cookies** and sends the user to their dashboard, using `role`.

### Cookies set by the website

| Cookie | Holds | Settings |
|---|---|---|
| `pp_token` | access token | HttpOnly, SameSite=Strict, Path=/, Max-Age = expires_in |
| `pp_refresh` | refresh token | HttpOnly, SameSite=Strict, Path=/auth/refresh, 7 days |
| `pp_id` | id token | HttpOnly, SameSite=Strict, Path=/ |

Set the `Secure` flag once the site runs on HTTPS.

### The three tokens

| Token | Life | Who reads it | Contains |
|---|---|---|---|
| Access token (signed) | 10 minutes | wallet and auth `/me` | `sub` (user id), `role`, `iss`, `aud`, `exp` |
| ID token (signed) | about 30 minutes | the website only | `sub`, `given_name` |
| Refresh token (random string) | 7 days | the auth server only | nothing to read |

Use `role` (`CUSTOMER` or `MERCHANT`) to decide which dashboard to show.

### Refresh (when the access token has expired)

`POST http://localhost:8081/oauth2/token`
Same Basic auth header. Body: `grant_type=refresh_token&refresh_token=<value of pp_refresh>`

The reply has the same shape as the login reply. **Each refresh token works once.** Save the new `access_token` AND the new `refresh_token`. If the reply is 400 `invalid_grant`, clear the cookies and send the user to login.

### Logout

`POST http://localhost:8081/oauth2/revoke`
Same Basic auth header. Body: `token=<refresh token>&token_type_hint=refresh_token`

Then clear `pp_token`, `pp_refresh` and `pp_id`, and go to `/login`.

### Other standard addresses

- `GET /.well-known/openid-configuration`: the server describes itself.
- `GET /oauth2/jwks`: the public key that checks token signatures.

## GET /api/v1/auth/me

**What it does:** shows who the token belongs to. It reads the user's id and role from the token that was sent.

**Who can call it:** any logged-in user (customer, merchant or admin).

**What to send:** the access token, either as the header `Authorization: Bearer <token>` or in the `pp_token` cookie. No body.

**What you get back (200):**

```json
{ "id": "2b297609-86db-4e3b-9b96-cc596ee43cbb", "role": "ADMIN" }
```

**What can go wrong:**
- 401: no token, a changed token, or an expired token.

**Why it exists:** so the website can confirm, on its server, that someone is still logged in and learn their role. The auth server checks the token's signature, so a forged cookie is rejected.

## Old login (to be removed)

`POST /api/v1/auth/login` and `POST /api/v1/auth/logout` still exist so the website keeps working while it switches. Do not build anything new on them.

## Errors and what the website should show

| Where | Status | error code | Suggested message |
|---|---|---|---|
| Register | 201 | (none) | Send the browser to `/auth/start` |
| Register | 400 | VALIDATION_FAILED | "Please check your details" |
| Register | 409 | EMAIL_TAKEN | "That email is already registered" |
| Register | 409 | PHONE_TAKEN | "That phone number is already registered" |
| Token swap | 400 | `invalid_grant` | Code used twice, expired, or verifier mismatch: start the login again |
| Token swap | 401 | `invalid_client` | Wrong client secret: fix `AUTH_CLIENT_SECRET` (developer problem) |
| Callback | (URL has `?error=`) | `access_denied`, `invalid_request` | Back to login with "Please try again" |
| Refresh | 400 | `invalid_grant` | Clear cookies, go to login |
| `/api/v1/auth/me` | 401 | (none) | Treat as logged out, try refresh once, then go to login |
| Any | 500 | (none) | "Something went wrong, try again" |

## Not in this version
- Forgot password
- A PesaPay-styled login page (the auth server's page is the plain default for now)
- Logout that also ends the auth server's own session
- HTTPS and the `Secure` cookie flag
