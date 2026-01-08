import { DisabledByDefault, EditOutlined } from '@mui/icons-material';
import {
  Divider,
  Grid,
  IconButton,
  Tooltip,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';
import ClaimedDeliverablesItemForm from './ClaimedDeliverablesItemForm';
import { useLedgerSelect } from '@/components/accounts/ledgers/forms/LedgerSelectProvider';

interface ClaimedDeliverablesItemRowProps {
  setClearFormKey: React.Dispatch<React.SetStateAction<number>>;
  submitMainForm: any;
  setSubmitItemForm: React.Dispatch<React.SetStateAction<boolean>>;
  submitItemForm: boolean;
  setIsDirty: (dirty: boolean) => void;
  selectedCurrencyId: number | string;
  deliverableItem: any;
  index: number;
  deliverableItems?: any[];
  claimDate: string;
  setDeliverablesItems: React.Dispatch<React.SetStateAction<any[]>>;
  subContract?: any;
  claim?: any;
  vat_percentage: number
}

const ClaimedDeliverablesItemRow: React.FC<ClaimedDeliverablesItemRowProps> = ({
  setClearFormKey,
  submitMainForm,
  setSubmitItemForm,
  submitItemForm,
  setIsDirty,
  selectedCurrencyId,
  deliverableItem,
  index,
  deliverableItems = [],
  claimDate,
  setDeliverablesItems,
  vat_percentage = 0
}) => {
  const [showForm, setShowForm] = useState<boolean>(false);
  const { ungroupedLedgerOptions } = useLedgerSelect();
  const vat_factor = vat_percentage * 0.01;

  const revenueLedger = ungroupedLedgerOptions?.find(
    (ledger: any) =>
      ledger.id ===
      (deliverableItem?.revenue_ledger_id ||
        deliverableItem?.revenue_ledger?.id)
  );

  const handleRemoveItem = () => {
    setDeliverablesItems((prevItems) => {
      const newItems = [...prevItems];
      newItems.splice(index, 1);
      return newItems;
    });
  };

  const deliverableName =
    deliverableItem?.deliverable?.description ||
    deliverableItem?.project_deliverable.description ||
    '-';

  const quantity = deliverableItem?.certified_quantity ?? 0;
  const unitSymbol = deliverableItem?.unit_symbol || deliverableItem?.measurement_unit?.symbol || '';
  
  const rate = deliverableItem.rate || deliverableItem.project_deliverable.contract_rate;
  const remarks = deliverableItem?.remarks;

  // Format currency values
  const formatCurrency = (value: number) => {
    return value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const formatQuantity = (qty: number) => {
    return qty.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  return (
    <React.Fragment>
      <Divider />

      {!showForm ? (
        <Grid
          container
          alignItems="center"
          sx={{ '&:hover': { bgcolor: 'action.hover' } }}
        >
          <Grid size={{ xs: 1, md: 0.5 }}>
            <Typography variant="body2">{index + 1}.</Typography>
          </Grid>

          <Grid size={{ xs: 11, md: vat_factor ? 2.5 : 3.5 }}>
            <Tooltip title="Project Deliverable" arrow placement="top-start">
              <Typography variant="body2" noWrap>
                {deliverableName}
              </Typography>
            </Tooltip>

            {remarks && (
              <Typography
                variant="caption"
                color="text.secondary"
                noWrap
              >
                {remarks}
              </Typography>
            )}
          </Grid>

          <Grid size={{ xs: 6, md: vat_factor ? 2.5 : 3 }}>
            <Tooltip title="Revenue Ledger">
              <Typography variant="body2">
                {revenueLedger?.name || '-'}
              </Typography>
            </Tooltip>
          </Grid>

          <Grid size={{ xs: 6, md: 2 }} textAlign={'end'} paddingLeft={{ xs: 3, md: 0 }}>
            <Tooltip title={`Quantity: ${formatQuantity(quantity)} ${unitSymbol}\nRate: ${formatCurrency(rate)}`} arrow>
              <Typography variant="body2">
                <span >
                  {formatQuantity(quantity)} {unitSymbol}
                </span>
                <Typography 
                  component="span" 
                  variant="caption" 
                  color="text.secondary"
                  sx={{ ml: 0.5 }}
                >
                  @ {formatCurrency(rate)}
                </Typography>
              </Typography>
            </Tooltip>
          </Grid>

          {
            !!vat_factor &&
            <Grid textAlign={'end'} size={{xs: 6, md: vat_factor ? 1.5 : 2}}>
              <Tooltip title="VAT Amount">
                <Typography>
                  {formatCurrency(rate * vat_factor)}
                </Typography>
              </Tooltip>
            </Grid>
          }
          
          <Grid textAlign={'end'} size={{xs: 6, md: 2, lg: 2}}>
            <Tooltip title={`Line Total (${formatQuantity(quantity)} × ${formatCurrency(rate)}${vat_factor ? ` × ${vat_percentage}% VAT` : ''})`}>
              <Typography>
                {formatCurrency(quantity * rate * (1 + vat_factor))}
              </Typography>
            </Tooltip>
          </Grid>

          <Grid textAlign="end" size={{ xs: vat_factor ? 12 : 6, md: 1 }}>
            <Tooltip title="Edit Task" arrow>
              <IconButton size="small" onClick={() => setShowForm(true)}>
                <EditOutlined fontSize="small" />
              </IconButton>
            </Tooltip>

            <Tooltip title="Remove Task" arrow>
              <IconButton size="small" onClick={handleRemoveItem}>
                <DisabledByDefault fontSize="small" color="error" />
              </IconButton>
            </Tooltip>
          </Grid>
        </Grid>
      ) : (
        <ClaimedDeliverablesItemForm
          setClearFormKey={setClearFormKey}
          submitMainForm={submitMainForm}
          setSubmitItemForm={setSubmitItemForm}
          submitItemForm={submitItemForm}
          selectedCurrencyId={selectedCurrencyId as any}
          setIsDirty={setIsDirty}
          deliverableItem={deliverableItem}
          setShowForm={setShowForm}
          index={index}
          deliverableItems={deliverableItems}
          claimDate={claimDate}
          setDeliverablesItems={setDeliverablesItems}
        />
      )}
    </React.Fragment>
  );
};

export default ClaimedDeliverablesItemRow;