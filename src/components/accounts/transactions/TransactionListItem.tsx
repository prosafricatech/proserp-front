import { Box, Grid, ListItemText, Stack, Tooltip, Typography } from '@mui/material'
import React from 'react'
import PaymentItemAction from './payments/PaymentItemAction'
import ReceiptItemAction from './receipts/ReceiptItemAction'
import TransferItemAction from './tranfers/TransferItemAction'
import JumboChipsGroup from '@jumbo/components/JumboChipsGroup/JumboChipsGroup'
import JournalItemAction from './journals/JournalItemAction'
import { readableDate } from '@/app/helpers/input-sanitization-helpers'
import { Transaction, TransactionTypes } from './TransactionTypes'
import SaleInvoiceAdjustmentItemAction from '@/components/pos/counter/salesListItem/invoice/saleAdjustment/SaleInvoiceAdjustmentItemAction'

function TransactionListItem({ transaction, type }: { transaction: Transaction, type: TransactionTypes }) {

    const SecondaryAction = () => {
        if (type === 'payments') {
            return <PaymentItemAction transaction={transaction} />
        } else if (type === 'receipts') {
            return <ReceiptItemAction transaction={transaction} />
        } else if (type === 'transfers') {
            return <TransferItemAction transaction={transaction} />
        } else if (type === 'journal_vouchers') {
            return <JournalItemAction transaction={transaction} />
        } else if (type === 'debit' || type === 'credit') {
            return <SaleInvoiceAdjustmentItemAction transaction={transaction} type={type}/>
        }
    }

    return (
        <Grid
            container
            columnSpacing={1}
            sx={{
                cursor: 'pointer',
                borderTop: 1,
                borderColor: 'divider',
                '&:hover': {
                    bgcolor: 'action.hover',
                },
                padding: 1
            }}
            alignItems={'center'}
        >
            <Grid size={{ xs: 6, md: 3, lg: 2 }}>
                <ListItemText
                    primary={
                        <Tooltip title={'Date'}>
                            <Typography
                                variant={"h5"}
                                lineHeight={1.25}
                                mb={0}
                                noWrap
                                component="span"
                            >
                                {readableDate(transaction.transaction_date)}
                            </Typography>
                        </Tooltip>
                    }
                />
            </Grid>

            <Grid size={{ xs: 6, md: 3, lg: 2 }}>
                <ListItemText
                    primary={
                        <Stack direction="row">
                            <Tooltip title="Voucher Number">
                                <Typography
                                    variant="h5"
                                    fontSize={14}
                                    lineHeight={1.25}
                                    mb={0}
                                    noWrap
                                    component="span"
                                >
                                    {transaction.voucherNo}
                                </Typography>
                            </Tooltip>
                            {!!transaction?.requisitionNo && (
                                <Tooltip title="Requisition No.">
                                    <Typography
                                        variant="caption"
                                        color="gray"
                                        component="span"
                                    >
                                        &nbsp;{` - ${transaction.requisitionNo}`}
                                    </Typography>
                                </Tooltip>
                            )}
                        </Stack>
                    }
                    secondary={
                        <Tooltip title="Reference">
                            <Typography
                                variant="h5"
                                fontSize={14}
                                lineHeight={1.25}
                                mb={0}
                                component="span"
                            >
                                {transaction.reference}
                            </Typography>
                        </Tooltip>
                    }
                />
            </Grid>

            <Grid size={{ xs: 12, md: 6, lg: 3 }}>
                <ListItemText
                    primary={
                        <JumboChipsGroup
                            chips={transaction.cost_centers}
                            mapKeys={{ label: "name" }}
                            spacing={1}
                            size={"small"}
                            max={3}
                            title="Cost Centers"
                        />
                    }
                />
            </Grid>

            <Grid size={{ xs: 12, md: 9, lg: 3 }}>
                <ListItemText
                    secondary={
                        <Tooltip title={'Narration'}>
                            <Typography component={'span'} lineHeight={1.25} mb={0}>
                                {transaction.narration}
                            </Typography>
                        </Tooltip>
                    }
                />
            </Grid>

            <Grid size={{ xs: 12, md: 2, lg: 1.5 }} sx={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'flex-end'
            }}>
                <Tooltip title={'Amount'}>
                    <Box sx={{ marginRight: 1 }}>
                        <Typography
                            variant={"h5"}
                            fontSize={14}
                            lineHeight={1.25}
                            mb={0}
                            noWrap
                            component="span"
                        >
                            {transaction.amount.toLocaleString("en-US", {
                                style: "currency",
                                currency: transaction.currency.code
                            })}
                        </Typography>
                    </Box>
                </Tooltip>
            </Grid>

            <Grid size={{ xs: 12, md: 1, lg: 0.5 }}>
                <Box display={'flex'} flexDirection={'row'} justifyContent={'flex-end'}>
                    <SecondaryAction />
                </Box>
            </Grid>
        </Grid>
    )
}

export default TransactionListItem
