import PayrollRuns from '@/components/humanResources/payrollRuns/PayrollRuns';

// Once a run is approved, it stays on this list through every later stage
// (posted/partially paid/paid/completed) rather than dropping off — it's a
// list of "runs that have been approved," not "runs currently in approved status."
const APPROVED_ONWARD_STATUSES =
  'approved,posted,partially_paid,paid,completed';

const ApprovedPayrollRuns = () => {
  return <PayrollRuns defaultStatus={APPROVED_ONWARD_STATUSES} />;
};

export default ApprovedPayrollRuns;
