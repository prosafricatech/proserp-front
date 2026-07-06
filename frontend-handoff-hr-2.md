# Frontend Handoff — Human Resources (Payroll, Leave, Onboarding)

This guide assumes **no prior knowledge** of payroll or leave. It explains the
concepts first, then the screens to build and the exact API calls.

All endpoints live in the same authenticated API group you already use for other
HR calls (employees, departments, etc.). Paths below are written relative to that
base — use the same prefix/headers/auth token your existing HR requests use.

A note you'll see repeated: many actions return validation errors as
`{ "validation_errors": { "field": ["message"] } }` with HTTP `422`, and simple
failures as `{ "message": "..." }` with `422`/`404`. Show these to the user.

---

# Part 1 — Payroll

## 1.1 The concepts (read this first)

**Payroll** is the monthly process of paying employees their salary. A few terms:

- **Salary components**
  - **Basic salary** — the core monthly pay, from the employee's *contract*.
  - **Allowances** — extra money added on top (e.g. housing, transport). Some are
    taxable, some aren't.
  - **Deductions** — money taken *out* of pay (e.g. loan repayments, social
    security/NSSF, and **PAYE** which is income tax).
  - **Employer contributions** — amounts the *company* pays on top of salary (e.g.
    pension). These don't reduce the employee's pay; they're a company cost.
  - **Gross pay** = basic + allowances. **Net pay** = gross − PAYE − deductions =
    what the employee actually takes home.

- **The three levels** (important for the UI structure):
  1. **Payroll Period** — just a month, e.g. "June 2026".
  2. **Payroll Run** — one batch of payroll inside a period. Usually one run per
     month for the whole company, but a company can split runs **per cost center**
     (think: per branch/department/project) so different managers approve each.
  3. **Payslip** — one employee's detailed pay inside a run.

  So: a **Period** (June 2026) contains one or more **Runs**, and each **Run**
  contains many **Payslips** (one per employee).

- **Cost center** — a label for a part of the business (branch, project, etc.) used
  for accounting and for choosing who approves.

> Rule: within one month you either have **one company-wide run** (no cost center)
> **or** several per-cost-center runs — never both. The API enforces this; just
> surface the error message if it happens.

## 1.2 The payroll lifecycle (the happy path)

This is the journey of a single **run**. Build the UI around these steps:

```
 1. Create a draft run for a month
 2. Preview the salary sheet  (calculated live, nothing saved)
 3. (fix employee data if needed, preview again)
 4. Submit  → payslips are saved, run awaits approval
 5. Approve → either a multi-step approval chain, or a single direct approval
 6. Post accounting transactions  → creates the accounting record
 7. Pay employees from a bank/cash account → run is marked Paid
```

A run has a **status** that moves through:
`draft → submitted → approved → posted → paid`
(plus the UI should reflect "rejected back to draft" — see approvals).

## 1.3 Screens & API calls

### Periods (the month list)
| Action | Call |
|---|---|
| List months | `GET /payroll-periods` |
| Create a month | `POST /payroll-periods` → `{ "year": 2026, "month": 6, "remarks": "" }` |
| View a month (+ its runs) | `GET /payroll-periods/{id}` |
| Delete a month (only if it has no runs) | `DELETE /payroll-periods/{id}` |

### Step 1 — Create a draft run
`POST /payroll-runs`
```json
{ "payroll_period_id": 12, "cost_center_id": 5 }
```
- `cost_center_id` is optional. Omit it (or send `null`) for a **company-wide** run.
- Returns the new run (`status: "draft"`). Keep its `id` — every step below uses it.

### Step 2 — Preview the salary sheet (nothing is saved)
`POST /payroll-runs/{id}/preview`
```json
{ "employee_ids": [1, 2, 3] }   // optional; omit to include all eligible employees
```
Returns a live-calculated salary sheet:
```json
{
  "rows": [
    {
      "employee": { "id": 1, "employee_number": "E001", "name": "Jane Doe" },
      "basic_salary": 1000000,
      "gross_salary": 1300000,
      "paye": 120000,
      "total_allowances": 300000,
      "total_deductions": 170000,
      "net_salary": 1130000,
      "allowances":  [ { "label": "Housing", "amount": 200000, "is_taxable": true } ],
      "deductions":  [ { "label": "NSSF", "amount": 50000 }, { "label": "PAYE", "amount": 120000 } ],
      "employer_contributions": [ { "label": "Pension (employer)", "amount": 100000 } ]
    }
  ],
  "totals": { "employees": 1, "gross_salary": 1300000, "paye": 120000, "net_salary": 1130000 }
}
```
**UI:** this is the "salary sheet" the user reviews. Nothing is stored yet, so they
can freely re-run it. To check one person, use:

