import React from 'react';
import {
  Stack,
  IconButton,
  Typography,
  MenuItem,
  Select,
  useMediaQuery,
  Tooltip,
} from '@mui/material';
import {
  FirstPage as FirstPageIcon,
  LastPage as LastPageIcon,
  NavigateBefore as PreviousPageIcon,
  NavigateNext as NextPageIcon,
} from '@mui/icons-material';
import useJumboList, { JumboListContextType } from '../../hooks/useJumboList';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';

interface JumboListPaginationProps {
  hidePagination?: boolean;
}

const JumboListPagination: React.FC<JumboListPaginationProps> = ({
  hidePagination = false,
}) => {
  // Hooks should always be called at the top
  const { activePage, itemsPerPage, totalCount, setActivePage } =
    useJumboList() as JumboListContextType;

  const { theme } = useJumboTheme();
  const smallScreen = useMediaQuery(theme.breakpoints.down('md'));
  const dictionary = useDictionary();

  const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));

  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && newPage < totalPages) {
      setActivePage(newPage);
    }
  };

  // Adjust visible pages count based on screen size
  const visiblePages = React.useMemo(() => {
    const maxVisible = smallScreen ? 3 : 5;
    const pages: (number | string)[] = [];

    if (totalPages <= maxVisible) {
      for (let i = 0; i < totalPages; i++) pages.push(i);
    } else {
      const start = Math.max(0, activePage - Math.floor(maxVisible / 2));
      const end = Math.min(totalPages - 1, start + maxVisible - 1);

      if (start > 0) pages.push(0, '...');
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < totalPages - 1) pages.push('...', totalPages - 1);
    }
    return pages;
  }, [activePage, totalPages, smallScreen]);

  if (hidePagination || totalPages <= 1) return null;

  return (
    <Stack
      direction="row"
      justifyContent="flex-end"
      alignItems="center"
      spacing={1}
      sx={{
        borderRadius: 3,
        p: 1.2,
        bgcolor:
          theme.palette.mode === 'dark'
            ? theme.palette.background.paper
            : '#fafafa',
        boxShadow: theme.shadows[1],
        flexWrap: 'wrap',
      }}
    >
      {/* First Page */}
      <Tooltip title="Go to first page" arrow>
        <span>
          <IconButton
            size="small"
            onClick={() => handlePageChange(0)}
            disabled={activePage === 0}
          >
            <FirstPageIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>

      {/* Previous Page */}
      <Tooltip title="Previous page" arrow>
        <span>
          <IconButton
            size="small"
            onClick={() => handlePageChange(activePage - 1)}
            disabled={activePage === 0}
          >
            <PreviousPageIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>

      {/* Page Numbers */}
      {visiblePages.map((p, i) =>
        p === '...' ? (
          <Typography key={`dots-${i}`} color="text.secondary" px={0.5}>
            ...
          </Typography>
        ) : (
          <Tooltip key={p} title={`Go to page ${Number(p) + 1}`} arrow>
            <span>
              <IconButton
                size="small"
                onClick={() => handlePageChange(p as number)}
                sx={{
                  borderRadius: '50%',
                  width: 32,
                  height: 32,
                  border: '1px solid',
                  borderColor:
                    p === activePage
                      ? theme.palette.primary.main
                      : theme.palette.divider,
                  bgcolor:
                    p === activePage
                      ? theme.palette.primary.main
                      : 'transparent',
                  color:
                    p === activePage
                      ? theme.palette.primary.contrastText
                      : theme.palette.text.primary,
                  '&:hover': {
                    bgcolor:
                      p === activePage
                        ? theme.palette.primary.main
                        : theme.palette.action.hover,
                  },
                }}
              >
                {Number(p) + 1}
              </IconButton>
            </span>
          </Tooltip>
        )
      )}

      {/* Next Page */}
      <Tooltip title="Next page" arrow>
        <span>
          <IconButton
            size="small"
            onClick={() => handlePageChange(activePage + 1)}
            disabled={activePage >= totalPages - 1}
          >
            <NextPageIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>

      {/* Last Page */}
      <Tooltip title="Go to last page" arrow>
        <span>
          <IconButton
            size="small"
            onClick={() => handlePageChange(totalPages - 1)}
            disabled={activePage >= totalPages - 1}
          >
            <LastPageIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>

      {/* Page Dropdown — hidden on small screens */}
      {!smallScreen && (
        <Stack direction="row" alignItems="center" spacing={1} ml={2}>
          <Typography variant="body2">Page</Typography>
          <Tooltip title="Jump to specific page" arrow>
            <Select
              size="small"
              value={activePage}
              onChange={(e) => handlePageChange(Number(e.target.value))}
              sx={{
                fontSize: '0.85rem',
                height: 32,
                width: 64,
                borderRadius: 2,
              }}
            >
              {Array.from({ length: totalPages }, (_, i) => (
                <MenuItem key={i} value={i}>
                  {i + 1}
                </MenuItem>
              ))}
            </Select>
          </Tooltip>
          <Typography variant="body2">of {totalPages}</Typography>
        </Stack>
      )}
    </Stack>
  );
};

export default JumboListPagination;