'use client';

import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { TableCell, TableRow, useTheme } from '@mui/material';
import { MyHrAccountStatementRow } from './accountStatementType';

const formatAmount = (value: number | null) =>
  value && value !== 0
    ? value.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : '-';

const formatBalance = (value: number) => {
  const formatted = value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return formatted === '-0.00' ? '0.00' : formatted;
};

interface MyHrAccountStatementListItemProps {
  row: MyHrAccountStatementRow;
  index: number;
}

const MyHrAccountStatementListItem = ({
  row,
  index,
}: MyHrAccountStatementListItemProps) => {
  const theme = useTheme();

  return (
    <TableRow
      sx={{
        backgroundColor:
          index % 2 === 0
            ? theme.palette.background.paper
            : theme.palette.action.hover,
      }}
    >
      <TableCell sx={{ whiteSpace: 'nowrap' }}>
        {readableDate(row.transactionDate)}
      </TableCell>
      <TableCell sx={{ whiteSpace: 'nowrap' }}>
        {row.reference || '—'}
      </TableCell>
      <TableCell sx={{ fontWeight: row.isOpening ? 600 : 400 }}>
        {row.description}
      </TableCell>
      <TableCell align='right'>{formatAmount(row.debit)}</TableCell>
      <TableCell align='right'>{formatAmount(row.credit)}</TableCell>
      <TableCell align='right' sx={{ fontWeight: 600 }}>
        {formatBalance(row.balance)}
      </TableCell>
    </TableRow>
  );
};

export default MyHrAccountStatementListItem;
