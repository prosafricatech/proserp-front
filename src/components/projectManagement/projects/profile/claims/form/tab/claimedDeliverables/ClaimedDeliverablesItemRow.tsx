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
  ClaimDate: string;
  setDeliverablesItems: React.Dispatch<React.SetStateAction<any[]>>;
  subContract?: any;
  claim?: any;
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
  ClaimDate,
  setDeliverablesItems,
  subContract,
  claim,
}) => {
  const [showForm, setShowForm] = useState<boolean>(false);
  const { ungroupedLedgerOptions } = useLedgerSelect();

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

  const quantity = `${deliverableItem?.certified_quantity ?? 0} ${
    deliverableItem?.task?.measurement_unit?.symbol || ''
  }`;

  const remarks = deliverableItem?.remarks;

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

          <Grid size={{ xs: 11, md: 4.5 }}>
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

          <Grid size={{ xs: 6, md: 4 }}>
            <Tooltip title="Revenue Ledger">
              <Typography variant="body2">
                {revenueLedger?.name || '-'}
              </Typography>
            </Tooltip>
          </Grid>

          <Grid size={{ xs: 6, md: 2 }} paddingLeft={{ xs: 3, md: 0 }}>
            <Tooltip title="Quantity" arrow>
              <Typography variant="body2">{quantity}</Typography>
            </Tooltip>
          </Grid>

          <Grid textAlign="end" size={{ xs: 12, md: 1 }}>
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
          selectedCurrencyId={selectedCurrencyId}
          setIsDirty={setIsDirty}
          deliverableItem={deliverableItem}
          setShowForm={setShowForm}
          index={index}
          subContract={subContract}
          claim={claim}
          deliverableItems={deliverableItems}
          ClaimDate={ClaimDate}
          setDeliverablesItems={setDeliverablesItems}
        />
      )}
    </React.Fragment>
  );
};

export default ClaimedDeliverablesItemRow;
