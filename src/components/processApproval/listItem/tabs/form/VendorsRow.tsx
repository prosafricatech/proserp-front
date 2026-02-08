import { Stakeholder } from '@/components/masters/stakeholders/StakeholderType';
import { Grid, Tooltip, Typography } from '@mui/material';
import React from 'react';

interface Vendor {
  id?: number;
  name?: string;
  remarks?: string;
  stakeholder?: Stakeholder;
  [key: string]: any;
}

interface VendorsRowProps {
  index: number;
  vendor: Vendor;
}

function VendorsRow({ index, vendor }: VendorsRowProps) {
    const client = vendor.stakeholder;

    return (
        <React.Fragment>
            <Grid container 
                padding={1}
                sx={{
                    cursor: 'pointer',
                    '&:hover': {
                        bgcolor: 'action.hover',
                    }
                }}
            >
                <Grid size={{xs: 1, md: 0.5}}>
                    {index + 1}.
                </Grid>
                <Grid size={{xs: 5, md: 8}}>
                    <Tooltip title="Vendor">
                        <Typography>{client?.name || vendor?.name}</Typography>
                    </Tooltip>
                </Grid>
                <Grid size={{xs: 6, md: 3.5}}>
                    <Tooltip title="Remarks">
                        <Typography>{vendor.remarks}</Typography>
                    </Tooltip>
                </Grid>
            </Grid>
        </React.Fragment>
    );
}

export default VendorsRow;