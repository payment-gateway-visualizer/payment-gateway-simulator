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