import React from 'react';
import { Grid, Divider, Typography, TextField, Tooltip, IconButton } from '@mui/material';
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
  amount: number;
  unpaid_amount: number;
  remarks?: string;
  description?: string;
  requisition_approval_ledger_item_id?: number;
}

interface ApprovedPaymentItemFormProps {
  handleItemChange: (index: number, key: string, value: any) => void;
  items: PaymentItem[];
  approvedDetails?: boolean;
}

const ApprovedPaymentItemForm: React.FC<ApprovedPaymentItemFormProps> = ({ 
  handleItemChange, 
  items, 
  approvedDetails 
}) => {
  const filteredItems = approvedDetails
    ? items.filter(item => item.unpaid_amount > 0)
    : items;

  return (
    <React.Fragment>
      {filteredItems.map((item, itemIndex) => (
        <Grid
          container
          key={`${item.id}-${itemIndex}`}
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
          <Grid size={{xs: 12}}>
            <Divider/>
          </Grid>
          <Grid size={{xs: 0.5}}>
            <Div sx={{ mt: 2, mb: 1.7 }}>{itemIndex + 1}.</Div>
          </Grid>
          <Grid size={{xs: 11.5, md: 4, lg: 4}}>
            <Div sx={{ mt: 2, mb: 1.7 }}>
              <Tooltip title="Debit">
                <Typography>{item.ledger.name}</Typography>
              </Tooltip>
            </Div>
          </Grid>
          <Grid size={{xs: 6, md: 2.5, lg: 2.5}}>
            <Div sx={{ mt: 2, mb: 1.7 }}>
              <Tooltip title="Unpaid Amount">
                <Typography>{item.unpaid_amount?.toLocaleString()}</Typography>
              </Tooltip>
            </Div>
          </Grid>
          <Grid size={{xs: 6, md: 2, lg: 2}}>
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
                  handleItemChange(itemIndex, 'amount', sanitizedValue);
                }}  
                InputProps={{
                  inputComponent: CommaSeparatedField,
                }}
                error={item.amount > item.unpaid_amount}
                helperText={
                  item.amount > item.unpaid_amount
                    ? `Debit Amount cannot exceed Unpaid Amount`
                    : ''
                }
              />
            </Div>
          </Grid>
          <Grid size={{xs: 11, md: 2.5, lg: 2.5}}>
            <Div sx={{ mt: 2, mb: 1.7 }}>
              <Tooltip title="Remarks">
                <Typography>{item.remarks || item.description}</Typography>
              </Tooltip>
            </Div>
          </Grid>
          {items.length > 1 &&
            <Grid size={{xs: 1, md: 0.5}} textAlign={'end'}>
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
          }
        </Grid>
      ))}
    </React.Fragment>
  );
};

export default React.memo(ApprovedPaymentItemForm);