import { readableDate } from '@/app/helpers/input-sanitization-helpers'
import { Grid, ListItemText, Tooltip, Typography } from '@mui/material'
import React from 'react'
import CertificateItemAction from './CertificateItemAction'

function CertificatesListItem({certificate}) {
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
            <Grid size={{xs: 12, md: 4, lg: 4}}>
                <ListItemText
                    primary={
                        <Tooltip title={`Certificate Date`}>
                            <Typography component="span" fontSize={14} lineHeight={1.5} noWrap>
                                {readableDate(certificate.certificate_date,false)}
                            </Typography>
                        </Tooltip>
                    }
                    secondary={
                        <Tooltip title="Certificate No">
                            <Typography component="span">
                                {certificate.certificateNo}
                            </Typography>
                        </Tooltip>
                    }
                />
            </Grid>
            <Grid size={{xs: 12, md: 4, lg: 4}}>
                <ListItemText
                    primary={
                        <Tooltip title="Remarks">
                            <Typography component="span">
                                {certificate.remarks}
                            </Typography>
                        </Tooltip>
                    }
                />
            </Grid>
            <Grid size={{xs: 6, md: 3, lg: 3}}>
                <Tooltip title="Amount">
                    <Typography variant="h6">
                        {certificate?.amount?.toLocaleString('en-US', {
                            style: 'currency',
                            currency: certificate.currency?.code,
                        })}
                    </Typography>
                </Tooltip>
            </Grid>
            <Grid size={{xs: 6, md: 1, lg: 0.5}} textAlign="end">
                <CertificateItemAction certificate={certificate} />
            </Grid>
        </Grid>
    )
}

export default CertificatesListItem