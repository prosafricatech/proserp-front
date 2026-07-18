'use client';

import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import CostCenterSelector from '@/components/masters/costCenters/CostCenterSelector';
import { CostCenter } from '@/components/masters/costCenters/CostCenterType';
import { getErrorMessage } from '@/utilities/helpers/errorHandler';
import { Div } from '@jumbo/shared';
import { AccountBalanceOutlined } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  Box,
  Grid,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import { useQuery } from '@tanstack/react-query';
import { Dayjs } from 'dayjs';
import { useMemo, useState } from 'react';
import humanResourcesServices from '../../humanResourcesServices';
import MyHrAccountStatementListItem from './MyHrAccountStatementListItem';
import { MyHrAccountStatementRow } from './accountStatementType';

const formatBalance = (value: number) => {
  const formatted = value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return formatted === '-0.00' ? '0.00' : formatted;
};

// The account statement is always the employee's own payable ledger (money
// the company owes them) — a liability account, which conventionally
// increases with Credit. Unlike the admin ledger statement, /me/account-
// statement doesn't return an `increasesWith` flag (there's no ledger type
// to pick — it's always this one kind), so it's fixed here rather than
// threaded through as a prop.
const INCREASES_WITH: 'CR' = 'CR';

interface AppliedFilters {
  from?: string;
  to?: string;
  cost_center_ids?: number[];
}

