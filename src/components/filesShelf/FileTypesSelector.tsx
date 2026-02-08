import React from 'react';
import { Box, Autocomplete, TextField } from '@mui/material';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

type FileGroup = {
  label: string;
  value: string[];
};

const options: FileGroup[] = [
  { label: "Documents", value: ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx"] },
  { label: "Images", value: ["jpg", "jpeg", "png", "gif", "bmp", "svg", "webp"] },
  { label: "Video", value: ["mp4", "mov", "avi", "mkv", "wmv"] },
  { label: "Audio", value: ["mp3"] },
];

interface FileTypesSelectorProps {
  value: string[];
  onChange: (value: string[]) => void;
}

const FileTypesSelector: React.FC<FileTypesSelectorProps> = ({ value, onChange }) => {
  const dictionary = useDictionary();
  // Derive the selected groups from the selected file extensions
  const selectedGroups = options.filter(option =>
    option.value.some(ext => value.includes(ext))
  );

  const handleChange = (
    _: React.SyntheticEvent,
    newValue: FileGroup[]
  ) => {
    const flatValues = newValue.flatMap(group => group.value);
    onChange(flatValues);
  };

  return (
    <Box sx={{ minWidth: 120 }}>
      <Autocomplete
        multiple
        options={options}
        size="small"
        fullWidth
        getOptionLabel={(option) => option.label}
        value={selectedGroups}
        onChange={handleChange}
        isOptionEqualToValue={(opt, val) => opt.label === val.label}
        renderInput={(params) => (
          <TextField {...params} label={dictionary.filesShelf.list.labels.fileType} variant="outlined" />
        )}
      />
    </Box>
  );
};

export default FileTypesSelector;
