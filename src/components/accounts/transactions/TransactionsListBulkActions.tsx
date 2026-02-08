import { DeleteOutlined } from '@mui/icons-material';
import { IconButton, Stack, Tooltip } from '@mui/material';
import React from 'react';
import { TransactionTypes } from './TransactionTypes';

type TransactionsListBulkActionsProps = {
  type: TransactionTypes;
  onDelete?: () => void;
  disabled?: boolean;
};

const TransactionsListBulkActions: React.FC<TransactionsListBulkActionsProps> = ({ 
  type, 
  onDelete, 
  disabled = false 
}) => {
  const handleDelete = () => {
    if (onDelete) {
      onDelete();
    }
  };

  return (
    <Stack direction={"row"} sx={{ backgroundColor: 'transparent', ml: -2 }}>
      <Tooltip title={`Delete ${type.replace('_', ' ')}`}>
        <span>
          <IconButton 
            color="error" 
            onClick={handleDelete}
            disabled={disabled}
            aria-label={`delete-${type}`}
          >
            <DeleteOutlined />
          </IconButton>
        </span>
      </Tooltip>
    </Stack>
  );
};

export default TransactionsListBulkActions;