'use client';
import { LayoutProps } from '@jumbo/types';
import { Box, Container, SxProps, Theme, Toolbar } from '@mui/material';

import { Div } from '@jumbo/shared';
import { SIDEBAR_STYLES } from '@jumbo/utilities/constants';
import React from 'react';
import { JumboLayoutRightSidebar } from './components/JumboLayoutRightSidebar';
import { useContentMargin, useHeaderSpaceSx, useJumboLayout } from './hooks';
import JumboLayoutHeader from './components/JumboLayoutHeader/JumboLayoutHeader';
import JumboLayoutSidebar from './components/JumboLayoutSidebar/JumboLayoutSidebar';
import JumboLayoutFooter from './components/JumboLayoutFooter/JumboLayoutFooter';

function WrapperContainer({
  children,
  container,
  sx,
}: {
  children: React.ReactNode;
  container?: boolean;
  sx: SxProps<Theme>;
}) {
  if (container) {
    return (
      <Container
        maxWidth={false}
        sx={{
          maxWidth: '1320px',
          display: 'flex',
          minWidth: 0,
          flex: 1,
          flexDirection: 'column',
          ...sx,
        }}
        disableGutters
      >
        {children}
      </Container>
    );
  }

  return children;
}

function JumboLayout(props: LayoutProps) {
  const {
    rootOptions,
    sidebarOptions,
    headerOptions,
    contentOptions,
    wrapperOptions,
    mainOptions,
  } = useJumboLayout();

  const headerSpaceSx = useHeaderSpaceSx();
  const contentMargin = useContentMargin();
  return (
    <Div
      sx={{
        display: 'flex',
        flex: 1,
        minWidth: 0,
        minHeight: '100%',
        flexDirection: 'column',
        ...rootOptions?.sx,
      }}
      className='CmtLayout-root'
    >
      {sidebarOptions?.style === SIDEBAR_STYLES.CLIPPED_UNDER_HEADER && (
        <JumboLayoutHeader>{props.header}</JumboLayoutHeader>
      )}
      <WrapperContainer
        container={wrapperOptions?.container}
        sx={wrapperOptions?.containerSx || {}}
      >
        <Box
          sx={{
            display: 'flex',
            flex: 1,
            minWidth: 0,
            position: 'relative',
            ...(wrapperOptions?.sx ?? {}),
          }}
          className='CmtLayout-wrapper'
          component={wrapperOptions?.component || 'div'}
        >
          {props.sidebar && (
            <JumboLayoutSidebar>{props.sidebar}</JumboLayoutSidebar>
          )}
          <Div
            sx={{
              display: 'flex',
              minWidth: 0,
              flex: 1,
              flexDirection: 'column',
              minHeight: '100%',
              ...(contentMargin
                ? {
                    marginLeft: {
                      sm: `${contentMargin}px`,
                    },
                  }
                : {}),
              transition: (theme) => theme.transitions.create(['margin-left']),
              ...(mainOptions?.sx ?? {}),
            }}
            className='CmtLayout-main'
          >
            {sidebarOptions?.style !== SIDEBAR_STYLES.CLIPPED_UNDER_HEADER && (
              <JumboLayoutHeader>{props.header}</JumboLayoutHeader>
            )}
            {!headerOptions.hide && headerOptions.fixed && (
              <Toolbar sx={{ ...headerSpaceSx }} />
            )}
            <Div
              sx={{
                display: 'flex',
                minWidth: 0,
                flex: 1,
                flexDirection: 'column',
                py: 4,
                px: { lg: 6, sm: 4, xs: 2.5 },
                ...(contentOptions?.sx ?? {}),
              }}
              className='CmtLayout-content'
            >
              {props.children}
            </Div>
            <JumboLayoutFooter>{props.footer}</JumboLayoutFooter>
          </Div>
          {props?.rightSidebar && (
            <JumboLayoutRightSidebar>
              {props?.rightSidebar}
            </JumboLayoutRightSidebar>
          )}
        </Box>
      </WrapperContainer>
    </Div>
  );
}

export { JumboLayout };
