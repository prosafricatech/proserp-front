'use client';

import React, { useState } from 'react';
import { useSnackbar } from 'notistack';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Dialog,
  Chip,
  Divider,
  Grid,
  LinearProgress,
  Stack,
  Tabs,
  Tab,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import rfqServices from '../rfq-services';
import RFQDialogForm from '../form/RFQDialogForm';
import RFQListItemAction from './RFQListItemAction';
import RFQListResponseTab from './RFQListResponseTab';
import { RFQListRow } from '../rfq-types';
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index, ...other }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`rfq-tabpanel-${index}`}
      aria-labelledby={`rfq-tab-${index}`}
      {...other}
    >
      {value === index && <Grid container spacing={1} sx={{ pt: 2 }}>{children}</Grid>}
    </div>
  );
}

function RFQListItem({ rfq }: { rfq: RFQListRow }) {
  const [expanded, setExpanded] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));
  const { showDialog, hideDialog } = useJumboDialog();

  const { data: rfqDetails, isLoading } = useQuery({
    queryKey: ['rfqDetails', rfq?.id],
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
        queryClient.invalidateQueries({ queryKey: ['rfqDetails', rfq.id] });
      }
      hideDialog();
    },
    onError: (error: any) => {
      enqueueSnackbar(error?.response?.data?.message, {
        variant: 'error',
      });
      hideDialog();
    },
  });

  // Handle edit button click - fetch details and open dialog
  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenEdit(true);
  };

  // Handle delete button click - show confirmation dialog
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    showDialog({
      title: 'Confirm Delete',
      content: (
        <div>
          <Typography variant="body1" gutterBottom>
            Are you sure you want to delete this RFQ?
          </Typography>
        </div>
      ),
      onYes: () => {
        deleteMutation.mutate({ id: rfq.id });
      },
      onNo: () => {
        hideDialog();
      },
      variant: 'confirm'
    });
  };

  // Handle dialog close
  const handleDialogClose = (open: boolean) => {
    setOpenEdit(open);
  };

  // Handle accordion change
  const handleAccordionChange = () => {
    setExpanded((prev) => !prev);
  };

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
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
          <Grid container spacing={1} width="100%" onClick={handleActionContainerClick}>
            <RFQListItemAction
              rfqId={rfq.id as any}
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
            />

            {isLoading ? (
              <Grid size={{ xs: 12 }}>
                <LinearProgress />
              </Grid>
            ) : (
              <>
                <Tabs 
                  value={tabValue} 
                  onChange={handleTabChange} 
                  variant="fullWidth"
                  sx={{ borderBottom: 1, borderColor: 'divider' }}
                >
                  <Tab label="Summary" />
                  <Tab label="Responses" />
                </Tabs>

                <Grid size={12}>
                  <TabPanel value={tabValue} index={0}>
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
                  </TabPanel>

                  <TabPanel value={tabValue} index={1}>
                    <Grid size={12}>
                      <RFQListResponseTab details={details} rfqId={rfq.id as any} />
                    </Grid>
                  </TabPanel>
                </Grid>

              </>
            )}
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Edit Dialog */}
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