`POST /payroll-runs/{id}/simulate` → `{ "employee_id": 1 }` → returns one row (same shape).

### Step 3 — Fix and re-preview
If something's wrong (missing allowance, wrong salary), the user edits the employee
/ contract / allowances elsewhere, then calls **preview** again. No payroll data is
touched until they submit.

### Step 4 — Submit (saves the payslips)
`POST /payroll-runs/{id}/submit`
```json
{ "employee_ids": [1, 2, 3] }   // optional; omit for all eligible
```
Response:
```json
{ "message": "Payroll submitted for approval", "processed": 3, "errors": [], "requires_approval": true }
```
- This **saves** a payslip per employee and moves the run to `submitted`.
- `requires_approval`:
  - `true` → an approval chain exists; use the **chain approval** flow (Step 5a).
  - `false` → no approval chain configured; use the **direct approval** (Step 5b).

> **Why two approval flows?** Some customers use a formal multi-step approval
> feature ("Process Approval"); others don't. The backend decides automatically and
> tells you via `requires_approval`. You just branch on that flag (and on the run's
> `approval_chain_id` being set or null when you load the run).
>
> The backend only chooses the chain flow when the tenant has an **active Process
> Approval subscription** *and* a chain is configured — so a tenant with a
> leftover chain but no subscription correctly gets the direct flow. You don't need
> to check subscriptions yourself; just trust `requires_approval` / `approval_chain_id`.

### Step 5a — Approve via a chain (multi-step)
When `requires_approval` is `true`, the run goes through approval *levels* (e.g.
"Approved by HR" → "Approved by Finance"). Load the run (`GET /payroll-runs/{id}`)
to see `approval_chain.levels` (the steps) and `approvals` (decisions made so far).

Each approver submits:
`POST /payroll-run-approvals`
```json
{
  "payroll_run_id": 31,
  "chain_level_id": 4,        // the level this approver is acting at (the next pending level)
  "status": "approved",        // "approved" | "rejected" | "on hold"
  "remarks": "Looks good",     // required unless status = "approved"
  "approval_date": "2026-06-25" // optional
}
```
- When the **last** level approves → run becomes `approved`.
- Any **rejection** → the run goes **back to `draft`** (so it can be fixed and
  re-submitted) and its approval history is cleared.

### Step 5b — Approve directly (no chain)
When there's no chain, a single authorized user finalizes it:
`POST /payroll-runs/{id}/approve` (no body). Run becomes `approved`.
(If you call this on a run that *does* have a chain, you get a 422 telling you to use
the chain flow — and vice-versa.)

### Step 6 — Post accounting transactions
This records the payroll in the accounting books (the "general ledger"). It produces
a **Journal Voucher** (a standard accounting document, shown elsewhere as `JV/00001`).

`POST /payroll-runs/{id}/post-transactions`
```json
{
  "salary_expense_ledger_id": 41,     // fallback account for salary cost (if department has none)
  "paye_payable_ledger_id": 55,       // account where income tax owed is parked
  "fallback_payable_ledger_id": 60    // account used to owe employees who have no personal payable account
}
```
- The user picks these three accounts in a small "confirm accounts" form. You can
  pre-fill them with the last-used values.
- **Salary cost allocation:** Each employee's salary is debited to their department's
  mapped ledger (if set in the department config). If the department has no mapping,
  the `salary_expense_ledger_id` passed here is used as fallback.
- If some salary component is missing its accounting account, you'll get a 422 like
  *"Map GL accounts for: deduction 'Loan' (payable account)"* — show it; the admin
  fixes the mapping (see §1.4) and retries.
- On success the run becomes `posted` and the response includes the voucher:
  `{ "journal_voucher": { "id": 9, "voucher_no": "JV/00009" } }`.

