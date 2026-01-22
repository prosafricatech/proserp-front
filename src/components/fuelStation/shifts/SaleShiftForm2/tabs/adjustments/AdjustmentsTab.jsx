"use client";

import { useEffect, useState } from 'react';
import { 
  Typography,
  Box,
} from '@mui/material';
import Adjustments from './Adjustments';
import AdjustmentsRow from './AdjustmentsRow';

function AdjustmentsTab({  cashierIndex, localAdjustments, setLocalAdjustments, setValue }) {

  useEffect(() => {
    setValue(`cashiers.${cashierIndex}.adjustments`, localAdjustments, {
      shouldValidate: true,
      shouldDirty: true
    });
  }, [localAdjustments, cashierIndex, setValue]);

  return (
    <Box>
        <Adjustments
          adjustments={localAdjustments}
          setAdjustments={setLocalAdjustments}
        />

        {localAdjustments.map((adjustment, index) => (
            <AdjustmentsRow
                adjustment={adjustment}
                index={index}
                adjustments={localAdjustments}
                setAdjustments={setLocalAdjustments}
            />
        ))}
      
      {localAdjustments.length === 0 && (
        <Typography color="textSecondary" textAlign="center" py={4}>
          No Adjustments added for this cashier yet. Add one using the form above.
        </Typography>
      )}
    </Box>
  );
}

export default AdjustmentsTab;