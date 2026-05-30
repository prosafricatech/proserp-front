# Imprest System Frontend Developer Guide

## Overview

The Imprest system is a cash advance and retirement workflow:

1. A user creates an Imprest requisition.
2. Approvers approve the requisition chain.
3. Finance pays the advance to the user.
4. The user creates a retirement draft, attaches receipts, and submits it for approval.
5. Approvers approve or reject the retirement. On approval, the backend creates the settlement Payment Voucher automatically.

## Phase 0: Setup

Before the flow can be used, finance/admin must link each eligible user to an imprest ledger account.

### Link a ledger account to a user

`POST /user-ledgers`

```json
{
  "user_id": 5,
  "ledger_id": 103,
  "type": "imprest"
}
```

### Unlink a ledger account

`DELETE /user-ledgers/{id}`

### Get current user's imprest accounts

`GET /my-ledgers`

Use this to populate the ledger picker on the retirement form.

### Get any user's imprest accounts

`GET /users/{id}/ledgers`

Response:

```json
[
  {
    "id": 1,
    "user_id": 5,
    "ledger_id": 103,
    "type": "imprest",
    "ledger": { "id": 103, "name": "John Doe Imprest Account" }
  }
]
```

## Phase 1: Create Imprest Requisition

### Create requisition

`POST /requisitions`

Required fields for `process_type = IMPREST`:

- `process_type`: `IMPREST`
- `cost_center_id`
- `currency_id`
- `exchange_rate`
- `imprest_ledger_id`
- `requisition_date`
- `submit_type`: `submitted` or `suspended`
- `ledger_items`

Example payload:

```json
{
  "process_type": "IMPREST",
  "cost_center_id": 2,
  "currency_id": 1,
  "exchange_rate": 1,
  "imprest_ledger_id": 103,
  "requisition_date": "2026-05-29T00:00:00.000Z",
  "remarks": "Field trip expenses — Mbeya",
  "submit_type": "submitted",
  "ledger_items": [
    {
      "ledger_id": 55,
      "measurement_unit_id": 1,
      "quantity": 1,
      "rate": 500.00,
      "remarks": "Airfare (return)"
    },
    {
      "ledger_id": 61,
      "measurement_unit_id": 1,
      "quantity": 2,
      "rate": 75.00,
      "remarks": "Hotel — 2 nights"
    }
  ]
}
```

Notes:

- `imprest_ledger_id` is required.
- `submit_type: "submitted"` sends immediately.
- `submit_type: "suspended"` saves as draft.
- `ledger_items` describe intended spend categories.
- Do not send `product_items` for IMPREST.

### List requisitions

`GET /requisitions?process_type=IMPREST`

### Show requisition

`GET /requisitions/{id}`

Identify IMPREST by checking:

```js
requisition.approval_chain.process_type === 'IMPREST'
```

IMPREST responses also include:

```json
"imprest_ledger": { "id": 103, "name": "John Doe Imprest Account" }
```

### Update requisition

`PUT /requisitions/{id}`

Same payload as create. Allowed only before approvals exist.

### Delete requisition

`DELETE /requisitions/{id}`

Allowed only before approvals exist.

## Phase 2: Requisition Approval Chain

Uses the same endpoints as other requisition process types.

### Submit approval

`POST /requisition-approvals`

Example:

```json
{
  "requisition_id": 12,
  "chain_level_id": 3,
  "approval_date": "2026-05-30T00:00:00.000Z",
  "submit_type": "approved",
  "is_final": true,
  "exchange_rate": 1,
  "remarks": "Approved for Mbeya trip",
  "ledger_items": [
    { "requisition_ledger_item_id": 25, "quantity": 1, "rate": 500.00 },
    { "requisition_ledger_item_id": 26, "quantity": 2, "rate": 75.00 }
  ]
}
```

### Approved imprest requisitions

`GET /approved-requisitions?process_type=IMPREST`

### Show approved requisition

`GET /approved-requisitions/{id}`

Use:

- `imprest_ledger.id` to pre-populate the payment debit account
- `amount` to set the payment amount and retirement ceiling

## Phase 3: Pay Out the Advance

Use the existing payment flow.

### Payment mapping for IMPREST

| Payment field | Source |
|---|---|
| `credit_ledger_id` | Finance-selected bank/cash ledger |
| `items[*].debit_ledger_id` | `imprest_ledger.id` from approved requisition |
| `items[*].amount` | `amount` from approved requisition |
| `requisition_approval_id` | Leave `null` |

Example:

