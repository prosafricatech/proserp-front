'use client';

import SearchIcon from '@mui/icons-material/Search';
import { SxProps, Theme, Paper, List, ListItem, ListItemText, CircularProgress, Box } from '@mui/material';
import { Search, SearchIconWrapper, StyledInputBase } from './style';
import React from 'react';
import { useSpinner } from '@/shared/ProgressIndicators/SpinnerContext';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { staticMenuItems } from '@/utilities/constants/static-menu-items';

import { entityConfigs } from './entityConfigs';

type SearchGlobalProps = {
  wrapperSx?: SxProps<Theme>;
  sx?: SxProps<Theme>;
};

type SearchResult = {
  id: string | number;
  label: string;
  type: string;
  url: string;
  description?: string;
};

const SearchGlobal = ({ wrapperSx, sx }: SearchGlobalProps) => {
  const [query, setQuery] = React.useState('');
  const [searchValue, setSearchValue] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const [open, setOpen] = React.useState(false);
  const router = useRouter();
  const { setShow } = useSpinner();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Debounced search effect
  React.useEffect(() => {
    if (!searchValue) {
      setResults([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    setOpen(true);

    const pageMatches: SearchResult[] = staticMenuItems
      .filter(page => page.label.toLowerCase().includes(searchValue.toLowerCase()))
      .map(page => ({
        id: page.uri,
        label: page.label,
        type: 'Page',
        url: page.uri,
      }));

    Promise.all(
      entityConfigs.map(async (entity) => entity.search(searchValue))
    ).then((allResults) => {
      setResults([...pageMatches, ...allResults.flat()]);
      setLoading(false);
    });
  }, [searchValue]);

  // Debounce input
  React.useEffect(() => {
    if (!query) {
      setSearchValue('');
      return;
    }
    const handler = setTimeout(() => {
      setSearchValue(query);
    }, 400);
    return () => clearTimeout(handler);
  }, [query]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  // Search immediately on Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setSearchValue(query);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    // Parse the result.url and add/replace the search param with the clicked label
    let url = result.url;
    try {
      const urlObj = new URL(url, window.location.origin);
      urlObj.searchParams.set('search', result.label);
      url = urlObj.pathname + urlObj.search;
    } catch (e) {
      // fallback: if URL parsing fails, append/replace manually
      if (url.includes('?')) {
        url = url.replace(/([?&])search=[^&]*/, `$1search=${encodeURIComponent(result.label)}`);
        if (!/([?&])search=/.test(url)) {
          url += `&search=${encodeURIComponent(result.label)}`;
        }
      } else {
        url += `?search=${encodeURIComponent(result.label)}`;
      }
    }
    // Only show spinner if navigating to a different route (including search params)
    if (window.location.pathname + window.location.search !== url) {
      setShow(true);
    }
    try {
      router.push(url);
    } catch (e) {
      console.error('router.push failed:', e, 'Falling back to window.location.assign');
      window.location.assign(url);
    }
  };

  // Hide spinner after route or query param change (client-side navigation)
  React.useEffect(() => {
    setShow(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams?.toString()]);

  // Close dropdown on outside click
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  return (
    <Box sx={{ position: 'relative', ...wrapperSx }}>
      <Search>
        <SearchIconWrapper>
          <SearchIcon />
        </SearchIconWrapper>
        <StyledInputBase
          name='search-globally'
          placeholder='Search anything'
          inputProps={{ 'aria-label': 'search' }}
          sx={sx ?? {}}
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => query && setOpen(true)}
          inputRef={inputRef}
        />
      </Search>
      {open && (
        <Paper sx={{ position: 'absolute', top: 40, left: 0, right: 0, zIndex: 10, maxHeight: 320, overflowY: 'auto' }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <CircularProgress size={24} />
            </Box>
          ) : results.length === 0 ? (
            <Box sx={{ p: 2, color: 'text.secondary', textAlign: 'center' }}>No results</Box>
          ) : (
            <List>
              {results.map((result) => (
                <ListItem
                  component="div"
                  key={result.type + '-' + result.id}
                  onMouseDown={() => handleResultClick(result)}
                  sx={{
                    cursor: 'pointer',
                    borderRadius: 1,
                    transition: 'background 0.2s',
                    '&:hover': {
                      backgroundColor: (theme) =>
                        theme.type === 'dark'
                          ? 'rgba(255,255,255,0.08)'
                          : 'rgba(0,0,0,0.04)',
                      color: (theme) =>
                        theme.type === 'dark'
                          ? theme.palette.primary.light
                          : theme.palette.primary.dark,
                    },
                  }}
                >
                  <ListItemText
                    primary={result.label}
                    secondary={result.description || result.type}
                    primaryTypographyProps={{
                      sx: {
                        color: (theme) =>
                          theme.type === 'dark'
                            ? 'white'
                            : 'inherit',
                      },
                    }}
                    secondaryTypographyProps={{
                      sx: {
                        color: (theme) =>
                          theme.type === 'dark'
                            ? 'rgba(255,255,255,0.7)'
                            : 'text.secondary',
                        fontSize: 13,
                      },
                    }}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Paper>
      )}
    </Box>
  );
};

export { SearchGlobal };
