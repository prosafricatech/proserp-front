import JumboCardQuick from '@jumbo/components/JumboCardQuick/JumboCardQuick'
import { Grid } from '@mui/material'
import { DateTimePicker } from '@mui/x-date-pickers'
import dayjs, { Dayjs } from 'dayjs'
import React from 'react'
import { useDashboardSettings } from './Dashboard'
import CostCenterSelector from '../masters/costCenters/CostCenterSelector'
import { useJumboAuth } from '@/app/providers/JumboAuthProvider'
import { CostCenter } from '../masters/costCenters/CostCenterType'

function Filters() {
    const { chartFilters: { from, to }, setChartFilters } = useDashboardSettings();
    const { authOrganization } = useJumboAuth();
    
    return (
        <JumboCardQuick>
            <Grid container justifyContent={'center'} spacing={1}>
                <Grid size={{ xs: 12, md: 6, lg: 3, xl: 2 }}>
                    <DateTimePicker
                        label="From"
                        minDate={dayjs(authOrganization?.organization?.recording_start_date)}
                        value={dayjs(from)}
                        slotProps={{
                            textField: {
                                size: 'small',
                                fullWidth: true,
                            }
                        }}
                        onChange={(value: Dayjs | null) => {
                            setChartFilters((filters) => { 
                                return { ...filters, from: value?.toISOString() || '' }; 
                            });
                        }}
                    />
                </Grid>
                <Grid size={{ xs: 12, md: 6, lg: 3, xl: 2 }}>
                    <DateTimePicker
                        label="To"
                        value={dayjs(to)}
                        minDate={dayjs(authOrganization?.organization?.recording_start_date)}
                        slotProps={{
                            textField: {
                                size: 'small',
                                fullWidth: true,
                            }
                        }}
                        onChange={(value: Dayjs | null) => {
                            setChartFilters((filters) => { 
                                return { ...filters, to: value?.toISOString() || '' }; 
                            });
                        }}
                    />
                </Grid>
                <Grid size={{ xs: 12, lg: 4, xl: 4 }}>
                    <CostCenterSelector
                        label='Cost and Profit Centers'
                        multiple={true}
                        allowSameType={true}
                        onChange={(cost_centers: any) => {
                            let costCenters = authOrganization?.costCenters;
                            let cost_center_ids = authOrganization?.costCenters?.map((cost_center: CostCenter) => cost_center.id) || [];
                            
                            if (cost_centers.length > 0) {
                                cost_center_ids = cost_centers.map((cost_center: CostCenter) => cost_center.id);
                                costCenters = cost_centers;
                            }
                            
                            setChartFilters((filters) => { 
                                return { ...filters, cost_center_ids, costCenters }; 
                            });
                        }}
                    />
                </Grid>
            </Grid>
        </JumboCardQuick>
    )
}

export default Filters