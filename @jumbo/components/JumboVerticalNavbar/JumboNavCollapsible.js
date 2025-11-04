'use client';

import React from 'react';
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Collapse from "@mui/material/Collapse";
import List from "@mui/material/List";
import { Popover } from "@mui/material";
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import { usePathname } from 'next/navigation';
import { useTranslation } from '@/hooks/useTranslation';
import { SIDEBAR_VIEWS } from '@jumbo/utilities/constants';
import { isUrlInChildren } from '@jumbo/utilities/urlHelpers';
import { ArrowWrapper } from "@jumbo/components/JumboVerticalNavbar/style";
import JumboNavIdentifier from "@jumbo/components/JumboVerticalNavbar/JumboNavIdentifier";
import { useJumboLayout } from '../JumboLayout/hooks';

const menuBefore = {
  left: 0,
  top: 0,
  content: `''`,
  position: 'absolute',
  display: 'inline-block',
  width: '4px',
  height: '100%',
  backgroundColor: 'transparent'
};

const JumboNavCollapsible = ({ item, translate }) => {
  const [open, setOpen] = React.useState(false);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const openPopover = Boolean(anchorEl);
  const { t } = useTranslation();
  const pathname = usePathname();
  const [previousPath, setPreviousPath] = React.useState(pathname);
  const { sidebarOptions } = useJumboLayout();

  const isMiniAndClosed = React.useMemo(() => {
    return sidebarOptions?.view === SIDEBAR_VIEWS.MINI && !sidebarOptions?.open;
  }, [sidebarOptions.view, sidebarOptions.open]);

  const handlePopoverOpen = React.useCallback((event) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handlePopoverClose = React.useCallback(() => {
    setAnchorEl(null);
  }, []);

  React.useEffect(() => {
    if (previousPath !== pathname) {
      setPreviousPath(pathname);
    }
  }, [item, pathname, previousPath]);

  React.useEffect(() => {
    setOpen(isUrlInChildren(item, previousPath));
  }, [item, previousPath]);

  const label = React.useMemo(() => {
    return translate ? t(item.label) : item.label;
  }, [item, translate, t]);

  if (!item) return null;

  const subMenus = item.children?.length ? item.children : null;

  return (
    <>
      <ListItemButton
        component="li"
        onClick={() => setOpen(!open)}
        onMouseEnter={handlePopoverOpen}
        onMouseLeave={handlePopoverClose}
        sx={{
          p: theme => !isMiniAndClosed ? theme.spacing(1, 3.75) : 0,
          borderRadius: isMiniAndClosed ? '50%' : '0 24px 24px 0',
          margin: isMiniAndClosed ? '0 auto' : '0',
          ...(isMiniAndClosed ? { width: 40, height: 40, justifyContent: 'center' } : {}),
          overflow: 'hidden',
          '&:hover': {
            color: theme => theme.jumboComponents.JumboNavbar.nav.action?.hover,
            backgroundColor: theme => theme.jumboComponents.JumboNavbar.nav.background.hover,
            ...(!isMiniAndClosed ? {
              '&::before': {
                ...menuBefore,
                backgroundColor: theme => theme.jumboComponents.JumboNavbar.nav.tick.hover,
              }
            } : {})
          },
          ...(!isMiniAndClosed ? { '&::before': menuBefore } : {}),
        }}
      >
        {!isMiniAndClosed && (
          <ArrowWrapper>
            {open ? <ArrowDropDownIcon /> : <ArrowRightIcon />}
          </ArrowWrapper>
        )}
        {item.icon && (
          <ListItemIcon sx={{ minWidth: isMiniAndClosed ? 20 : 32, color: 'inherit' }}>
            {item.icon}
          </ListItemIcon>
        )}
        {!isMiniAndClosed && (
          <ListItemText
            primary={label}
            sx={{
              m: 0,
              '& .MuiTypography-root': {
                fontSize: '0.8rem',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }
            }}
          />
        )}
      </ListItemButton>
      {subMenus && !isMiniAndClosed && (
        <Collapse component="li" in={open} timeout="auto" unmountOnExit>
          <List disablePadding>
            {subMenus.map((child, index) => (
              <JumboNavIdentifier item={child} key={`${item.label}-${index}`} isNested={true} />
            ))}
          </List>
        </Collapse>
      )}
      {subMenus && isMiniAndClosed && (
        <Popover
          id="mouse-over-popover"
          sx={{ pointerEvents: 'none' }}
          open={openPopover}
          anchorEl={anchorEl}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'left' }}
          onClose={handlePopoverClose}
          disableRestoreFocus
        >
          <List disablePadding>
            {subMenus.map((child, index) => (
              <JumboNavIdentifier item={child} key={`${item.label}-mini-${index}`} isNested={true} />
            ))}
          </List>
        </Popover>
      )}
    </>
  );
};

export default JumboNavCollapsible;
