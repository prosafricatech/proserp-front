'use client'
import JumboCardQuick from '@jumbo/components/JumboCardQuick'
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { Alert, useMediaQuery } from '@mui/material';
import React from 'react'

function OrganizationCalendar() {

  const {theme} = useJumboTheme();
  const smallScreen = useMediaQuery(theme.breakpoints.down('md'));
  return (
    <JumboCardQuick
        title={'Organization Calendar'}
        sx={{ 
          height: smallScreen ?  200 : 278
       }}
    >
      <Alert variant={'outlined'} severity={'info'}>No any events on calender</Alert>
    </JumboCardQuick>
  )
}

export default OrganizationCalendar