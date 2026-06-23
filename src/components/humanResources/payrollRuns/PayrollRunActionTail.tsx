'use client';

import { PayrollPeriodType } from '../payrollPeriods/PayrollPeriodType';
import { AddOutlined, EditOutlined } from '@mui/icons-material';
import {
  ButtonGroup,
  Dialog,
  IconButton,
  Tooltip,
  useMediaQuery,
} from '@mui/material';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import React, { lazy, useState } from 'react';
import { PayrollRunType } from './PayrollRunType';

const PayrollRunForm = lazy(() => import('./PayrollRunForm'));

interface PayrollRunActionTailProps {
  payrollPeriod: PayrollPeriodType | null;
  payrollRun?: PayrollRunType | null;
}

const PayrollRunActionTail = ({
  payrollPeriod,
  payrollRun = null,
}: PayrollRunActionTailProps) => {
  const [openDialog, setOpenDialog] = useState(false);
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  return (
    <React.Fragment>
      <Dialog
        maxWidth='xs'
        fullWidth
        fullScreen={belowLargeScreen}
        open={openDialog}
        onClose={() => setOpenDialog(false)}
      >
        <PayrollRunForm
          setOpenDialog={setOpenDialog}
          payrollPeriod={payrollPeriod}
          payrollRun={payrollRun}
        />
      </Dialog>

      <ButtonGroup
        variant='outlined'
        size='small'
        disableElevation
        sx={{ '& .MuiButton-root': { px: 1 } }}
      >
        <Tooltip title='Create Payroll Run'>
          <span>
            <IconButton
              onClick={() => setOpenDialog(true)}
              disabled={!payrollPeriod?.id}
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