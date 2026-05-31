import { DisabledByDefault, EditOutlined } from '@mui/icons-material';
import { Divider, Grid, IconButton, Tooltip, Typography } from '@mui/material';
import React, { useState } from 'react';
import PurchaseRequisitionAdditionalCostsTab from './PurchaseRequisitionAdditionalCostsTab';

interface AdditionalCostsTabRowProp {
  additionalCost: any;
  setIsDirty: any;
  index: number;
  additionalCosts: Array<any>;
  setAdditionalCosts: any;
}

function PurchaseRequisitionAdditionalCostsTabRow({
  additionalCost,
  setIsDirty,
  index,
  additionalCosts = [],
  setAdditionalCosts,
}: AdditionalCostsTabRowProp) {
  const [showForm, setShowForm] = useState(false);

  return (
    <React.Fragment>
      <Divider sx={{ mt: 2 }} />
      {!showForm ? (
        <Grid
          container
          sx={{
            cursor: 'pointer',
            '&:hover': {
              bgcolor: 'action.hover',
            },
          }}
        >
          <Grid size={{ xs: 1, md: 1 }}>{index + 1}.</Grid>
          <Grid size={{ xs: 7, md: 3 }}>
            <Tooltip title='Cost name'>
              <Typography>
                {additionalCost.credit_ledger_name || additionalCost.name}
              </Typography>
            </Tooltip>
          </Grid>
          <Grid
            size={{ xs: 4, md: 3 }}
            textAlign={{ xs: 'right', md: 'start' }}
          >
            <Tooltip title='Reference'>
              <Typography>{additionalCost.reference}</Typography>
            </Tooltip>
          </Grid>
          <Grid size={{ xs: 6, md: 3 }} textAlign={{ md: 'right' }}>
            <Tooltip title='Amount'>
              <Typography>
                {parseFloat(additionalCost.amount)?.toLocaleString('en-US', {
                  maximumFractionDigits: 2,
                  minimumFractionDigits: 2,
                })}
              </Typography>
            </Tooltip>
          </Grid>
          <Grid textAlign={'end'} size={{ xs: 6, md: 2 }}>
            <Tooltip title='Edit Additional Cost'>
              <IconButton
                size='small'
                onClick={() => {
                  setShowForm(true);
                }}
              >
                <EditOutlined fontSize='small' />
              </IconButton>
            </Tooltip>
            <Tooltip title='Remove Additional Cost'>
              <IconButton
                size='small'
                onClick={() =>
                  setAdditionalCosts((additionalCosts: any) => {
                    const newItems = [...additionalCosts];
                    newItems.splice(index, 1);
                    return newItems;
                  })
                }
              >
                <DisabledByDefault fontSize='small' color='error' />
              </IconButton>
            </Tooltip>
          </Grid>
        </Grid>
      ) : (
        <PurchaseRequisitionAdditionalCostsTab
          additionalCost={additionalCost}
          setIsDirty={setIsDirty}
          setShowForm={setShowForm}
          index={index}
          additionalCosts={additionalCosts}
          setAdditionalCosts={setAdditionalCosts}
        />
      )}
    </React.Fragment>
  );
}

export default PurchaseRequisitionAdditionalCostsTabRow;
