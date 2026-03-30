import {
  useJumboLayout,
  useSidebarState,
} from '@jumbo/components/JumboLayout/hooks';
import { SIDEBAR_STYLES } from '@jumbo/utilities/constants';
import MenuIcon from '@mui/icons-material/Menu';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import { IconButton } from '@mui/material';

function SidebarToggleButton() {
  const { isSidebarStyle, isSidebarOpen, isSidebarCollapsible } =
    useSidebarState();
  const { sidebarOptions, setSidebarOptions } = useJumboLayout();

  return (
    <>
      {isSidebarCollapsible() && (
        <IconButton
          edge='start'
          color='inherit'
          aria-label='open drawer'
          sx={{
            ml: isSidebarStyle(SIDEBAR_STYLES.CLIPPED_UNDER_HEADER) ? -2 : 0,
            mr: 3,
            boxShadow: 23,
            color: (theme) =>
              theme.palette.mode === 'light' ? 'text.primary' : 'inherit',
            backgroundColor: (theme) =>
              theme.palette.mode === 'light'
                ? theme.palette.common.white
                : 'transparent',
            border: (theme) =>
              theme.palette.mode === 'light'
                ? `1px solid ${theme.palette.divider}`
                : '1px solid transparent',
            '&:hover': {
              backgroundColor: (theme) =>
                theme.palette.mode === 'light'
                  ? theme.palette.grey[100]
                  : theme.palette.action.hover,
            },
          }}
          onClick={() => setSidebarOptions({ open: !sidebarOptions.open })}
        >
          {isSidebarOpen() ? <MenuOpenIcon /> : <MenuIcon />}
        </IconButton>
      )}
    </>
  );
}

export { SidebarToggleButton };
