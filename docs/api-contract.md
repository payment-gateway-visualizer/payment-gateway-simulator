# Auth API Contract (v1)

Base address (on my computer): http://localhost:8081
All requests and replies are JSON. All errors look like:
{ "error": "CODE", "message": "readable explanation" }

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

## Login
POST /api/v1/auth/login

Send:
{ "email": "jane@example.com", "password": "StrongPass#1" }

Success, 200: { "token": "<jwt>", "role": "CUSTOMER",
                "firstName": "Jane", "expiresInSeconds": 3600 }
Wrong email or password, 401: { "error": "INVALID_CREDENTIALS" }

The website keeps the token and sends it on later requests as:
Authorization: Bearer <token>
Use `role` to decide which dashboard to show.

## Not in version 1
- Forgot password

## Errors and what the website should show

Every error reply looks like: { "error": "CODE" }
Check the HTTP status first, then the `error` code.

| Where | Status | error code | Suggested message |
|---|---|---|---|
| Register | 201 | (none) | Go to login, or show "Account created" |
| Register | 400 | VALIDATION_FAILED | "Please check your details" |
| Register | 409 | EMAIL_TAKEN | "That email is already registered" |
| Register | 409 | PHONE_TAKEN | "That phone number is already registered" |
| Login | 200 | (none) | Save the token, go to the dashboard |
| Login | 401 | INVALID_CREDENTIALS | "Wrong email or password" |
| Any | 500 | (none) | "Something went wrong, try again" |

Example (JavaScript):

```js
const res = await fetch("http://localhost:8081/api/v1/auth/register", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(form),
});
const data = await res.json();

if (res.status === 201) { /* success */ }
else if (res.status === 409 && data.error === "EMAIL_TAKEN") { /* email message */ }
else if (res.status === 409 && data.error === "PHONE_TAKEN") { /* phone message */ }
else if (res.status === 400) { /* check details message */ }
else { /* generic error message */ }
```