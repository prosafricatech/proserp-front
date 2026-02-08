'use client';
import { 
  Box, 
  Typography, 
  TextField, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper,
  Chip,
  Card,
  CardContent
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { DateTimePicker } from '@mui/x-date-pickers';
import smsServices from './smsServices';
import { useSnackbar } from 'notistack';

interface LogsFormData {
  from?: string;
  to?: string;
  sentSince?: string;
  sentUntil?: string;
}

interface SmsLog {
  messageId: string;
  sentAt: string;
  doneAt: string;
  to: string;
  from: string;
  text: string;
  smsCount: number;
  status: {
    groupId: number;
    groupName: string;
    id: number;
    name: string;
    description: string;
  } | null;
  error: {
    groupId: number;
    groupName: string;
    id: number;
    name: string;
    description: string;
    permanent: boolean;
  } | null;
}

interface LogsResponse {
  results: SmsLog[];
}

export default function LogsForm() {
  const { enqueueSnackbar } = useSnackbar();
  const [logs, setLogs] = useState<SmsLog[]>([]);

  const { register, handleSubmit, setValue, watch } = useForm<LogsFormData>();

  const mutation = useMutation({
    mutationFn: smsServices.getLogs,
    onSuccess: (data: LogsResponse) => {
      enqueueSnackbar('SMS logs fetched successfully!', { variant: 'success' });
      setLogs(data.results || []);
    },
    onError: (err: any) => {
      enqueueSnackbar(err?.response?.data?.message || 'Failed to fetch SMS logs', { variant: 'error' });
      setLogs([]);
    }
  });

  const onSubmit = (data: LogsFormData) => {
    mutation.mutate(data);
  };

  const getStatusColor = (statusName: string | null) => {
    if (!statusName) return 'default';
    
    switch (statusName) {
      case 'DELIVERED_TO_HANDSET':
        return 'success';
      case 'PENDING_ENROUTE':
        return 'warning';
      case 'REJECTED':
      case 'EXPIRED':
        return 'error';
      default:
        return 'default';
    }
  };

  const getErrorColor = (errorName: string | null) => {
    if (!errorName) return 'default';
    
    switch (errorName) {
      case 'NO_ERROR':
        return 'success';
      default:
        return 'error';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h6">Get Sent SMS Logs</Typography>

      <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        
        <TextField 
          label="To (Recipient Number)" 
          {...register("to")} 
          fullWidth 
          size="small"
        />
        
        <DateTimePicker
          label="Sent Since"
          defaultValue={null}
          slotProps={{
            textField: {
              size: 'small',
              fullWidth: true,
            },
          }}
          onChange={(newValue) => {
            setValue('sentSince', newValue ? newValue.format('YYYY-MM-DD') : undefined);
          }}
        />
        
        <DateTimePicker
          label="Sent Until"
          defaultValue={null}
          slotProps={{
            textField: {
              size: 'small',
              fullWidth: true,
            },
          }}
          onChange={(newValue) => {
            setValue('sentUntil', newValue ? newValue.format('YYYY-MM-DD') : undefined);
          }}
        />

        <LoadingButton 
          type="submit" 
          variant="contained" 
          loading={mutation.isPending}
          sx={{ alignSelf: 'flex-start' }}
        >
          Get Logs
        </LoadingButton>
      </Box>

      {logs.length > 0 && (
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              SMS Logs ({logs.length} records)
            </Typography>
            
            <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>To</TableCell>
                    <TableCell>Message</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>SMS Count</TableCell>
                    <TableCell>Sent At</TableCell>
                    <TableCell>Completed At</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {logs.map((log, index) => (
                    <TableRow key={index}>
                      <TableCell>{log.to}</TableCell>
                      <TableCell>
                        <Box sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {log.text}
                        </Box>
                      </TableCell>
                      <TableCell>
                        {log.status ? (
                          <Chip 
                            label={log.status.name} 
                            color={getStatusColor(log.status.name)}
                            size="small"
                            title={log.status.description}
                          />
                        ) : (
                          <Chip label="UNKNOWN" color="default" size="small" />
                        )}
                      </TableCell>
                      <TableCell>{log.smsCount}</TableCell>
                      <TableCell>{formatDate(log.sentAt)}</TableCell>
                      <TableCell>{log.doneAt ? formatDate(log.doneAt) : 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Summary Statistics */}
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Summary
              </Typography>
              <Typography variant="body2">
                Total Messages: {logs.length}
              </Typography>
              <Typography variant="body2">
                Delivered: {logs.filter(log => log.status?.name === 'DELIVERED_TO_HANDSET').length}
              </Typography>
              <Typography variant="body2">
                Pending: {logs.filter(log => log.status?.name === 'PENDING_ENROUTE').length}
              </Typography>
              <Typography variant="body2">
                Rejected: {logs.filter(log => log.status?.groupName === 'REJECTED').length}
              </Typography>
              <Typography variant="body2">
                Total SMS: {logs.reduce((total, log) => total + log.smsCount, 0)}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}

      {mutation.isSuccess && logs.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          No SMS logs found for the selected criteria.
        </Typography>
      )}
    </Box>
  );
}