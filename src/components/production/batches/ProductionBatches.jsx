'use client'

import React, { useEffect, useState } from 'react'
import { Autocomplete, Divider, Grid, LinearProgress, Stack, TextField } from '@mui/material';
import ProductionBatchesList from './ProductionBatchesList';
import productionBatchesServices from './productionBatchesServices';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import JumboCardQuick from '@jumbo/components/JumboCardQuick';
import { useQuery } from '@tanstack/react-query';

function ProductionBatches() {
  const [activeWorkCenter, setActiveWorkCenter] = useState(null);
  const { authUser } = useJumboAuth();

  const { data: workcenters, isPending: isFetching } = useQuery({
    queryKey: ['userWorkCenters', { userId: authUser?.user?.id, type: 'work center' }],
    queryFn: productionBatchesServices.getUserWorkCenters,
    enabled: !!authUser?.user?.id,
  });

    const [mounted, setMounted] = useState(false);
    useEffect(() => {
      setMounted(true);
    }, []);
  
  useEffect(() => {
    if (workcenters?.length === 1) {
      setActiveWorkCenter(workcenters[0]);
    }
  }, [workcenters]);

  if (isFetching) {
    return <LinearProgress />
  }

  if (!mounted) return null;

  return (
    <JumboCardQuick
      sx={{ height: '100%' }}
    >
      <Stack direction={'column'}>
        <Grid container padding={1} columnSpacing={1} rowGap={2} justifyContent={'center'}>
          <Grid size={{xs: 12, md: 6, lg: 4}}>
            <Autocomplete
              size="small"
              isOptionEqualToValue={(option, value) => option.id === value.id}
              options={workcenters}
              getOptionLabel={(option) => option.name}
              defaultValue={workcenters?.length === 1 ? workcenters[0] : null}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Work Center"
                />
              )}
              onChange={(event, newValue) => {
                if (newValue) {
                  setActiveWorkCenter(newValue);
                } else {
                  setActiveWorkCenter(null);
                }
              }}
            />
          </Grid>
        </Grid>
        <Divider />
        <ProductionBatchesList activeWorkCenter={activeWorkCenter} />
      </Stack>
    </JumboCardQuick>
  );
}

export default ProductionBatches;
