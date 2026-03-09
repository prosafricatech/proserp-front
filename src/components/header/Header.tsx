'use client';

import {
  useJumboLayout,
  useSidebarState,
} from '@jumbo/components/JumboLayout/hooks';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { SIDEBAR_STYLES } from '@jumbo/utilities/constants';
// import { TranslationPopover } from '@/components/translationPopover';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import RefreshIcon from '@mui/icons-material/Refresh';
import { IconButton, Stack, Tooltip, useMediaQuery } from '@mui/material';
import dynamic from 'next/dynamic';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import React from 'react';
import { Logo } from '../logo/Logo';
import { SidebarToggleButton } from '../sidebarToggleButton';
import { Search } from './search';
import { ThemeModeOption } from './themeModeOptions/ThemeModeOption';

const AuthUserPopover = dynamic(
  () => import('../authUserPopover').then((mod) => mod.AuthUserPopover),
  { ssr: false }
);

function Header({ dictionary }: { dictionary: any }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isSidebarStyle } = useSidebarState();

  const [searchVisibility, setSearchVisibility] = React.useState(false);
  const [navigationStack, setNavigationStack] = React.useState<string[]>([]);
  const [navigationIndex, setNavigationIndex] = React.useState(0);
  const { theme } = useJumboTheme();
  const { headerOptions } = useJumboLayout();
  const isBelowLg = useMediaQuery(
    theme.breakpoints.down(headerOptions?.drawerBreakpoint ?? 'xl')
  );
  const smallScreen = useMediaQuery(theme.breakpoints.down('md'));

  const handleSearchVisibility = React.useCallback((value: boolean) => {
    setSearchVisibility(value);
  }, []);

  const handleGoBack = React.useCallback(() => {
    router.back();
  }, [router]);

  const handleGoForward = React.useCallback(() => {
    router.forward();
  }, [router]);

  const handleRefresh = React.useCallback(() => {
    window.location.reload();
  }, []);

  React.useEffect(() => {
    const currentPath = `${pathname || ''}${searchParams?.toString() ? `?${searchParams.toString()}` : ''}`;
    const storageKey = 'proserp-navigation-stack';

    let nextStack: string[] = [];
    let nextIndex = 0;

    try {
      const saved = sessionStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved) as { stack?: string[]; index?: number };
        const savedStack = Array.isArray(parsed?.stack) ? parsed.stack : [];
        const savedIndex = typeof parsed?.index === 'number' ? parsed.index : 0;

        if (savedStack.length === 0) {
          nextStack = [currentPath];
          nextIndex = 0;
        } else if (savedStack[savedIndex] === currentPath) {
          nextStack = savedStack;
          nextIndex = savedIndex;
        } else if (savedIndex > 0 && savedStack[savedIndex - 1] === currentPath) {
          nextStack = savedStack;
          nextIndex = savedIndex - 1;
        } else if (
          savedIndex < savedStack.length - 1 &&
          savedStack[savedIndex + 1] === currentPath
        ) {
          nextStack = savedStack;
          nextIndex = savedIndex + 1;
        } else {
          nextStack = [...savedStack.slice(0, savedIndex + 1), currentPath];
          nextIndex = nextStack.length - 1;
        }
      } else {
        nextStack = [currentPath];
        nextIndex = 0;
      }

      sessionStorage.setItem(
        storageKey,
        JSON.stringify({ stack: nextStack, index: nextIndex })
      );
    } catch {
      nextStack = [currentPath];
      nextIndex = 0;
    }

    setNavigationStack(nextStack);
    setNavigationIndex(nextIndex);
  }, [pathname, searchParams]);

  const canGoBack = navigationIndex > 0;
  const canGoForward = navigationIndex < navigationStack.length - 1;
  const isLightMode = theme.type === 'light';

  const headerActionButtonSx = {
    color: isLightMode ? 'text.primary' : 'inherit',
    backgroundColor: isLightMode ? 'common.white' : 'transparent',
    border: '1px solid',
    borderColor: isLightMode ? 'divider' : 'transparent',
    '&:hover': {
      backgroundColor: isLightMode ? 'grey.100' : 'action.hover',
    },
  };

  return (
    <React.Fragment>
      <SidebarToggleButton />
      {smallScreen &&
        <Stack direction='row' alignItems='center' gap={0.5} sx={{ mr: 1 }}>
          {canGoBack && (
            <Tooltip title='Back'>
              <IconButton color='inherit' size='small' onClick={handleGoBack}>
                <ArrowBackIcon fontSize='small' />
              </IconButton>
            </Tooltip>
          )}
          {canGoForward && (
            <Tooltip title='Forward'>
              <IconButton color='inherit' size='small' onClick={handleGoForward}>
                <ArrowForwardIcon fontSize='small' />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title='Refresh'>
            <IconButton color='inherit' size='small' onClick={handleRefresh}>
              <RefreshIcon fontSize='small' />
            </IconButton>
          </Tooltip>
        </Stack>
      }
      {isSidebarStyle(SIDEBAR_STYLES.CLIPPED_UNDER_HEADER) && !isBelowLg && (
        <Logo sx={{ mr: 3, minWidth: 150 }} mode={theme.type} />
      )}
      <Search show={searchVisibility} onClose={handleSearchVisibility} />
      <Stack direction='row' alignItems='center' gap={1.25} sx={{ ml: 'auto' }}>
        <ThemeModeOption />
        {/* <TranslationPopover /> */}
        {/* <SearchIconButtonOnSmallScreen onClick={handleSearchVisibility} /> */}
        {/* <NotificationsPopover /> */}
        <AuthUserPopover dictionary={dictionary} />
      </Stack>
    </React.Fragment>
  );
}

export { Header };
