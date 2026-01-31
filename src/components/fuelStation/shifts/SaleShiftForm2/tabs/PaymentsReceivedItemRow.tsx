import { useLedgerSelect } from '@/components/accounts/ledgers/forms/LedgerSelectProvider';
import { DisabledByDefault, EditOutlined } from '@mui/icons-material';
import { Divider, Grid, IconButton, Tooltip, Typography } from '@mui/material';
import React, { useState } from 'react';
import PaymentsReceived from './PaymentsReceived';

interface Ledger {
  id?: number;
  name: string;
}

interface PaymentsReceivedItemRow {
  debit_ledger?: Ledger;
  debit_ledger_id?: number;
  debitLedgerName?: string;
  credit_ledger?: Ledger;
  credit_ledger_id?: number;
  creditLedgerName?: string;
  amount: number;
  narration: string;
}

interface PaymentsReceivedItemRowProps {
    setClearFormKey: (value: React.SetStateAction<number>) => void;
    submitMainForm: () => void;
    setSubmitItemForm: (value: boolean) => void;
    submitItemForm: boolean;
    setIsDirty: (value: boolean) => void;
    item: PaymentsReceivedItemRow;
    index: number;
    paymentItems?: PaymentsReceivedItemRow[];
    setPaymentItems: (items: PaymentsReceivedItemRow[] | ((prevItems: PaymentsReceivedItemRow[]) => PaymentsReceivedItemRow[])) => void;
}

function PaymentsReceivedItemRow({ 
    setClearFormKey, 
    submitMainForm, 
    setSubmitItemForm, 
    submitItemForm, 
    setIsDirty, 
    item, 
    index, 
    paymentItems = [], 
    setPaymentItems,
    showWarning,
    setShowWarning,
    clearFormKey
}: PaymentsReceivedItemRowProps & { showWarning: boolean; setShowWarning: (val: boolean) => void; clearFormKey: number }) {
    const { ungroupedLedgerOptions } = useLedgerSelect();
    const debit_ledger = ungroupedLedgerOptions.find(ledger => ledger.id === item.debit_ledger_id)
    const credit_ledger = ungroupedLedgerOptions.find(ledger => ledger.id === item.credit_ledger_id)
    const [showForm, setShowForm] = useState(false);

    return (
        <React.Fragment>
            <Divider />
            {!showForm ? (
                <Grid container
                    sx={{
                        cursor: 'pointer',
                        '&:hover': {
                            bgcolor: 'action.hover',
                        }
                    }}
                >
                    <Grid size={{xs: 1, md: 0.5}}>
                        {index + 1}.
                    </Grid>
                    
                    <Grid size={{xs: 6, md: 3}}>
                        <Tooltip title="Paid By">
                            <Typography>{credit_ledger?.name || item.creditLedgerName}</Typography>
                        </Tooltip>
                    </Grid>
                    
                    <Grid size={{xs: 6, md: 3}}>
                        <Tooltip title="Paid To">
                            <Typography>{debit_ledger?.name || item.debitLedgerName}</Typography>
                        </Tooltip>
                    </Grid>
                    
                    <Grid size={{xs: 6, md: 4, lg: 2.5}}>
                        <Tooltip title="Narration">
                            <Typography>{item.narration}</Typography>
                        </Tooltip>
                    </Grid>
                    
                    <Grid size={{xs: 6, md: 3, lg: 2}}>
                        <Tooltip title="Amount">
                            <Typography textAlign={'right'}>{item.amount?.toLocaleString()}</Typography>
                        </Tooltip>
                    </Grid>
                    
                    <Grid textAlign={'end'} size={{xs: 12, md: 12, lg: 1}}>
                        <Tooltip title='Edit Item'>
                            <IconButton size='small' onClick={() => { setShowForm(true) }}>
                                <EditOutlined fontSize='small' />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title='Remove Item'>
                            <IconButton size='small'
                                onClick={() => setPaymentItems(prevItems => {
                                    const newItems = [...prevItems];
                                    newItems.splice(index, 1);
                                    return newItems;
                                })}
                            >
                                <DisabledByDefault fontSize='small' color='error' />
                            </IconButton>
                        </Tooltip>
                    </Grid>
                </Grid>
            ) : (
                <PaymentsReceived
                    item={item}
                    submitMainForm={submitMainForm} 
                    setClearFormKey={setClearFormKey}
                    setSubmitItemForm={setSubmitItemForm} 
                    submitItemForm={submitItemForm}
                    setIsDirty={setIsDirty}
                    setShowForm={setShowForm}
                    index={index}
                    paymentItems={paymentItems}
                    setPaymentItems={setPaymentItems}
                    showWarning={showWarning}
                    setShowWarning={setShowWarning}
                    clearFormKey={clearFormKey}
                />
            )}
        </React.Fragment>
    );
}

export default PaymentsReceivedItemRow;