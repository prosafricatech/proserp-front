'use client';

import { useLanguage } from '@/app/[lang]/contexts/LanguageContext';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
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
import {
  ReceiptLongOutlined,
  AccountBalanceWalletOutlined,
  VerifiedRounded,
  Add
} from '@mui/icons-material';
import RemoveIcon from '@mui/icons-material/Remove';
import AddIcon from '@mui/icons-material/Add';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import humanResourcesServices from '../humanResourcesServices';
import { PayrollPeriodType } from './PayrollPeriodType';
import { PayrollRunType } from '../payrollRuns/PayrollRunType';
import PayrollPeriodItemAction from './PayrollPeriodItemAction';
import PayrollRunItemAction from '../payrollRuns/PayrollRunItemAction';
import PayrollRunForm from '../payrollRuns/PayrollRunForm';

const MONTH_NAMES = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const statusColor = (status: string): 'success' | 'warning' | 'error' | 'default' => {
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

const runStatusColor = (status: string): 'success' | 'warning' | 'error' | 'info' | 'default' => {
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

const PayrollPeriodsListItem = ({ payrollPeriod }: PayrollPeriodsListItemProps) => {
  const queryClient = useQueryClient();
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));
  
  const [expanded, setExpanded] = useState(false);
  const [openCreateRunDialog, setOpenCreateRunDialog] = useState(false);

  const { data: runsData, isLoading: isLoadingRuns, refetch: refetchRuns } = useQuery({
    queryKey: ['payrollRunsForPeriod', String(payrollPeriod.id)],
    queryFn: () => humanResourcesServices.getPayrollRunsList({
      payroll_period_id: payrollPeriod.id,
    }),
    enabled: expanded,
  });

  const runs: PayrollRunType[] = runsData?.data || [];
  const runCount = payrollPeriod.runs_count ?? runs.length ?? 0;
  const monthName = MONTH_NAMES[payrollPeriod.month] || payrollPeriod.month;

  // Check if there's a company-wide run (no cost center)
  const hasCompanyWideRun = runs.some(run => run.cost_center_id === null);
  
  // Check if there are only branch runs (with cost centers)
  const hasBranchRuns = runs.some(run => run.cost_center_id !== null);
  
  // Determine if new run can be created
  const canCreateRun = !hasCompanyWideRun && (runs.length === 0 || hasBranchRuns);

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
          <Grid container spacing={1} width="100%" sx={{ px: 1 }}>
            <Grid size={{ xs: 12, md: 3 }}>
              <Typography variant="body2">{payrollPeriod.year}</Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <Typography variant="body2">{monthName}</Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <Chip
                label={payrollPeriod.status || 'active'}
                color={statusColor(payrollPeriod.status || '')}
                size="small"
                sx={{ textTransform: 'capitalize' }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <Badge badgeContent={runCount} color="info" showZero>
                <ReceiptLongOutlined fontSize="small" color="action" />
              </Badge>
            </Grid>
          </Grid>
        </AccordionSummary>

        <AccordionDetails sx={{ bgcolor: 'background.paper', mb: 3 }}>
          <Grid container spacing={2}>
            <Grid size={12}>
              <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center">
                {canCreateRun && (
                  <Tooltip title="New Run">
                    <IconButton 
                      size="small" 
                      onClick={() => setOpenCreateRunDialog(true)}
                    >
                      <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                        <ReceiptLongOutlined fontSize="small" />
                        <Add
                          fontSize="small"
                          sx={{
                            position: 'absolute',
                            right: -6,
                            bottom: -6,
                            fontSize: 12,
                            bgcolor: 'primary.main',
                            color: 'white',
                            borderRadius: '50%',
                            border: '2px solid white',
                            width: 14,
                            height: 14,
                          }}
                        />
                      </Box>
                    </IconButton>
                  </Tooltip>
                )}
                <PayrollPeriodItemAction
                  payrollPeriod={payrollPeriod}
                  hasRuns={runCount > 0}
                />
              </Stack>
            </Grid>

            <Grid size={12}>
              {isLoadingRuns ? (
                <Box display="flex" justifyContent="center" py={4}>
                  <CircularProgress size={30} />
                </Box>
              ) : runs.length === 0 ? (
                <Alert severity="info">
                  No payroll runs found for {monthName} {payrollPeriod.year}.
                  Click the + button to create a run.
                </Alert>
              ) : (
                <TableContainer sx={{ maxHeight: 400 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>Cost Center</TableCell>
                        <TableCell align="center">Status</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {runs.map((run) => {
                        const isCompanyWide = run.cost_center_id === null;
                        return (
                          <TableRow
                            key={run.id}
                            hover
                            sx={{
                              cursor: 'pointer',
                              '&:hover': { bgcolor: 'action.hover' },
                            }}
                          >
                            <TableCell>
                              <Box display="flex" alignItems="center" gap={1}>
                                <AccountBalanceWalletOutlined fontSize="small" color="action" />
                                <Typography variant="body2">
                                  {isCompanyWide ? 'Company-wide Run' : run.cost_center?.name || 'Run'}
                                </Typography>
                                {run.employee && (
                                  <Typography variant="caption" color="text.secondary">
                                    ({run.employee.first_name} {run.employee.last_name})
                                  </Typography>
                                )}
                              </Box>
                            </TableCell>
                            <TableCell align="center">
                              <Chip
                                label={run.status || 'draft'}
                                size="small"
                                color={runStatusColor(run.status || '')}
                                sx={{ textTransform: 'capitalize' }}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <Stack
                                direction="row"
                                spacing={0.5}
                                justifyContent="flex-end"
                              >
                                {(run.status === 'paid' || run.status === 'finalized') && (
                                  <Tooltip title="Fully Processed">
                                    <VerifiedRounded fontSize="small" color="success" />
                                  </Tooltip>
                                )}
                                <div onClick={(e) => e.stopPropagation()}>
                                  <PayrollRunItemAction payrollRun={run} isFromPayrollPeriodsList={true} />
                                </div>
                              </Stack>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      <Dialog
        open={openCreateRunDialog}
        onClose={() => setOpenCreateRunDialog(false)}
        maxWidth="sm"
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