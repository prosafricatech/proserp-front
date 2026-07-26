// StakeholdersBulkImportsContent.tsx
'use client';

import {
  CheckCircleOutline,
  DescriptionOutlined,
  DownloadOutlined,
  ErrorOutline,
  InsertDriveFileOutlined,
  UploadOutlined,
  Refresh,
} from '@mui/icons-material';
import {
  Alert,
  alpha,
  Box,
  Button,
  LinearProgress,
  Paper,
  Stack,
  Tab,
  Tabs,
  Typography,
  useTheme,
  Grid,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import React, { ChangeEvent, useState } from 'react';
import supportServices from '../support-services';

interface ImportResult {
  message: string;
  imported: number;
  skipped: number;
  errors: Array<{
    row: number;
    error: string;
  }>;
}

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

const StakeholdersBulkImportsContent = () => {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const isDark = theme.type === 'dark';

  const [tabValue, setTabValue] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  // Download template mutation
  const { mutate: downloadTemplate, isPending: isDownloading } = useMutation({
    mutationFn: () =>
      supportServices.downloadStakeholdersRegistrationTemplate?.() ||
      Promise.reject(new Error('Download function not implemented')),
    onSuccess: (blob: Blob) => {
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'stakeholders-registration-template.xlsx';
      anchor.click();
      window.URL.revokeObjectURL(url);
      enqueueSnackbar('Template downloaded successfully', {
        variant: 'success',
      });
    },
    onError: (error: any) =>
      enqueueSnackbar(getErrorMessage(error), { variant: 'error' }),
  });

  // Upload stakeholders mutation
  const { mutate: importStakeholders, isPending: isImporting } = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append('stakeholders_excel', file);
      return supportServices.importStakeholdersRegistrationExcel(formData);
    },
    onSuccess: (response: any) => {
      setImportResult(response);
      setFile(null);
      
      queryClient.invalidateQueries({ queryKey: ['stakeholders'] });
      queryClient.invalidateQueries({ queryKey: ['ledgers'] });

      if (response.errors && response.errors.length > 0) {
        enqueueSnackbar(
          `${response.message}. ${response.errors.length} error(s) found. Check the details below.`,
          { variant: 'warning' }
        );
      } else if (response.imported > 0 && response.skipped === 0) {
        enqueueSnackbar(response.message || 'Stakeholders imported successfully', {
          variant: 'success',
        });
      } else if (response.imported > 0 && response.skipped > 0) {
        enqueueSnackbar(
          `${response.message}. ${response.imported} imported, ${response.skipped} skipped.`,
          { variant: 'warning' }
        );
      } else {
        enqueueSnackbar(
          response.message ||
            'No stakeholders were imported. Please check the errors below.',
          { variant: 'error' }
        );
      }
    },
    onError: (error: any) => {
      enqueueSnackbar(getErrorMessage(error), { variant: 'error' });
    },
  });

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

  const handleReset = () => {
    setFile(null);
    setImportResult(null);
    setTabValue(0);
  };

  const hasErrors = (importResult?.errors || []).length > 0;

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Bulk Import Stakeholders
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Import customers and suppliers in bulk using Excel. Create receivable and payable ledgers automatically.
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 500,
              py: 1.5,
              minHeight: 40,
            },
          }}
        >
          <Tab
            icon={<DownloadOutlined />}
            label="Download Template"
            iconPosition="start"
          />
          <Tab
            icon={<UploadOutlined />}
            label="Upload Excel"
            iconPosition="start"
          />
        </Tabs>
      </Box>

      {(isDownloading || isImporting) && (
        <LinearProgress sx={{ mt: 2, borderRadius: 1 }} />
      )}

      {/* Tab 0: Download Template */}
      <TabPanel value={tabValue} index={0}>
        <Stack spacing={3} sx={{ mt: 2 }}>
          <Alert
            severity="info"
            icon={<DescriptionOutlined />}
            sx={{
              borderRadius: 2,
              '& .MuiAlert-icon': {
                alignItems: 'center',
                color: isDark ? theme.palette.info.light : undefined,
              },
              bgcolor: isDark ? alpha(theme.palette.info.main, 0.12) : undefined,
              color: isDark ? theme.palette.common.white : undefined,
              border: isDark ? `1px solid ${alpha(theme.palette.info.main, 0.3)}` : undefined,
            }}
          >
            <Typography variant="body2" fontWeight={600} gutterBottom color={isDark ? 'inherit' : undefined}>
              Getting Started
            </Typography>
            <Typography variant="body2" color={isDark ? alpha(theme.palette.common.white, 0.8) : 'text.secondary'}>
              Download the Excel template below. Fill in stakeholder details
              following the format provided. The template includes dropdown
              validation for Type and Yes/No fields.
            </Typography>
          </Alert>

          <Paper
            variant="outlined"
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
            <Typography variant="h6" fontWeight={600}>
              Stakeholders Registration Template
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center">
              Excel file with dropdown validation for Type, Create Receivable/Payable Ledger
            </Typography>
            <Button
              variant="contained"
              startIcon={<DownloadOutlined />}
              onClick={() => downloadTemplate()}
              disabled={isDownloading}
              size="large"
              sx={{
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

      {/* Tab 1: Upload Excel */}
      <TabPanel value={tabValue} index={1}>
        <Stack spacing={3} sx={{ mt: 2 }}>
          <Alert
            severity="info"
            sx={{
              borderRadius: 2,
              '& .MuiAlert-icon': {
                alignItems: 'center',
                color: isDark ? theme.palette.info.light : undefined,
              },
              bgcolor: isDark ? alpha(theme.palette.info.main, 0.12) : undefined,
              color: isDark ? theme.palette.common.white : undefined,
              border: isDark ? `1px solid ${alpha(theme.palette.info.main, 0.3)}` : undefined,
            }}
          >
            <Typography variant="body2" fontWeight={600} gutterBottom color={isDark ? 'inherit' : undefined}>
              Upload Instructions
            </Typography>
            <Typography variant="body2" color={isDark ? alpha(theme.palette.common.white, 0.8) : 'text.secondary'}>
              Upload the filled Excel file. Stakeholders with existing names will
              be skipped. You can create both Receivable and Payable ledgers for
              each stakeholder.
            </Typography>
          </Alert>

          <Paper
            variant="outlined"
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
                <Typography variant="h6" fontWeight={600} color="success.main">
                  {file.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {(file.size / 1024).toFixed(1)} KB • Ready to upload
                </Typography>
                <Stack direction="row" spacing={2}>
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    onClick={() => setFile(null)}
                    sx={{ borderRadius: 2, textTransform: 'none' }}
                  >
                    Remove File
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<UploadOutlined />}
                    onClick={() => importStakeholders(file)}
                    disabled={isImporting}
                    size="large"
                    sx={{
                      minWidth: 200,
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 600,
                    }}
                  >
                    {isImporting ? 'Uploading...' : 'Upload & Import'}
                  </Button>
                </Stack>
              </>
            ) : (
              <>
                <Typography variant="body2" color="text.secondary">
                  No file selected
                </Typography>
                <Button
                  variant="outlined"
                  component="label"
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
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileChange}
                  />
                </Button>
              </>
            )}
          </Paper>

          {/* Import Results */}
          {importResult && (
            <Box
              sx={{
                width: '100%',
              }}
            >
              <Stack spacing={3}>
                <Alert
                  severity={hasErrors ? 'warning' : 'success'}
                  icon={hasErrors ? <ErrorOutline /> : <CheckCircleOutline />}
                  sx={{
                    borderRadius: 2,
                    width: '100%',
                    '& .MuiAlert-icon': {
                      alignItems: 'center',
                      color: isDark
                        ? (hasErrors ? theme.palette.warning.light : theme.palette.success.light)
                        : undefined,
                    },
                    bgcolor: isDark
                      ? alpha(hasErrors ? theme.palette.warning.main : theme.palette.success.main, 0.12)
                      : undefined,
                    color: isDark ? theme.palette.common.white : undefined,
                    border: isDark
                      ? `1px solid ${alpha(hasErrors ? theme.palette.warning.main : theme.palette.success.main, 0.3)}`
                      : undefined,
                  }}
                >
                  <Typography variant="body2" fontWeight={600} gutterBottom>
                    Import Summary
                  </Typography>
                  
                  <Box sx={{ width: '100%', mt: 1 }}>
                    <Grid container spacing={2} sx={{ width: '100%' }}>
                      <Grid size={{ xs: 6, md: 3 }}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Imported
                        </Typography>
                        <Typography variant="h6" color="success.main" fontWeight={700}>
                          {importResult.imported ?? 0}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 6, md: 3 }}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Skipped
                        </Typography>
                        <Typography variant="h6" color="warning.main" fontWeight={700}>
                          {importResult.skipped ?? 0}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 6, md: 3 }}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Errors
                        </Typography>
                        <Typography variant="h6" color="error.main" fontWeight={700}>
                          {importResult.errors?.length ?? 0}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 6, md: 3 }}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Total Processed
                        </Typography>
                        <Typography variant="h6" fontWeight={700}>
                          {(importResult.imported ?? 0) + (importResult.skipped ?? 0)}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                  
                  {importResult.message && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {importResult.message}
                    </Typography>
                  )}
                </Alert>

                {/* Error Rows */}
                {importResult.errors && importResult.errors.length > 0 && (
                  <Box sx={{ width: '100%' }}>
                    <Typography
                      variant="subtitle2"
                      gutterBottom
                      fontWeight={600}
                      color="text.secondary"
                      sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                    >
                      <ErrorOutline fontSize="small" color="warning" />
                      Skipped Rows ({importResult.errors.length} row
                      {importResult.errors.length > 1 ? 's' : ''})
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
                        width: '100%',
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
                        }}
                      >
                        <Typography variant="caption" fontWeight={700}>
                          Row No.
                        </Typography>
                        <Typography variant="caption" fontWeight={700}>
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
                          <Typography variant="body2" color="warning.main">
                            {item.row}.
                          </Typography>
                          <Typography variant="body2">
                            {item.error || item.message}
                          </Typography>
                        </Box>
                      ))}
                    </Box>

                    <Box
                      sx={{
                        mt: 1.5,
                        p: 1.5,
                        bgcolor: isDark
                          ? alpha(theme.palette.info.main, 0.06)
                          : alpha(theme.palette.info.main, 0.04),
                        borderRadius: 1,
                        border: 1,
                        borderColor: isDark
                          ? alpha(theme.palette.info.main, 0.15)
                          : alpha(theme.palette.info.main, 0.1),
                        width: '100%',
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        💡 <strong>Tip:</strong> Correct the errors above and
                        re-upload the Excel file to import these stakeholders.
                      </Typography>
                    </Box>
                  </Box>
                )}

                {/* Success Message */}
                {(!importResult.errors || importResult.errors.length === 0) &&
                  importResult.imported > 0 && (
                    <Alert severity="success" sx={{ width: '100%' }}>
                      <Typography variant="body2">
                        ✅ All {importResult.imported} stakeholder
                        {importResult.imported > 1 ? 's' : ''} were imported
                        successfully!
                      </Typography>
                    </Alert>
                  )}

                <Button
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={handleReset}
                  size="small"
                  sx={{ alignSelf: 'flex-start' }}
                >
                  Import Another File
                </Button>
              </Stack>
            </Box>
          )}
        </Stack>
      </TabPanel>
    </Box>
  );
};

export default StakeholdersBulkImportsContent;