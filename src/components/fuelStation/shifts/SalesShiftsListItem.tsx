import React, { useContext } from 'react';
import { Box, Chip, Grid, Tooltip, Typography } from '@mui/material';
import { StationFormContext } from './SalesShifts';
import SalesShiftsItemAction from './SalesShiftsItemAction';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { SalesShift } from './SalesShiftTypes';

const SalesShiftsListItem = ({ salesShift }) => {
    const {activeStation} = useContext(StationFormContext);
    const { shift_teams } = activeStation;

  return (
    <Grid 
      container 
      columnSpacing={2}   
      alignItems={'center'}
      sx={{
        cursor: 'pointer',
        borderTop: 1,
        borderColor: 'divider',
        '&:hover': {
          bgcolor: 'action.hover',
        },
        paddingTop: 2,
        paddingLeft: 3,
        paddingRight:2,
    }}
    >
        <Grid size={{xs:6, md:2}}>
            <Tooltip title='Shift No'>
                <Typography fontWeight={'bold'}>
                    {salesShift.shiftNo}
                </Typography>
            </Tooltip>
        </Grid>
        <Grid size={{xs:6, md:3}}>
            <Tooltip title='Shift Team'>
                <Typography>
                    {shift_teams?.find(team => team.id === salesShift.shift_team_id)?.name}
                </Typography>
            </Tooltip>
        </Grid>
        <Grid size={{xs:6, md:2}}>
            <Tooltip title='Shift Start'>
                <Typography>
                    {readableDate(salesShift.shift_start, true)}
                </Typography>
            </Tooltip>
        </Grid>
        <Grid size={{xs:6, md:2}}>
            <Tooltip title='Shift End'>
                <Typography>
                    {readableDate(salesShift.shift_end, true)}
                </Typography>
            </Tooltip>
        </Grid>
        <Grid size={{xs:6, md:2}}>
            <Tooltip title='Status'>
                <Chip
                    size='small' 
                    label={salesShift.status}
                    color={salesShift.status === 'closed'? 'success' : 'primary'}
                /> 
            </Tooltip>
        </Grid>
        <Grid size={{xs:6, md:1}}>
            <Box display={'flex'} flexDirection={'row'} justifyContent={'flex-end'} > 
                <SalesShiftsItemAction salesShift={salesShift} />
            </Box>
        </Grid>
    </Grid>
  );
};

export default SalesShiftsListItem;