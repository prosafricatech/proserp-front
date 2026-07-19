'use client';

import { VisibilityOutlined } from '@mui/icons-material';
import { Dialog, IconButton, LinearProgress, Tooltip } from '@mui/material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import humanResourcesServices from '../../humanResourcesServices';
import { PayslipViewDialog } from '../../payrollRuns/PayrollRunDialogs';

interface MyHrPayslipItemActionProps {
  payslipId: number;
}

function mapPayslipForDialog(raw: any, profile?: any) {
  if (!raw) return null;

  const allowances = raw.allowances || [];
  const deductions = raw.deductions || [];

  const totalAllowances = allowances.reduce(
    (sum: number, a: any) => sum + (a.amount || 0),
    0
  );
  const totalDeductions = deductions.reduce(
    (sum: number, d: any) => sum + (d.amount || 0),
    0
  );
  const grossSalary = (raw.basic_salary || 0) + totalAllowances;
  const netSalary = grossSalary - (raw.paye || 0) - totalDeductions;

  return {
    ...raw,
    employee: profile
      ? {
          name: [profile.first_name, profile.middle_name, profile.last_name]
            .filter(Boolean)
            .join(' '),
        }
      : undefined,
    employee_number: profile?.employee_number,
    allowances,
    deductions,
    employer_contributions: raw.employer_contributions || [],
    total_allowances: totalAllowances,
    total_deductions: totalDeductions,
    gross_salary: grossSalary,
    net_salary: netSalary,
  };
}

const MyHrPayslipItemAction = ({ payslipId }: MyHrPayslipItemActionProps) => {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: payslip, isLoading } = useQuery({
    queryKey: ['myHrPayslip', payslipId],
    queryFn: () => humanResourcesServices.myHrPayslip(payslipId),
    enabled: open,
  });

  const profile: any = queryClient.getQueryData(['showMyHr']);

  return (
    <>
      <Tooltip title='View Payslip'>
        <IconButton size='small' onClick={() => setOpen(true)}>
          <VisibilityOutlined fontSize='small' />
        </IconButton>
      </Tooltip>

      {open &&
        (isLoading ? (
          <Dialog
            open={open}
            onClose={() => setOpen(false)}
            fullWidth
            maxWidth='sm'
          >
            <LinearProgress />
          </Dialog>
        ) : (
          <PayslipViewDialog
            open={open}
            onClose={() => setOpen(false)}
            payslip={mapPayslipForDialog(payslip, profile)}
          />
        ))}
    </>
  );
};

export default MyHrPayslipItemAction;
