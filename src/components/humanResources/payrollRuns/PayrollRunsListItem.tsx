'use client';

import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Badge,
  Box,
  Chip,
  Grid,
  Tab,
  Tabs,
  Typography,
  LinearProgress,
} from '@mui/material';
import {
  ReceiptLongOutlined,
} from '@mui/icons-material';
import RemoveIcon from '@mui/icons-material/Remove';
import AddIcon from '@mui/icons-material/Add';
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import PayrollRunItemAction from './PayrollRunItemAction';
import { PayrollRunType } from './PayrollRunType';
import humanResourcesServices from '../humanResourcesServices';
import { statusColor, processPayslips } from './payrollUtils';
import { TabPanel, EmployeesTab, PayslipsTab, ApprovalsTab } from './PayrollRunTabs';
import { PayrollRunActions } from './PayrollRunActions';
import { SimulationDialog, PayslipViewDialog } from './PayrollRunDialogs';

const PayrollRunsListItem = ({ payrollRun }: { payrollRun: PayrollRunType }) => {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [openSimulationDialog, setOpenSimulationDialog] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState<any>(null);
  const [openPayslipDialog, setOpenPayslipDialog] = useState(false);

  const status = payrollRun.status?.toLowerCase() || 'draft';
  const isDraft = status === 'draft';
  const isSubmitted = status === 'submitted';
  const isApproved = status === 'approved';
  const isPosted = status === 'posted';
  const isPaid = status === 'paid';
  const hasChain = Boolean(payrollRun.approval_chain_id || payrollRun.approval_chain);
  const hasPayslips = status === 'approved' || status === 'posted' || status === 'paid';

  // Fetch preview data
  const { data: previewData, isLoading: isLoadingPreview, refetch: refetchPreview, isFetching: isRefetching } = useQuery({
    queryKey: ['previewPayrollRunEmployees', payrollRun.id],
    queryFn: () => humanResourcesServices.previewPayrollRun({ id: payrollRun.id }),
    enabled: expanded,
    staleTime: 1000 * 60 * 5,
  });

  const previewRows = previewData?.data?.rows || previewData?.rows || [];

  // Fetch run details
  const { data: runDetailsData, isLoading: isLoadingDetails } = useQuery({
    queryKey: ['payrollRunDetails', payrollRun.id],
    queryFn: () => humanResourcesServices.showPayrollRun(payrollRun.id),
    enabled: expanded,
    staleTime: 1000 * 60 * 5,
  });

  const runDetails = runDetailsData?.data || runDetailsData || payrollRun;
  const processedPayslips = useMemo(() => processPayslips(runDetails?.payslips || []), [runDetails]);

  const employeeName = `${payrollRun.employee?.first_name || ''} ${payrollRun.employee?.last_name || ''}`.trim();
  const runLabel = employeeName || payrollRun.cost_center?.name || 'Company-wide run';

  // Mutations
  const { mutate: submitPayrollRun, isPending: isSubmitting } = useMutation({
    mutationFn: () => humanResourcesServices.submitPayrollRun({ id: payrollRun.id }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['payrollRuns'] });
      queryClient.invalidateQueries({ queryKey: ['payrollRunDetails', payrollRun.id] });
      queryClient.invalidateQueries({ queryKey: ['previewPayrollRunEmployees', payrollRun.id] });
      enqueueSnackbar(response?.message || 'Payroll submitted for approval', { variant: 'success' });
    },
    onError: (error) => enqueueSnackbar('Something went wrong', { variant: 'error' }),
  });

  const { mutate: approvePayrollRun, isPending: isApproving } = useMutation({
    mutationFn: () => humanResourcesServices.approvePayrollRun(payrollRun.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payrollRuns'] });
      queryClient.invalidateQueries({ queryKey: ['payrollRunDetails', payrollRun.id] });
      queryClient.invalidateQueries({ queryKey: ['previewPayrollRunEmployees', payrollRun.id] });
      enqueueSnackbar('Payroll run approved', { variant: 'success' });
    },
    onError: (error) => enqueueSnackbar('Something went wrong', { variant: 'error' }),
  });

  const { mutate: postPayrollRun, isPending: isPosting } = useMutation({
    mutationFn: () => humanResourcesServices.postPayrollRunTransactions({ id: payrollRun.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payrollRuns'] });
      queryClient.invalidateQueries({ queryKey: ['payrollRunDetails', payrollRun.id] });
      queryClient.invalidateQueries({ queryKey: ['previewPayrollRunEmployees', payrollRun.id] });
      enqueueSnackbar('Transactions posted successfully', { variant: 'success' });
    },
    onError: (error) => enqueueSnackbar('Something went wrong', { variant: 'error' }),
  });

  const { mutate: payPayrollRun, isPending: isPaying } = useMutation({
    mutationFn: () => humanResourcesServices.payPayrollRun({ id: payrollRun.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payrollRuns'] });
      queryClient.invalidateQueries({ queryKey: ['payrollRunDetails', payrollRun.id] });
      queryClient.invalidateQueries({ queryKey: ['previewPayrollRunEmployees', payrollRun.id] });
      enqueueSnackbar('Employees paid successfully', { variant: 'success' });
    },
    onError: (error) => enqueueSnackbar('Something went wrong', { variant: 'error' }),
  });

  const { mutate: deletePayrollRun, isPending: isDeleting } = useMutation({
    mutationFn: () => humanResourcesServices.deletePayrollRun(payrollRun.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payrollRuns'] });
      enqueueSnackbar('Payroll run deleted', { variant: 'success' });
    },
    onError: (error) => enqueueSnackbar('Something went wrong', { variant: 'error' }),
  });

  const handleAction = (action: string) => {
    switch (action) {
      case 'submit': submitPayrollRun(); break;
      case 'approve': approvePayrollRun(); break;
      case 'post': postPayrollRun(); break;
      case 'pay': payPayrollRun(); break;
      case 'delete': deletePayrollRun(); break;
    }
  };

  const handleSimulateEmployee = async (employeeId: number) => {
    setIsSimulating(true);
    try {
      const response = await humanResourcesServices.simulatePayrollRun({ id: payrollRun.id, employee_id: employeeId });
      setSimulationResult(response?.data || response);
      setOpenSimulationDialog(true);
      enqueueSnackbar('Employee simulation generated', { variant: 'success' });
    } catch (error: any) {
      enqueueSnackbar('Failed to simulate employee', { variant: 'error' });
    } finally {
      setIsSimulating(false);
    }
  };

  const handleViewPayslip = (payslip: any) => {
    setSelectedPayslip(payslip);
    setOpenPayslipDialog(true);
  };

  const isLoading = isLoadingPreview || isLoadingDetails || isRefetching;

  return (
    <>
      <Accordion expanded={expanded} onChange={() => setExpanded(!expanded)} square sx={{
        borderRadius: 2, borderTop: 2, borderColor: 'divider',
        '&:hover': { bgcolor: 'action.hover' },
        '&.Mui-expanded': { margin: '0 0 16px 0' },
      }}>
        <AccordionSummary expandIcon={expanded ? <RemoveIcon /> : <AddIcon />} sx={{
          px: 3, flexDirection: 'row-reverse',
          '.MuiAccordionSummary-content': { alignItems: 'center', '&.Mui-expanded': { margin: '12px 0' } },
          '.MuiAccordionSummary-expandIconWrapper': {
            borderRadius: 1, border: 1, color: 'text.secondary', transform: 'none', mr: 1,
            '&.Mui-expanded': { transform: 'none', color: 'primary.main', borderColor: 'primary.main' },
            '& svg': { fontSize: '1.25rem' },
          },
        }}>
          <Grid container spacing={1} width="100%" sx={{ px: 1 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Box display="flex" alignItems="center" gap={1}>
                <ReceiptLongOutlined fontSize="small" color="action" />
                <Typography variant="body2">{runLabel}</Typography>
                {payrollRun.employee && (
                  <Typography variant="caption" color="text.secondary">({payrollRun.employee.employee_number})</Typography>
                )}
              </Box>
            </Grid>
            <Grid size={{ xs: 6, md: 6 }}>
              <Chip label={payrollRun.status || 'draft'} color={statusColor(payrollRun.status || '')} size="small" sx={{ textTransform: 'capitalize' }} />
            </Grid>
          </Grid>
        </AccordionSummary>

        <AccordionDetails sx={{ backgroundColor: 'background.paper', mb: 2 }}>
          {isLoading ? <LinearProgress /> : (
            <>
              <PayrollRunActions
                isDraft={isDraft} isSubmitted={isSubmitted} isApproved={isApproved} isPosted={isPosted}
                hasChain={hasChain} onRefresh={refetchPreview} onAction={handleAction}
                isLoading={isLoading} isSubmitting={isSubmitting} isDeleting={isDeleting}
                isApproving={isApproving} isPosting={isPosting} isPaying={isPaying} isRefetching={isRefetching}
                runLabel={runLabel}
              />

              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
                  <Tab label="Employees" />
                  {hasPayslips && <Tab label="Payslips" />}
                  <Tab label="Approvals" />
                </Tabs>
              </Box>

              <TabPanel value={tabValue} index={0}>
                <EmployeesTab
                  rows={previewRows}
                  search={employeeSearch}
                  onSearchChange={setEmployeeSearch}
                  onSimulate={handleSimulateEmployee}
                  isSimulating={isSimulating}
                />
              </TabPanel>

              {hasPayslips && (
                <TabPanel value={tabValue} index={1}>
                  <PayslipsTab
                    payslips={processedPayslips}
                    search={employeeSearch}
                    onSearchChange={setEmployeeSearch}
                    onViewPayslip={handleViewPayslip}
                    runStatus={payrollRun.status || 'approved'}
                    isPaid={isPaid}
                    isPosted={isPosted}
                  />
                </TabPanel>
              )}

              <TabPanel value={tabValue} index={hasPayslips ? 2 : 1}>
                <ApprovalsTab hasChain={hasChain} approvalChain={runDetails?.approval_chain} approvals={runDetails?.approvals} />
              </TabPanel>
            </>
          )}
        </AccordionDetails>
      </Accordion>

      <SimulationDialog open={openSimulationDialog} onClose={() => setOpenSimulationDialog(false)} data={simulationResult} />
      
      <PayslipViewDialog 
        open={openPayslipDialog} 
        onClose={() => {
          setOpenPayslipDialog(false);
          setSelectedPayslip(null);
        }} 
        payslip={selectedPayslip} 
      />
    </>
  );
};

export default PayrollRunsListItem;