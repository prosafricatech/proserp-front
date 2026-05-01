'use client';
import SearchIcon from '@mui/icons-material/Search';
import { SxProps, Theme } from '@mui/material';
import { Search, SearchIconWrapper, StyledInputBase } from './style';

type SearchGlobalProps = {
  wrapperSx?: SxProps<Theme>;
  sx?: SxProps<Theme>;
};

const SearchGlobal = ({ wrapperSx, sx }: SearchGlobalProps) => {
  return (
    <Search sx={wrapperSx ?? {}}>
      <SearchIconWrapper>
        <SearchIcon />
      </SearchIconWrapper>

      <StyledInputBase
        name='search-globally'
        placeholder='Search anything'
        inputProps={{ 'aria-label': 'search' }}
        sx={sx ?? {}}
      />
    </Search>
  );
};

export { SearchGlobal };
