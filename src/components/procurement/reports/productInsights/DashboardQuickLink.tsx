'use client'
import { InsightsOutlined } from '@mui/icons-material'
import { Button, Dialog, DialogActions, Typography, useMediaQuery } from '@mui/material'
import React, { useState } from 'react'
import ProductInsights from './ProductInsights';
import useProsERPStyles from '@/app/helpers/style-helpers';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { Div } from '@jumbo/shared';

function DashboardQuickLink() {
  const css = useProsERPStyles();
  const [openDialog, setOpenDialog] = useState(false);

  //Screen handling constants
  const {theme} = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  return (
    <React.Fragment>
      <Dialog scroll={belowLargeScreen ? 'body' : 'paper'} fullWidth fullScreen={belowLargeScreen} maxWidth={'md'} open={openDialog}>
          <ProductInsights/>
          <DialogActions className={css.hiddenOnPrint}>
              <Button sx={{ m:1 }} size='small' variant='outlined' onClick={() =>{setOpenDialog(false)}}>
                  Close
              </Button>
          </DialogActions>
      </Dialog>
      <Div onClick={() => setOpenDialog(true)}>
        <InsightsOutlined  sx={{ fontSize: '40px' }} />
        <Typography>Product Insights</Typography>
      </Div>
    </React.Fragment>
  )
}

export default DashboardQuickLink