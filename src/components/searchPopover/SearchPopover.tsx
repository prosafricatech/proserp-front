'use client';
import { Theme } from '@emotion/react';
import { Div, Span } from '@jumbo/shared';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import {
  IconButton,
  InputAdornment,
  Popover,
  SxProps,
  TextField,
  alpha,
} from '@mui/material';
import React from 'react';
const SearchPopover = ({
  placeholder,
  sx,
}: {
  placeholder: string;
  sx?: SxProps<Theme>;
}) => {
  const [searchValue, setSearchValue] = React.useState('');

  const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(
    null
  );

  const open = Boolean(anchorEl);
  const id = open ? 'search-popover' : undefined;

  return (
    <React.Fragment>
      <Div sx={{ display: { md: 'none' } }}>
        <Span
          sx={{
            display: 'inline-flex',
            borderRadius: 2,
            backgroundColor: (theme) => alpha(theme.palette.common.black, 0.05),
          }}
        >
          <IconButton
            onClick={(event: React.MouseEvent<HTMLButtonElement>) =>
              setAnchorEl(event.currentTarget)
            }
          >
            <SearchIcon />
          </IconButton>
        </Span>
        <Popover
          id={id}
          open={open}
          anchorEl={anchorEl}
          onClose={() => setAnchorEl(null)}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
        >
          <TextField
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            variant='outlined'
            placeholder={placeholder}
            InputProps={{
              startAdornment: (
                <InputAdornment position='start'>
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: searchValue && (
                <InputAdornment position='end'>
                  <IconButton onClick={() => setSearchValue('')}>
                    <CloseIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            size='small'
            sx={{ width: 280, maxWidth: '100%', m: 1.5 }}
          />
        </Popover>
      </Div>
      <TextField
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        variant='outlined'
        placeholder={placeholder}
        InputProps={{
          startAdornment: (
            <InputAdornment position='start'>
              <SearchIcon />
            </InputAdornment>
          ),
          endAdornment: searchValue && (
            <InputAdornment position='end'>
              <IconButton onClick={() => setSearchValue('')}>
                <CloseIcon />
              </IconButton>
            </InputAdornment>
          ),
        }}
        size='small'
        sx={{
          width: 280,
          maxWidth: '100%',
          display: { xs: 'none', md: 'inline-flex' },
          ...sx,
        }}
      />
    </React.Fragment>
  );
};
export { SearchPopover };
