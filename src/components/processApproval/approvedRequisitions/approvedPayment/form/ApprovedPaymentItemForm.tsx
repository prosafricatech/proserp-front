import React from 'react';
import { Grid, Divider, Typography, TextField, Tooltip, IconButton, Box } from '@mui/material';
import { Div } from '@jumbo/shared';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import { DisabledByDefault } from '@mui/icons-material';

interface PaymentItem {
  id?: number;
  debit_ledger_id: number;
  ledger: {
    id: number;
    name: string;
  };
  credit_ledger?: {
    id: number;
    name: string;
  };
  credit_ledger_id?: number;
  amount: number;
  unpaid_amount: number;
  remarks?: string;
  description?: string;
  requisition_approval_ledger_item_id?: number;
  fulfillment_type?: string;
  quantity?: number;
  rate?: number;
  paid_amount?: number;
  measurement_unit?: {
    id: number;
    name: string;
    symbol: string;
  };
}

interface ApprovedPaymentItemFormProps {
  handleItemChange: (index: number, key: string, value: any) => void;
  items: PaymentItem[];
  approvedDetails?: boolean;
  isImprestPayment?: boolean;
  isMaterialPayment?: boolean;
  payFromLedgerName?: string;
  serverError?: Record<string, string | string[]> | null;
}

const ApprovedPaymentItemForm: React.FC<ApprovedPaymentItemFormProps> = ({ 
  handleItemChange, 
  items, 
  approvedDetails,
  isImprestPayment = false,
  isMaterialPayment = false,
  payFromLedgerName,
  serverError,
}) => {
  const filteredItems = approvedDetails
    ? items.filter(item => {
        if (isMaterialPayment) {
          return true; // Show all items for material payments
        }
        return item.unpaid_amount > 0;
      })
    : items;

  const resolveDebitLabel = (item: PaymentItem) => {
    const sourceLedgerName = String(payFromLedgerName || '').trim();
    const itemLedgerName = String(item.ledger?.name || '').trim();

    if (!isImprestPayment || !sourceLedgerName) {
      return itemLedgerName;
    }

    if (!itemLedgerName || sourceLedgerName === itemLedgerName) {
      return sourceLedgerName;
    }

    return `${sourceLedgerName} (${itemLedgerName})`;
  };

  const resolveFieldError = (index: number, field: string) => {
    const errorValue = serverError?.[`items.${index}.${field}`];

    if (Array.isArray(errorValue)) {
      return errorValue[0] || '';
    }

    return errorValue || '';
  };

  return (
    <React.Fragment>
      {filteredItems.map((item, itemIndex) => {
        const showUnpaidAmount = !isMaterialPayment;
        const shouldValidateUnpaid = !isMaterialPayment;
        const isAmountError = shouldValidateUnpaid && item.amount > item.unpaid_amount;
        const amountHelperText = isAmountError
          ? `Debit Amount cannot exceed Unpaid Amount`
          : '';

        // Check if credit ledger exists
        const hasCreditLedger = item.credit_ledger_id || item.credit_ledger?.id;

        return (
          <Grid
            container
            key={`${item.id || itemIndex}-${itemIndex}`}
            columnSpacing={1}
            paddingBottom={2}
            paddingRight={0.5}
            sx={{
              cursor: 'pointer',
              '&:hover': {
                bgcolor: 'action.hover',
              },
            }}
          >
            <Grid size={{ xs: 12 }}>
              <Divider />
            </Grid>
            
            <Grid size={{ xs: 0.5 }}>
              <Div sx={{ mt: 2, mb: 1.7 }}>{itemIndex + 1}.</Div>
            </Grid>
            
            <Grid size={{ xs: 11.5, md: 4, lg: 4 }}>
              <Div sx={{ mt: 1, mb: 0.5 }}>
                <Box>
                  <Tooltip title="Debit Ledger">
                    <Typography variant="body2" fontWeight="medium">
                      {resolveDebitLabel(item)}
                    </Typography>
                  </Tooltip>
                  
                  {/* Show Credit Ledger as secondary if it exists */}
                  {hasCreditLedger && (
                    <Tooltip title="Credit Ledger">
                      <Typography 
                        variant="caption" 
                        color="text.secondary"
                        sx={{ display: 'block', mt: 0.5 }}
                      >
                        ({item.credit_ledger?.name || item.credit_ledger_id})
                      </Typography>
                    </Tooltip>
                  )}
                </Box>
              </Div>
            </Grid>
            
            {/* Only show Unpaid Amount for imprest payments */}
            {showUnpaidAmount && (
              <Grid size={{ xs: 6, md: 2.5, lg: 2.5 }}>
                <Div sx={{ mt: 2, mb: 1.7 }}>
                  <Tooltip title="Unpaid Amount">
                    <Typography>{item.unpaid_amount?.toLocaleString()}</Typography>
                  </Tooltip>
                </Div>
              </Grid>
            )}
            
            <Grid size={{ xs: 6, md: showUnpaidAmount ? 2 : 4, lg: showUnpaidAmount ? 2 : 4 }}>
              <Div sx={{ mt: 1, mb: 0.5 }}>
                <TextField
                  label="Amount"
                  fullWidth
                  size="small"
                  defaultValue={approvedDetails
                    ? item.unpaid_amount
                    : item.amount
                  }
                  onChange={(e) => {
                    const sanitizedValue = sanitizedNumber(e.target.value);
                    handleItemChange(itemIndex, 'amount', Number.isFinite(sanitizedValue) ? sanitizedValue : 0);
                  }}  
                  InputProps={{
                    inputComponent: CommaSeparatedField,
                  }}
                  error={!!resolveFieldError(itemIndex, 'amount') || isAmountError}
                  helperText={resolveFieldError(itemIndex, 'amount') || amountHelperText}
                />
              </Div>
            </Grid>
            
            <Grid size={{ xs: 11, md: showUnpaidAmount ? 2.5 : 3.5, lg: showUnpaidAmount ? 2.5 : 3 }}>
              <Div sx={{ mt: 1, mb: 0.5 }}>
                <TextField
                  label="Description"
                  fullWidth
                  size="small"
                  value={item.description || item.remarks || ''}
                  error={!!resolveFieldError(itemIndex, 'description')}
                  helperText={resolveFieldError(itemIndex, 'description')}
                  onChange={(e) => {
                    handleItemChange(itemIndex, 'description', e.target.value);
                  }}
                />
              </Div>
            </Grid>
            
            {filteredItems.length > 1 && (
              <Grid size={{ xs: 1, md: 0.5 }} textAlign={'end'}>
                <Div sx={{ mt: 1, mb: 1.7 }}>
                  <Tooltip title="Remove Item">
                    <IconButton
                      size="small"
                      onClick={() => handleItemChange(itemIndex, 'delete', true)}
                    >
                      <DisabledByDefault fontSize="small" color="error" />
                    </IconButton>
                  </Tooltip>
                </Div>
              </Grid>
            )}
          </Grid>
        );
      })}
    </React.Fragment>
  );
};

export default React.memo(ApprovedPaymentItemForm);