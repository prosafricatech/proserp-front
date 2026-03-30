'use client';

import { DisabledByDefault, EditOutlined } from '@mui/icons-material';
import {
  Divider,
  Grid,
  IconButton,
  Tooltip,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';

import CertifiedAdjustments from './CertifiedAdjustments';
import { useLedgerSelect } from '@/components/accounts/ledgers/forms/LedgerSelectProvider';

// ==================== Types ====================
interface Adjustment {
  id?: number | string;
  description?: string;
  type?: string;
  type_name?: string;
  amount?: number | string;
  complement_ledger_id?: number;
  complement_ledger?: { id: number; name: string };
}

interface CertifiedAdjustmentsRowProps {
  adjustment: Adjustment;
  adjustments: Adjustment[];
  setAdjustments: React.Dispatch<React.SetStateAction<Adjustment[]>>;
  index: number;
  setClearFormKey: React.Dispatch<React.SetStateAction<number>>;
  submitMainForm: () => void;
  submitItemForm: boolean;
  setSubmitItemForm: (value: boolean) => void;
  setIsDirty: (value: boolean) => void;
}

// ==================== Component ====================
const CertifiedAdjustmentsRow: React.FC<CertifiedAdjustmentsRowProps> = ({
  adjustment,
  adjustments,
  setAdjustments,
  index,
  setClearFormKey,
  submitMainForm,
  submitItemForm,
  setSubmitItemForm,
  setIsDirty,
}) => {
  const [showForm, setShowForm] = useState(false);
  const { ungroupedLedgerOptions } = useLedgerSelect();

  const complementLedger = ungroupedLedgerOptions?.find(
    (ledger) =>
      ledger.id === adjustment?.complement_ledger_id ||
      ledger.id === adjustment?.complement_ledger?.id
  );

  const handleDelete = () => {
    setAdjustments((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <React.Fragment>
      <Divider sx={{ my: 1 }} />

      {!showForm ? (
        <Grid
          container
          alignItems="center"
          sx={{
            py: 1,
            cursor: 'pointer',
            borderRadius: 1,
            '&:hover': {
              bgcolor: 'action.hover',
            },
          }}
          onClick={() => setShowForm(true)}
        >
          {/* Index */}
          <Grid size={{ xs: 1, md: 0.5 }}>
            <Typography variant="body2" color="text.secondary">
              {index + 1}.
            </Typography>
          </Grid>

          {/* Type */}
          <Grid size={{ xs: 11, md: 3.5 }}>
            <Tooltip title="Type">
              <Typography variant="body2">
                {(adjustment?.type === '-' || adjustment?.type === 'deduction') ? 'Deduction (-)' : 'Addition (+)'}
              </Typography>
            </Tooltip>
          </Grid>

          {/* Description + Complement Ledger */}
          <Grid size={{ xs: 12, md: 4.5 }}>
            <Tooltip title={adjustment.description || ''}>
              <Typography
                variant="body2"
                sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}
              >
                {adjustment.description || '-'}
              </Typography>
            </Tooltip>
            <Tooltip title="Complement Ledger">
              <Typography variant="caption" color="text.secondary">
                {complementLedger?.name || '-'}
              </Typography>
            </Tooltip>
          </Grid>

          {/* Amount */}
          <Grid size={{ xs: 12, md: 2 }} textAlign="end">
            <Tooltip title="Amount">
              <Typography variant="body2">
                {adjustment.amount
                  ? Number(adjustment.amount).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })
                  : '0.00'}
              </Typography>
            </Tooltip>
          </Grid>

          {/* Actions */}
          <Grid size={{ xs: 12, md: 1.5 }} textAlign="end">
            <Tooltip title="Edit Adjustment">
              <IconButton size="small" onClick={(e) => { e.stopPropagation(); setShowForm(true); }}>
                <EditOutlined fontSize="small" />
              </IconButton>
            </Tooltip>

            <Tooltip title="Remove Adjustment">
              <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleDelete(); }}>
                <DisabledByDefault fontSize="small" color="error" />
              </IconButton>
            </Tooltip>
          </Grid>
        </Grid>
      ) : (
        <CertifiedAdjustments
          setClearFormKey={setClearFormKey}
          submitMainForm={submitMainForm}
          submitItemForm={submitItemForm}
          setSubmitItemForm={setSubmitItemForm}
          setIsDirty={setIsDirty}
          adjustment={adjustment}
          setShowForm={setShowForm}
          index={index}
          adjustments={adjustments}
          setAdjustments={setAdjustments}
        />
      )}
    </React.Fragment>
  );
};

export default CertifiedAdjustmentsRow;