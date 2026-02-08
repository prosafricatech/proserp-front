'use client'

import React from 'react';
import { Box, Chip, Grid, ListItemText, Tooltip, Typography } from '@mui/material';
import CostCenterItemAction from './CostCenterAction';
import { CostCenter } from './CostCenterType';

const CostCenterListItem = ({ costCenter }: {costCenter: CostCenter}) => {
  return (
    <React.Fragment>
      <Grid
        mt={1}
          sx={{
            cursor: 'pointer',
            borderTop: 1,
            borderColor: 'divider',
            '&:hover': {
              bgcolor: 'action.hover',
            },
          }} 
        container columnSpacing={2}
        paddingLeft={2}
        paddingRight={2}
      > 
        <Grid size={{xs: 12, md: 4}}>
          <ListItemText
            primary={
              <Tooltip title="Name">
                <Typography variant="h5" fontSize={14} lineHeight={1.25} mb={0} noWrap>
                  {costCenter.name}
                </Typography>
              </Tooltip>
            }
          />
        </Grid>
        <Grid size={{xs: 6, md: 4}}>
          <ListItemText
            primary={
              <Tooltip title="Type">
                <Typography variant="h5" fontSize={14} lineHeight={1.25} mb={0} noWrap>
                  {costCenter.type}
                </Typography>
              </Tooltip>
            }
          />
        </Grid>
        <Grid size={{xs: 6, md: 2}}
          sx={{ textAlign: { xs: 'end', md: 'start' } }}
          >
            <ListItemText
              primary={
                <Tooltip title="Status">
                  <Typography variant="h5" fontSize={14} lineHeight={1.25} mb={0} noWrap>
                    <Chip
                      label={costCenter.status}
                      sx={{
                        backgroundColor: 
                          costCenter.status === 'active' ? 'success.main' : 
                          costCenter.status === 'suspended' ? 'warning.main' : 'error.main',
                        color: '#fff'
                      }}
                      size="small"
                    />
                  </Typography>
                </Tooltip>
              }
            />
        </Grid>
        { costCenter.type === '' &&
          <Grid size={{xs: 12, md: 2}}>
            <Box display={'flex'} flexDirection={'row'} justifyContent={'flex-end'} > 
              <CostCenterItemAction costCenter={costCenter} />
            </Box>
          </Grid>
        }
      </Grid>
    </React.Fragment>
  );
};

export default CostCenterListItem;
