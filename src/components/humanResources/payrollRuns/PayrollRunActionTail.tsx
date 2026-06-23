'use client';

import CostCenterSelector from '@/components/masters/costCenters/CostCenterSelector';
import { CostCenter } from '@/components/masters/costCenters/CostCenterType';
import { AddOutlined } from '@mui/icons-material';
import {
  Alert,
  Button,
  ButtonGroup,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { useState } from 'react';
import humanResourcesServices from '../humanResourcesServices';
import { PayrollPeriodType } from '../payrollPeriods/PayrollPeriodType';

const getErrorMessage = (error: any) => {
  const validationErrors = error?.response?.data?.validation_errors;
  if (validationErrors && typeof validationErrors === 'object') {
    const first = Object.values(validationErrors)[0] as any;
    return Array.isArray(first) ? first[0] : String(first);
  }

  return error?.response?.data?.message || error?.message || 'Something went wrong';
};

const PayrollRunActionTail = ({
  payrollPeriod,
}: {
  payrollPeriod: PayrollPeriodType | null;
}) => {
  const [openDialog, setOpenDialog] = useState(false);
  const [costCenter, setCostCenter] = useState<CostCenter | null>(null);
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const { mutate: addPayrollRun, isPending } = useMutation({
    mutationFn: humanResourcesServices.addPayrollRun,
    onSuccess: () => {
      setOpenDialog(false);
      setCostCenter(null);
      queryClient.invalidateQueries({ queryKey: ['payrollRuns'] });
      queryClient.invalidateQueries({ queryKey: ['payrollRunsForPeriod', String(payrollPeriod?.id)] });
      queryClient.invalidateQueries({ queryKey: ['showPayrollPeriod', String(payrollPeriod?.id)] });
      enqueueSnackbar('Payroll run created', { variant: 'success' });
    },
    onError: (error: any) => enqueueSnackbar(getErrorMessage(error), { variant: 'error' }),
  });

  return (
    <>
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} fullWidth maxWidth='sm'>
        <DialogTitle>Create Payroll Run</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <Alert severity='info'>
              Leave cost center empty for a company-wide run. Use a cost center when this month is split by branch, department, or project.
            </Alert>
            <Typography variant='body2' color='text.secondary'>
              Period: {payrollPeriod ? `${payrollPeriod.year}-${payrollPeriod.month}` : '-'}
            </Typography>
            <CostCenterSelector
              multiple={false}
              withNotSpecified={false}
              label='Cost Center (optional)'
              defaultValue={costCenter}
              onChange={(value) => setCostCenter((Array.isArray(value) ? value[0] : value) || null)}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} disabled={isPending}>Cancel</Button>
          <Button
            variant='contained'
            disabled={isPending || !payrollPeriod?.id}
            onClick={() =>
              addPayrollRun({
                payroll_period_id: payrollPeriod?.id,
                cost_center_id: costCenter?.id || null,
              })
            }
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
      <ButtonGroup variant='outlined' size='small' disableElevation>
        <Tooltip title='Create Payroll Run'>
          <span>
            <IconButton disabled={!payrollPeriod?.id} onClick={() => setOpenDialog(true)}>
              <AddOutlined />
            </IconButton>
          </span>
        </Tooltip>
      </ButtonGroup>
    </>
  );
};

export default PayrollRunActionTail;
