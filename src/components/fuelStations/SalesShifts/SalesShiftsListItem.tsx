import React from 'react';
import { Chip, Divider, Grid, Tooltip, Typography } from '@mui/material';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { SalesShift } from './SalesShiftType';
import SalesShiftItemAction from './SalesShiftItemAction';

interface SalesShiftsListItemProps {
  salesShift: SalesShift;
}

const SalesShiftsListItem: React.FC<SalesShiftsListItemProps> = ({ salesShift }) => {
  const currentDate = new Date();
  const shiftEnd = salesShift.shift_end ? new Date(salesShift.shift_end) : null;
  
  const status = shiftEnd ? 
    (currentDate < shiftEnd ? "active" : "closed") : 
    "active";
  
  const statusColor = shiftEnd ? 
    (currentDate < shiftEnd ? "success" : "default") : 
    "success";

  const totalAmount = salesShift.main_ledger?.amount || 0;

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
          <Tooltip title='Shift Team'>
            <Typography>{salesShift.shift_team?.name}</Typography>
          </Tooltip>
          <Tooltip title='Shift Start'>
            <Typography variant='caption'>
              {readableDate(salesShift.shift_start)}
            </Typography>
          </Tooltip>
        </Grid>
        <Grid size={{ xs: 6, md: 3, lg: 3 }}>
          <Tooltip title='Station'>
            <Typography>{salesShift.station?.name}</Typography>
          </Tooltip>
        </Grid>
        <Grid size={{ xs: 6, md: 2, lg: 2 }}>
          <Tooltip title='Shift End'>
            <Typography>{salesShift?.shift_end && readableDate(salesShift.shift_end)}</Typography>
          </Tooltip>
        </Grid>
        <Grid size={{ xs: 12, md: 3, lg: 3 }} display={'flex'} alignItems={'center'} justifyContent={'space-between'}>
          <Tooltip title='Status'>
            <Chip
              label={status}
              color={statusColor}
              size='small'
            />        
          </Tooltip>
          <Tooltip title='Total Amount'>
            <Typography>
              {totalAmount.toLocaleString("en-US", {
                style: "currency",
                currency: "TZS" // Adjust based on your currency
              })}
            </Typography>
          </Tooltip>
        </Grid>
        <Grid size={{ xs: 12, md: 1, lg: 1 }} textAlign={"end"}>
          <SalesShiftItemAction salesShift={salesShift}/>
        </Grid> 
      </Grid>
    </React.Fragment>
  );
};

export default SalesShiftsListItem;