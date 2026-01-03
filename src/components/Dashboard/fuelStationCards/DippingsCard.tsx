'use client'
import JumboCardQuick from '@jumbo/components/JumboCardQuick';
import { Autocomplete, Grid, LinearProgress, Typography, TextField, Checkbox, Chip, useMediaQuery, FormControl, InputLabel, Select, MenuItem, ButtonGroup, Tooltip, Button } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useDashboardSettings } from '../Dashboard';
import DippingTrend from './DippingTrend';
import LatestDippings from './LatestDippings';
import { CheckBox, CheckBoxOutlineBlank } from '@mui/icons-material';
import { deviceType } from '@/utilities/helpers/user-agent-helpers';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { useQuery } from '@tanstack/react-query';
import { Div } from '@jumbo/shared';
import { CostCenter } from '@/components/masters/costCenters/CostCenterType';
import fuelStationServices from '@/components/fuelStation/fuelStationServices';

interface DippingReportParams {
  from: string;
  to: string;
  fuel_station_ids: number[] | undefined;
  with_calculated_stock: number;
}

function DippingsCard() {
    const { chartFilters: { from, to, costCenters } } = useDashboardSettings();
    const isMobile = deviceType() === 'mobile';

    const fuelStationCostCenters = React.useMemo(
        () => costCenters?.filter(cost_center => cost_center.type === 'Fuel Station'),
        [costCenters]
    );

    // Screen handling constants
    const { theme } = useJumboTheme();
    const smallScreen = useMediaQuery(theme.breakpoints.down('md')) || isMobile;
    const midScreen = useMediaQuery('(min-width: 960.1px) and (max-width: 1279.9px)');

    const [selectedStations, setSelectedStations] = useState<CostCenter[]>([]);
    const [selectedType, setSelectedType] = useState<'closing' | 'deviation' | 'calculated stock'>('closing');
    const [params, setParams] = useState<DippingReportParams>({
        from,
        to,
        fuel_station_ids: fuelStationCostCenters
            ?.map(cost_center => cost_center.cost_centerable_id)
            .filter((id): id is number => id !== undefined),
        with_calculated_stock: 0,
    });

    useEffect(() => {
        setParams(prevParams => ({
            ...prevParams,
            from,
            to,
            fuel_station_ids:
            selectedStations.length > 0
                ? selectedStations
                    .map(station => station.cost_centerable_id)
                    .filter((id): id is number => id !== undefined)
                : fuelStationCostCenters
                    ?.map(cost_center => cost_center.cost_centerable_id)
                    .filter((id): id is number => id !== undefined),
            with_calculated_stock: selectedType === 'closing' ? 0 : 1,
        }));
    }, [from, to, selectedStations, fuelStationCostCenters, selectedType]);

    const { data: reportData, isLoading } = useQuery({
        queryKey: ['dippingsReport', params],
        queryFn: async () => {
            return await fuelStationServices.dippingReport(params);
        }
    });

    return (
        <JumboCardQuick
            sx={{
                height: smallScreen ? 700 : 310
            }}
            title={
                isLoading ? <LinearProgress/> : (
                    !smallScreen && !midScreen ? 
                    <>
                        <Grid container spacing={1} borderBottom={1} borderColor={'divider'} pb={1}>
                            <Grid size={{ xs: 12, md: 2 }}>
                                <Typography variant='h4'>Dippings</Typography>
                            </Grid>
                            <Grid size={{ xs: 6, md: 10, lg: 10 }} textAlign={'end'}> 
                                <ButtonGroup
                                    variant="outlined"
                                    size='small'
                                    disableElevation
                                >
                                    <Tooltip title={'Closing'}>
                                        <Button variant={selectedType === 'closing' ? "contained" : "outlined"}
                                            onClick={() => setSelectedType('closing')}
                                        >Closing</Button>
                                    </Tooltip>
                                    <Tooltip title={'Deviation'}>
                                        <Button variant={selectedType === 'deviation' ? "contained" : "outlined"}
                                            onClick={() => setSelectedType('deviation')}
                                        >Deviation</Button>
                                    </Tooltip>
                                    <Tooltip title={'Calculated Stock'}>
                                        <Button variant={selectedType === 'calculated stock' ? "contained" : "outlined"}
                                            onClick={() => setSelectedType('calculated stock')}
                                        >Stock</Button>
                                    </Tooltip>
                                </ButtonGroup>
                            </Grid>
                        </Grid>
                        <Grid container spacing={5}>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <DippingTrend reportData={reportData as any} selectedType={selectedType as any}/>
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <LatestDippings reportData={reportData as any} selectedType={selectedType as any}/>
                            </Grid>
                        </Grid>
                    </>
                    :
                    <Grid container spacing={1} columnSpacing={3}>
                        <Grid size={{ xs: 12 }} mb={1}>
                            <Grid container spacing={1} borderBottom={1} borderColor={'divider'}>
                                <Grid size={{ xs: 8, md: 1.5, lg: 2.5 }}>
                                    <Typography variant='h4'>Dippings</Typography>
                                </Grid>
                                <Grid size={{ xs: 4, md: 4, lg: 11.5 }} textAlign={'end'}>
                                    <Div>
                                        <FormControl fullWidth size='small'>
                                            <InputLabel id="selected-display-trend-group-by-input-label">Display</InputLabel>
                                            <Select
                                                labelId="selected-display-group-by-label"
                                                id="selected-display-group-by"
                                                value={selectedType}
                                                label={'Display'}
                                                onChange={(e) => {
                                                    setSelectedType(e.target.value as 'closing' | 'deviation' | 'calculated stock');
                                                }}
                                            >
                                                <MenuItem value='closing'>Closing</MenuItem>
                                                <MenuItem value='deviation'>Deviation</MenuItem>
                                                <MenuItem value='calculated stock'>Stock</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Div>
                                </Grid>
                            </Grid>
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <DippingTrend reportData={reportData as any} selectedType={selectedType as any}/>
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <LatestDippings reportData={reportData as any} selectedType={selectedType as any}/>
                        </Grid>
                    </Grid>
                )
            }
        >
        </JumboCardQuick>
    );
}

export default DippingsCard;