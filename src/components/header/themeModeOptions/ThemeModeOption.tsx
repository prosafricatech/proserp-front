import React from 'react';
import { JumboIconButton } from '@jumbo/components/JumboIconButton';
import {
  useJumboFooterTheme,
  useJumboHeaderTheme,
  useJumboSidebarTheme,
  useJumboTheme,
} from '@jumbo/components/JumboTheme/hooks';
import { Span } from '@jumbo/shared';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
 
import { mainTheme as mainThemeDefault } from '@/themes/main/default';
import { headerTheme as headerThemeDefault } from '@/themes/header/default';
import { sidebarTheme as sidebarThemeDefault } from '@/themes/sidebar/default';
import { footerTheme as footerThemeDefault } from '@/themes/footer/default';

import { mainTheme as mainThemeDark } from '@/themes/main/dark';
import { headerTheme as headerThemeDark } from '@/themes/header/dark';
import { sidebarTheme as sidebarThemeDark } from '@/themes/sidebar/dark';
import { footerTheme as footerThemeDark } from '@/themes/footer/dark';

import { mainTheme as mainThemeSemiDark } from '@/themes/main/semi-dark';
import { headerTheme as headerThemeSemiDark } from '@/themes/header/semi-dark';
import { sidebarTheme as sidebarThemeSemiDark } from '@/themes/sidebar/semi-dark';
import { footerTheme as footerThemeSemiDark } from '@/themes/footer/semi-dark';

const themeMap = {
  light: {
    main: mainThemeDefault,
    header: headerThemeDefault,
    sidebar: sidebarThemeDefault,
    footer: footerThemeDefault,
  },
  'semi-dark': {  
    main: mainThemeSemiDark,
    header: headerThemeSemiDark,
    sidebar: sidebarThemeSemiDark,
    footer: footerThemeSemiDark,
  },
  dark: {
    main: mainThemeDark,
    header: headerThemeDark,
    sidebar: sidebarThemeDark,
    footer: footerThemeDark,
  },
};

const ThemeModeOption = () => {
  const { theme, setTheme } = useJumboTheme();
  const { setSidebarTheme } = useJumboSidebarTheme();
  const { setHeaderTheme } = useJumboHeaderTheme();
  const { setFooterTheme } = useJumboFooterTheme();

  const handleModeChange = React.useCallback(
    (type: keyof typeof themeMap) => {
      localStorage.setItem('theme-type', type);

      const selected = themeMap[type];
      setTheme({ type, ...selected.main });
      setHeaderTheme(selected.header);
      setSidebarTheme(selected.sidebar);
      setFooterTheme(selected.footer);
    },
    [setTheme, setHeaderTheme, setSidebarTheme, setFooterTheme]
  );

  React.useEffect(() => {
    const savedThemeType = (localStorage.getItem('theme-type') || 'light') as keyof typeof themeMap;
    handleModeChange(savedThemeType);
  }, []);

  return (
    <Span>
      {theme.type === 'light' ? (
        <JumboIconButton onClick={() => handleModeChange('dark')} elevation={23}>
          <LightModeOutlinedIcon sx={{ fontSize: '1.25rem' }} />
        </JumboIconButton>
      ) : (
        <JumboIconButton onClick={() => handleModeChange('light')} elevation={23}>
          <DarkModeOutlinedIcon sx={{ fontSize: '1.25rem' }} />
        </JumboIconButton>
      )}
    </Span>
  );
};

export { ThemeModeOption };
