import { ReactNode } from 'react';
import { SxProps } from '@mui/system';
import { Theme } from '@mui/material/styles';

export interface JumboListNoDataPlaceholderProps {
  /**
   * The content to display when there's no data
   * If not provided, will show a default illustration with "No data available" text
   */
  children?: ReactNode;
  /**
   * Custom styles for the container Div
   */
  sx?: SxProps<Theme>;
}