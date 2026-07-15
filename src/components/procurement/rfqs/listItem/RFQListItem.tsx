'use client';

import React, { useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Dialog,
  Button,
  Chip,
  Divider,
  Grid,
  IconButton,
  LinearProgress,
  Stack,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { DeleteOutlined, EditOutlined, OpenInNewOutlined } from '@mui/icons-material';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import rfqServices from '../rfq-services';
import RFQDialogForm from '../form/RFQDialogForm';
import { RFQListRow } from '../rfq-types';

function RFQListItem({ rfq }: { rfq: RFQListRow }) {
  const [expanded, setExpanded] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const { checkOrganizationPermission } = useJumboAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const { data: rfqDetails, isLoading } = useQuery({
    queryKey: ['rfq', rfq?.id],
    queryFn: () => rfqServices.getOne(rfq.id),
    enabled: expanded && !!rfq?.id,
    refetchOnWindowFocus: false,
  });

  const details = (rfqDetails?.data || rfqDetails || rfq) as any;
  const statusRaw = String(details?.status || rfq?.status || 'draft');
  const statusLower = statusRaw.toLowerCase();
  const formattedStatus =
    statusRaw.charAt(0).toUpperCase() + statusRaw.slice(1).toLowerCase();
  const statusColor =
    statusLower === 'closed'
      ? 'success'
      : statusLower === 'sent'
      ? 'primary'
      : statusLower === 'canceled'
      ? 'default'
      : 'info';

  const deleteMutation = useMutation({
    mutationFn: rfqServices.delete,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['rfqs'] });
      if (rfq?.id) {
        queryClient.invalidateQueries({ queryKey: ['rfq', rfq.id] });
      }
    },
  });

  // Handle edit button click - fetch details and open dialog
  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenEdit(true);
  };

  // Handle delete button click
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this RFQ?')) {
      deleteMutation.mutate({ id: rfq.id });
    }
  };

  // Handle open button click
  const handleOpenClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/en-US/procurement/rfqs/${rfq.id}`);
  };

  // Handle dialog close
  const handleDialogClose = (open: boolean) => {
    setOpenEdit(open);
  };

  // Handle accordion change
  const handleAccordionChange = () => {
    setExpanded((prev) => !prev);
  };

  // Prevent action clicks from triggering accordion toggle
  const handleActionContainerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <>
      <Accordion
        expanded={expanded}
        onChange={handleAccordionChange}
        square
        sx={{
          borderRadius: 2,
          borderTop: 2,
          borderColor: 'divider',
          '&:hover': { bgcolor: 'action.hover' },
        }}
      >
        <AccordionSummary
          expandIcon={expanded ? <RemoveIcon /> : <AddIcon />}
          sx={{
            px: 2,
            flexDirection: 'row-reverse',
            '.MuiAccordionSummary-content': {
              alignItems: 'center',
              '&.Mui-expanded': { margin: '10px 0' },
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
              '& svg': { fontSize: '0.9rem' },
            },
          }}
        >
          <Grid container spacing={1} alignItems="center" sx={{ width: '100%', m: 0 }}>
            <Grid size={{ xs: 4, md: 4 }}>
              <Tooltip title="RFQ Number">
                <Typography>{details?.rfqNo || rfq.rfqNo || `RFQ/${rfq.id}`}</Typography>
              </Tooltip>
              <Tooltip title="RFQ Date">
                <Typography variant="caption" color="text.secondary">
                  {readableDate(details?.rfq_date || rfq.rfq_date, false)}
                </Typography>
              </Tooltip>
            </Grid>
            <Grid size={{ xs: 4, md: 4 }}>
              <Tooltip title="Response Deadline">
                <Typography variant="caption" color="text.secondary" display="block">
                  {readableDate(details?.response_deadline || rfq.response_deadline, false)}
                </Typography>
              </Tooltip>
            </Grid>
            <Grid size={{ xs: 4, md: 4 }} textAlign="end">
              <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="flex-end">
                <Tooltip title="RFQ Status">
                  <Chip size="small" label={formattedStatus} color={statusColor as any} />
                </Tooltip>
              </Stack>
            </Grid>
          </Grid>
          <Divider />
        </AccordionSummary>
        <AccordionDetails sx={{ backgroundColor: 'background.paper', marginBottom: 3 }}>
          <Grid container spacing={1}>
            <Grid size={{ xs: 12 }} textAlign="end" onClick={handleActionContainerClick}>
              <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                <Tooltip title="Open RFQ">
                  <IconButton size="small" onClick={handleOpenClick}>
                    <OpenInNewOutlined fontSize="small" />
                  </IconButton>
                </Tooltip>
                {checkOrganizationPermission(PERMISSIONS.RFQS_EDIT) && (
                  <Tooltip title="Edit RFQ">
                    <IconButton size="small" onClick={handleEditClick}>
                      <EditOutlined fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                {checkOrganizationPermission(PERMISSIONS.RFQS_DELETE) && (
                  <Tooltip title="Delete RFQ">
                    <IconButton size="small" onClick={handleDeleteClick}>
                      <DeleteOutlined fontSize="small" color="error" />
                    </IconButton>
                  </Tooltip>
                )}
              </Stack>
            </Grid>

            {isLoading ? (
              <Grid size={{ xs: 12 }}>
                <LinearProgress />
              </Grid>
            ) : (
              <>
                <Grid size={12}>
                  <Tooltip title="List of invited suppliers">
                    <Typography variant="subtitle2" gutterBottom>
                      Suppliers
                    </Typography>
                  </Tooltip>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {(details?.stakeholders || []).map((stakeholder: any) => (
                      <Tooltip key={stakeholder.id} title={`Supplier: ${stakeholder.name}${stakeholder.status ? ` (${stakeholder.status})` : ''}`}>
                        <Chip 
                          size="small" 
                          label={`${stakeholder.name}${stakeholder.status ? ` · ${stakeholder.status}` : ''}`} 
                        />
                      </Tooltip>
                    ))}
                    {!details?.stakeholders?.length && (
                      <Typography variant="body2" color="text.secondary">
                        No suppliers invited yet
                      </Typography>
                    )}
                  </Stack>
                </Grid>
                <Grid size={12}>
                  <Tooltip title="List of RFQ items">
                    <Typography variant="subtitle2" gutterBottom>
                      Items
                    </Typography>
                  </Tooltip>
                  {details?.items?.length ? (
                    details.items.map((item: any, index: number) => (
                      <Grid
                        key={`${item.id || index}`}
                        container
                        spacing={1}
                        alignItems="center"
                        sx={{ borderBottom: 1, borderColor: 'divider', py: 0.5 }}
                      >
                        <Grid size={{ xs: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            {index + 1}.
                          </Typography>
                        </Grid>
                        <Grid size={{ xs: 7, md: 4 }}>
                          <Tooltip title={`Product: ${item.product?.name || item.product?.item_name || 'Item'}`}>
                            <Typography variant="body2">
                              {item.product?.name || item.product?.item_name || 'Item'}
                            </Typography>
                          </Tooltip>
                        </Grid>
                        <Grid size={{ xs: 3 }} textAlign="right">
                          <Tooltip title={`Quantity: ${item.quantity}`}>
                            <Typography variant="body2" color="text.secondary">
                              {item.quantity}
                            </Typography>
                          </Tooltip>
                        </Grid>
                        <Grid size={{ xs: 2, md: 3 }} textAlign="right">
                          <Tooltip title={`Unit: ${item.unit_symbol || item.measurement_unit?.symbol || ''}`}>
                            <Typography variant="body2" color="text.secondary">
                              {item.unit_symbol || item.measurement_unit?.symbol || ''}
                            </Typography>
                          </Tooltip>
                        </Grid>
                      </Grid>
                    ))
                  ) : (
                    <Alert variant="outlined" severity="info">
                      No items found
                    </Alert>
                  )}
                </Grid>
              </>
            )}
          </Grid>
        </AccordionDetails>
      </Accordion>

      <Dialog
        fullWidth
        maxWidth="lg"
        fullScreen={belowLargeScreen}
        scroll={belowLargeScreen ? 'body' : 'paper'}
        open={openEdit}
        onClose={() => handleDialogClose(false)}
      >
        <RFQDialogForm toggleOpen={handleDialogClose} rfq={details} />
      </Dialog>
    </>
  );
}

export default RFQListItem;