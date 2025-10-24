'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import CircleIcon from '@mui/icons-material/Circle';
import { useTranslation } from '@/hooks/useTranslation';
import { SIDEBAR_VIEWS } from '@jumbo/utilities/constants';
import { deviceType } from '@/utilities/helpers/user-agent-helpers';
import { useJumboLayout } from '../JumboLayout/hooks';
import { BackdropSpinner } from '@/shared/ProgressIndicators/BackdropSpinner';

const menuBefore = {
  left: 0,
  top: 0,
  content: `''`,
  position: 'absolute',
  display: 'inline-block',
  width: '4px',
  height: '100%',
  backgroundColor: 'transparent',
};

const JumboNavItem = ({ item, isNested, translate }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation();
  const { sidebarOptions, setSidebarOptions } = useJumboLayout();
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const isMiniAndClosed = useMemo(
    () => sidebarOptions?.view === SIDEBAR_VIEWS.MINI && !sidebarOptions?.open,
    [sidebarOptions.view, sidebarOptions.open]
  );

  const label = useMemo(() => (translate ? t(item.label) : item.label), [item, translate, t]);

  const handleClick = async (e) => {
    if (pathname !== item.uri) {
      e.preventDefault();
      setIsLoading(true);
      await router.push(item.uri);
    } else if (isMobile) {
      // Only close if already on same page (and on mobile)
      setSidebarOptions({ open: false });
    }
  };

  useEffect(() => {
    setIsMobile(deviceType() === 'mobile');
  }, []);

  // Once navigation completes, stop loading
  // Close sidebar ONLY if mobile
  useEffect(() => {
    if (isLoading) {
      setIsLoading(false);
      if (isMobile) {
        setSidebarOptions({ open: false });
      }
    }
  }, [pathname]);

  if (!item) return null;

  return (
    <>
      <ListItemButton
        component="li"
        onClick={handleClick}
        sx={{
          p: 0,
          overflow: 'hidden',
          borderRadius: isMiniAndClosed ? '50%' : '0 24px 24px 0',
          margin: isMiniAndClosed ? '0 auto' : '0',
          ...(isMiniAndClosed ? { width: 40, height: 40, justifyContent: 'center' } : {}),
          ...(!isMiniAndClosed ? { '&::before': menuBefore } : {}),
          '&:hover': {
            color: (theme) => theme.jumboComponents.JumboNavbar.nav.action?.hover,
            backgroundColor: (theme) => theme.jumboComponents.JumboNavbar.nav.background.hover,
            ...(!isMiniAndClosed
              ? {
                  '&::before': {
                    ...menuBefore,
                    backgroundColor: (theme) => theme.jumboComponents.JumboNavbar.nav.tick.hover,
                  },
                }
              : {}),
          },
          ...(pathname === item.uri
            ? {
                color: (theme) => theme.jumboComponents.JumboNavbar.nav.action?.active,
                backgroundColor: (theme) => theme.jumboComponents.JumboNavbar.nav.background.active,
                ...(!isMiniAndClosed
                  ? {
                      '&::before': {
                        ...menuBefore,
                        backgroundColor: (theme) => theme.jumboComponents.JumboNavbar.nav.tick.active,
                      },
                    }
                  : {}),
              }
            : {}),
          ...(isLoading && {
            opacity: 0.7,
            pointerEvents: 'none',
          }),
        }}
      >
        <Link
          href={item.uri}
          onClick={handleClick}
          target={item.target}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            overflow: 'hidden',
            position: 'relative',
            color: 'inherit',
            padding: isMiniAndClosed ? 0 : '8px 30px',
            textDecoration: 'none',
            justifyContent: isMiniAndClosed ? 'center' : 'flex-start',
          }}
          aria-disabled={isLoading}
        >
          <ListItemIcon sx={{ minWidth: isMiniAndClosed ? 5 : 15, color: 'inherit' }}>
            {isNested ? <CircleIcon sx={{ fontSize: 6, ml: 1 }} /> : item.icon}
          </ListItemIcon>
          {!isMiniAndClosed && (
            <ListItemText
              primary={label}
              sx={{
                ml: 1.4,
                '& .MuiTypography-root': {
                  fontSize: '0.8rem',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                },
              }}
            />
          )}
        </Link>
      </ListItemButton>
      {isLoading && <BackdropSpinner isRouterTransfer />}
    </>
  );
};

export default JumboNavItem;
