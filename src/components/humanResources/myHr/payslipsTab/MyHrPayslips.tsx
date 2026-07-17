'use client';

import { Alert, Skeleton, Stack } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import humanResourcesServices from '../../humanResourcesServices';

/**
 * Payslips tab.
 *
 * Per frontend-handoff-hr-8.md Part 6.2: GET /me/payslips (optional
 * ?payroll_period_id=), and GET /me/payslips/{id} for the full breakdown of
 * one payslip (service + API handler for that one are set up too, see
 * humanResourcesServices.myHrPayslip — just not wired to any UI yet).
 *
 * Unlike the Profile tab, the fetch lives HERE (inside the tab component),
 * not in MyHr.tsx — MyHr.tsx only switches which tab is mounted, so this
 * query only ever runs once the user actually opens the Payslips tab.
 *
 * INTENTIONALLY UNFINISHED: we don't yet know the real shape of a payslip
 * list item (amounts? period label? status? a link to the run?), so the list/
 * table UI below is a placeholder. Once a real response is captured (see the
 * console.log), replace the placeholder block with the real list — and wire
 * up a row click -> a detail dialog using myHrPayslip(id) at that point.
 */
const MyHrPayslips = () => {
  const {
    data: payslips,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['myHrPayslips'],
    queryFn: () => humanResourcesServices.myHrPayslipsList(),
  });

  useEffect(() => {
    if (payslips) {
      // TEMP — inspect the real response shape here, then share it so the
      // list UI can be finished against real field names.
      console.log('myHr payslips payload:', payslips);
    }
  }, [payslips]);

  if (isLoading) {
    return (
      <Stack spacing={1.5} sx={{ mt: 1 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton
            key={i}
            variant='rectangular'
            width='100%'
            height={56}
            sx={{ borderRadius: 1 }}
          />
        ))}
      </Stack>
    );
  }

  if (isError) {
    return (
      <Alert severity='error' sx={{ mt: 1 }}>
        Could not load payslips{(error as any)?.message ? `: ${(error as any).message}` : '.'}
      </Alert>
    );
  }

  const list = Array.isArray(payslips) ? payslips : (payslips as any)?.data ?? [];

  return (
    <Alert severity='info' sx={{ mt: 1 }}>
      Loaded {list.length} payslip{list.length === 1 ? '' : 's'} — check the console for the raw
      shape. The list/table UI is pending real field names.
    </Alert>
  );
};

export default MyHrPayslips;
