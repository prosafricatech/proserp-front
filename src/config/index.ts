import { footerTheme } from '@/themes/footer/default';
import { headerTheme } from '@/themes/header/default';
import { mainTheme } from '@/themes/main/default';
import { sidebarTheme } from '@/themes/sidebar/default';
import { JumboThemeConfig } from '@jumbo/types';
import { createJumboTheme } from '@jumbo/utilities/helpers';
import { anonymousPaths, publicPaths } from './routes/path';

type ConfigType = {
  THEME: JumboThemeConfig;
  PUBLIC_ROUTES: string[];
  ANONYMOUS_ROUTES: string[];
  DISABLE_PROTECTED_ROUTE_CHECK: boolean;
};

export const CONFIG: ConfigType = {
  THEME: createJumboTheme(mainTheme, headerTheme, sidebarTheme, footerTheme),
  PUBLIC_ROUTES: publicPaths,
  ANONYMOUS_ROUTES: anonymousPaths,
  DISABLE_PROTECTED_ROUTE_CHECK: false,
};
