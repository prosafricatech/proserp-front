// Shape returned by GET /me/contracts (see frontend-handoff-hr-8.md, Part
// 6.2). Confirmed against a real sample response (2026-07-18) — paginated
// (`{data, current_page, per_page, total}`), full contract history (not just
// the active one).

export interface MyHrContract {
  id: number;
  employee_id: number;
  designation_id: number;
  contract_type: string;
  start_date: string;
  end_date: string | null;
  probation_end_date: string | null;
  basic_salary: number;
  status: string;
  remarks: string | null;
  created_by: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  designation: {
    id: number;
    title: string;
    code: string | null;
    description: string | null;
    created_by: number;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
  };
}
