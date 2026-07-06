'use client';

import { PayrollPeriodType } from '../payrollPeriods/PayrollPeriodType';
import { AddOutlined } from '@mui/icons-material';
import {
  ButtonGroup,
  Dialog,
  IconButton,
  Tooltip,
  useMediaQuery,
} from '@mui/material';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { useQuery } from '@tanstack/react-query';
import React, { lazy, useState } from 'react';
import { PayrollRunType } from './PayrollRunType';
import humanResourcesServices from '../humanResourcesServices';

const PayrollRunForm = lazy(() => import('./PayrollRunForm'));

interface PayrollRunActionTailProps {
  payrollPeriod: PayrollPeriodType | null;
  payrollRun?: PayrollRunType | null;
  onSuccess?: () => void;
}

const PayrollRunActionTail = ({
  payrollPeriod,
  payrollRun = null,
  onSuccess,
}: PayrollRunActionTailProps) => {
  const [openDialog, setOpenDialog] = useState(false);
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  // Fetch existing runs for this period to check if company-wide run exists
  const { data: runsData } = useQuery({
    queryKey: ['payrollRunsForPeriod', String(payrollPeriod?.id)],
    queryFn: () => humanResourcesServices.getPayrollRunsList({
      payroll_period_id: payrollPeriod?.id,
    }),
    enabled: !!payrollPeriod?.id,
  });

  const runs: PayrollRunType[] = runsData?.data || [];

  // Check if there's a company-wide run (no cost center)
  const hasCompanyWideRun = runs.some(run => run.cost_center_id === null);
  
  // Check if there are branch runs (with cost centers)
  const hasBranchRuns = runs.some(run => run.cost_center_id !== null);
  
  // Determine if new run can be created
  const canCreateRun = !hasCompanyWideRun && (runs.length === 0 || hasBranchRuns);

  // Get tooltip message for disabled button
  const getDisabledTooltip = () => {
    if (!payrollPeriod?.id) return 'Select a payroll period first';
    if (hasCompanyWideRun) return 'Cannot create another run - this period already has a company-wide run';
    return '';
  };

  const isDisabled = !payrollPeriod?.id || !canCreateRun;

  const handleSuccess = () => {
    if (onSuccess) onSuccess();
  };

  return (
    <React.Fragment>
      <Dialog
        maxWidth="sm"
        fullWidth
        fullScreen={belowLargeScreen}
        open={openDialog}
        onClose={() => setOpenDialog(false)}
      >
        <PayrollRunForm
          setOpenDialog={setOpenDialog}
          payrollPeriod={payrollPeriod}
          payrollRun={payrollRun}
          onSuccess={handleSuccess}
          runs={runs}
        />
      </Dialog>

      <ButtonGroup
        variant="outlined"
        size="small"
        disableElevation
        sx={{ '& .MuiButton-root': { px: 1 } }}
      >
        <Tooltip title={isDisabled ? getDisabledTooltip() : 'Create Payroll Run'}>
          <span>
            <IconButton
              onClick={() => setOpenDialog(true)}
              disabled={isDisabled}
            >
              <AddOutlined />
            </IconButton>
          </span>
        </Tooltip>
      </ButtonGroup>
    </React.Fragment>
  );
};

export default PayrollRunActionTail;