> Important accounting idea (so the UI copy makes sense): posting **doesn't pay
> anyone** yet. It records that the company *owes* employees their net pay. Paying is
> a separate step.

### Step 7 — Pay employees
`POST /payroll-runs/{id}/pay`
```json
{ "credit_ledger_id": 12 }   // the cash or bank account the money comes from
```
- Creates a **Payment** (shown elsewhere as `PV/00001`) that moves money from the
  chosen bank/cash account and clears what was owed to employees.
- The run becomes `paid`. Response: `{ "payment": { "id": 7, "voucher_no": "PV/00007" } }`.

### Reading payslips
| Action | Call |
|---|---|
| List payslips | `GET /payslips?payroll_run_id=31` (or `?payroll_period_id=12`, `?keyword=jane`) |
| One payslip detail | `GET /payslips/{id}` |

### Other run calls
| Action | Call |
|---|---|
| List runs | `GET /payroll-runs?payroll_period_id=12&status=draft` |
| Run detail (everything) | `GET /payroll-runs/{id}` |
| Delete a draft run | `DELETE /payroll-runs/{id}` (only while `draft`) |

## 1.4 Admin/config screens this depends on

1. **Department salary expense accounts (cost allocation).** Departments can now define
   where their salary costs are debited during payroll posting. This allows separating
   salary expenses by function (e.g., Admin Payroll, Technical Payroll):
   - **Departments** → add an optional **Salary Expense Ledger** picker
   - When posting payroll, each employee's basic salary and generic allowances debit
     their department's assigned ledger (or fall back to the run's default if not set).
   - Specific allowance types can override this with their own `expense_ledger_id`.

   This is sent on the normal create/update of departments.

2. **Salary component accounts (GL mapping).** For posting (Step 6) to work, each
   component type needs accounting accounts. Add ledger pickers to these existing
   screens:
   - **Allowance types** → `expense_ledger_id`
   - **Deduction types** → `payable_ledger_id`
   - **Employer contribution types** → `expense_ledger_id` + `payable_ledger_id`

   (These are sent on the normal create/update of each type.)

2. **Bulk application to employees (with confirmation).** When creating or updating a **deduction type**,
   **employer contribution type**, or **leave type**, add an optional **"Apply To Employees"** dropdown:
   - `None` (default) — do nothing
   - `All Employees` — automatically create this deduction/contribution/allocation for every employee
   - `Employees With Active Contracts` — apply only to those who currently have an active contract
   
   **Important:** If the type already has employees (e.g., editing an existing NSSF rate), the backend will
   return a **422 error** with:
   ```json
   {
     "message": "This will update 150 employees and create for 30 new employees. Add force_update: true to confirm.",
     "would_update": 150,
     "would_create": 30
   }
   ```
   
   **UI:** Show a confirmation modal: *"This will update 150 employees' [deduction/contribution/allocation] and
   add it for 30 new employees. Continue?"* If the user confirms, re-submit the form with an
   additional `force_update: true` in the request body.
   
   This two-step confirmation prevents accidental bulk overwrites when, for example, NSSF rates
   change and the admin updates the type. It's useful for:
   - Setting up statutory deductions (e.g. NSSF) that should apply to everyone
   - Updating rates across the workforce when regulations change
   - Adding standard contributions (e.g. pension) on type creation
   - Allocating days on leave type creation (e.g. 21 days annual leave for all employees)
   
   **For leave types specifically:** when applying to employees, use the leave type's `days_per_year`
   value as the allocation amount for each employee. This ensures consistency — all employees allocated
   at once get the same amount.
   
   **No new screen needed** — just add the dropdown and handle the 422 confirmation on the existing
   deduction/contribution/leave-type create/update forms.

3. **Approval chains.** The multi-step approval uses the **same approval-chain
   management UI** you already have for requisitions — just create a chain with
   process type **`PAYROLL`** (optionally per cost center). No new screen needed. If
   no `PAYROLL` chain exists, payroll automatically uses the direct-approval path.

---

# Part 2 — Leave Requests

## 2.1 The concepts

An employee asks for time off (a **leave request**) — e.g. 10 days annual leave.
They have a yearly **allocation** (a balance of days). The request is approved by
one or more managers, who may approve **fewer days** than requested. Only the
**finally granted** days are subtracted from the balance.

