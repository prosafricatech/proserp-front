'use client';

import {
  CheckCircleOutline,
  DeleteOutline,
  DescriptionOutlined,
  DownloadOutlined,
  EditOutlined,
  ErrorOutline,
  InsertDriveFileOutlined,
  Refresh,
  UploadOutlined,
} from '@mui/icons-material';
import {
  Alert,
  alpha,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions as MuiDialogActions,
  DialogContent as MuiDialogContent,
  DialogTitle as MuiDialogTitle,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import React, { ChangeEvent, useState } from 'react';
import humanResourcesServices from '../../humanResourcesServices';

interface PayrollPeriodAdjustmentsTabProps {
  payrollPeriodId: number;
  year: number;
  month: number;
}

interface AdjustmentEmployee {
  id: number;
  employee_number: string;
  first_name: string;
  last_name: string;
}

interface PeriodAllowance {
  id: number;
  payroll_period_id: number;
  employee_id: number;
  allowance_type_id: number;
  amount: number;
  remarks: string | null;
  employee: AdjustmentEmployee;
  allowanceType: {
    id: number;
    name: string;
  };
}

interface PeriodDeduction {
  id: number;
  payroll_period_id: number;
  employee_id: number;
  deduction_type_id: number;
  amount: number;
  remarks: string | null;
  employee: AdjustmentEmployee;
  deductionType: {
    id: number;
    name: string;
  };
}

interface PeriodAdjustments {
  allowances: PeriodAllowance[];
  deductions: PeriodDeduction[];
}

interface ImportResult {
  message: string;
  imported: number;
  skipped: number;
  errors: Array<{
    row: number;
    error: string;
  }>;
}

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

const getErrorMessage = (error: any) => {
  const validationErrors = error?.response?.data?.validation_errors;
  if (validationErrors && typeof validationErrors === 'object') {
    const first = Object.values(validationErrors)[0] as any;
    return Array.isArray(first) ? first[0] : String(first);
  }
  return (
    error?.response?.data?.message || error?.message || 'Something went wrong'
  );
};

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = ({ children, value, index }: TabPanelProps) => (
  <div hidden={value !== index} role='tabpanel'>
    {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
  </div>
);

const PayrollPeriodAdjustmentsTab = ({
  payrollPeriodId,
  year,
  month,
}: PayrollPeriodAdjustmentsTabProps) => {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const isDark = theme.type=== 'dark';

  const [tabValue, setTabValue] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  // Edit states
  const [editingAllowance, setEditingAllowance] = useState<PeriodAllowance | null>(null);
  const [editingDeduction, setEditingDeduction] = useState<PeriodDeduction | null>(null);
  const [editAmount, setEditAmount] = useState<number>(0);
  const [editRemarks, setEditRemarks] = useState<string>('');

  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deletingType, setDeletingType] = useState<'allowance' | 'deduction' | null>(null);

  const monthName = MONTH_NAMES[month] || month;

  // Query to fetch adjustments using periodAdjustmentReview
  const {
    data: adjustmentsData,
    isLoading: isLoadingAdjustments,
    refetch: refetchAdjustments,
  } = useQuery({
    queryKey: ['periodAdjustments', String(payrollPeriodId)],
    queryFn: () => humanResourcesServices.periodAdjustmentReview(payrollPeriodId),
    enabled: tabValue === 0,
  });

  const adjustments: PeriodAdjustments = adjustmentsData?.data || adjustmentsData || { allowances: [], deductions: [] };

  // Download template mutation
  const { mutate: downloadTemplate, isPending: isDownloading } = useMutation({
    mutationFn: humanResourcesServices.downloadPeriodAdjustmentTemplate,
    onSuccess: (blob: Blob) => {
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'payroll-adjustments-template.xlsx';
      anchor.click();
      window.URL.revokeObjectURL(url);
      enqueueSnackbar('Template downloaded successfully', {
        variant: 'success',
      });
    },
    onError: (error: any) =>
      enqueueSnackbar(getErrorMessage(error), { variant: 'error' }),
  });

  // Upload adjustments mutation
  const { mutate: importAdjustments, isPending: isImporting } = useMutation({
    mutationFn: (file: File) =>
      humanResourcesServices.importPeriodAdjustmentExcel(payrollPeriodId, file),
    onSuccess: (response: any) => {
      const result = response.data || response;
      setImportResult(result);
      setFile(null);
      
      if (result.errors && result.errors.length > 0) {
        enqueueSnackbar(
          `${result.message}. ${result.errors.length} error(s) found. Check the details below.`,
          { variant: 'warning' }
        );
      } else if (result.imported > 0 && result.skipped === 0) {
        enqueueSnackbar(result.message || 'Adjustments imported successfully', {
          variant: 'success',
        });
        setTabValue(0);
        refetchAdjustments();
      } else if (result.imported > 0 && result.skipped > 0) {
        enqueueSnackbar(
          `${result.message}. ${result.imported} imported, ${result.skipped} skipped.`,
          { variant: 'warning' }
        );
      } else {
        enqueueSnackbar(
          result.message ||
            'No adjustments were imported. Please check the errors below.',
          { variant: 'error' }
        );
      }
    },
    onError: (error: any) => {
      enqueueSnackbar(getErrorMessage(error), { variant: 'error' });
    },
  });

  // Edit allowance mutation
  const editAllowanceMutation = useMutation({
    mutationFn: (payload: { id: number; amount: number; remarks: string }) =>
      humanResourcesServices.updateperiodAdjustmentAllowance({
        id: payload.id,
        amount: payload.amount,
        remarks: payload.remarks,
      }),
    onSuccess: () => {
      setEditingAllowance(null);
      refetchAdjustments();
      enqueueSnackbar('Allowance updated successfully', { variant: 'success' });
    },
    onError: (error: any) => {
      enqueueSnackbar(getErrorMessage(error), { variant: 'error' });
    },
  });

  // Edit deduction mutation
  const editDeductionMutation = useMutation({
    mutationFn: (payload: { id: number; amount: number; remarks: string }) =>
      humanResourcesServices.updateperiodAdjustmentDeducction({
        id: payload.id,
        amount: payload.amount,
        remarks: payload.remarks,
      }),
    onSuccess: () => {
      setEditingDeduction(null);
      refetchAdjustments();
      enqueueSnackbar('Deduction updated successfully', { variant: 'success' });
    },
    onError: (error: any) => {
      enqueueSnackbar(getErrorMessage(error), { variant: 'error' });
    },
  });

  // Delete allowance mutation
  const deleteAllowanceMutation = useMutation({
    mutationFn: (id: number) =>
      humanResourcesServices.deleteperiodAdjustmentAllowance(id),
    onSuccess: () => {
      setDeleteDialogOpen(false);
      setDeletingId(null);
      setDeletingType(null);
      refetchAdjustments();
      enqueueSnackbar('Allowance deleted successfully', { variant: 'success' });
    },
    onError: (error: any) => {
      setDeleteDialogOpen(false);
      enqueueSnackbar(getErrorMessage(error), { variant: 'error' });
    },
  });

  // Delete deduction mutation
  const deleteDeductionMutation = useMutation({
    mutationFn: (id: number) =>
      humanResourcesServices.deleteperiodAdjustmentDeduction(id),
    onSuccess: () => {
      setDeleteDialogOpen(false);
      setDeletingId(null);
      setDeletingType(null);
      refetchAdjustments();
      enqueueSnackbar('Deduction deleted successfully', { variant: 'success' });
    },
    onError: (error: any) => {
      setDeleteDialogOpen(false);
      enqueueSnackbar(getErrorMessage(error), { variant: 'error' });
    },
  });

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFile(event.target.files?.[0] || null);
    setImportResult(null);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    if (newValue === 0) {
      refetchAdjustments();
    }
    if (newValue === 1) {
      setImportResult(null);
    }
  };

  const handleEditClick = (item: PeriodAllowance | PeriodDeduction, type: 'allowance' | 'deduction') => {
    if (type === 'allowance') {
      const allowance = item as PeriodAllowance;
      setEditingAllowance(allowance);
      setEditAmount(allowance.amount);
      setEditRemarks(allowance.remarks || '');
    } else {
      const deduction = item as PeriodDeduction;
      setEditingDeduction(deduction);
      setEditAmount(deduction.amount);
      setEditRemarks(deduction.remarks || '');
    }
  };

  const handleEditSave = () => {
    if (editingAllowance) {
      editAllowanceMutation.mutate({
        id: editingAllowance.id,
        amount: editAmount,
        remarks: editRemarks,
      });
    } else if (editingDeduction) {
      editDeductionMutation.mutate({
        id: editingDeduction.id,
        amount: editAmount,
        remarks: editRemarks,
      });
    }
  };

  const handleDeleteClick = (id: number, type: 'allowance' | 'deduction') => {
    setDeletingId(id);
    setDeletingType(type);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (deletingId && deletingType) {
      if (deletingType === 'allowance') {
        deleteAllowanceMutation.mutate(deletingId);
      } else {
        deleteDeductionMutation.mutate(deletingId);
      }
    }
  };

  const renderAdjustmentsTable = () => {
    const allowances = adjustments?.allowances || [];
    const deductions = adjustments?.deductions || [];

    if (allowances.length === 0 && deductions.length === 0) {
      return (
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          No adjustments uploaded for this period. Go to the "Upload" tab to add ad-hoc allowances or deductions.
        </Alert>
      );
    }

    const renderTableRows = (items: PeriodAllowance[] | PeriodDeduction[], type: 'allowance' | 'deduction') => {
      if (items.length === 0) return null;

      return items.map((item) => {
        const isAllowance = type === 'allowance';
        const employee = item.employee;
        const typeName = isAllowance
          ? (item as PeriodAllowance).allowanceType?.name || 'N/A'
          : (item as PeriodDeduction).deductionType?.name || 'N/A';

        return (
          <TableRow key={item.id} hover>
            <TableCell>
              <Typography variant="body2">
                {employee?.employee_number || 'N/A'} — {employee?.first_name || ''} {employee?.last_name || ''}
              </Typography>
            </TableCell>
            <TableCell>
              <Chip
                label={typeName}
                size="small"
                color={isAllowance ? 'success' : 'error'}
                variant="outlined"
              />
            </TableCell>
            <TableCell align="right">
              <Typography variant="body2" fontWeight="medium">
                {item.amount.toLocaleString()}
              </Typography>
            </TableCell>
            <TableCell>
              <Typography variant="body2" color="text.secondary">
                {item.remarks || '-'}
              </Typography>
            </TableCell>
            <TableCell align="center">
              <Stack direction="row" spacing={0.5} justifyContent="center">
                <Tooltip title="Edit">
                  <IconButton
                    size="small"
                    onClick={() => handleEditClick(item, type)}
                    color="primary"
                  >
                    <EditOutlined fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                  <IconButton
                    size="small"
                    onClick={() => handleDeleteClick(item.id, type)}
                    color="error"
                  >
                    <DeleteOutline fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
            </TableCell>
          </TableRow>
        );
      });
    };

    return (
      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: isDark ? 'action.hover' : 'grey.50' }}>
              <TableCell>Employee</TableCell>
              <TableCell>Type</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell>Remarks</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {renderTableRows(allowances, 'allowance')}
            {renderTableRows(deductions, 'deduction')}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  return (
    <Box>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant='fullWidth'
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 500,
              py: 2,
              minHeight: 48,
              '&.Mui-selected': {
                color: theme.palette.primary.main,
              },
            },
            '& .MuiTabs-indicator': {
              height: 3,
              borderRadius: '3px 3px 0 0',
            },
          }}
        >
          <Tab
            icon={<DescriptionOutlined />}
            label='View Adjustments'
            iconPosition='start'
          />
          <Tab
            icon={<UploadOutlined />}
            label='Upload Adjustments'
            iconPosition='start'
          />
        </Tabs>
      </Box>

      {(isDownloading || isImporting) && (
        <LinearProgress sx={{ mt: 2, borderRadius: 1 }} />
      )}

      <TabPanel value={tabValue} index={0}>
        <Stack spacing={3}>
          <Alert
            severity='info'
            icon={<DescriptionOutlined />}
            sx={{
              borderRadius: 2,
              '& .MuiAlert-icon': {
                alignItems: 'center',
              },
              bgcolor: isDark
                ? alpha(theme.palette.info.main, 0.1)
                : undefined,
            }}
          >
            <Typography variant='body2' fontWeight={600} gutterBottom>
              Current Adjustments — {monthName} {year}
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              These ad-hoc allowances and deductions will appear in payslips when the payroll run is submitted.
              You can edit the amount and remarks, or delete entries as needed.
            </Typography>
          </Alert>

          {isLoadingAdjustments ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress size={30} />
            </Box>
          ) : (
            renderAdjustmentsTable()
          )}
        </Stack>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Stack spacing={3}>
          <Alert
            severity='info'
            sx={{
              borderRadius: 2,
              '& .MuiAlert-icon': {
                alignItems: 'center',
              },
              bgcolor: isDark
                ? alpha(theme.palette.info.main, 0.1)
                : undefined,
            }}
          >
            <Typography variant='body2' fontWeight={600} gutterBottom>
              Upload Instructions
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              Download the template, fill in the adjustments, and upload the file.
              Each row represents one adjustment for an employee. Re-uploading will
              overwrite matching entries based on (period, employee, type).
            </Typography>
          </Alert>

          <Paper
            variant='outlined'
            sx={{
              p: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              bgcolor: isDark
                ? alpha(theme.palette.background.paper, 0.6)
                : 'background.default',
              borderRadius: 2,
              border: `2px dashed ${file ? theme.palette.success.main : isDark ? alpha(theme.palette.divider, 0.3) : theme.palette.divider}`,
              transition: 'all 0.3s ease',
              '&:hover': {
                borderColor: file
                  ? theme.palette.success.main
                  : theme.palette.primary.main,
                bgcolor: isDark
                  ? alpha(theme.palette.primary.main, 0.05)
                  : alpha(theme.palette.primary.main, 0.02),
              },
            }}
          >
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: file
                  ? isDark
                    ? alpha(theme.palette.success.main, 0.15)
                    : alpha(theme.palette.success.main, 0.08)
                  : isDark
                    ? alpha(theme.palette.text.secondary, 0.05)
                    : alpha(theme.palette.text.secondary, 0.04),
                transition: 'all 0.3s ease',
              }}
            >
              <InsertDriveFileOutlined
                sx={{
                  fontSize: 32,
                  color: file ? theme.palette.success.main : 'text.secondary',
                  opacity: file ? 1 : 0.5,
                }}
              />
            </Box>

            {file ? (
              <>
                <Typography variant='h6' fontWeight={600} color='success.main'>
                  {file.name}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  {(file.size / 1024).toFixed(1)} KB • Ready to upload
                </Typography>
                <Button
                  variant='outlined'
                  color='error'
                  size='small'
                  onClick={() => setFile(null)}
                  sx={{ borderRadius: 2, textTransform: 'none' }}
                >
                  Remove File
                </Button>
              </>
            ) : (
              <>
                <Typography variant='body2' color='text.secondary'>
                  No file selected
                </Typography>
                <Button
                  variant='outlined'
                  component='label'
                  startIcon={<UploadOutlined />}
                  sx={{
                    minWidth: 200,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 500,
                  }}
                >
                  Select Excel File
                  <input
                    hidden
                    type='file'
                    accept='.xlsx,.xls'
                    onChange={handleFileChange}
                  />
                </Button>
              </>
            )}
          </Paper>

          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button
              variant='contained'
              startIcon={<DownloadOutlined />}
              onClick={() => downloadTemplate()}
              disabled={isDownloading}
              size='large'
              sx={{
                minWidth: 200,
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
              }}
            >
              {isDownloading ? 'Downloading...' : 'Download Template'}
            </Button>
            {file && (
              <Button
                variant='contained'
                startIcon={<UploadOutlined />}
                onClick={() => importAdjustments(file)}
                disabled={isImporting}
                size='large'
                sx={{
                  minWidth: 200,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                }}
              >
                {isImporting ? 'Uploading...' : 'Upload & Import'}
              </Button>
            )}
          </Stack>

          {importResult && (
            <Paper
              variant='outlined'
              sx={{
                p: 3,
                borderRadius: 2,
                mt: 2,
              }}
            >
              <Stack spacing={3}>
                <Alert
                  severity={
                    (importResult.errors || []).length > 0
                      ? 'warning'
                      : 'success'
                  }
                  icon={
                    importResult.errors?.length > 0 ? (
                      <ErrorOutline />
                    ) : (
                      <CheckCircleOutline />
                    )
                  }
                  sx={{
                    borderRadius: 2,
                    '& .MuiAlert-icon': {
                      alignItems: 'center',
                    },
                    bgcolor: isDark
                      ? 'background.paper'
                      : 'background.default',
                  }}
                >
                  <Typography variant='body2' color={isDark ? theme.palette.text.primary : 'primary'} gutterBottom>
                    Import Summary
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 4, mt: 1, flexWrap: 'wrap' }}>
                    <Box>
                      <Typography variant='caption' color='text.secondary' display='block'>
                        Imported
                      </Typography>
                      <Typography variant='h6' color='success.main' fontWeight={700}>
                        {importResult.imported ?? 0}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant='caption' color='text.secondary' display='block'>
                        Skipped
                      </Typography>
                      <Typography variant='h6' color='warning.main' fontWeight={700}>
                        {importResult.skipped ?? 0}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant='caption' color='text.secondary' display='block'>
                        Errors
                      </Typography>
                      <Typography variant='h6' color='error.main' fontWeight={700}>
                        {importResult.errors?.length ?? 0}
                      </Typography>
                    </Box>
                  </Box>
                  {importResult.message && (
                    <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
                      {importResult.message}
                    </Typography>
                  )}
                </Alert>

                {importResult.errors && importResult.errors.length > 0 && (
                  <Box>
                    <Typography
                      variant='subtitle2'
                      gutterBottom
                      fontWeight={600}
                      color='text.secondary'
                      sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                    >
                      <ErrorOutline fontSize='small' color='warning' />
                      Skipped Rows ({importResult.errors.length} row{importResult.errors.length > 1 ? 's' : ''})
                    </Typography>

                    <Box
                      sx={{
                        bgcolor: isDark
                          ? alpha(theme.palette.warning.main, 0.06)
                          : alpha(theme.palette.warning.main, 0.03),
                        borderRadius: 1,
                        border: 1,
                        borderColor: isDark
                          ? alpha(theme.palette.warning.main, 0.15)
                          : alpha(theme.palette.warning.main, 0.1),
                        overflow: 'hidden',
                        maxHeight: 320,
                        overflowY: 'auto',
                        '&::-webkit-scrollbar': {
                          width: 6,
                        },
                        '&::-webkit-scrollbar-track': {
                          background: isDark
                            ? alpha(theme.palette.common.white, 0.05)
                            : alpha(theme.palette.common.black, 0.05),
                        },
                        '&::-webkit-scrollbar-thumb': {
                          background: isDark
                            ? alpha(theme.palette.common.white, 0.15)
                            : alpha(theme.palette.common.black, 0.15),
                          borderRadius: 3,
                        },
                      }}
                    >
                      <Box
                        sx={{
                          display: 'grid',
                          gridTemplateColumns: '80px 1fr',
                          bgcolor: isDark
                            ? alpha(theme.palette.warning.main, 0.12)
                            : alpha(theme.palette.warning.main, 0.06),
                          borderBottom: 1,
                          borderColor: isDark
                            ? alpha(theme.palette.divider, 0.3)
                            : theme.palette.divider,
                          p: 1.5,
                          gap: 1,
                          position: 'sticky',
                          top: 0,
                          zIndex: 1,
                          backdropFilter: isDark ? 'blur(4px)' : 'none',
                        }}
                      >
                        <Typography
                          variant='caption'
                          fontWeight={700}
                          color={isDark ? 'text.primary' : 'text.secondary'}
                          sx={{ letterSpacing: 0.5 }}
                        >
                          Row No.
                        </Typography>
                        <Typography
                          variant='caption'
                          fontWeight={700}
                          color={isDark ? 'text.primary' : 'text.secondary'}
                          sx={{ letterSpacing: 0.5 }}
                        >
                          Error Description
                        </Typography>
                      </Box>

                      {importResult.errors.map((item: any, index: number) => (
                        <Box
                          key={`${item.row}-${index}`}
                          sx={{
                            display: 'grid',
                            gridTemplateColumns: '80px 1fr',
                            gap: 1,
                            p: 1.5,
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                            <Typography variant='body2' color='warning.main'>
                              {item.row}.
                            </Typography>
                          </Box>
                          <Box>
                            <Typography
                              variant='body2'
                              color={isDark ? 'text.primary' : 'text.primary'}
                            >
                              {item.error || item.message}
                            </Typography>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}

                {(!importResult.errors || importResult.errors.length === 0) &&
                  importResult.imported > 0 && (
                    <Alert
                      severity='success'
                      sx={{
                        borderRadius: 2,
                        bgcolor: isDark
                          ? alpha(theme.palette.success.main, 0.1)
                          : undefined,
                      }}
                    >
                      <Typography variant='body2'>
                        ✅ All {importResult.imported} adjustment
                        {importResult.imported > 1 ? 's' : ''} were imported
                        successfully!
                      </Typography>
                    </Alert>
                  )}
              </Stack>
            </Paper>
          )}
        </Stack>
      </TabPanel>

      {/* Edit Dialog */}
      <Dialog
        open={!!editingAllowance || !!editingDeduction}
        onClose={() => {
          setEditingAllowance(null);
          setEditingDeduction(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <MuiDialogTitle>
          Edit {editingAllowance ? 'Allowance' : 'Deduction'}
        </MuiDialogTitle>
        <MuiDialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              label="Amount"
              type="number"
              fullWidth
              value={editAmount}
              onChange={(e) => setEditAmount(Number(e.target.value))}
              sx={{ mb: 2 }}
              required
              inputProps={{ min: 0, step: 0.01 }}
            />
            <TextField
              label="Remarks"
              fullWidth
              multiline
              rows={3}
              value={editRemarks}
              onChange={(e) => setEditRemarks(e.target.value)}
              placeholder="Optional remarks for this adjustment"
            />
          </Box>
        </MuiDialogContent>
        <MuiDialogActions>
          <Button
            onClick={() => {
              setEditingAllowance(null);
              setEditingDeduction(null);
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleEditSave}
            variant="contained"
            disabled={editAmount <= 0 || editAllowanceMutation.isPending || editDeductionMutation.isPending}
          >
            Save
          </Button>
        </MuiDialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <MuiDialogTitle>Confirm Delete</MuiDialogTitle>
        <MuiDialogContent>
          <Typography>
            Are you sure you want to delete this {deletingType} adjustment?
            This action cannot be undone.
          </Typography>
        </MuiDialogContent>
        <MuiDialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={deleteAllowanceMutation.isPending || deleteDeductionMutation.isPending}
          >
            Delete
          </Button>
        </MuiDialogActions>
      </Dialog>
    </Box>
  );
};

export default PayrollPeriodAdjustmentsTab;