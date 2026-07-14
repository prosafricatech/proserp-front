'use client';

import React, { useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Dialog,
  Button,
  Chip,
  Divider,
  Grid,
  Stack,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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

function RFQListItem({ rfq }) {
  const [expanded, setExpanded] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const { checkOrganizationPermission } = useJumboAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const deleteMutation = useMutation({
    mutationFn: rfqServices.delete,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['rfqs'] });
      if (rfq?.id) {
        queryClient.invalidateQueries({ queryKey: ['rfq', rfq.id] });
      }
      if (data?.message) {
        // no snackbar dependency here to keep the item light; list refresh is enough
        // eslint-disable-next-line no-console
        console.info(data.message);
      }
    },
  });

  return (
    <>
      <Accordion
        expanded={expanded}
        onChange={() => setExpanded((prev) => !prev)}
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
            <Grid size={{ xs: 12, md: 3 }}>
              <Typography>{rfq.rfqNo || `RFQ/${rfq.id}`}</Typography>
              <Typography variant="caption" color="text.secondary">
                {readableDate(rfq.rfq_date)}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Typography variant="body2">{rfq.reference || '-'}</Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                {rfq.remarks || ''}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Chip size="small" label={rfq.status || 'draft'} color={rfq.status === 'closed' ? 'success' : rfq.status === 'sent' ? 'primary' : rfq.status === 'canceled' ? 'default' : 'info'} />
                <Chip size="small" label={`${rfq.items_count || rfq.items?.length || 0} items`} />
                <Chip size="small" label={`${rfq.responses_count || rfq.responses?.length || 0} responses`} />
              </Stack>
            </Grid>
            <Grid size={{ xs: 12, md: 2 }} textAlign="right">
              <Button size="small" startIcon={<OpenInNewOutlined />} onClick={() => router.push(`/en-US/procurement/rfqs/${rfq.id}`)}>
                Open
              </Button>
              {checkOrganizationPermission(PERMISSIONS.RFQS_EDIT) && (
                <Button size="small" startIcon={<EditOutlined />} onClick={(e) => { e.stopPropagation(); setOpenEdit(true); }}>
                  Edit
                </Button>
              )}
              {checkOrganizationPermission(PERMISSIONS.RFQS_DELETE) && (
                <Button size="small" color="error" startIcon={<DeleteOutlined />} onClick={(e) => { e.stopPropagation(); deleteMutation.mutate({ id: rfq.id }); }}>
                  Delete
                </Button>
              )}
            </Grid>
          </Grid>
          <Divider />
        </AccordionSummary>
        <AccordionDetails sx={{ backgroundColor: 'background.paper', marginBottom: 3 }}>
          <Grid container spacing={1}>
            <Grid size={12}>
              <Typography variant="subtitle2" gutterBottom>
                Suppliers
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {(rfq.stakeholders || []).map((stakeholder) => (
                  <Chip key={stakeholder.id} size="small" label={`${stakeholder.name}${stakeholder.status ? ` · ${stakeholder.status}` : ''}`} />
                ))}
                {!rfq.stakeholders?.length && <Typography variant="body2" color="text.secondary">No suppliers invited yet</Typography>}
              </Stack>
            </Grid>
            <Grid size={12}>
              <Typography variant="subtitle2" gutterBottom>
                Items
              </Typography>
              {rfq.items?.map((item: any, index: number) => (
                <Typography key={`${item.id || index}`} variant="body2" color="text.secondary">
                  {index + 1}. {item.product?.name || item.product?.item_name || 'Item'} · {item.quantity}
                  {item.unit_symbol || item.measurement_unit?.symbol ? ` ${item.unit_symbol || item.measurement_unit?.symbol}` : ''}
                </Typography>
              ))}
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      <Dialog
        fullWidth
        maxWidth="xl"
        fullScreen={belowLargeScreen}
        scroll={belowLargeScreen ? 'body' : 'paper'}
        open={openEdit}
      >
        <RFQDialogForm toggleOpen={setOpenEdit} rfq={rfq} />
      </Dialog>
    </>
  );
}

export default RFQListItem;
