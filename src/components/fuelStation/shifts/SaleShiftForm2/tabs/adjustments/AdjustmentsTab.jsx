"use client";

import { useEffect } from 'react';
import { 
  Typography,
  Box,
} from '@mui/material';
import { useFormContext } from 'react-hook-form';
import Adjustments from './Adjustments';
import AdjustmentsRow from './AdjustmentsRow';

function AdjustmentsTab({  
  cashierIndex, 
  localAdjustments, 
  setLocalAdjustments, 
  setValue }) {

  const { watch } = useFormContext();

  useEffect(() => {
    const existingAdjustments = watch(`cashiers.${cashierIndex}.adjustments`) || [];
    if (existingAdjustments.length > 0 && localAdjustments.length === 0) {
      setLocalAdjustments(existingAdjustments);
    }
  }, [cashierIndex, localAdjustments.length]);

  useEffect(() => {
    setValue(`cashiers.${cashierIndex}.adjustments`, localAdjustments, {
      shouldValidate: true,
      shouldDirty: true
    });
  }, [localAdjustments, cashierIndex]);

  return (
    <Box>
        <Adjustments
          adjustments={localAdjustments}
          setAdjustments={setLocalAdjustments}
        />

        {localAdjustments.map((adjustment, index) => (
            <AdjustmentsRow
                key={index}
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