'use client'

import React, { useEffect, useState } from 'react'
import SalesShifts from './SalesShifts'
import fuelStationServices from '../fuelStationServices';
import { Autocomplete, Divider, Grid, LinearProgress, Stack, TextField } from '@mui/material';
import JumboCardQuick from '@jumbo/components/JumboCardQuick';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { useQuery } from '@tanstack/react-query';

function StationShiftsSelector() {
    const [activeStation, setActiveStation] = useState(null);
    const [isClient, setIsClient] = useState(false); // ← Add this
    const { authUser } = useJumboAuth();
    const { data: stations, isFetching } = useQuery({
        queryKey: ['userStations', { userId: authUser?.user?.id }],
        queryFn: fuelStationServices.getUserStations,
        enabled: !!authUser?.user?.id,
    });

    useEffect(() => {
        setIsClient(true); // ← Set to true only on client
    }, []);

    useEffect(() => {
        if (stations?.length === 1) {
            setActiveStation(stations[0]);
        }
    }, [stations]);

    // ← Only show loading on client side during fetching
    if (isClient && isFetching) {
        return <LinearProgress />
    }

    return (
        <JumboCardQuick
            sx={{ height: '100%' }}
        >
            <Stack direction={'column'}>
                <Grid container padding={1} columnSpacing={1} rowGap={2} justifyContent={'center'}>
                    <Grid size={{xs: 12, md: 6, lg: 4}}>
                        <Autocomplete
                            size="small"
                            isOptionEqualToValue={(option, value) => option?.id === value?.id}
                            options={stations || []} // Added fallback for undefined
                            getOptionLabel={(option) => option?.name}
                            value={activeStation} // Use value instead of defaultValue
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Station"
                                />
                            )}
                            onChange={(event, newValue) => {
                                setActiveStation(newValue);
                            }}
                        />
                    </Grid>
                </Grid>
                <Divider />
                <SalesShifts activeStation={activeStation} />
            </Stack>
        </JumboCardQuick>
    );
}

export default StationShiftsSelector;