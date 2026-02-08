'use client';

import {
  useJumboLayout,
  useSidebarState,
} from '@jumbo/components/JumboLayout/hooks';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { SIDEBAR_STYLES } from '@jumbo/utilities/constants';
import { TranslationPopover } from '@/components/translationPopover';
import { Stack, useMediaQuery } from '@mui/material';
import React from 'react';
import { SidebarToggleButton } from '../sidebarToggleButton';
import { Search } from './search';
import dynamic from 'next/dynamic';
import { Logo } from '../logo';
import { ThemeModeOption } from './themeModeOptions/ThemeModeOption';

const AuthUserPopover = dynamic(() =>
  import('../authUserPopover').then((mod) => mod.AuthUserPopover),
  { ssr: false }
);

function Header({ dictionary }: { dictionary: any }) {
  const { isSidebarStyle } = useSidebarState();

  const [searchVisibility, setSearchVisibility] = React.useState(false);
  const { theme } = useJumboTheme();
  const { headerOptions } = useJumboLayout();
  const isBelowLg = useMediaQuery(
    theme.breakpoints.down(headerOptions?.drawerBreakpoint ?? 'xl')
  );

  const handleSearchVisibility = React.useCallback((value: boolean) => {
    setSearchVisibility(value);
  }, []);

  return (
    <React.Fragment>
      <SidebarToggleButton />
      {isSidebarStyle(SIDEBAR_STYLES.CLIPPED_UNDER_HEADER) && !isBelowLg && (
        <Logo sx={{ mr: 3, minWidth: 150 }} mode={theme.type} />
      )}
      <Search show={searchVisibility} onClose={handleSearchVisibility} />
      <Stack direction='row' alignItems='center' gap={1.25} sx={{ ml: 'auto' }}>
        <ThemeModeOption />
        {/* <TranslationPopover /> */}
        {/* <SearchIconButtonOnSmallScreen onClick={handleSearchVisibility} /> */}
        {/* <NotificationsPopover /> */}
        <AuthUserPopover dictionary={dictionary}/>
      </Stack>
    </React.Fragment>
  );
}

export { Header };