const MyHrAccountStatement = () => {
  const { authOrganization } = useJumboAuth();
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [fromDate, setFromDate] = useState<Dayjs | null>(null);
  const [toDate, setToDate] = useState<Dayjs | null>(null);
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilters>({});

  const mainColor =
    authOrganization?.organization.settings?.main_color || '#2113AD';
  const contrastText =
    authOrganization?.organization.settings?.contrast_text || '#FFFFFF';

  const { data, isLoading, isFetching, isError, error } = useQuery({
    queryKey: ['showMyHrAccountStatement', appliedFilters],
    queryFn: () => humanResourcesServices.myHrAccountStatement(appliedFilters),
  });

  const handleFilter = () => {
    setAppliedFilters({
      ...(fromDate ? { from: fromDate.toISOString() } : {}),
      ...(toDate ? { to: toDate.toISOString() } : {}),
      ...(costCenters.length
        ? { cost_center_ids: costCenters.map((c) => c.id) }
        : {}),
    });
  };

  const { rows, totalDebits, totalCredits } = useMemo(() => {
    const transactions = data?.transactions || [];
    const [openingTx, ...restTx] = transactions;

    const openingBalance = openingTx
      ? INCREASES_WITH === 'CR'
        ? openingTx.credit - openingTx.debit
        : openingTx.debit - openingTx.credit
      : 0;

    let runningBalance = openingBalance;

    const computedRows: MyHrAccountStatementRow[] = [
      ...(openingTx
        ? [
            {
              transactionDate: openingTx.transactionDate,
              reference: '',
              description: openingTx.description,
              debit: null,
              credit: null,
              balance: openingBalance,
              isOpening: true,
            },
          ]
        : []),
      ...restTx.map((tx: any) => {
        runningBalance +=
          INCREASES_WITH === 'CR' ? tx.credit - tx.debit : tx.debit - tx.credit;
        return {
          transactionDate: tx.transactionDate,
          reference: [tx.voucherNo, tx.reference].filter(Boolean).join(' '),
          description: tx.description,
          debit: tx.debit,
          credit: tx.credit,
          balance: runningBalance,
        };
      }),
    ];

    return {
      rows: computedRows,
      totalDebits: restTx.reduce((sum: number, tx: any) => sum + tx.debit, 0),
      totalCredits: restTx.reduce((sum: number, tx: any) => sum + tx.credit, 0),
    };
  }, [data]);

  return (
    <Stack spacing={2} sx={{ mt: 1 }}>
      <Grid container columnSpacing={1} rowSpacing={1} alignItems='center'>
        <Grid size={{ xs: 12, md: 5 }}>
          <Div sx={{ mt: 1, mb: 1 }}>
            <CostCenterSelector
              label='Cost Centers'
              multiple
              allowSameType
              defaultValue={costCenters}
              onChange={(value) =>
                setCostCenters(
                  Array.isArray(value) ? value : value ? [value] : []
                )
              }
            />
          </Div>
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Div sx={{ mt: 1, mb: 1 }}>
            <DateTimePicker
              label='From'
              sx={{ width: '100%' }}
              value={fromDate}
              slotProps={{ textField: { size: 'small', fullWidth: true } }}
              onChange={setFromDate}
            />
          </Div>
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Div sx={{ mt: 1, mb: 1 }}>
            <DateTimePicker
              label='To'
              sx={{ width: '100%' }}
              value={toDate}
              minDate={fromDate ?? undefined}
              slotProps={{ textField: { size: 'small', fullWidth: true } }}
              onChange={setToDate}
            />
          </Div>
        </Grid>
        <Grid size={{ xs: 12, md: 1 }} textAlign={{ md: 'right' }}>
          <LoadingButton
            loading={isFetching}
            onClick={handleFilter}
            variant='contained'
            size='small'
            fullWidth
          >
            Filter
          </LoadingButton>
        </Grid>
      </Grid>

      {isLoading ? (
        <Stack spacing={1.5}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton
              key={i}
              variant='rectangular'
              width='100%'
              height={48}
              sx={{ borderRadius: 1 }}
            />
          ))}
        </Stack>
      ) : isError ? (
        <Box
          width='100%'
          py={6}
          display='flex'
          flexDirection='column'
          justifyContent='center'
          alignItems='center'
        >
          <AccountBalanceOutlined sx={{ width: 50, height: 50 }} />
          <Typography textAlign='center' fontSize={15} mt={1}>
            {getErrorMessage(error)}
          </Typography>
        </Box>
      ) : (
        <>
          <Grid container spacing={2}>
            <Grid size={6}>
              <Typography variant='subtitle2' color='primary'>
                Total Debits
              </Typography>
              <Typography variant='body2'>
                {formatBalance(totalDebits)}
              </Typography>
            </Grid>
            <Grid size={6}>
              <Typography variant='subtitle2' color='primary'>
                Total Credits
              </Typography>
              <Typography variant='body2'>
                {formatBalance(totalCredits)}
              </Typography>
            </Grid>
          </Grid>

          {rows.length === 0 ? (
            <Typography textAlign='center' color='text.secondary' py={4}>
              No transactions found for this period.
            </Typography>
          ) : (
            <TableContainer sx={{ overflowX: 'auto' }}>
              <Table size='small' sx={{ minWidth: 650 }}>
                <TableHead>
                  <TableRow>
                    <TableCell
                      sx={{ backgroundColor: mainColor, color: contrastText }}
                    >
                      Date
                    </TableCell>
                    <TableCell
                      sx={{ backgroundColor: mainColor, color: contrastText }}
                    >
                      Reference
                    </TableCell>
                    <TableCell
                      sx={{ backgroundColor: mainColor, color: contrastText }}
                    >
                      Description
                    </TableCell>
                    <TableCell
                      align='right'
                      sx={{ backgroundColor: mainColor, color: contrastText }}
                    >
                      Debit
                    </TableCell>
                    <TableCell
                      align='right'
                      sx={{ backgroundColor: mainColor, color: contrastText }}
                    >
                      Credit
                    </TableCell>
                    <TableCell
                      align='right'
                      sx={{ backgroundColor: mainColor, color: contrastText }}
                    >
                      Balance
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row, index) => (
                    <MyHrAccountStatementListItem
                      key={`${row.transactionDate}-${index}`}
                      row={row}
                      index={index}
                    />
                  ))}
                  <TableRow sx={{ backgroundColor: mainColor }}>
                    <TableCell
                      colSpan={3}
                      sx={{
                        color: contrastText,
                        fontWeight: 700,
                        borderBottom: 'none',
                      }}
                    >
                      TOTAL
                    </TableCell>
                    <TableCell
                      align='right'
                      sx={{
                        color: contrastText,
                        fontWeight: 700,
                        borderBottom: 'none',
                      }}
                    >
                      {formatBalance(totalDebits)}
                    </TableCell>
                    <TableCell
                      align='right'
                      sx={{
                        color: contrastText,
                        fontWeight: 700,
                        borderBottom: 'none',
                      }}
                    >
                      {formatBalance(totalCredits)}
                    </TableCell>
                    <TableCell
                      sx={{ backgroundColor: mainColor, borderBottom: 'none' }}
                    />
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}
    </Stack>
  );
};

export default MyHrAccountStatement;
