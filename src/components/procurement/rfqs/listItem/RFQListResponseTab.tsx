'use client';

import React, { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  LinearProgress,
  Paper,
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
  AddOutlined,
  VisibilityOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import RFQResponsesForm from './form/RFQResponsesForm';
import rfqServices from '../rfq-services';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';

interface RFQListResponseTabProps {
  details: any;
  rfqId: number;
}

const RFQListResponseTab: React.FC<RFQListResponseTabProps> = ({ details, rfqId }) => {
  const { checkOrganizationPermission } = useJumboAuth();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const [openResponseForm, setOpenResponseForm] = useState(false);
  const [editResponseId, setEditResponseId] = useState<number | null>(null);
  const [viewResponseId, setViewResponseId] = useState<number | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: number | null; name?: string }>({
    open: false,
    id: null,
  });

  const responses = details?.responses || [];
  const canEdit = checkOrganizationPermission(PERMISSIONS.RFQS_EDIT);
  const canDelete = checkOrganizationPermission(PERMISSIONS.RFQS_DELETE);

  const { data: editResponseData, isLoading: isLoadingEdit } = useQuery({
    queryKey: ['rfqResponseDetail', editResponseId],
    queryFn: () => rfqServices.getResponse(editResponseId),
    enabled: !!editResponseId,
  });

  const { data: viewResponseData, isLoading: isLoadingView } = useQuery({
    queryKey: ['rfqResponseDetail', viewResponseId],
    queryFn: () => rfqServices.getResponse(viewResponseId),
    enabled: !!viewResponseId,
  });

  const deleteResponseMutation = useMutation({
    mutationFn: rfqServices.deleteResponse,
    onSuccess: () => {
      enqueueSnackbar('Response deleted successfully', { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['rfqDetails', rfqId] });
      queryClient.invalidateQueries({ queryKey: ['rfqDetails'] });
      queryClient.invalidateQueries({ queryKey: ['rfqs'] });
      queryClient.invalidateQueries({ queryKey: ['rfqComparison', rfqId] });
      setDeleteDialog({ open: false, id: null });
    },
    onError: (error: any) => {
      enqueueSnackbar(error?.response?.data?.message || 'Unable to delete response', { variant: 'error' });
      setDeleteDialog({ open: false, id: null });
    },
  });

  const handleEditClose = (open: boolean) => {
    if (!open) setEditResponseId(null);
  };

  return (
    <>
      <Box sx={{ width: '100%', px: 0 }}>
        <Grid container spacing={2} sx={{ width: '100%', margin: 0 }}>
          <Grid size={12} display="flex" justifyContent="space-between" alignItems="center" sx={{ px: 0 }}>
            <Typography variant="subtitle2" />
            <Tooltip title="Add Response">
              <IconButton size="small" onClick={() => setOpenResponseForm(true)}>
                <AddOutlined fontSize="small" />
              </IconButton>
            </Tooltip>
          </Grid>

          {responses.length > 0 ? (
            <Grid size={12} sx={{ px: 0 }}>
              <TableContainer component={Paper} variant="outlined" sx={{ width: '100%' }}>
                <Table size="small" sx={{ width: '100%' }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ width: '5%' }}>S/N</TableCell>
                      <TableCell sx={{ width: '25%' }}>Supplier</TableCell>
                      <TableCell sx={{ width: '17%' }}>Response Date</TableCell>
                      <TableCell sx={{ width: '17%' }}>Validity Date</TableCell>
                      <TableCell sx={{ width: '20%' }} align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {responses.map((response: any, index: number) => (
                      <TableRow key={response.id || index}>
                        <TableCell>{index + 1}.</TableCell>
                        <TableCell>
                          <Typography variant="body2">{response.stakeholder?.name || ''}</Typography>
                        </TableCell>
                        <TableCell>{response.response_date ? readableDate(response.response_date, false) : ''}</TableCell>
                        <TableCell>{response.validity_date ? readableDate(response.validity_date, false) : ''}</TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                            <Tooltip title="View Response">
                              <IconButton size="small" onClick={() => setViewResponseId(response.id)}>
                                <VisibilityOutlined fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            {canEdit && (
                              <Tooltip title="Edit Response">
                                <IconButton size="small" onClick={() => setEditResponseId(response.id)}>
                                  <EditOutlined fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                            {canDelete && (
                              <Tooltip title="Delete Response">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => setDeleteDialog({ open: true, id: response.id, name: response.stakeholder?.name })}
                                >
                                  <DeleteOutlined fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          ) : (
            <Grid size={12} sx={{ px: 0 }}>
              <Alert variant="outlined" severity="info" sx={{ width: '100%' }}>
                No responses yet. Click the add button to create a response.
              </Alert>
            </Grid>
          )}
        </Grid>
      </Box>

      {/* Add */}
      <Dialog fullWidth maxWidth="lg" fullScreen={belowLargeScreen} scroll={belowLargeScreen ? 'body' : 'paper'}
        open={openResponseForm} onClose={() => setOpenResponseForm(false)}>
        <RFQResponsesForm toggleOpen={setOpenResponseForm} rfqDetails={details} rfqId={rfqId} />
      </Dialog>

      {/* Edit */}
      <Dialog fullWidth maxWidth="lg" fullScreen={belowLargeScreen} scroll={belowLargeScreen ? 'body' : 'paper'}
        open={!!editResponseId} onClose={() => handleEditClose(false)}>
        {isLoadingEdit || !editResponseData ? (
          <DialogContent><LinearProgress /></DialogContent>
        ) : (
          <RFQResponsesForm
            toggleOpen={handleEditClose}
            rfqDetails={details}
            rfqId={rfqId}
            response={editResponseData}
            onSuccess={() => setEditResponseId(null)}
          />
        )}
      </Dialog>

      {/* View */}
      <Dialog fullWidth maxWidth="md" fullScreen={belowLargeScreen} scroll={belowLargeScreen ? 'body' : 'paper'}
        open={!!viewResponseId} onClose={() => setViewResponseId(null)}>
        <DialogTitle>
          Response Details{viewResponseData?.stakeholder?.name ? ` — ${viewResponseData.stakeholder.name}` : ''}
        </DialogTitle>
        <DialogContent dividers>
          {isLoadingView || !viewResponseData ? (
            <LinearProgress />
          ) : (
            <>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid size={{ xs: 12, md: 3 }}>
                  <Typography variant="caption" color="text.secondary" display="block">Response Date</Typography>
                  <Typography variant="body2">{readableDate(viewResponseData.response_date, false)}</Typography>
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <Typography variant="caption" color="text.secondary" display="block">Validity Date</Typography>
                  <Typography variant="body2">
                    {viewResponseData.validity_date ? readableDate(viewResponseData.validity_date, false) : '-'}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <Typography variant="caption" color="text.secondary" display="block">Currency</Typography>
                  <Typography variant="body2">
                    {viewResponseData.currency?.name} ({viewResponseData.currency?.code})
                  </Typography>
                </Grid>
                {viewResponseData.remarks && (
                  <Grid size={12}>
                    <Typography variant="caption" color="text.secondary" display="block">Remarks</Typography>
                    <Typography variant="body2">{viewResponseData.remarks}</Typography>
                  </Grid>
                )}
              </Grid>
              <Divider sx={{ mb: 2 }} />
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Product</TableCell>
                      <TableCell align="right">Requested</TableCell>
                      <TableCell align="right">Quoted Qty</TableCell>
                      <TableCell align="right">Rate</TableCell>
                      <TableCell align="right">VAT %</TableCell>
                      <TableCell align="right">Amount</TableCell>
                      <TableCell align="right">Lead Time</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(viewResponseData.items || []).map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          {item.product?.item_name || item.product?.name || 'Item'}
                          {item.remarks && (
                            <Typography variant="caption" color="text.secondary" display="block">{item.remarks}</Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">{item.requested_quantity} {item.measurement_unit?.symbol}</TableCell>
                        <TableCell align="right">{item.quantity} {item.measurement_unit?.symbol}</TableCell>
                        <TableCell align="right">{item.rate?.toLocaleString()}</TableCell>
                        <TableCell align="right">{item.vat_percentage || 0}%</TableCell>
                        <TableCell align="right">{item.amount?.toLocaleString()}</TableCell>
                        <TableCell align="right">
                          {item.lead_time_days !== null && item.lead_time_days !== undefined ? `${item.lead_time_days}d` : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewResponseId(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, id: null })}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <DeleteOutlined color="error" />
          Delete Response
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the response from "{deleteDialog.name || 'this supplier'}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setDeleteDialog({ open: false, id: null })} variant="outlined" size="small">
            Cancel
          </Button>
          <LoadingButton
            onClick={() => deleteDialog.id && deleteResponseMutation.mutate({ id: deleteDialog.id })}
            color="error"
            variant="contained"
            size="small"
            loading={deleteResponseMutation.isPending}
            startIcon={<DeleteOutlined />}
          >
            Delete
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default RFQListResponseTab;