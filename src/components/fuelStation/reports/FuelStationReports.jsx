'use client'

import JumboCardQuick from '@jumbo/components/JumboCardQuick/JumboCardQuick'
import { Button, Dialog, DialogActions, Grid, Typography, useMediaQuery } from '@mui/material'
import React, { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTableCells } from '@fortawesome/free-solid-svg-icons'
import DippingReport from './dippingReport/DippingReport'
import useProsERPStyles from '@/app/helpers/style-helpers'
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks'

function FuelStationReports() {
  const css = useProsERPStyles();
  const [openDippingReport, setOpenDippingReport] = useState(false);
  const [report, setReport] = useState(null);

  //Screen handling constants
  const {theme} = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  return (
    <>
      <Typography variant={'h4'} mb={2}>Fuel Station Reports</Typography>
      <Dialog 
        scroll={belowLargeScreen ? 'body' : 'paper'} 
        fullWidth
        maxWidth={'lg'}
        open={openDippingReport}
      >
        {report}
        <DialogActions className={css.hiddenOnPrint}>
          <Button sx={{ m:1 }} size='small' variant='outlined' onClick={() =>{setOpenDippingReport(false);}}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
      <JumboCardQuick 
        sx={{ height:'100%'  }}
      >
        <Grid container textAlign={'center'} columnSpacing={2} rowSpacing={2}>
          <Grid 
            sx={{ 
              cursor: 'pointer',
              '&:hover': {
                bgcolor: 'action.hover',
              }
            }}
            size={{xs: 6, md: 3, lg: 2}}
            p={1}
            textAlign={'center'}
            onClick={() => {
              setReport(<DippingReport/>)
              setOpenDippingReport(true);
            }}
          >
            <FontAwesomeIcon size='lg' icon={faTableCells} style={{ fontSize: '48px' }}/>
            <Typography>Dipping Report</Typography>
          </Grid>
        </Grid>
      </JumboCardQuick>
    </>
  )
}

export default FuelStationReports