'use client';

import {
  CheckCircleOutline,
  Delete,
  DescriptionOutlined,
  DownloadOutlined,
  ErrorOutline,
  InsertDriveFileOutlined,
  UploadOutlined,
} from '@mui/icons-material';
import {
  Alert,
  alpha,
  Box,
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Stack,
  Switch,
  Tab,
  Tabs,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import React, { ChangeEvent, useState } from 'react';
import humanResourcesServices from '../humanResourcesServices';
import ContributionsTab from './ContributionsTab';
import DeductionsTab from './DeductionsTab';
import LeaveAllocationsTab from './LeaveAllocationsTab';

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

const EmployeeOnboardingDialog = ({
  setOpenDialog,
}: {
  setOpenDialog: (open: boolean) => void;
}) => {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [settingTab, setSettingTab] = useState(0);

  const [deductionSettings, setDeductionSettings] = useState<Array<any>>([]);
  const [contributionSettings, setContributionSettings] = useState<Array<any>>(
    []
  );
  const [allocationsSettings, setAllocationsSettings] = useState<Array<any>>(
    []
  );
  const [autoCreateLedger, setAutoCreateLedger] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<any | null>(null);
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  const { mutate: downloadTemplate, isPending: isDownloading } = useMutation({
    mutationFn: humanResourcesServices.downloadEmployeesRegistrationTemplate,
    onSuccess: (blob: Blob) => {
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'employees-registration-template.xlsx';
      anchor.click();
      window.URL.revokeObjectURL(url);
      enqueueSnackbar('Template downloaded successfully', {
        variant: 'success',
      });
    },
    onError: (error: any) =>
      enqueueSnackbar(getErrorMessage(error), { variant: 'error' }),
  });

  const { mutate: importExcelMutation, isPending: isImporting } = useMutation({
    mutationFn: humanResourcesServices.importEmployeesRegistrationExcel,
    onSuccess: (response: any) => {
      setImportResult(response);
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      enqueueSnackbar(response?.message || 'Employees import completed', {
        variant: 'success',
      });
      setOpenDialog(false);
    },
    onError: (error: any) =>
      enqueueSnackbar(getErrorMessage(error), { variant: 'error' }),
  });

  const importExcel = (data: any) => {
    const payload = {
      employees_excel: data,
      create_payable_ledgers: autoCreateLedger,
      deductions: deductionSettings,
      contributions: contributionSettings,
      leave_allocations: allocationsSettings,
    };

    importExcelMutation(payload);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFile(event.target.files?.[0] || null);
    setImportResult(null);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    if (newValue === 1) {
      setImportResult(null);
    }
  };
  const handleSettingTabChange = (
    event: React.SyntheticEvent,
    newValue: number
  ) => {
    setSettingTab(newValue);
  };

  const handleClose = () => {
    if (!isImporting && !isDownloading) {
      setOpenDialog(false);
    }
  };

  const isDark = theme.type === 'dark';

  return (
    <>
      <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
        <Typography variant='h5' fontWeight={600}>
          Employee Onboarding
        </Typography>
      </DialogTitle>

      <DialogContent>
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
              icon={<DownloadOutlined />}
              label='Download Template'
              iconPosition='start'
            />
            <Tab
              icon={<UploadOutlined />}
              label='Upload Excel'
              iconPosition='start'
            />
          </Tabs>
        </Box>

        {(isDownloading || isImporting) && (
          <LinearProgress sx={{ mt: 2, borderRadius: 1 }} />
        )}

        {/* Tab 1: Download Template */}
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
                Getting Started
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Download the Excel template below. Fill in employee details
                following the format provided. The template includes dropdown
                validation for fields like Gender, Department, and Employment
                Type.
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
                border: `2px dashed ${isDark ? alpha(theme.palette.divider, 0.3) : theme.palette.divider}`,
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: theme.palette.primary.main,
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
                  bgcolor: isDark
                    ? alpha(theme.palette.primary.main, 0.15)
                    : alpha(theme.palette.primary.main, 0.08),
                }}
              >
                <DescriptionOutlined
                  sx={{
                    fontSize: 32,
                    color: theme.palette.primary.main,
                  }}
                />
              </Box>
              <Typography variant='h6' fontWeight={600}>
                Employee Registration Template
              </Typography>
              <Typography variant='body2' color='text.secondary' align='center'>
                Excel file with pre-defined columns and dropdown validation
              </Typography>
              <Button
                variant='contained'
                startIcon={<DownloadOutlined />}
                onClick={() => downloadTemplate()}
                disabled={isDownloading}
                size='large'
                sx={{
                  mt: 1,
                  minWidth: 200,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                }}
              >
                {isDownloading ? 'Downloading...' : 'Download Template'}
              </Button>
            </Paper>
          </Stack>
        </TabPanel>

        {/* Tab 2: Upload Excel */}
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
                Upload the filled Excel file. Employees with existing IDs or
                duplicate entries will be skipped. If a row has Basic Salary, an
                active contract will be created automatically.
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
                  <Typography
                    variant='h6'
                    fontWeight={600}
                    color='success.main'
                  >
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

            {/* ledger auto-create switch */}
            <FormControlLabel
              control={
                <Switch
                  checked={autoCreateLedger}
                  onChange={() => {
                    setAutoCreateLedger((prev) => !prev);
                  }}
                />
              }
              label='Auto create payable ledger'
            />

            {/* optional data */}
            <Tabs
              value={settingTab}
              onChange={handleSettingTabChange}
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
              <Tab label='Deductions' />
              <Tab label='Contributions' />
              <Tab label='Leave Allocations' />
            </Tabs>

            {settingTab === 0 && (
              <DeductionsTab setDeductionSettings={setDeductionSettings} />
            )}

            {settingTab === 1 && (
              <ContributionsTab
                setContributionSettings={setContributionSettings}
              />
            )}

            {settingTab === 2 && (
              <LeaveAllocationsTab
                setAllocationsSettings={setAllocationsSettings}
              />
            )}

            {settingTab === 0 &&
              deductionSettings.length > 0 &&
              deductionSettings.map((itm: any, idx: number) => (
                <React.Fragment key={idx}>
                  <Divider sx={{ py: 0, my: 0 }} />
                  <Grid container>
                    <Grid size={5}>
                      <Tooltip title='Deduction'>
                        <Typography>{itm.deduction_name}</Typography>
                      </Tooltip>
                    </Grid>
                    <Grid size={5}>
                      <Tooltip title='Scope'>
                        <Typography>{itm.scope}</Typography>
                      </Tooltip>
                    </Grid>
                    <Grid size={2}>
                      <Tooltip title='Delete'>
                        <IconButton
                          color='error'
                          size='small'
                          onClick={() => {
                            setDeductionSettings((prev) => {
                              return prev.filter((item, i) => i !== idx);
                            });
                          }}
                        >
                          <Delete />
                        </IconButton>
                      </Tooltip>
                    </Grid>
                  </Grid>
                </React.Fragment>
              ))}

            {settingTab === 1 &&
              contributionSettings.length > 0 &&
              contributionSettings.map((itm: any, idx: number) => (
                <React.Fragment key={idx}>
                  <Divider sx={{ py: 0, my: 0 }} />
                  <Grid container>
                    <Grid size={5}>
                      <Tooltip title='Deduction'>
                        <Typography>{itm.contribution_name}</Typography>
                      </Tooltip>
                    </Grid>
                    <Grid size={5}>
                      <Tooltip title='Scope'>
                        <Typography>{itm.scope}</Typography>
                      </Tooltip>
                    </Grid>
                    <Grid size={2}>
                      <Tooltip title='Delete'>
                        <IconButton
                          color='error'
                          size='small'
                          onClick={() => {
                            setContributionSettings((prev) => {
                              return prev.filter((item, i) => i !== idx);
                            });
                          }}
                        >
                          <Delete />
                        </IconButton>
                      </Tooltip>
                    </Grid>
                  </Grid>
                </React.Fragment>
              ))}

            {settingTab === 2 &&
              allocationsSettings.length > 0 &&
              allocationsSettings.map((itm: any, idx: number) => (
                <React.Fragment key={idx}>
                  <Divider sx={{ py: 0, my: 0 }} />
                  <Grid container>
                    <Grid size={5}>
                      <Tooltip title='Leave Name'>
                        <Typography>{itm.leave_name}</Typography>
                      </Tooltip>
                    </Grid>
                    <Grid size={5}>
                      <Tooltip title='Allocation AMount'>
                        <Typography>
                          {parseFloat(itm.allocation_amount).toLocaleString(
                            'en-US',
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          )}
                        </Typography>
                      </Tooltip>
                    </Grid>
                    <Grid size={2}>
                      <Tooltip title='Delete'>
                        <IconButton
                          color='error'
                          size='small'
                          onClick={() => {
                            setAllocationsSettings((prev) => {
                              return prev.filter((item, i) => i !== idx);
                            });
                          }}
                        >
                          <Delete />
                        </IconButton>
                      </Tooltip>
                    </Grid>
                  </Grid>
                </React.Fragment>
              ))}

            {file && (
              <Button
                variant='contained'
                startIcon={<UploadOutlined />}
                onClick={() => importExcel(file)}
                disabled={isImporting}
                size='large'
                sx={{
                  minWidth: 200,
                  alignSelf: 'center',
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                }}
              >
                {isImporting ? 'Uploading...' : 'Upload & Import'}
              </Button>
            )}

            {/* Import Results */}
            {importResult && (
              <Paper
                variant='outlined'
                sx={{
                  p: 3,
                  borderRadius: 2,
                  bgcolor: isDark
                    ? alpha(theme.palette.background.paper, 0.6)
                    : undefined,
                }}
              >
                <Stack spacing={2}>
                  <Alert
                    severity={
                      (importResult.errors || []).length ? 'warning' : 'success'
                    }
                    icon={
                      importResult.errors?.length ? (
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
                    }}
                  >
                    <Typography variant='body2' fontWeight={600} gutterBottom>
                      Import Summary
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 4, mt: 1 }}>
                      <Box>
                        <Typography
                          variant='caption'
                          color='text.secondary'
                          display='block'
                        >
                          Imported
                        </Typography>
                        <Typography
                          variant='h6'
                          color='success.main'
                          fontWeight={700}
                        >
                          {importResult.imported ?? 0}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography
                          variant='caption'
                          color='text.secondary'
                          display='block'
                        >
                          Skipped
                        </Typography>
                        <Typography
                          variant='h6'
                          color='warning.main'
                          fontWeight={700}
                        >
                          {importResult.skipped ?? 0}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography
                          variant='caption'
                          color='text.secondary'
                          display='block'
                        >
                          Errors
                        </Typography>
                        <Typography
                          variant='h6'
                          color='error.main'
                          fontWeight={700}
                        >
                          {importResult.errors?.length ?? 0}
                        </Typography>
                      </Box>
                    </Box>
                    {importResult.message && (
                      <Typography
                        variant='body2'
                        color='text.secondary'
                        sx={{ mt: 1 }}
                      >
                        {importResult.message}
                      </Typography>
                    )}
                  </Alert>

                  {!!importResult.errors?.length && (
                    <Box>
                      <Typography
                        variant='subtitle2'
                        gutterBottom
                        fontWeight={600}
                        color='text.secondary'
                      >
                        Error Details:
                      </Typography>
                      <List
                        dense
                        disablePadding
                        sx={{
                          bgcolor: isDark
                            ? alpha(theme.palette.error.main, 0.05)
                            : alpha(theme.palette.error.main, 0.03),
                          borderRadius: 1,
                          p: 1,
                        }}
                      >
                        {importResult.errors.map((item: any, index: number) => (
                          <ListItem
                            key={`${item.row}-${index}`}
                            sx={{
                              px: 1,
                              py: 0.5,
                              borderRadius: 0.5,
                              '&:hover': {
                                bgcolor: isDark
                                  ? alpha(theme.palette.error.main, 0.08)
                                  : alpha(theme.palette.error.main, 0.04),
                              },
                            }}
                          >
                            <ListItemIcon sx={{ minWidth: 28 }}>
                              <ErrorOutline fontSize='small' color='error' />
                            </ListItemIcon>
                            <ListItemText
                              primary={
                                <Typography variant='body2'>
                                  <strong>Row {item.row}:</strong>{' '}
                                  {item.error || item.message}
                                </Typography>
                              }
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}
                </Stack>
              </Paper>
            )}
          </Stack>
        </TabPanel>
      </DialogContent>

      <DialogActions
        sx={{ px: 3, py: 2, borderTop: 1, borderColor: 'divider' }}
      >
        <Button
          onClick={handleClose}
          disabled={isImporting || isDownloading}
          variant='outlined'
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 500,
            minWidth: 100,
          }}
        >
          Close
        </Button>
      </DialogActions>
    </>
  );
};

export default EmployeeOnboardingDialog;
