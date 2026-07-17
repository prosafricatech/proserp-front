// Placeholder types for GET /me/payslips (list) and GET /me/payslips/{id}
// (detail) — see frontend-handoff-hr-8.md, Part 6.2.
//
// The doc doesn't spell out the payslip field shape (unlike /me/employee,
// which we already have a sample for), so this is intentionally loose until
// a real response is available. Once we have one, replace both types below
// with the real fields — same treatment `MyHrProfileType` got.

export type MyHrPayslipListItem = Record<string, unknown>;

export type MyHrPayslipDetail = Record<string, unknown>;
