"use client";

import React, { useEffect, useState } from 'react'
import { Autocomplete, Divider, Grid, LinearProgress, Stack, TextField } from '@mui/material';
import JumboCardQuick from '@jumbo/components/JumboCardQuick';
import fuelStationServices from '../fuelStationServices';
import Dippings from './Dippings';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { useQuery } from '@tanstack/react-query';

function DippingsSelector() {
    const [activeStation, setActiveStation] = useState(null);

    const { authUser } = useJumboAuth();
    const { data: stations, isFetching } = useQuery({
    queryKey: ['userStations', {
        userId: authUser?.user?.id,
    }],
    queryFn: fuelStationServices.getUserStations
});

    useEffect(() => {
        if (stations?.length === 1) {
            setActiveStation(stations[0]);
        }
    }, [stations]);

    if (isFetching) {
        return <LinearProgress />
    }

    return (
        <JumboCardQuick
            sx={{ height: '100%' }}
        >
            <Stack direction={'column'}>
                <Grid container padding={1} columnSpacing={1} rowGap={2} justifyContent={'center'}>
                    <Grid size={{xs:12, md:6, lg:4}}>
                        <Autocomplete
                            size="small"
                            isOptionEqualToValue={(option, value) => option.id === value.id}
                            options={stations}
                            getOptionLabel={(option) => option.name}
                            defaultValue={stations.length === 1 ? stations[0] : null}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Station"
                                />
                            )}
                            onChange={(event, newValue) => {
                                if (newValue) {
                                    setActiveStation(newValue);
                                } else {
                                    setActiveStation(null);
                                }
                            }}
                        />
                    </Grid>
                </Grid>
                <Divider />
                <Dippings activeStation={activeStation} />
            </Stack>
        </JumboCardQuick>
    );
}

export default DippingsSelector;
