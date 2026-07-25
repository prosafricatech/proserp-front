'use client';

import React, { useState, useEffect } from 'react';
import {
  Divider,
  Grid,
  TextField,
  Tooltip,
  Typography,
  IconButton,
  Box,
  Checkbox,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import { DeleteOutline } from '@mui/icons-material';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { Organization } from '@/types/auth-types';

interface RFQResponseItemRowProps {
  index: number;
  item: any;
  onUpdate: (index: number, field: string, value: any) => void;
  onRemove: () => void;
  isLastItem?: boolean;
  vatPercentage?: number;
}

const RFQResponseItemRow: React.FC<RFQResponseItemRowProps> = ({
  index,
  item,
  onUpdate,
  onRemove,
  isLastItem = false,
  vatPercentage = 0,
}) => {
  const { authOrganization } = useJumboAuth();
  const rfqItem = item.rfq_item;
  const [vatChecked, setVatChecked] = useState(item.vat_percentage > 0 || false);
  const [isVatfieldChange, setIsVatfieldChange] = useState(false);
  const [priceInclusiveVAT, setPriceInclusiveVAT] = useState(0);
  const [priceFieldKey, setPriceFieldKey] = useState(0);
  const [vatPriceFieldKey, setVatPriceFieldKey] = useState(0);

  const vat_factor = (item.vat_percentage || vatPercentage || 0) * 0.01;

  // Calculate amount with VAT
  const calculateAmount = () => {
    const qty = Number(item.quantity) || 0;
    const rate = Number(item.rate) || 0;
    return qty * rate * (1 + vat_factor);
  };

  // Update amount when quantity, rate, or VAT changes
  useEffect(() => {
    const amount = calculateAmount();
    onUpdate(index, 'amount', amount);
  }, [item.quantity, item.rate, item.vat_percentage, vatPercentage]);

  // Sync VAT checkbox with item
  useEffect(() => {
    if (item.vat_percentage !== undefined) {
      setVatChecked(item.vat_percentage > 0);
    }
  }, [item.vat_percentage]);

  const handleVatToggle = (checked: boolean) => {
    setVatChecked(checked);
    const vatPercent = checked ? (authOrganization?.organization as Organization)?.settings?.vat_percentage ?? 0 : 0;
    onUpdate(index, 'vat_percentage', vatPercent);
    if (!checked) {
      setPriceInclusiveVAT(0);
      setIsVatfieldChange(false);
    }
  };

  const handleRateChange = (value: any) => {
    const numericValue = Number.isFinite(value) ? value : 0;
    setIsVatfieldChange(false);
    setPriceInclusiveVAT(0);
    onUpdate(index, 'rate', numericValue);
    setVatPriceFieldKey((key) => key + 1);
  };

  const handleVatInclusiveChange = (value: any) => {
    const numericValue = Number.isFinite(value) ? value : 0;
    setIsVatfieldChange(true);
    setPriceInclusiveVAT(numericValue);
    const rateWithoutVat = vat_factor > 0 ? numericValue / (1 + vat_factor) : numericValue;
    onUpdate(index, 'rate', rateWithoutVat);
    setPriceFieldKey((key) => key + 1);
  };

  const getVatInclusiveValue = () => {
    if (isVatfieldChange) {
      return priceInclusiveVAT ? Math.round(priceInclusiveVAT * 100000) / 100000 : '';
    }
    const rate = Number(item.rate) || 0;
    return vat_factor > 0 ? Math.round(rate * (1 + vat_factor) * 100000) / 100000 : rate;
  };

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

        <Grid size={{ xs: 10, md: 3 }}>
          <Tooltip title="Product Name">
            <Typography variant="body2">
              {rfqItem?.product?.name || rfqItem?.product?.item_name || 'Item'}
            </Typography>
          </Tooltip>
          <Typography variant="caption" color="text.secondary" display="block">
            Required: {rfqItem?.quantity || 0} {rfqItem?.measurement_unit?.symbol || ''}
          </Typography>
        </Grid>

        <Grid size={{ xs: 5, md: 1.5 }}>
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

        <Grid size={{ xs: 12, md: 1 }}>
          <Box display="flex" alignItems="center" sx={{ mt: { xs: 0, md: 0.5 } }}>
            <Typography variant="body2" sx={{ mr: 0.5 }}>
              VAT
            </Typography>
            <Checkbox
              size="small"
              checked={vatChecked}
              onChange={(e) => handleVatToggle(e.target.checked)}
            />
          </Box>
        </Grid>

        <Grid size={{ xs: 5, md: vat_factor > 0 ? 1.5 : 2 }}>
          <TextField
            label="Rate"
            fullWidth
            size="small"
            key={priceFieldKey}
            value={item.rate || ''}
            InputProps={{
              inputComponent: CommaSeparatedField as any,
            }}
            onChange={(e) => {
              const value = e.target.value ? sanitizedNumber(e.target.value) : '';
              handleRateChange(Number.isFinite(value) ? value : 0);
            }}
          />
        </Grid>

        {vat_factor > 0 && (
          <Grid size={{ xs: 5, md: 1.5 }}>
            <TextField
              label="Price (VAT Inclusive)"
              fullWidth
              size="small"
              key={vatPriceFieldKey}
              value={getVatInclusiveValue()}
              InputProps={{
                inputComponent: CommaSeparatedField as any,
              }}
              onChange={(e) => {
                const value = e.target.value ? sanitizedNumber(e.target.value) : '';
                handleVatInclusiveChange(Number.isFinite(value) ? value : 0);
              }}
            />
          </Grid>
        )}

        <Grid size={{ xs: 5, md: vat_factor > 0 ? 1.5 : 2 }}>
          <TextField
            label="Amount"
            fullWidth
            size="small"
            value={item.amount || 0}
            InputProps={{
              inputComponent: CommaSeparatedField as any,
              readOnly: true,
            }}
          />
        </Grid>

        <Grid size={{ xs: 5, md: vat_factor > 0 ? 1.5 : 2}}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="Delivery Date"
              value={item.delivery_date || null}
              onChange={(newValue) => onUpdate(index, 'delivery_date', newValue)}
              slotProps={{
                textField: {
                  size: 'small',
                  fullWidth: true,
                },
              }}
            />
          </LocalizationProvider>
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

        {!isLastItem &&
          <Grid size={{ xs: 1, md: 12 }} textAlign="end" display="flex" alignItems="center" justifyContent="flex-end">
            <Tooltip title={isLastItem ? 'Cannot remove last item' : 'Remove this item'}>
              <span>
                <IconButton
                  size="small"
                  onClick={onRemove}
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
        }
      </Grid>
    </React.Fragment>
  );
};

export default RFQResponseItemRow;