Same idea as payroll approvals: there are **two flows** depending on whether a
multi-step approval chain is configured.

## 2.2 Screens & API calls

### Submit a request
`POST /leave-requests`
```json
{
  "employee_id": 1,
  "leave_type_id": 2,
  "cost_center_id": 5,        // OPTIONAL — an employee may not be on a cost center yet
  "start_date": "2026-07-01",
  "end_date": "2026-07-10",
  "days_requested": 10,
  "reason": "Annual leave"
}
```
- The request starts in status **`in_review`**. The balance is **not** reduced yet.
- The response's request has `approval_chain_id`:
  - **set** → use the chain flow (§2.3a)
  - **null** → use the direct flow (§2.3b)

### List / view
| Action | Call |
|---|---|
| List | `GET /leave-requests?employee_id=1&status=in_review` |
| Detail (chain + decisions) | `GET /leave-requests/{id}` |

`GET /leave-requests/{id}` returns the request plus `approval_chain.levels` (the
steps), `approvals` (decisions so far, each with `days_approved`), and `days_granted`
(set once finally approved).

### 2.3a Approve via a chain (multi-step, tracks days per level)
Each approver records a decision **and how many days they approve**:
`POST /leave-request-approvals`
```json
{
  "leave_request_id": 12,
  "chain_level_id": 3,        // the level this approver acts at
  "status": "approved",        // "approved" | "rejected" | "on hold"
  "days_approved": 7,          // required when approving; must be ≤ the previous level's days (or days_requested at the first level)
  "remarks": "Approved 7 of 10", // required when "rejected" or "on hold"
  "approval_date": "2026-06-25"   // optional
}
```
This lets you show the journey: *requested 10 → manager approved 7 → HR approved 5*.
- **Final level approves** → request becomes `approved`, `days_granted` is set, and
  the balance is reduced by the granted days.
- **Any rejection** → request becomes `rejected`; balance untouched.

**UI tip:** when an approver opens the form, cap the days input at the previous
level's `days_approved` (or `days_requested` if they're the first level).

### 2.3b Approve directly (no chain)
When `approval_chain_id` is null:
- Approve: `POST /leave-requests/{id}/approve`
  ```json
  { "days_approved": 7, "remarks": "" }   // days_approved optional; defaults to full request
  ```
- Reject: `POST /leave-requests/{id}/reject`
  ```json
  { "remarks": "Not enough cover" }       // remarks required
  ```

### Cancel / delete
| Action | Call |
|---|---|
| Cancel (refunds granted days if it was approved) | `POST /leave-requests/{id}/cancel` |
| Delete (not while in_review/approved) | `DELETE /leave-requests/{id}` |

Statuses: `in_review → approved / rejected / cancelled`.

---

# Part 3 — Employee Onboarding (bulk Excel import)

For setting up a new company with many employees at once.

### 1) Download the template
`POST /employees-registration-excel-template` → returns an `.xlsx` file (trigger a
download). It has a **Data** sheet with built-in dropdowns:
- **Gender** (Male/Female), **Department** (live list), **Employment Type**
  (Full Time/Part Time/Casual).
- Columns: Employee Number, First Name*, Middle Name, Last Name*, Gender, Email,
  Phone, Address, Date of Birth, National ID, Passport Number, Department,
  Employment Type, Join Date, **Basic Salary**, **Contract Start Date**.
  (\* required.)

### 2) Upload the filled file with optional bulk deductions/contributions/leave allocations
`POST /employees/import_registration_excel` — `multipart/form-data`. Fields:
- **`employees_excel`** (file, `.xlsx`/`.xls`) — the filled template
- **`deductions`** (array of objects, optional) — deductions to apply:
  ```json
  [
    { "id": 5, "scope": "all" },
    { "id": 7, "scope": "active_contracts" }
  ]
  ```
- **`contributions`** (array of objects, optional) — contributions to apply:
  ```json
  [
    { "id": 2, "scope": "all" }
  ]
  ```
- **`leave_allocations`** (array of objects, optional) — leave allocations to apply:
  ```json
  [
    { "id": 3, "allocation_amount": 21 },
    { "id": 5, "allocation_amount": 10 }
  ]
  ```

