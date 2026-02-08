import { ReactNode } from 'react';
import { SxProps } from '@mui/system';
import { Theme } from '@mui/material/styles';

export interface JumboRqListProps {
  service: (params: any) => Promise<any>;
  queryOptions: {
    queryKey: string | any[];
    queryParams?: any;
    countKey?: string;
    dataKey: string;
  };
  primaryKey: string;
  itemsPerPage?: number;
  itemsPerPageOptions?: number[];
  multiSelectOptions?: any[];
  noDataPlaceholder?: ReactNode;
  renderItem: (item: any, index: number) => ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  toolbar?: ReactNode;
  onSelectionChange?: (selectedItems: any[]) => void;
  onRefresh?: () => void;
  wrapperComponent?: React.ElementType;
  wrapperSx?: SxProps<Theme>;
  component?: React.ElementType;
  componentElement?: string | React.ElementType;
  sx?: SxProps<Theme>;
  itemSx?: SxProps<Theme>;
  transition?: boolean;
  view?: string;
}