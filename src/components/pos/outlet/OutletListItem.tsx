import React from 'react';
import {
  Divider,
  Grid,
  Typography,
  Tooltip,
  Chip,
  Stack,
} from '@mui/material';
import { styled} from '@mui/material/styles';
import OutletListItemAction from './OutletListItemAction';
import { Outlet } from './OutletType';
import PointOfSaleOutlinedIcon from '@mui/icons-material/PointOfSaleOutlined';
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined';
import Badge from '@mui/material/Badge';

  interface OutletItemProps {
  outlet: Outlet;
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

  const OutletListItem: React.FC<OutletItemProps> = ({ outlet }) => {
  
    return (
      <>
        <Divider />
          <Grid
            container
            spacing={1}
            alignItems="center"
            px={2}
            py={1}
            paddingRight={3}
            sx={{
              cursor: 'pointer',
              '&:hover': {
                bgcolor: 'action.hover',
              },
            }}
          >
          {/* Name + Type */}
            <Grid size={{ xs: 12, md: 3 }}>
            <Tooltip title={outlet.name}>
            <Typography variant="subtitle1" noWrap>
                {outlet.name}
            </Typography>
            </Tooltip>
              <Tooltip title={outlet.type}>
              <Typography variant="caption" color="text.secondary" noWrap>
                {outlet.type}
            </Typography>
            </Tooltip>
            </Grid>
            {/* Address */}
              <Grid size={{ xs: 12, md: 3 }}>
                <Tooltip title={outlet.address}>
                <Typography variant="body2" noWrap>
                  {outlet.address}
                </Typography>
                </Tooltip>
              </Grid>
                  {/* Stores */}
                <Grid size={{ xs: 8, md: 3, }}>
                  <Stack
                    direction="row"
                    spacing={0.5}
                    rowGap={0.5}
                    flexWrap="wrap"
                    useFlexGap
                  >
                    {outlet.stores?.map((store) => (
                      <Tooltip key={store.id} title={store.name}>
                      <StyledBadgeChip
                        key={store.id}
                        label={store.name}
                        size="small"
                      />
                      </Tooltip>
                    ))}
                  </Stack>
                </Grid>
                    <Grid size={{ xs: 4, md: 2 }} container justifyContent="flex-end">
                      <Grid>
                        <Tooltip title={`Counters: ${outlet.counters?.length ?? 0}`}>
                          <StyledCountBadge
                            badgeContent={outlet.counters?.length ?? 1}
                            color="primary"
                          >
                            <PointOfSaleOutlinedIcon fontSize="small" />
                          </StyledCountBadge>
                        </Tooltip>
                      </Grid>
                        <Grid>
                          <Tooltip title={`Users: ${outlet.users?.length ?? 0}`}>
                            <StyledCountBadge
                              badgeContent={outlet.users?.length ?? 1}
                              color="primary"
                        >
                          <PeopleOutlinedIcon fontSize="small" />
                        </StyledCountBadge>
                      </Tooltip>
                    </Grid>
                  </Grid>
              {/* Action Menu */}
              <Grid size={{ xs: 12, md: 1 }} textAlign="end">
              <OutletListItemAction outlet={outlet} />
              </Grid>
            </Grid>
          </>
        );
      };

export default OutletListItem;
