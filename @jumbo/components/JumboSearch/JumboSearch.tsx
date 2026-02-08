import React from 'react';
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import InputBase from "@mui/material/InputBase";
import IconButton from "@mui/material/IconButton";
import { SxProps, Theme } from "@mui/material/styles";
import { Div } from '@jumbo/shared';
import { useDebouncedCallback } from 'use-debounce';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

interface JumboSearchProps {
  onChange: (value: string) => void;
  value?: string;
  sx?: SxProps<Theme>;
}

const JumboSearch: React.FC<JumboSearchProps> = React.memo(
  ({ onChange, value = '', sx }) => {
    const dictionary = useDictionary();
    const [searchKeywords, setSearchKeywords] = React.useState<string>(value);
    const [inputValue, setInputValue] = React.useState<string>(value);

    const handleChange = useDebouncedCallback(
      (searchValue: string) => {
        setSearchKeywords(searchValue);
      },
      1000
    );

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = event.target.value;
      setInputValue(newValue);
      handleChange(newValue);
    };

    const handleClear = () => {
      setInputValue('');
      setSearchKeywords('');
      onChange('');
      handleChange.cancel();
    };

    React.useEffect(() => {
      onChange(searchKeywords);
    }, [searchKeywords, onChange]);

    React.useEffect(() => {
      setInputValue(value);
      setSearchKeywords(value);
    }, [value]);

    React.useEffect(() => {
      return () => {
        handleChange.cancel();
      };
    }, [handleChange]);

    return (
      <Div sx={{ position: 'relative', width: '100%', ...sx }}>
        <Div
          sx={{
            padding: (theme: Theme) => theme.spacing(0, 2),
            height: '100%',
            position: 'absolute',
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2,
            color: (theme: Theme) => theme.palette.text.secondary,
          }}
        >
          <SearchIcon />
        </Div>

        <InputBase
          value={inputValue}
          onChange={handleInputChange}
          placeholder={dictionary.rqList.jumboSearch}
          inputProps={{ 'aria-label': 'search' }}
          autoFocus
          sx={{
            width: '100%',
            height: 40,
            borderRadius: 24,
            border: '1px solid',
            borderColor: (theme: Theme) =>
              theme.type === 'dark'
                ? '#9da9b7'
                : '#c4c4c4',
            backgroundColor: (theme: Theme) =>
              theme.type === 'dark'
                ? '#3C475F'
                : '#FFFFFF',
            color: (theme: Theme) => theme.palette.text.primary,
            '&:hover': {
              borderColor: '#9da9b7',
            },
            '&:focus-within': {
              borderColor: '#9da9b7',
              boxShadow: (theme: Theme) =>
                theme.type === 'dark'
                  ? '0 0 0 1px rgba(157,169,183,0.4)'
                  : '0 0 0 1px rgba(157,169,183,0.3)',
            },
            '& .MuiInputBase-input': {
              padding: '8px 14px',
              paddingLeft: '40px',
              paddingRight: inputValue ? '40px' : '14px',
              fontSize: 14,
              height: '24px',
              '&::placeholder': {
                color: (theme: Theme) => theme.palette.text.secondary,
                opacity: 1,
              },
            },
          }}
        />

        {inputValue && (
          <Div
            sx={{
              position: 'absolute',
              right: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 3,
            }}
          >
            <IconButton
              size="small"
              onClick={handleClear}
              aria-label="clear search"
              sx={{
                width: 24,
                height: 24,
                padding: 0,
                color: (theme: Theme) => theme.palette.text.secondary,
                backgroundColor: (theme: Theme) =>
                  theme.type === 'dark'
                    ? 'rgba(255,255,255,0.12)'
                    : 'rgba(0,0,0,0.05)',
                '&:hover': {
                  color: (theme: Theme) => theme.palette.text.primary,
                  backgroundColor: (theme: Theme) =>
                    theme.type === 'dark'
                      ? 'rgba(255,255,255,0.2)'
                      : 'rgba(0,0,0,0.1)',
                },
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Div>
        )}
      </Div>
    );
  }
);

export default JumboSearch;
