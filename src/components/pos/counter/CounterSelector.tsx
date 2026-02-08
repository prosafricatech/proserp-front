'use client'

import {
    Autocomplete,
    Divider,
    Grid,
    LinearProgress,
    TextField
} from '@mui/material';
import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Counter, Outlet, useCounter } from './CounterProvider';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import posServices from '../pos-services';

interface UserOutletsParams {
    userId?: string;
    organizationId?: string;
}

const ALL_OUTLET: any = {
    id: 'all',
    name: 'All Outlets',
    counters: [{ id: 'all', name: 'All' }]
};

const CounterSelector = () => {
    const { authUser, authOrganization } = useJumboAuth();
    const organization = authOrganization?.organization;

    const userOutletsParams: UserOutletsParams = {
        userId: authUser?.user?.id,
        organizationId: organization?.id,
    };

    const {
        data: rawOutlets = [],
        isFetching
    } = useQuery<Outlet[], Error, Outlet[], ['userSalesOutlets', UserOutletsParams]>({
        queryKey: ['userSalesOutlets', userOutletsParams],
        queryFn: ({ queryKey }) => posServices.getUserOutlets(queryKey[1]),
        enabled: !!authUser?.user?.id && !!organization?.id,
    });

    const outlets: Outlet[] = useMemo(() => {
        return [ALL_OUTLET, ...rawOutlets];
    }, [rawOutlets]);

    const [counters, setCounters] = useState<Counter[]>([]);
    const { activeCounter, setActiveCounter, setOutlet } = useCounter();

    // Determine selected outlet from activeCounter
    const selectedOutlet = useMemo(() => {
        return outlets.find(
            o => o.id === activeCounter?.id || o.counters?.some(c => c.id === activeCounter?.id)
        ) || null;
    }, [outlets, activeCounter]);

    // Set initial outlet and counter
    useEffect(() => {
        if (rawOutlets.length === 1) {
            const singleOutlet = rawOutlets[0];
            setOutlet(singleOutlet);
            setCounters(singleOutlet.counters);
            if (singleOutlet.counters.length > 0) {
                setActiveCounter(singleOutlet.counters[0]);
            }
        } else if (rawOutlets.length > 1) {
            setOutlet(ALL_OUTLET);
            setCounters(ALL_OUTLET.counters);
            setActiveCounter(ALL_OUTLET.counters[0]);
        }
    }, [rawOutlets, setOutlet, setActiveCounter]);

    if (isFetching) {
        return <LinearProgress />;
    }

    return (
        <Grid container padding={1} spacing={2} justifyContent="center">
            <Grid size={{xs: 12, md: 4}}>
                <Autocomplete<Outlet>
                    size="small"
                    options={outlets}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    getOptionLabel={(option) => option.name}
                    value={selectedOutlet}
                    onChange={(event, newValue) => {
                        if (newValue) {
                            setOutlet(newValue);
                            setCounters(newValue.counters);
                            if (newValue.counters.length > 0) {
                                setActiveCounter(newValue.counters[0]);
                            } else {
                                setActiveCounter(null);
                            }
                        } else {
                            setOutlet(null);
                            setCounters([]);
                            setActiveCounter(null);
                        }
                    }}
                    renderInput={(params) => <TextField {...params} label="Outlet" />}
                />
            </Grid>
            <Grid size={{xs: 12, md: 4}}>
                <Autocomplete<Counter>
                    size="small"
                    options={counters}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    getOptionLabel={(option) => option.name}
                    value={activeCounter}
                    onChange={(event, newValue) => {
                        setActiveCounter(newValue);
                    }}
                    disabled={counters.length === 0}
                    renderInput={(params) => <TextField {...params} label="Counter" />}
                />
            </Grid>
            <Grid size={12}>
                <Divider />
            </Grid>
        </Grid>
    );
};

export default CounterSelector;
