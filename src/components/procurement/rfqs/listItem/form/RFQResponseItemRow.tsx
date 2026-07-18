'use client';

import React from 'react';
import {
  Divider,
  Grid,
  TextField,
  Tooltip,
  Typography,
  IconButton,
  Box,
} from '@mui/material';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import { DeleteOutline } from '@mui/icons-material';

interface RFQResponseItemRowProps {
  index: number;
  item: any;
  onUpdate: (index: number, field: string, value: any) => void;
  onRemove: () => void;
  isLastItem?: boolean;
}

const RFQResponseItemRow: React.FC<RFQResponseItemRowProps> = ({
  index,
  item,
  onUpdate,
  onRemove,
  isLastItem = false,
}) => {
  const rfqItem = item.rfq_item;
  const hasQuantityAndRate = item.quantity > 0 && item.rate > 0;

  return (
    <React.Fragment>
      <Divider />
      <Grid 
        container 
        width={'100%'} 
        columnSpacing={1} 
        sx={{ 
          py: 1,
          borderRadius: 1,
          transition: 'background-color 0.2s ease',
        }}
      >
        <Grid size={{ xs: 12, md: 0.5 }} display="flex" alignItems="center">
          <Typography variant="body2" color="text.secondary">
            {index + 1}.
          </Typography>
        </Grid>

        <Grid size={{ xs: 10, md: 3.5 }}>
          <Tooltip title="Product Name">
            <Typography variant="body2">
              {rfqItem?.product?.name || rfqItem?.product?.item_name || 'Item'}
            </Typography>
          </Tooltip>
          <Typography variant="caption" color="text.secondary" display="block">
            Required: {rfqItem?.quantity || 0} {rfqItem?.measurement_unit?.symbol || ''}
          </Typography>
        </Grid>

        <Grid size={{ xs: 5, md: 2 }}>
          <TextField
            label="Quantity"
            fullWidth
            size="small"
            value={item.quantity || ''}
            InputProps={{
              inputComponent: CommaSeparatedField as any,
            }}
            onChange={(e) => {
              const value = e.target.value ? sanitizedNumber(e.target.value) : '';
              onUpdate(index, 'quantity', Number.isFinite(value) ? value : '');
            }}
          />
        </Grid>

        <Grid size={{ xs: 5, md: 2 }}>
          <TextField
            label="Rate"
            fullWidth
            size="small"
            value={item.rate || ''}
            InputProps={{
              inputComponent: CommaSeparatedField as any,
            }}
            onChange={(e) => {
              const value = e.target.value ? sanitizedNumber(e.target.value) : '';
              onUpdate(index, 'rate', Number.isFinite(value) ? value : '');
            }}
          />
        </Grid>

        <Grid size={{ xs: 5, md: 2 }}>
          <TextField
            label="Amount"
            fullWidth
            size="small"
            value={item.total || 0}
            InputProps={{
              inputComponent: CommaSeparatedField as any,
              readOnly: true,
            }}
          />
        </Grid>

        <Grid size={{ xs: 5, md: 1.5 }}>
          <TextField
            label="Lead Time"
            fullWidth
            size="small"
            value={item.lead_time_days || ''}
            onChange={(e) => {
              const value = e.target.value ? Number(e.target.value) : undefined;
              onUpdate(index, 'lead_time_days', value);
            }}
            inputProps={{ min: 0 }}
            placeholder="Days"
          />
        </Grid>

        <Grid size={{ xs: 1, md: 0.5 }} display="flex" alignItems="center" justifyContent="center">
          <Tooltip title={isLastItem ? 'Cannot remove last item' : 'Remove this item'}>
            <span>
              <IconButton
                size="small"
                onClick={onRemove}
                disabled={isLastItem}
                color="error"
                sx={{
                  opacity: isLastItem ? 0.3 : 1
                }}
              >
                <DeleteOutline fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 12, md: 12 }}>
          <TextField
            label="Remarks"
            fullWidth
            multiline
            rows={2}
            size="small"
            value={item.remarks || ''}
            onChange={(e) => onUpdate(index, 'remarks', e.target.value)}
          />
        </Grid>
      </Grid>
    </React.Fragment>
  );
};

export default RFQResponseItemRow;