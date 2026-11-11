# Wallet and payments API contract

Base address (wallet service): `http://localhost:8082/api/v1`

While an endpoint's status is **STUB**, the service returns fixed sample data in exactly the shape written here. When it becomes **LIVE**, the shape does not change.

## Rules that apply to every endpoint

- **Login first.** Get a token from the auth service (`POST http://localhost:8081/api/v1/auth/login`) and send it on every call: `Authorization: Bearer <token>`.
- **401** = no token, a bad token, or an expired token. **403** = valid token, but your role isn't allowed here (`{"error": "FORBIDDEN"}`).
- **Money** is always a whole number of cents in `amountCents`. KES 250.00 is `25000`. The currency is always KES.
- **Ids** are text (UUIDs). **Times** are ISO-8601 in UTC, like `2026-11-11T09:30:00Z`.
- **Errors** always look like `{"error": "CODE"}`.
- **Lists** come back newest first inside `{"items": [...]}`.

## Summary

| Endpoint | Who | Purpose | Status |
|---|---|---|---|
| `GET /wallets/me` | customer, merchant | My balances | STUB |
| `POST /wallets/me/top-up` | customer | Add mock money | STUB |
| `POST /payment-requests` | merchant | Ask a customer to pay | STUB |
| `GET /payment-requests` | customer, merchant | My requests (`?status=` optional) | STUB |
| `POST /payment-requests/{id}/approve` | customer | Pay a request | STUB |
| `POST /payment-requests/{id}/reject` | customer | Refuse a request | STUB |
| `POST /payment-requests/{id}/reversal-request` | customer | Ask the admin for a reversal | STUB |
| `GET /notifications` | merchant, admin | Bell messages | STUB |
| `POST /notifications/{id}/read` | merchant, admin | Mark a message as read | STUB |
| `GET /insights/me` | any logged-in user | Number tiles for my role | STUB |
| Admin: callbacks and settlement | admin | Shapes agreed next week | later |

## Wallet

### `GET /wallets/me`
A wallet is created automatically the first time you ask. Customers always have `pendingCents` of 0.

```json
{ "id": "6f1c...", "availableCents": 125000, "pendingCents": 0, "currency": "KES" }
```

### `POST /wallets/me/top-up` (customer)
Adds mock money. No real payment happens.

Request: `{ "amountCents": 50000 }` (must be more than 0, at most 15,000,000). Reply: the wallet, as above. Errors: `VALIDATION_FAILED` (400).

## Payment requests

A payment request looks like this everywhere:

```json
{
  "id": "a1b2...",
  "merchantName": "Mama Mboga Fresh",
  "customerName": "Jane Wanjiru",
  "amountCents": 25000,
  "reason": "Groceries for the week",
  "status": "PENDING",
  "createdAt": "2026-11-11T09:30:00Z",
  "paidAt": null
}
```

`status` is one of `PENDING` (waiting for the customer), `PAID`, or `FAILED` (rejected).

### `POST /payment-requests` (merchant)
Request:
```json
{ "customer": "jane@example.com", "amountCents": 25000, "reason": "Groceries for the week" }
```
`customer` is the customer's email **or** phone number. `reason` is required, at most 140 characters. Reply: **201** and the payment request. Errors: `VALIDATION_FAILED` (400), `CUSTOMER_NOT_FOUND` (404).

### `GET /payment-requests`
A merchant sees the requests they created. A customer sees the requests addressed to them. Optional `?status=PENDING`, `PAID` or `FAILED`. Reply: `{ "items": [ ...payment requests ] }`.

### `POST /payment-requests/{id}/approve` (customer)
Pays the request: money moves from the customer's wallet to the merchant's pending balance. **Required header:** `Idempotency-Key: <a new UUID for each user click>`. If the same key is sent twice, the second call returns the first result and does not charge again.

Reply (200): the payment request with `"status": "PAID"` and `paidAt` filled in.

| Error | Code | Meaning |
|---|---|---|
| 400 | `IDEMPOTENCY_KEY_REQUIRED` | Header missing |
| 404 | `REQUEST_NOT_FOUND` | No such request, or not yours |
| 409 | `INSUFFICIENT_BALANCE` | Not enough money. Nothing moved, and the request stays PENDING |
| 409 | `NOT_PENDING` | Already paid or rejected |
| 409 | `REQUEST_IN_PROGRESS` | The same key is still being processed |
| 422 | `IDEMPOTENCY_KEY_REUSED` | The same key was used for a different request |

### `POST /payment-requests/{id}/reject` (customer)
Reply (200): the payment request with `"status": "FAILED"`. Errors: `REQUEST_NOT_FOUND` (404), `NOT_PENDING` (409).

### `POST /payment-requests/{id}/reversal-request` (customer)
Sends one message to the admin. **No money moves.** Request: `{ "note": "Wrong amount" }` (optional, at most 140 characters). Reply: **201** `{ "status": "SENT" }`. Errors: `REQUEST_NOT_FOUND` (404), `NOT_PAID` (409, only paid requests), `ALREADY_REQUESTED` (409).

## Notifications

### `GET /notifications` (merchant, admin)
```json
{ "items": [
  { "id": "n1...", "type": "PAYMENT_RECEIVED", "message": "Jane Wanjiru paid KES 250.00",
    "requestId": "a1b2...", "read": false, "createdAt": "2026-11-11T09:41:00Z" }
] }
```
`type` is `PAYMENT_RECEIVED` (for merchants) or `REVERSAL_REQUESTED` (for the admin).

### `POST /notifications/{id}/read`
Reply: **204**, no body.

## Insights

### `GET /insights/me`
The tiles depend on the role in your token.

```json
{ "role": "CUSTOMER", "spentThisMonthCents": 185000, "paymentsMade": 7,
  "mostPaidMerchant": "Mama Mboga Fresh", "failedPayments": 1 }
```
```json
{ "role": "MERCHANT", "receivedThisMonthCents": 640000, "successRatePercent": 82,
  "averagePaymentCents": 21300, "oldestPendingRequestDays": 3 }
```
```json
{ "role": "ADMIN", "totalVolumeCents": 5240000,
  "callbackSuccessRatePercent": 96, "needsAttentionCount": 2 }
```

## Known gaps (written down on purpose)

- `CUSTOMER_NOT_FOUND` lets a merchant learn whether an email or phone is registered.
- Top-up is unlimited, because it is mock money.
- Lists have no paging yet.