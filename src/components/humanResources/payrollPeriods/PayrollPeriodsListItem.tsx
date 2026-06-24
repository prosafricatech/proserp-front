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
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import humanResourcesServices from '../humanResourcesServices';
import { PayrollPeriodType } from './PayrollPeriodType';
import { PayrollRunType } from '../payrollRuns/PayrollRunType';
import PayrollPeriodItemAction from './PayrollPeriodItemAction';
import PayrollRunItemAction from '../payrollRuns/PayrollRunItemAction';
import PayrollRunForm from '../payrollRuns/PayrollRunForm';

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

const statusColor = (status: string): 'success' | 'warning' | 'error' | 'default' => {
  switch (status?.toLowerCase()) {
    case 'paid':
    case 'finalized':
      return 'success';
    case 'approved':
      return 'success';
    case 'submitted':
      return 'warning';
    case 'processing':
      return 'warning';
    case 'rejected':
    case 'cancelled':
      return 'error';
    case 'draft':
      return 'default';
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
    case 'draft':
      return 'default';
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
  const router = useRouter();
  const lang = useLanguage();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));
  
  const [expanded, setExpanded] = useState(false);
  const [openCreateRunDialog, setOpenCreateRunDialog] = useState(false);

  // Fetch runs for this period when expanded
  const { data: runsData, isLoading: isLoadingRuns, refetch: refetchRuns } = useQuery({
    queryKey: ['payrollRunsForPeriod', String(payrollPeriod.id)],
    queryFn: () =>
      humanResourcesServices.getPayrollRunsList({
        payroll_period_id: payrollPeriod.id,
        limit: 100,
      }),
    enabled: expanded, // Only fetch when expanded
  });

  const runs: PayrollRunType[] = runsData?.data || [];
  const hasRuns = runs.length > 0;

  // Format money
  const formatMoney = (value: number) =>
    Number(value || 0).toLocaleString();

  // Delete period mutation
  const { mutate: deletePeriod, isPending: isDeleting } = useMutation({
    mutationFn: () => humanResourcesServices.deletePayrollPeriod(payrollPeriod.id),
    onSuccess: () => {
      enqueueSnackbar('Payroll period deleted successfully', {
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['payrollPeriods'] });
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || 'Failed to delete period';
      enqueueSnackbar(message, { variant: 'error' });
    },
  });

  const handleDeletePeriod = () => {
    if (hasRuns) {
      enqueueSnackbar('Cannot delete period with existing runs', {
        variant: 'error',
      });
      return;
    }
    // Will be handled by PayrollPeriodItemAction
  };

  const handleRunClick = (runId: number) => {
    router.push(`/${lang}/humanResources/payroll/run/${runId}`);
  };

  // Invalidate queries after run creation
  const handleRunCreated = () => {
    setOpenCreateRunDialog(false);
    refetchRuns();
    queryClient.invalidateQueries({ queryKey: ['payrollPeriods'] });
  };

  const monthName = MONTH_NAMES[payrollPeriod.month] || payrollPeriod.month;

  return (
    <>
      <Accordion
        expanded={expanded}
        onChange={() => setExpanded((prev) => !prev)}
        square
        sx={{
          borderRadius: 2,
          borderTop: 2,
          borderColor: 'divider',
          '&:hover': {
            bgcolor: 'action.hover',
          },
          '&.Mui-expanded': {
            margin: '0 0 16px 0',
          },
        }}
      >
        <AccordionSummary
          expandIcon={expanded ? <RemoveIcon /> : <AddIcon />}
          sx={{
            px: 3,
            flexDirection: 'row-reverse',
            '.MuiAccordionSummary-content': {
              alignItems: 'center',
              '&.Mui-expanded': {
                margin: '12px 0',
              },
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
              '& svg': {
                fontSize: '1.25rem',
              },
            },
          }}
        >
          <Grid 
            container 
            spacing={1} 
            width="100%" 
            sx={{ paddingLeft: 1, paddingRight: 1 }}
          >
            <Grid size={{ xs: 12, md: 3 }}>
              <Tooltip title="Year">
                <Typography variant="body2">
                  {payrollPeriod.year}
                </Typography>
              </Tooltip>
            </Grid>

            <Grid size={{ xs: 12, md: 3 }}>
              <Tooltip title="Month">
                <Typography variant="body2">
                  {monthName}
                </Typography>
              </Tooltip>
            </Grid>

            <Grid size={{ xs: 12, md: 3 }}>
              <Tooltip title="Status">
                <Chip
                  label={payrollPeriod.status || 'active'}
                  color={statusColor(payrollPeriod.status || '')}
                  size="small"
                  sx={{ textTransform: 'capitalize' }}
                />
              </Tooltip>
            </Grid>

            <Grid size={{ xs: 12, md: 3 }}>
              <Tooltip title="Runs Count">
                <Badge 
                  badgeContent={payrollPeriod.runs_count ?? runs.length ?? 0} 
                  color="info"
                  showZero
                >
                  <ReceiptLongOutlined fontSize="small" color="action" />
                </Badge>
              </Tooltip>
            </Grid>
          </Grid>
        </AccordionSummary>

        <AccordionDetails sx={{ backgroundColor: 'background.paper', marginBottom: 3 }}>
          <Grid container spacing={2}>
            {/* Actions Row */}
            <Grid size={12}>
              <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center">
                <Tooltip title="New Run">
                  <IconButton
                    size="small"
                    onClick={() => setOpenCreateRunDialog(true)}
                    sx={{
                      borderRadius: 1,
                      position: 'relative',
                    }}
                  >
                    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                      <ReceiptLongOutlined fontSize="small" />
                      <Add
                        fontSize="small" 
                        sx={{ 
                          position: 'absolute',
                          right: -6,
                          bottom: -6,
                          fontSize: '12px',
                          bgcolor: 'primary.main',
                          color: 'white',
                          borderRadius: '50%',
                          border: '2px solid white',
                          width: '14px',
                          height: '14px',
                        }} 
                      />
                    </Box>
                  </IconButton>
                </Tooltip>
                <PayrollPeriodItemAction 
                  payrollPeriod={payrollPeriod} 
                  hasRuns={hasRuns}
                  onDelete={deletePeriod}
                  isDeleting={isDeleting}
                />
              </Stack>
            </Grid>

            {/* Runs List */}
            <Grid size={12}>
              {isLoadingRuns ? (
                <Box display="flex" justifyContent="center" py={4}>
                  <CircularProgress size={30} />
                </Box>
              ) : runs.length === 0 ? (
                <Alert 
                  severity="info" 
                  sx={{ mb: 2 }}
                >
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
                        <TableCell align="center">Employees</TableCell>
                        <TableCell align="center">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {runs.map((run) => {
                        const isFullyProcessed = run.status === 'paid' || run.status === 'finalized';
                        
                        return (
                          <TableRow
                            key={run.id}
                            hover
                            sx={{ cursor: 'pointer' }}
                            onClick={() => handleRunClick(run.id)}
                          >
                            <TableCell>
                              <Box display="flex" alignItems="center" gap={1}>
                                <AccountBalanceWalletOutlined fontSize="small" color="action" />
                                <Typography variant="body2">
                                  {run.cost_center?.name || 'Company-wide Run'}
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
                            <TableCell align="center">
                              <Badge 
                                badgeContent={run.payslip_count || run.employee_count || 0} 
                                color="info"
                                showZero
                              />
                            </TableCell>
                            <TableCell align="center">
                              <Stack 
                                direction="row" 
                                spacing={0.5} 
                                justifyContent="center"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {/* Show completion badge if run is fully processed */}
                                {isFullyProcessed && (
                                  <Tooltip title="Fully Processed">
                                    <VerifiedRounded fontSize="small" color="success" />
                                  </Tooltip>
                                )}
                                <PayrollRunItemAction payrollRun={run} />
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

      {/* Create Run Dialog */}
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
        />
      </Dialog>
    </>
  );
};

export default PayrollPeriodsListItem;