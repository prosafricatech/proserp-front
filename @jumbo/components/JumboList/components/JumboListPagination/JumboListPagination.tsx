'use client'

import React from 'react';
import {
  Stack,
  Typography,
  MenuItem,
  Select,
  Tooltip,
  IconButton,
  useMediaQuery,
} from '@mui/material';
import {
  FirstPage as FirstPageIcon,
  LastPage as LastPageIcon,
  NavigateBefore as PreviousPageIcon,
  NavigateNext as NextPageIcon,
} from '@mui/icons-material';
import useJumboList, { JumboListContextType } from '../../hooks/useJumboList';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

interface JumboListPaginationProps {
  hidePagination?: boolean;
  hideItemsPerPage?: boolean;
  itemsPerPageOptions?: number[];
}

const JumboListPagination: React.FC<JumboListPaginationProps> = ({
  hidePagination = false,
  hideItemsPerPage = false,
  itemsPerPageOptions: customItemsPerPageOptions,
}) => {
  const {
    activePage,
    itemsPerPage,
    totalCount,
    isLoading,
    setActivePage,
    setItemsPerPage,
    itemsPerPageOptions: defaultItemsPerPageOptions,
    data,
  } = useJumboList() as JumboListContextType;

  const dictionary = useDictionary();
  const { theme } = useJumboTheme();
  const smallScreen = useMediaQuery(theme.breakpoints.down('md'));

  const defaultRowsOptions = [10, 20, 50, 100, 200];
  const itemsPerPageOptions = customItemsPerPageOptions || defaultRowsOptions;

  const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));

  const handleRowsPerPageChange = (newCount: number) => {
    setItemsPerPage(newCount);
    setActivePage(0);
  };

  const paginationTranslations = dictionary?.rqList?.pagination || {
    first: 'Go to first page',
    last: 'Go to last page',
    previous: 'Previous page',
    next: 'Next page',
    rowsPerPage: 'Rows',
    currentPage: 'Current page',
    goToPage: 'Go to page',
  };

  const handlePageChange = (page: number) => {
    if (page >= 0 && page < totalPages) setActivePage(page);
  };

  const visiblePages = React.useMemo(() => {
    const maxVisible = smallScreen ? 3 : 5;
    const pages: (number | string)[] = [];

    if (totalPages <= maxVisible) {
      for (let i = 0; i < totalPages; i++) pages.push(i);
    } else {
      pages.push(0);
      let start = Math.max(1, activePage - Math.floor(maxVisible / 2));
      let end = Math.min(totalPages - 2, start + maxVisible - 3);
      if (end - start < maxVisible - 3) {
        start = Math.max(1, end - (maxVisible - 3));
      }
      if (start > 1) pages.push('left-ellipsis');
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < totalPages - 2) pages.push('right-ellipsis');
      if (totalPages > 1) pages.push(totalPages - 1);
    }
    return pages;
  }, [activePage, totalPages, smallScreen]);

  if (hidePagination || (data?.length <= 0 && isLoading)) return null;

  const shouldShowPagination = totalPages > 1;
  const isFirstPage = activePage === 0;
  const isLastPage = activePage >= totalPages - 1;

  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      justifyContent="flex-end"
      alignItems="end"
      spacing={2}
      sx={{
        borderRadius: 2,
        p: 2,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={2}>
        {/* Rows per page selector */}
        {!hideItemsPerPage && (
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="body2" color="text.secondary">
              {paginationTranslations?.rowsPerPage || 'Rows'}:
            </Typography>
            <Tooltip title="Select number of rows per page" arrow placement="top">
              <Select
                size="small"
                value={itemsPerPage}
                onChange={(e) => handleRowsPerPageChange(Number(e.target.value))}
                sx={{
                  minWidth: 80,
                  borderRadius: 1,
                  '& .MuiSelect-select': {
                    py: 0.75,
                  },
                }}
              >
                {itemsPerPageOptions.map((opt) => (
                  <MenuItem key={opt} value={opt}>
                    {opt}
                  </MenuItem>
                ))}
              </Select>
            </Tooltip>
          </Stack>
        )}

        {/* Pagination controls */}
        {shouldShowPagination && (
          <Stack direction="row" alignItems="center" spacing={1}>
            {/* Navigation Buttons */}
            <Tooltip title={paginationTranslations?.first || 'Go to first page'} arrow>
              <span>
                <IconButton
                  onClick={() => handlePageChange(0)}
                  disabled={isFirstPage}
                  size="small"
                >
                  <FirstPageIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>

            <Tooltip title={paginationTranslations?.previous || 'Previous page'} arrow>
              <span>
                <IconButton
                  onClick={() => handlePageChange(activePage - 1)}
                  disabled={isFirstPage}
                  size="small"
                >
                  <PreviousPageIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>

            {/* Page Numbers */}
            {!smallScreen && (
              <Stack direction="row" alignItems="center" spacing={0.5}>
                {visiblePages.map((page, index) => {
                  if (page === 'left-ellipsis' || page === 'right-ellipsis') {
                    return (
                      <Typography
                        key={`ellipsis-${index}`}
                        variant="body2"
                        color="text.secondary"
                        sx={{ px: 1 }}
                      >
                        ...
                      </Typography>
                    );
                  }

                  const pageNumber = page as number;
                  const isActive = pageNumber === activePage;

                  return (
                    <Tooltip
                      key={pageNumber}
                      title={
                        isActive
                          ? `${paginationTranslations?.currentPage || 'Current page'}: ${pageNumber + 1}`
                          : `${paginationTranslations?.goToPage || 'Go to page'} ${pageNumber + 1}`
                      }
                      arrow
                    >
                      <span>
                        <IconButton
                          size="small"
                          onClick={() => handlePageChange(pageNumber)}
                          sx={{
                            minWidth: 32,
                            height: 32,
                            borderRadius: '50%',
                            fontSize: '0.875rem',
                            fontWeight: isActive ? 'bold' : 'normal',
                            backgroundColor: isActive
                              ? theme.palette.primary.main
                              : 'transparent',
                            color: isActive
                              ? theme.palette.primary.contrastText
                              : theme.palette.text.primary,
                            border: `1px solid ${
                              isActive
                                ? theme.palette.primary.main
                                : theme.palette.divider
                            }`,
                            '&:hover': {
                              backgroundColor: isActive
                                ? theme.palette.primary.dark
                                : theme.palette.action.hover,
                            },
                          }}
                        >
                          {pageNumber + 1}
                        </IconButton>
                      </span>
                    </Tooltip>
                  );
                })}
              </Stack>
            )}

            <Tooltip title={paginationTranslations?.next || 'Next page'} arrow>
              <span>
                <IconButton
                  onClick={() => handlePageChange(activePage + 1)}
                  disabled={isLastPage}
                  size="small"
                >
                  <NextPageIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>

            <Tooltip title={paginationTranslations?.last || 'Go to last page'} arrow>
              <span>
                <IconButton
                  onClick={() => handlePageChange(totalPages - 1)}
                  disabled={isLastPage}
                  size="small"
                >
                  <LastPageIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>

            {!smallScreen && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ minWidth: 100, textAlign: 'center' }}
              >
                Page {activePage + 1} of {totalPages}
              </Typography>
            )}
          </Stack>
        )}
      </Stack>
    </Stack>
  );
};

export default JumboListPagination;