```json
{
  "transactionDate": "2026-05-31T00:00:00.000Z",
  "narration": "Imprest advance — RQ/00012 — John Doe",
  "credit_ledger_id": 12,
  "currency_id": 1,
  "exchange_rate": 1,
  "cost_centers": [{ "id": 2 }],
  "items": [
    {
      "debit_ledger_id": 103,
      "amount": 650.00,
      "description": "Imprest advance for Mbeya trip"
    }
  ]
}
```

## Phase 4: Retirement

### Create draft retirement

`POST /imprest-retirements`

```json
{
  "requisition_approval_id": 8,
  "ledger_id": 103,
  "retirement_date": "2026-06-05",
  "remarks": "Post-trip receipts",
  "items": [
    { "ledger_id": 55, "amount": 480.00, "description": "Flight — receipt FL001" },
    { "ledger_id": 61, "amount": 130.00, "description": "Hotel — invoice HTL002" },
    { "ledger_id": 70, "amount": 45.00, "description": "Taxis — 3 receipts" }
  ]
}
```

Notes:

- `ledger_id` is the user's imprest ledger from `GET /my-ledgers`.
- `requisition_approval_id` is the final approval id.
- Retirement item totals may exceed the approved amount.
- `items[*].ledger_id` are expense accounts.

### Attach receipts

`POST /attachments` as `multipart/form-data`

Fields:

- `file`
- `name`
- `attachmentable_type = "imprest_retirement"`
- `attachmentable_id = retirement id`

### Update draft

`PUT /imprest-retirements/{id}`

### Delete draft

`DELETE /imprest-retirements/{id}`

### Submit for approval

`POST /imprest-retirements/{id}/submit`

Only one pending retirement is allowed per imprest approval at a time.

### Show retirement

`GET /imprest-retirements/{id}`

Use `status_label` for display and `imprest_approval` for balance calculations.

### List retirements

`GET /imprest-retirements`

Supported query params:

- `status`
- `requisition_approval_id`
- `from`
- `to`
- `limit`

## Phase 5: Retirement Approval

### Approve retirement

`POST /imprest-retirement-approvals`

```json
{
  "imprest_retirement_id": 1,
  "status": "approved",
  "approval_date": "2026-06-07",
  "remarks": "All receipts verified"
}
```

On approval, the backend creates a Payment Voucher automatically:

- Debit: retirement expense accounts
- Credit: user's imprest ledger account

### Reject retirement

`POST /imprest-retirement-approvals`

```json
{
  "imprest_retirement_id": 1,
  "status": "rejected",
  "approval_date": "2026-06-07",
  "remarks": "Taxi receipts missing. Resubmit with supporting documents."
}
```

`remarks` is required when `status = "rejected"`.

### Revoke approval

`DELETE /imprest-retirement-approvals/{id}`

This deletes the payment voucher and journals and resets the retirement to `submitted`.

## Status Labels

| Raw status | Approval | Display |
|---|---|---|
| `draft` | — | Draft |
| `submitted` | `null` | Pending Approval |
| `submitted` | `{ status: "approved" }` | Approved |
| `submitted` | `{ status: "rejected" }` | Rejected |

## Outstanding Balance

```js
const approved = imprest_approval.amount;
const retired = imprest_approval.total_retired;
const balance = approved - retired;
```

- `balance > 0`: user still holds cash
- `balance = 0`: fully retired
- `balance < 0`: overspend settled by retirement payment

## UI Rules

### Requisition

- Use existing approval UI.
- When creating IMPREST requisition, show the user's imprest ledger dropdown from `GET /my-ledgers`.
- Keep ledger items as spend categories only.

### Payment

- Pre-populate `items[*].debit_ledger_id` from `imprest_ledger.id`.
- Use requisition reference in narration.
- Do not set `requisition_approval_id`.

### Retirement

- Allow draft creation, attachment upload, draft update, delete, and submit.
- Block new retirement creation while another retirement is pending.
- Display `status_label` where available.

## Permissions

- `ImprestRequisitions:Read`
- `ImprestRequisitions:Create`
- `ImprestRetirement:Read`
- `ImprestRetirement:Create`
- `ImprestRetirement:Approve`

## Prerequisites

1. Create an approval chain with `process_type = IMPREST`.
2. Link eligible users to imprest ledger accounts using `POST /user-ledgers`.

Without those setup steps, requisition submission and retirement forms will fail.

## Error Cases

- `400`: Validation failure
- `400`: Retirement submitted with no items
- `400`: Another retirement already pending approval
- `400`: Approving/rejecting a non-submitted retirement
- `400`: Rejecting without remarks
- `400`: Revoking a non-approved retirement approval
- `404`: Record not found
