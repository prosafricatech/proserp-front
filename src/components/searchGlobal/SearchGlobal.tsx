'use client';

import SearchIcon from '@mui/icons-material/Search';
import { SxProps, Theme, Paper, List, ListItem, ListItemText, CircularProgress, Box } from '@mui/material';
import { Search, SearchIconWrapper, StyledInputBase } from './style';
import React from 'react';
import { useSpinner } from '@/shared/ProgressIndicators/SpinnerContext';
import { useRouter, usePathname } from 'next/navigation';
import { staticMenuItems } from '@/utilities/constants/static-menu-items';

type SearchGlobalProps = {
  wrapperSx?: SxProps<Theme>;
  sx?: SxProps<Theme>;
};

type SearchResult = {
  id: string | number;
  label: string;
  type: string;
  url: string;
};

const entityConfigs = [
  {
    type: 'employee',
    label: 'Employee',
    endpoint: '/api/humanResources/employees',
    getResults: (data: any) => (Array.isArray(data?.results) ? data.results.map((item: any) => ({
      id: item.id,
      label: item.name || item.fullName || item.email,
      type: 'Employee',
      url: `/humanResources/employees/${item.id}`,
    })) : []),
  },
  {
    type: 'user',
    label: 'User',
    endpoint: '/api/sharedComponents/getUsers',
    getResults: (data: any) => (Array.isArray(data?.results) ? data.results.map((item: any) => ({
      id: item.id,
      label: item.name || item.fullName || item.email,
      type: 'User',
      url: `/users/${item.id}`,
    })) : []),
  },
  {
    type: 'department',
    label: 'Department',
    endpoint: '/api/humanResources/departments',
    getResults: (data: any) => (Array.isArray(data?.results) ? data.results.map((item: any) => ({
      id: item.id,
      label: item.name,
      type: 'Department',
      url: `/humanResources/departments/${item.id}`,
    })) : []),
  },
];

const SearchGlobal = ({ wrapperSx, sx }: SearchGlobalProps) => {
  const [query, setQuery] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const [open, setOpen] = React.useState(false);
  const router = useRouter();
  const { setShow } = useSpinner();
  const pathname = usePathname();
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!query) {
      setResults([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    setOpen(true);

    // Static page search
    const pageMatches: SearchResult[] = staticMenuItems
      .filter(page => page.label.toLowerCase().includes(query.toLowerCase()))
      .map(page => ({
        id: page.uri,
        label: page.label,
        type: 'Page',
        url: page.uri,
      }));

    // Search all entities in parallel
    Promise.all(
      entityConfigs.map(async (entity) => {
        const url = `${entity.endpoint}?keyword=${encodeURIComponent(query)}&limit=5`;
        try {
          const res = await fetch(url);
          if (!res.ok) return [];
          const data = await res.json();
          return entity.getResults(data);
        } catch {
          return [];
        }
      })
    ).then((allResults) => {
      setResults([...pageMatches, ...allResults.flat()]);
      setLoading(false);
    });
  }, [query]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleResultClick = (result: SearchResult) => {
    setShow(true);
    if (result.type === 'Page') {
      try {
        router.push(result.url);
      } catch (e) {
        console.error('router.push failed:', e, 'Falling back to window.location.assign');
        window.location.assign(result.url);
      }
    }
    // Optionally, handle other types (entities) here
  };

  // Hide spinner after route change (client-side navigation)
  React.useEffect(() => {
    setShow(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

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
          placeholder='Go to'
          inputProps={{ 'aria-label': 'search' }}
          sx={sx ?? {}}
          value={query}
          onChange={handleInputChange}
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
                    primaryTypographyProps={{
                      sx: {
                        color: (theme) =>
                          theme.type === 'dark'
                            ? 'white'
                            : 'inherit',
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
