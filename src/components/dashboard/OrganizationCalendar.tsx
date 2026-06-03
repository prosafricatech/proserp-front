'use client';
import JumboCardQuick from '@jumbo/components/JumboCardQuick';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { Alert, useMediaQuery } from '@mui/material';

function OrganizationCalendar() {
  const { theme } = useJumboTheme();
  const smallScreen = useMediaQuery(theme.breakpoints.down('md'));
  const midScreen = useMediaQuery(theme.breakpoints.down('lg'));
  return (
    <JumboCardQuick
      title={'Organization Calendar'}
      sx={{ height: midScreen ? 360 : null }}
    >
      <Alert variant={'outlined'} severity={'info'}>
        No any events on calender
      </Alert>
    </JumboCardQuick>
  );
}

export default OrganizationCalendar;
