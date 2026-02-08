import { ReactNode } from 'react';
import { SxProps } from '@mui/system';
import { GridProps, ListProps, Theme } from '@mui/material';

export interface MultiSelectOption {
  label: ReactNode;
  selectionLogic: (items: any[]) => any[];
}

export interface JumboListProps {
  header?: ReactNode;
  toolbar?: ReactNode;
  footer?: ReactNode;
  data: any[];
  primaryKey: string;
  renderItem: (item: any, index?: number) => ReactNode;
  totalCount?: number;
  itemsPerPage?: number;
  itemsPerPageOptions?: number[];
  onPageChange?: (page: number) => void;
  onSelectionChange?: (selectedItems: any[]) => void;
  onItemsPerPageChange?: (itemsPerPage: number) => void;
  multiSelectOptions?: MultiSelectOption[];
  noDataPlaceholder?: ReactNode;
  wrapperComponent?: React.ElementType;
  wrapperSx?: SxProps<Theme>;
  component?: React.ElementType<ListProps>;
  componentElement?: string | React.ElementType;
  sx?: SxProps<Theme> | GridProps['sx'];
  itemSx?: SxProps<Theme>;
  isLoading?: boolean;
  disableTransition?: boolean;
  view?: 'list' | 'grid';
  page?: number;
}

export interface JumboListContextValue {
  data: any[];
  totalCount?: number;
  itemsPerPage?: number;
  itemsPerPageOptions?: number[];
  activePage: number;
  isLoading?: boolean;
  multiSelectOptions?: MultiSelectOption[];
  bulkActions?: any[] | null;
  primaryKey: string;
  selectedItems: any[];
  setActivePage: (pageNumber: number) => void;
  setSelectedItems: (itemsData: any) => void;
  setBulkActions: (bulkActions: any[] | null) => void;
  setItemsPerPage: (value: number) => void;
}