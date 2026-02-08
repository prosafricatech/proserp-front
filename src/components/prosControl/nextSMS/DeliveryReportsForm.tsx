'use client';

import { 
  Box, 
  Typography, 
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
import { useMutation } from '@tanstack/react-query';
import smsServices from './smsServices';
import { useSnackbar } from 'notistack';

interface DeliveryReport {
  messageId: string;
  sentAt: string;
  doneAt: string;
  to: string;
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

interface DeliveryReportResponse {
  results: DeliveryReport[];
}

export default function DeliveryReportsForm() {
  const { enqueueSnackbar } = useSnackbar();
  const [reports, setReports] = useState<DeliveryReport[]>([]);

  const mutation = useMutation({
    mutationFn: smsServices.getDeliveryReport,
    onSuccess: (data: DeliveryReportResponse) => {
      enqueueSnackbar('Delivery reports fetched successfully!', { variant: 'success' });
      setReports(data.results || []);
    },
    onError: (err: any) => {
      enqueueSnackbar(err?.response?.data?.message || 'Failed to fetch delivery reports', { variant: 'error' });
      setReports([]);
    }
  });

  const handleGetReports = () => {
    mutation.mutate();
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
      <Typography variant="h6">Get Delivery Reports</Typography>

      <LoadingButton 
        onClick={handleGetReports}
        variant="contained" 
        loading={mutation.isPending}
        sx={{ mb: 2, alignSelf: 'flex-start' }}
      >
        Get Delivery Reports
      </LoadingButton>

      {reports.length > 0 && (
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Delivery Reports ({reports.length} records)
            </Typography>
            
            <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>To</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>SMS Count</TableCell>
                    <TableCell>Sent At</TableCell>
                    <TableCell>Completed At</TableCell>
                    <TableCell>Error</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reports.map((report, index) => (
                    <TableRow key={index}>
                      <TableCell>{report.to}</TableCell>
                      <TableCell>
                        {report.status ? (
                          <Chip 
                            label={report.status.name} 
                            color={getStatusColor(report.status.name)}
                            size="small"
                          />
                        ) : (
                          <Chip label="UNKNOWN" color="default" size="small" />
                        )}
                      </TableCell>
                      <TableCell>
                        {report.status?.description || 'No status available'}
                      </TableCell>
                      <TableCell>{report.smsCount}</TableCell>
                      <TableCell>{formatDate(report.sentAt)}</TableCell>
                      <TableCell>{report.doneAt ? formatDate(report.doneAt) : 'N/A'}</TableCell>
                      <TableCell>
                        {report.error ? (
                          <Chip 
                            label={report.error.name} 
                            color={getErrorColor(report.error.name)}
                            size="small"
                          />
                        ) : (
                          <Chip label="NO_ERROR" color="success" size="small" />
                        )}
                      </TableCell>
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
                Total Messages: {reports.length}
              </Typography>
              <Typography variant="body2">
                Delivered: {reports.filter(r => r.status?.name === 'DELIVERED_TO_HANDSET').length}
              </Typography>
              <Typography variant="body2">
                Pending: {reports.filter(r => r.status === null).length}
              </Typography>
              <Typography variant="body2">
                Total SMS: {reports.reduce((total, report) => total + report.smsCount, 0)}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}

      {mutation.isSuccess && reports.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          No delivery reports found.
        </Typography>
      )}
    </Box>
  );
}