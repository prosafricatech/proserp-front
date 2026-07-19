// Shape returned by GET /my-ledgers (frontend-handoff-hr-8.md, Part 6.3).
// Confirmed against a real sample response (2026-07-18). Plain array — not
// a paginated {data,total} envelope, and not a single statement object
// either (that's the separate /my-ledgers/{id}/statement call — see
// MyHrImprestAccountItemAction.tsx).

export interface MyHrImprestLedgerLink {
  id: number;
  user_id: number;
  ledger_id: number;
  type: string;
  created_at: string;
  updated_at: string;
  ledger: {
    id: number;
    name: string;
  };
}
