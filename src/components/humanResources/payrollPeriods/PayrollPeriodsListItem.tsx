'use client';

import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import {
  AccountBalanceWalletOutlined,
  Add,
  ReceiptLongOutlined,
  VerifiedRounded,
} from '@mui/icons-material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Badge,
  Box,
  Chip,
  CircularProgress,
  Dialog,
  Grid,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import humanResourcesServices from '../humanResourcesServices';
import PayrollRunForm from '../payrollRuns/PayrollRunForm';
import PayrollRunItemAction from '../payrollRuns/PayrollRunItemAction';
import { PayrollRunType } from '../payrollRuns/PayrollRunType';
import PayrollPeriodItemAction from './PayrollPeriodItemAction';
import { PayrollPeriodType } from './PayrollPeriodType';
import PayrollPeriodDetails from './PayrollPeriodDetails';

const MONTH_NAMES = [
  '',
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const statusColor = (
  status: string
): 'success' | 'warning' | 'error' | 'default' => {
  switch (status?.toLowerCase()) {
    case 'paid':
    case 'finalized':
    case 'approved':
      return 'success';
    case 'submitted':
    case 'processing':
      return 'warning';
    case 'rejected':
    case 'cancelled':
      return 'error';
    default:
      return 'default';
  }
};

const runStatusColor = (
  status: string
): 'success' | 'warning' | 'error' | 'info' | 'default' => {
  switch (status?.toLowerCase()) {
    case 'paid':
      return 'success';
    case 'approved':
      return 'info';
    case 'submitted':
      return 'warning';
    case 'rejected':
    case 'cancelled':
      return 'error';
    default:
      return 'default';
  }
};

interface PayrollPeriodsListItemProps {
  payrollPeriod: PayrollPeriodType;
}

const PayrollPeriodsListItem = ({
  payrollPeriod,
}: PayrollPeriodsListItemProps) => {
  const queryClient = useQueryClient();
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const [expanded, setExpanded] = useState(false);
  const [openCreateRunDialog, setOpenCreateRunDialog] = useState(false);

  const {
    data: runsData,
    isLoading: isLoadingRuns,
    refetch: refetchRuns,
  } = useQuery({
    queryKey: ['payrollRunsForPeriod', String(payrollPeriod.id)],
    queryFn: () =>
      humanResourcesServices.getPayrollRunsList({
        payroll_period_id: payrollPeriod.id,
      }),
    enabled: expanded,
  });

  const runs: PayrollRunType[] = runsData?.data || [];
  const runCount = payrollPeriod.runs_count ?? runs.length ?? 0;
  const monthName = MONTH_NAMES[payrollPeriod.month] || payrollPeriod.month;

  const handleRunCreated = () => {
    setOpenCreateRunDialog(false);
    refetchRuns();
    queryClient.invalidateQueries({ queryKey: ['payrollPeriods'] });
  };

  return (
    <>
      <Accordion
        expanded={expanded}
        onChange={() => setExpanded(!expanded)}
        square
        sx={{
          borderRadius: 2,
          borderTop: 2,
          borderColor: 'divider',
          '&:hover': { bgcolor: 'action.hover' },
          '&.Mui-expanded': { margin: '0 0 16px 0' },
        }}
      >
        <AccordionSummary
          expandIcon={expanded ? <RemoveIcon /> : <AddIcon />}
          sx={{
            px: 3,
            flexDirection: 'row-reverse',
            '.MuiAccordionSummary-content': {
              alignItems: 'center',
              '&.Mui-expanded': { margin: '12px 0' },
            },
            '.MuiAccordionSummary-expandIconWrapper': {
              borderRadius: 1,
              border: 1,
              color: 'text.secondary',
              transform: 'none',
              mr: 1,
              '&.Mui-expanded': {
                transform: 'none',
                color: 'primary.main',
                borderColor: 'primary.main',
              },
              '& svg': { fontSize: '1.25rem' },
            },
          }}
        >
          <Grid container spacing={1} width='100%' sx={{ px: 1 }}>
            <Grid size={{ xs: 12, md: 3 }}>
              <Typography variant='body2'>{payrollPeriod.year}</Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <Typography variant='body2'>{monthName}</Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <Chip
                label={payrollPeriod.status || 'active'}
                color={statusColor(payrollPeriod.status || '')}
                size='small'
                sx={{ textTransform: 'capitalize' }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <Badge badgeContent={runCount} color='info' showZero>
                <ReceiptLongOutlined fontSize='small' color='action' />
              </Badge>
            </Grid>
          </Grid>
        </AccordionSummary>

        <AccordionDetails sx={{ bgcolor: 'background.paper', mb: 3 }}>
          <PayrollPeriodDetails
            payrollPeriodId={payrollPeriod.id}
            payrollPeriod={payrollPeriod}
            year={payrollPeriod.year}
            month={payrollPeriod.month}
          />
        </AccordionDetails>
      </Accordion>

      <Dialog
        open={openCreateRunDialog}
        onClose={() => setOpenCreateRunDialog(false)}
        maxWidth='sm'
        fullWidth
        fullScreen={belowLargeScreen}
      >
        <PayrollRunForm
          setOpenDialog={setOpenCreateRunDialog}
          payrollPeriod={payrollPeriod}
          onSuccess={handleRunCreated}
          runs={runs}
        />
      </Dialog>
    </>
  );
};

export default PayrollPeriodsListItem;
