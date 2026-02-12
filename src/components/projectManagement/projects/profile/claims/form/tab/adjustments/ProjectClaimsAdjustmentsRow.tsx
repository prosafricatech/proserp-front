import { DisabledByDefault, EditOutlined } from '@mui/icons-material';
import { Divider, Grid, IconButton, Tooltip, Typography } from '@mui/material';
import React, { useState } from 'react';
import { useLedgerSelect } from '@/components/accounts/ledgers/forms/LedgerSelectProvider';
import ProjectClaimsAdjustments from './ProjectClaimsAdjustments';

interface ProjectClaimsAdjustmentsRowProps {
  adjustment: any;
  adjustments?: any[];
  setAdjustments: React.Dispatch<React.SetStateAction<any[]>>;
  index: number;
  setClearFormKey: React.Dispatch<React.SetStateAction<number>>;
  submitMainForm: any;
  setSubmitItemForm: React.Dispatch<React.SetStateAction<boolean>>;
  submitItemForm: boolean;
  setIsDirty: (dirty: boolean) => void;
}

const ProjectClaimsAdjustmentsRow: React.FC<ProjectClaimsAdjustmentsRowProps> = ({
  adjustment,
  adjustments = [],
  setAdjustments,
  index,
  setClearFormKey,
  submitMainForm,
  setSubmitItemForm,
  submitItemForm,
  setIsDirty,
}) => {
  const [showForm, setShowForm] = useState<boolean>(false);
  const { ungroupedLedgerOptions } = useLedgerSelect();

  const complementLedger = ungroupedLedgerOptions?.find(
    (ledger: any) =>
      ledger.id ===
      (adjustment?.complement_ledger_id ||
        adjustment?.complement_ledger?.id)
  );

  const handleRemoveItem = () => {
    setAdjustments((prev) => {
      const newItems = [...prev];
      newItems.splice(index, 1);
      return newItems;
    });
  };

  return (
    <React.Fragment>
      <Divider />

      {!showForm ? (
        <Grid
          container
          sx={{
            cursor: 'pointer',
            '&:hover': { bgcolor: 'action.hover' },
          }}
        >
          <Grid size={{ xs: 1, md: 0.5 }}>
            <Typography variant="body2">{index + 1}.</Typography>
          </Grid>

          <Grid size={{ xs: 6, md: 3.5 }}>
            <Tooltip title="Type">
              <Typography variant="body2">
                {(adjustment?.type === '-' || adjustment?.type === 'deduction') ? 'Deduction (-)' : 'Addition (+)'}
              </Typography>
            </Tooltip>
          </Grid>

          <Grid size={{ xs: 12, md: 4.5 }}>
            <Tooltip title="Description">
              <Typography
                variant="body2"
                sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}
              >
                {adjustment?.description || '-'}
              </Typography>
            </Tooltip>
            <Tooltip title="Complement Ledger">
              <Typography variant="caption" color="text.secondary">
                {complementLedger?.name || '-'}
              </Typography>
            </Tooltip>
          </Grid>

          <Grid
            size={{ xs: 12, md: 2 }}
            textAlign="end"
            paddingRight={1}
          >
            <Tooltip title="Amount">
              <Typography variant="body2">
                {adjustment?.amount?.toLocaleString() || '0'}
              </Typography>
            </Tooltip>
          </Grid>

          <Grid textAlign="end" size={{ xs: 12, md: 1.5 }}>
            <Tooltip title="Edit Adjustment">
              <IconButton size="small" onClick={() => setShowForm(true)}>
                <EditOutlined fontSize="small" />
              </IconButton>
            </Tooltip>

            <Tooltip title="Remove Adjustment">
              <IconButton size="small" onClick={handleRemoveItem}>
                <DisabledByDefault fontSize="small" color="error" />
              </IconButton>
            </Tooltip>
          </Grid>
        </Grid>
      ) : (
        <ProjectClaimsAdjustments
          setClearFormKey={setClearFormKey}
          submitMainForm={submitMainForm}
          setSubmitItemForm={setSubmitItemForm}
          submitItemForm={submitItemForm}
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

export default ProjectClaimsAdjustmentsRow;
