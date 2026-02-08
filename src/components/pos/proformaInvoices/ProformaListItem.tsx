import React from 'react';
import { Chip, Divider, Grid, Tooltip, Typography } from '@mui/material';
import ProformaItemAction from './ProformaItemAction';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { Proforma } from './ProformaType';

interface ProformaListItemProps {
  proforma: Proforma;
}

const ProformaListItem: React.FC<ProformaListItemProps> = ({ proforma }) => {
  const expiryDate = proforma.expiry_date ? new Date(proforma.expiry_date) : null;
  const currentDate = new Date();
  
  const status = expiryDate ? 
    (currentDate < expiryDate ? "valid" : "expired") : 
    "N/A";
  
  const statusColor = expiryDate ? 
    (currentDate < expiryDate ? "primary" : "warning") : 
    "default";

  return (
    <React.Fragment>
      <Divider />      
      <Grid 
        mt={1} 
        mb={1}
        sx={{
          cursor: 'pointer',
          '&:hover': {
            bgcolor: 'action.hover',
          }
        }}  
        paddingLeft={2}
        paddingRight={2}
        columnSpacing={1}
        alignItems={'center'}
        container
      >
        <Grid size={{ xs: 6, md: 3, lg: 3 }}>
          <Tooltip title='Proforma No'>
            <Typography>{proforma.proformaNo}</Typography>
          </Tooltip>
          <Tooltip title='Proforma Date'>
            <Typography variant='caption'>
              {readableDate(proforma.proforma_date)}
            </Typography>
          </Tooltip>
        </Grid>
        <Grid size={{ xs: 6, md: 3, lg: 3 }}>
          <Tooltip title='Client'>
            <Typography>{proforma.stakeholder?.name}</Typography>
          </Tooltip>
        </Grid>
        <Grid size={{ xs: 6, md: 2, lg: 2 }}>
          <Tooltip title='Expiry Date'>
            <Typography>{proforma?.expiry_date && readableDate(proforma.expiry_date)}</Typography>
          </Tooltip>
        </Grid>
        <Grid size={{ xs: 12, md: 3, lg: 3 }} display={'flex'} alignItems={'center'} justifyContent={'space-between'}>
          <Tooltip title='Status'>
            <Chip
              label={proforma.expiry_date ? status : "N/A"}
              color={proforma.expiry_date ? statusColor : "default"}
              size='small'
            />        
          </Tooltip>
          <Tooltip title='Amount'>
            <Typography>
              {((proforma.amount || 0) + (proforma.vat_amount || 0))?.toLocaleString("en-US", {
                style: "currency",
                currency: proforma.currency.code
              })}
            </Typography>
          </Tooltip>
        </Grid>
        <Grid size={{ xs: 12, md: 1, lg: 1 }} textAlign={"end"}>
          <ProformaItemAction proforma={proforma}/>
        </Grid> 
      </Grid>
    </React.Fragment>
  );
};

export default ProformaListItem;