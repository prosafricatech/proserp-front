'use client';

import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { getErrorMessage } from '@/utilities/helpers/errorHandler';
import { VisibilityOutlined } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import { useQuery } from '@tanstack/react-query';
import { Dayjs } from 'dayjs';
import { useMemo, useState } from 'react';
import humanResourcesServices from '../../humanResourcesServices';
import { MyHrImprestLedgerLink } from './imprestAccountsType';

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

// An imprest/float ledger tracks money advanced TO the employee that they
// still owe an accounting of until it's retired — from the employee's side
// this behaves like an asset/receivable balance, which conventionally
// increases with Debit (the opposite of the Account Statement tab's payable
// ledger, which increases with Credit). NOT yet confirmed against a real
// populated statement response (only the /my-ledgers list sample was seen,
// which has no transactions) — verify the sign once real data comes back,
// and flip to 'CR' here if balances come out inverted.
const INCREASES_WITH: 'DR' | 'CR' = 'DR';

// Pulled into a function on purpose: TypeScript narrows a directly-
// referenced `const` to its literal initializer within the same scope even
// when it's annotated with a wider union type, so comparing
// `INCREASES_WITH === 'CR'` inline gets flagged as an "unintentional
// comparison" (the two literal types never overlap, as far as the narrowed
// type is concerned) even though it's fine at runtime. A function parameter
// isn't narrowed the same way, so wrapping the comparison here avoids the
// false-positive without needing a runtime cast.
function signedAmount(
  credit: number,
  debit: number,
  increasesWith: 'DR' | 'CR'
) {
  return increasesWith === 'CR' ? credit - debit : debit - credit;
}

interface AppliedFilters {
  from?: string;
  to?: string;
}

interface MyHrImprestAccountItemActionProps {
  link: MyHrImprestLedgerLink;
}

/**
 * Row action for one imprest ledger — opens a statement dialog. Same
 * self-contained action-with-own-dialog convention used elsewhere
 * (UserLedgerUnlinkRowAction.tsx / MyHrPayslipItemAction.tsx), query gated
 * on `enabled: open`.
 *
 * Filters here are From/To only (no Cost Centers, unlike the Account
 * Statement tab) — per the handoff doc, GET /my-ledgers/{ledgerId}/statement
 * only documents optional ?from=&to=.
 */
const MyHrImprestAccountItemAction = ({
  link,
}: MyHrImprestAccountItemActionProps) => {
  const { authOrganization } = useJumboAuth();
  const [open, setOpen] = useState(false);
  const [fromDate, setFromDate] = useState<Dayjs | null>(null);
  const [toDate, setToDate] = useState<Dayjs | null>(null);
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilters>({});

  const mainColor =
    authOrganization?.organization.settings?.main_color || '#2113AD';
  const contrastText =
    authOrganization?.organization.settings?.contrast_text || '#FFFFFF';

  const { data, isLoading, isFetching, isError, error } = useQuery({
    queryKey: ['myHrImprestAccountStatement', link.ledger_id, appliedFilters],
    queryFn: () =>
      humanResourcesServices.myHrImprestAccountStatement(
        link.ledger_id,
        appliedFilters
      ),
    enabled: open,
  });

  const handleFilter = () => {
    setAppliedFilters({
      ...(fromDate ? { from: fromDate.toISOString() } : {}),
      ...(toDate ? { to: toDate.toISOString() } : {}),
    });
  };

  const { rows, totalDebits, totalCredits } = useMemo(() => {
    const transactions = data?.transactions || [];
    const [openingTx, ...restTx] = transactions;

    const openingBalance = openingTx
      ? signedAmount(openingTx.credit, openingTx.debit, INCREASES_WITH)
      : 0;

    let runningBalance = openingBalance;

    const computedRows = [
      ...(openingTx
        ? [
            {
              transactionDate: openingTx.transactionDate,
              reference: '',
              description: openingTx.description,
              debit: null as number | null,
              credit: null as number | null,
              balance: openingBalance,
              isOpening: true,
            },
          ]
        : []),
      ...restTx.map((tx: any) => {
        runningBalance += signedAmount(tx.credit, tx.debit, INCREASES_WITH);
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
    <>
      <Tooltip title='View Statement'>
        <IconButton size='small' onClick={() => setOpen(true)}>
          <VisibilityOutlined fontSize='small' />
        </IconButton>
      </Tooltip>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth='md'
      >
        <DialogTitle>
          {link.ledger?.name || 'Imprest Account'} — Statement
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <Grid
              container
              columnSpacing={1}
              rowSpacing={1}
              alignItems='center'
            >
              <Grid size={{ xs: 6, md: 5 }}>
                <DateTimePicker
                  label='From'
                  sx={{ width: '100%' }}
                  value={fromDate}
                  slotProps={{ textField: { size: 'small', fullWidth: true } }}
                  onChange={setFromDate}
                />
              </Grid>
              <Grid size={{ xs: 6, md: 5 }}>
                <DateTimePicker
                  label='To'
                  sx={{ width: '100%' }}
                  value={toDate}
                  minDate={fromDate ?? undefined}
                  slotProps={{ textField: { size: 'small', fullWidth: true } }}
                  onChange={setToDate}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
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
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton
                    key={i}
                    variant='rectangular'
                    width='100%'
                    height={40}
                    sx={{ borderRadius: 1 }}
                  />
                ))}
              </Stack>
            ) : isError ? (
              <Box
                width='100%'
                py={4}
                display='flex'
                flexDirection='column'
                justifyContent='center'
                alignItems='center'
              >
                <Typography textAlign='center' fontSize={15}>
                  {getErrorMessage(error)}
                </Typography>
              </Box>
            ) : rows.length === 0 ? (
              <Typography textAlign='center' color='text.secondary' py={3}>
                No transactions found for this period.
              </Typography>
            ) : (
              <TableContainer sx={{ overflowX: 'auto' }}>
                <Table size='small' sx={{ minWidth: 600 }}>
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
                      <TableRow
                        key={`${row.transactionDate}-${index}`}
                        sx={{
                          backgroundColor:
                            index % 2 === 0
                              ? 'background.paper'
                              : 'action.hover',
                        }}
                      >
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>
                          {readableDate(row.transactionDate)}
                        </TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>
                          {row.reference || '—'}
                        </TableCell>
                        <TableCell
                          sx={{ fontWeight: row.isOpening ? 600 : 400 }}
                        >
                          {row.description}
                        </TableCell>
                        <TableCell align='right'>
                          {formatAmount(row.debit)}
                        </TableCell>
                        <TableCell align='right'>
                          {formatAmount(row.credit)}
                        </TableCell>
                        <TableCell align='right' sx={{ fontWeight: 600 }}>
                          {formatBalance(row.balance)}
                        </TableCell>
                      </TableRow>
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
                        sx={{
                          backgroundColor: mainColor,
                          borderBottom: 'none',
                        }}
                      />
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Stack>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MyHrImprestAccountItemAction;
