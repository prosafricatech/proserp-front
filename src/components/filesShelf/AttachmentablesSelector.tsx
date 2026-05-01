import React from 'react';
import { Autocomplete, TextField } from '@mui/material';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

type Option = {
  label: string;
  value: string;
};

type AttachmentablesSelectorProps = {
  value: string[];
  onChange: (values: string[]) => void;
};
const attachmentableOptions: Option[] = [
  { label: "Payment", value: "payment" },
  { label: "Receipt", value: "receipt" },
  { label: "Journal Voucher", value: "journal_voucher" },
  { label: "Fund Transfer", value: "fund_transfer" },
  { label: "Purchase Order", value: "purchase_order" },
  { label: "Grn", value: "grn" },
  { label: "Sale", value: "sale" },
  { label: "Project", value: "project" },
  { label: "Sub Contracts", value: "project_subcontract" },
  { label: "Delivery Note", value: "delivery_note" },
  { label: "Requisitions", value: "requisition" },
].sort((a, b) => a.label.localeCompare(b.label));

const AttachmentablesSelector: React.FC<AttachmentablesSelectorProps> = ({ value, onChange }) => {
const dictionary = useDictionary();

  const selectedOptions = React.useMemo<Option[]>(
    () => attachmentableOptions.filter(option => value.includes(option.value)),
    [value]
  );

  const handleChange = (_event: React.SyntheticEvent, newValue: Option[]) => {
    onChange(newValue.map(option => option.value));
  };

  return (
    <Autocomplete
      multiple
      fullWidth
      size="small"
      options={attachmentableOptions}
      getOptionLabel={(option) => option.label}
      isOptionEqualToValue={(option, value) => option.value === value.value}
      value={selectedOptions}
      onChange={handleChange}
      renderInput={(params) => (
        <TextField
          {...params}
          label={dictionary.filesShelf.list.labels.relatedTo}
          fullWidth
          variant="outlined"
        />
      )}
    />
  );
};

export default AttachmentablesSelector;
