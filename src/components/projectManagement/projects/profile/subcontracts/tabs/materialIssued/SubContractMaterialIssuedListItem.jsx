import { Grid, Tooltip, Typography } from '@mui/material';
import React from 'react';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';

function SubContractMaterialIssuedListItem({ subContractMaterialsUsed }) {
    const hasDate = Boolean(subContractMaterialsUsed?.date);

    return (
        <Grid
            sx={{
                cursor: 'pointer',
                borderTop: 1,
                borderColor: 'divider',
                '&:hover': {
                    bgcolor: 'action.hover',
                },
                padding: 1,
            }}
            columnSpacing={2}
            alignItems={'center'}
            container
        >
            {hasDate && (
                <Grid size={{xs: 12, md: 4}}>
                    <Tooltip title={'Used Date'}>
                        <Typography variant="h6">
                            {readableDate(subContractMaterialsUsed?.date, true)}
                        </Typography>
                    </Tooltip>
                </Grid>
            )}

            <Grid size={{xs: hasDate ? 6 : 8, md: hasDate ? 4 : 6}} textAlign={'start'}>
                <Tooltip title="Product Name">
                    <Typography component="span">
                        {subContractMaterialsUsed?.product_name}
                    </Typography>
                </Tooltip>
            </Grid>

            <Grid size={{xs: hasDate ? 6 : 4, md: hasDate ? 4 : 6}} textAlign={hasDate ? "end" : 'start'}>
                <Tooltip title="Quantity">
                    <Typography component="span">
                        {subContractMaterialsUsed?.quantity} {subContractMaterialsUsed?.measurement_unit?.symbol}
                    </Typography>
                </Tooltip>
            </Grid>
        </Grid>
    );
}

export default SubContractMaterialIssuedListItem;