Example form data:
```
employees_excel: [file]
deductions[0][id]: 5
deductions[0][scope]: all
deductions[1][id]: 7
deductions[1][scope]: active_contracts
contributions[0][id]: 2
contributions[0][scope]: all
leave_allocations[0][id]: 3
leave_allocations[0][allocation_amount]: 21
leave_allocations[1][id]: 5
leave_allocations[1][allocation_amount]: 10
```

Response:
```json
{
  "message": "Imported 487 employee(s), skipped 13",
  "imported": 487,
  "skipped": 13,
  "errors": [ { "row": 14, "error": "Gender must be Male or Female (got 'M')" } ]
}
```

**UI:**
1. "Download template" button → downloads Data sheet + Departments reference
2. User fills in employee data
3. Upload form:
   - File picker
   - (Optional) **Deductions** multiselect — shows list of deduction types from `GET /deductions`
     - If user selects deductions, show a scope dropdown per deduction: `All Employees` or `Active Contracts Only`
   - (Optional) **Contributions** multiselect — shows list of contribution types from `GET /contributions`
     - If user selects contributions, show a scope dropdown per contribution
   - (Optional) **Leave Allocations** multiselect — shows list of leave types from `GET /leave-types`
     - If user selects leave types, show an allocation amount input per type (number of days)
4. After upload, show imported/skipped counts and list errors so user can fix and re-upload
5. Re-uploading is safe — duplicates by employee_number/email are skipped

**Scopes (deductions/contributions):** `all` applies to all 487 imported employees; `active_contracts` applies only to those
with a **Basic Salary** filled (who will get a starter contract).

**Leave allocations:** always apply to all imported employees (no scope picker). The user sets the number of days
per leave type on the form.

**Bonus:** if a row has **Basic Salary**, the import creates a starter active **contract** for that
employee (permanent, status = active, basic_salary from the column), so they're immediately ready
for payroll. (Without a contract, an employee can't appear in a payroll run.)

### Employee profile fields (new, optional)
The normal employee create/update (`POST/PUT /employees`) now also accepts:
- `cost_center_id` — which cost center the employee belongs to (used to scope
  per-cost-center payroll runs and tag accounting entries).
- `payable_ledger_id` — link the employee to a specific "money we owe this person"
  account, **or** auto-create one by sending `create_payable: true` +
  `payable_ledger_name: "Payable - Jane Doe"`. If you don't set this, payroll uses
  the run's fallback account at posting time, so it's optional.

---

# Glossary (quick reference)

| Term | Plain meaning |
|---|---|
| Payroll period | A month (e.g. June 2026). |
| Payroll run | One batch of payroll in a month (whole company, or per cost center). |
| Payslip | One employee's pay breakdown in a run. |
| Allowance | Extra pay added (housing, transport). |
| Deduction | Money taken out (loans, social security). |
| PAYE | Income tax (a deduction). |
| Employer contribution | A company cost on top of salary (e.g. pension). |
| Gross / Net | Before deductions / take-home. |
| Cost center | A part of the business (branch/project) for accounting & approvals. |
| Approval chain | The ordered list of managers who approve. |
| Posting / Journal Voucher | Recording payroll in the accounting books. |
| Payment | Actually sending the money from a bank/cash account. |
| Leave allocation | An employee's yearly balance of leave days. |
| days_granted | The final approved leave days, subtracted from the balance. |

---

# Cheat sheet — payroll calls in order

```
POST /payroll-periods                          (once per month)
POST /payroll-runs                             {payroll_period_id, cost_center_id?}
POST /payroll-runs/{id}/preview                {employee_ids?}        ← no save, repeat freely
POST /payroll-runs/{id}/simulate               {employee_id}          ← one person, no save
POST /payroll-runs/{id}/submit                 {employee_ids?}        ← saves payslips
   if requires_approval:
       POST /payroll-run-approvals             {payroll_run_id, chain_level_id, status, remarks?}
   else:
       POST /payroll-runs/{id}/approve
POST /payroll-runs/{id}/post-transactions      {salary_expense_ledger_id, paye_payable_ledger_id, fallback_payable_ledger_id}
POST /payroll-runs/{id}/pay                    {credit_ledger_id}
```
