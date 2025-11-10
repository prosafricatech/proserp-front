'use client'

import JumboCardQuick from '@jumbo/components/JumboCardQuick/JumboCardQuick'
import { BalanceOutlined, DeckOutlined, Money, ReceiptLongOutlined, ViewTimelineOutlined } from '@mui/icons-material'
import { Button, Dialog, DialogActions, Grid,Typography, useMediaQuery } from '@mui/material'
import React, { useEffect, useState } from 'react'
import IncomeStatement from './incomeStatement/IncomeStatement'
import LedgerSelectProvider from '../ledgers/forms/LedgerSelectProvider'
import TrialBalance from './trial balance/TrialBalance'
import BalanceSheet from './balance sheet/BalanceSheet'
import XReport from './zReport/ZReport'
import DebtorCreditorReport from './debtorCreditor/DebtorCreditorReport'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMoneyBill1} from '@fortawesome/free-regular-svg-icons'
import CashierReport from './cashierReport/CashierReport'
import useProsERPStyles from '@/app/helpers/style-helpers'
import { useJumboAuth } from '@/app/providers/JumboAuthProvider'
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks'
import { MODULES } from '@/utilities/constants/modules'
import UnsubscribedAccess from '@/shared/Information/UnsubscribedAccess'
import { PERMISSIONS } from '@/utilities/constants/permissions'
import UnauthorizedAccess from '@/shared/Information/UnauthorizedAccess'

function AccountsReports() {
    const css = useProsERPStyles();
    const [openDialog, setOpenDialog] = useState(false);
    const [openBalanceSheet, setOpenBalanceSheet] = useState(false);
    const [openCashierReport, setOpenCashierReport] = useState(false);
    const [openReceiptDialog, setOpenReceiptDialog] = useState(false);
    const [openTrialBalance, setOpenTrialBalance] = useState(false);

    const [report, setReport] = useState(null);
    const {checkOrganizationPermission, authOrganization,organizationHasSubscribed} = useJumboAuth();

    //Screen handling constants
    const {theme} = useJumboTheme();
    const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

    const [mounted, setMounted] = useState(false);
    useEffect(() => {
       setMounted(true);
    }, []);

    if (!mounted) return null;

    if(!organizationHasSubscribed(MODULES.ACCOUNTS_AND_FINANCE)){
        return <UnsubscribedAccess modules={'Accounts & Finance'}/>
    }

    if(!checkOrganizationPermission(PERMISSIONS.ACCOUNTS_REPORTS)){
        return <UnauthorizedAccess/>;
    }
  return (
    <React.Fragment>
        <LedgerSelectProvider>
            <Dialog 
                scroll={belowLargeScreen ? 'body' : 'paper'} 
                fullWidth
                maxWidth={(openCashierReport || openTrialBalance) ? 'lg' : 'md'}
                fullScreen={(openBalanceSheet || openCashierReport || IncomeStatement) && belowLargeScreen} 
                open={openDialog || openReceiptDialog || openBalanceSheet || openCashierReport || openTrialBalance}
            >
                {report}
                {!openCashierReport &&
                    <DialogActions className={css.hiddenOnPrint}>
                        <Button sx={{ m:1 }} size='small' variant='outlined' onClick={() =>{ setOpenDialog(false) ; setOpenReceiptDialog(false); setOpenBalanceSheet(false); setOpenTrialBalance(false); setOpenCashierReport(false);}}>
                            Close
                        </Button>
                    </DialogActions>
                }
            </Dialog>
            <Typography variant={'h4'} mb={2}>Financial Reports</Typography>
            <JumboCardQuick 
                sx={{ height:'100%'  }}
            >
                <Grid container textAlign={'center'} columnSpacing={2} rowSpacing={2}>
                    <Grid sx={{ 
                            cursor: 'pointer',
                            '&:hover': {
                                bgcolor: 'action.hover',
                            }
                        }}
                        size={{xs: 6, md: 3, lg: 2}} 
                        p={1}
                        textAlign={'center'}
                        onClick={() => {
                            setReport(<CashierReport setOpenCashierReport={setOpenCashierReport}/>)
                            setOpenCashierReport(true);
                        }}
                    >
                        <FontAwesomeIcon size='lg' icon={faMoneyBill1}  style={{ fontSize: '48px' }}/>
                        <Typography>Cashier Report</Typography>
                    </Grid>
                    <Grid sx={{ 
                                cursor: 'pointer',
                                '&:hover': {
                                    bgcolor: 'action.hover',
                                }
                            }}
                            size={{xs: 6, md: 3, lg: 2}} 
                        p={1}
                        textAlign={'center'}
                        onClick={() => {
                            setReport(<IncomeStatement/>)
                            setOpenDialog(true);
                        }}
                    >
                        <ViewTimelineOutlined sx={{ fontSize: '40px' }} />
                        <Typography>Income Statement</Typography>
                    </Grid>
                    <Grid sx={{ 
                            cursor: 'pointer',
                            '&:hover': {
                                bgcolor: 'action.hover',
                            }
                        }}
                        size={{xs: 6, md: 3, lg: 2}} 
                        p={1}
                        textAlign={'center'}
                        onClick={() => {
                            setReport(<TrialBalance/>)
                            setOpenTrialBalance(true);
                        }}
                    >
                        <DeckOutlined sx={{ fontSize: '40px' }} />
                        <Typography>Trial Balance</Typography>
                    </Grid>
                    <Grid sx={{ 
                            cursor: 'pointer',
                            '&:hover': {
                                bgcolor: 'action.hover',
                            }
                        }}
                        size={{xs: 6, md: 3, lg: 2}} 
                        p={1}
                        textAlign={'center'}
                        onClick={() => {
                            setReport(<BalanceSheet/>)
                            setOpenBalanceSheet(true);
                        }}
                    >
                        <BalanceOutlined sx={{ fontSize: '40px' }} />
                        <Typography>Balance Sheet</Typography>
                    </Grid>
                    {
                        authOrganization?.organization?.tra_serial_number &&
                        <React.Fragment>
                            <Grid sx={{ 
                                cursor: 'pointer',
                                '&:hover': {
                                    bgcolor: 'action.hover',
                                }
                            }} xs={6} 
                            md={3} 
                            lg={2} 
                            p={1}
                            textAlign={'center'}
                            onClick={() => {
                                setReport(<XReport/>)
                                setOpenReceiptDialog(true);
                            }}
                        >
                            <ReceiptLongOutlined sx={{ fontSize: '40px' }} />
                            <Typography>Z Report</Typography>
                        </Grid>
                        </React.Fragment>
                    }
                    <Grid sx={{ 
                            cursor: 'pointer',
                            '&:hover': {
                                bgcolor: 'action.hover',
                            }
                        }}
                        size={{xs: 6, md: 3, lg: 2}} 
                        p={1}
                        textAlign={'center'}
                        onClick={() => {
                            setReport(<DebtorCreditorReport/>)
                            setOpenDialog(true);
                        }}
                    >
                        <Money sx={{ fontSize: '40px' }} />
                        <Typography>Debtors & Creditors</Typography>
                    </Grid>
                </Grid>
            </JumboCardQuick>
        </LedgerSelectProvider>
    </React.Fragment>
  )
}

export default AccountsReports