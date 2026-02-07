import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import PeopleIcon from '@mui/icons-material/People';
import PropaneTankIcon from '@mui/icons-material/PropaneTank';
import { Badge, Chip, Divider, Grid, Tooltip, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import React from 'react';
import StationItemAction from './StationItemAction';
import { Station } from './StationType';

interface StationListItemProps {
  station: Station;
  onClick?: (station: Station) => void;
}

const StyledCountBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    right: -6,
    top: 0,
    border: `2px solid ${theme.palette.background.paper}`,
    padding: '0 4px',
    fontSize: '0.75rem',
    backgroundColor: theme.palette.primary.main,
    color: '#fff',
    fontWeight: 600,
    borderRadius: '50%',
    height: 18,
    minWidth: 18,
  },
}));

const StyledBadgeChip = styled(Chip)(({ theme }) => ({
  borderRadius: 12,
  fontSize: 12,
  fontWeight: 500,
  backgroundColor: theme.palette.grey[100],
  border: `1px solid ${theme.palette.divider}`,
  color: theme.palette.text.primary,
}));

const StationListItem = React.memo(
  ({ station, onClick }: StationListItemProps) => {
    // Count unique tanks from fuel pumps
    const uniqueTankCount = React.useMemo(() => {
      if (!station.fuel_pumps?.length) return 0;
      const uniqueTankIds = new Set(
        station.fuel_pumps.map((pump) => pump.tank_id).filter(Boolean)
      );
      return uniqueTankIds.size;
    }, [station.fuel_pumps]);

    // Count fuel pumps
    const fuelPumpCount = station.fuel_pumps?.length || 0;

    // Count users
    const userCount = station.users?.length || 0;

    return (
      <>
        <Divider />
        <Grid
          container
          spacing={2}
          alignItems='center'
          px={2}
          py={1}
          paddingRight={3}
          sx={{
            cursor: onClick ? 'pointer' : 'default',
            '&:hover': {
              bgcolor: onClick ? 'action.hover' : 'transparent',
            },
          }}
          onClick={() => onClick?.(station)}
        >
          {/* Station Name */}
          <Grid size={{ xs: 12, md: 2.5 }}>
            <Tooltip title='Station Name'>
              <Typography variant='subtitle1' noWrap>
                {station.name}
              </Typography>
            </Tooltip>
          </Grid>

          <Grid container size={{ xs: 12, md: 9.5 }}>
            <Grid size={{ xs: 10, md: 10 }} container justifyContent='start'>
              {/* Fuel Pump Badge */}
              <Grid
                size={{ xs: 1.5, md: 1.5 }}
                container
                justifyContent='center'
              >
                <Tooltip title='Fuel Pumps'>
                  <StyledCountBadge
                    badgeContent={fuelPumpCount}
                    color='primary'
                  >
                    <LocalGasStationIcon fontSize='small' />
                  </StyledCountBadge>
                </Tooltip>
              </Grid>

              {/* Tanks Badge */}
              <Grid
                size={{ xs: 1.5, md: 1.5 }}
                container
                justifyContent='center'
              >
                <Tooltip title='Tanks'>
                  <StyledCountBadge
                    badgeContent={uniqueTankCount}
                    color='primary'
                  >
                    <PropaneTankIcon fontSize='small' />
                  </StyledCountBadge>
                </Tooltip>
              </Grid>

              {/* Users Badge */}
              <Grid
                size={{ xs: 1.5, md: 1.5 }}
                container
                justifyContent='center'
              >
                <Tooltip title='Users'>
                  <StyledCountBadge badgeContent={userCount} color='primary'>
                    <PeopleIcon fontSize='small' />
                  </StyledCountBadge>
                </Tooltip>
              </Grid>

              {/* Address */}
              <Grid size={{ xs: 3, md: 3 }} textAlign='end'>
                <Tooltip title='Address'>
                  <Typography variant='body2' noWrap>
                    {station.address || ''}
                  </Typography>
                </Tooltip>
              </Grid>
            </Grid>
            {/* Action Menu */}
            <Grid size={{ xs: 2, md: 2 }} textAlign='end'>
              <StationItemAction station={station} />
            </Grid>
          </Grid>
        </Grid>
      </>
    );
  }
);

export default StationListItem;
