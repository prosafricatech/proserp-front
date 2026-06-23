'use client';

import {
  Alert,
  Box,
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { ChangeEvent, useState } from 'react';
import humanResourcesServices from '../humanResourcesServices';

const getErrorMessage = (error: any) => {
  const validationErrors = error?.response?.data?.validation_errors;
  if (validationErrors && typeof validationErrors === 'object') {
    const first = Object.values(validationErrors)[0] as any;
    return Array.isArray(first) ? first[0] : String(first);
  }

  return error?.response?.data?.message || error?.message || 'Something went wrong';
};

const EmployeeOnboardingDialog = ({
  setOpenDialog,
}: {
  setOpenDialog: (open: boolean) => void;
}) => {
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
    },
    onError: (error: any) => enqueueSnackbar(getErrorMessage(error), { variant: 'error' }),
  });

  const { mutate: importExcel, isPending: isImporting } = useMutation({
    mutationFn: humanResourcesServices.importEmployeesRegistrationExcel,
    onSuccess: (response: any) => {
      setImportResult(response);
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      enqueueSnackbar(response?.message || 'Employees import completed', { variant: 'success' });
    },
    onError: (error: any) => enqueueSnackbar(getErrorMessage(error), { variant: 'error' }),
  });

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFile(event.target.files?.[0] || null);
    setImportResult(null);
  };

  return (
    <>
      <DialogTitle>Employee Onboarding</DialogTitle>
      <DialogContent>
        <Stack spacing={2} mt={1}>
          {(isDownloading || isImporting) && <LinearProgress />}
          <Alert severity='info'>
            Download the Excel template, fill employee details, then upload it here. Rows with existing employees are skipped.
          </Alert>
          <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
            <Button variant='outlined' onClick={() => downloadTemplate()} disabled={isDownloading}>
              Download Template
            </Button>
            <Button variant='outlined' component='label'>
              Select Excel File
              <input
                hidden
                type='file'
                accept='.xlsx,.xls'
                onChange={handleFileChange}
              />
            </Button>
          </Stack>
          {file && (
            <Typography variant='body2' color='text.secondary'>
              Selected: {file.name}
            </Typography>
          )}
          {importResult && (
            <Box>
              <Alert severity={(importResult.errors || []).length ? 'warning' : 'success'}>
                <Typography variant='body2'>
                  Imported: {importResult.imported ?? 0}, skipped: {importResult.skipped ?? 0}
                </Typography>
                {importResult.message && (
                  <Typography variant='body2'>{importResult.message}</Typography>
                )}
              </Alert>
              {!!importResult.errors?.length && (
                <Stack spacing={0.5} mt={1}>
                  {importResult.errors.map((item: any, index: number) => (
                    <Typography key={`${item.row}-${index}`} variant='body2'>
                      Row {item.row}: {item.error || item.message}
                    </Typography>
                  ))}
                </Stack>
              )}
            </Box>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setOpenDialog(false)} disabled={isImporting}>Close</Button>
        <Button
          variant='contained'
          disabled={!file || isImporting}
          onClick={() => file && importExcel(file)}
        >
          Upload
        </Button>
      </DialogActions>
    </>
  );
};

export default EmployeeOnboardingDialog;
