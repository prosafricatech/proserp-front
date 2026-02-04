'use client'
import JumboCardQuick from '@jumbo/components/JumboCardQuick/JumboCardQuick'
import { FeedOutlined, ListAltOutlined, Money, SummarizeOutlined, ViewTimelineOutlined } from '@mui/icons-material'
import { Button, Dialog, DialogActions, Grid, LinearProgress, Typography, useMediaQuery } from '@mui/material'
import React, { lazy, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMoneyBill1 } from '@fortawesome/free-regular-svg-icons';
import { faCubes, faTableCells } from '@fortawesome/free-solid-svg-icons'
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks'
import { useJumboAuth } from '@/app/providers/JumboAuthProvider'
import useProsERPStyles from '@/app/helpers/style-helpers'
import StockReport from '../procurement/stores/[store_id]/storeStock/StockReport'
import ItemMovement from '../procurement/stores/[store_id]/storeStock/ItemMovement'
import StockMovement from '../procurement/stores/[store_id]/reports/stockMovement/StockMovement'
import { MODULES } from '@/utilities/constants/modules'
import { PERMISSIONS } from '@/utilities/constants/permissions'
import DippingReport from '../fuelStation/reports/dippingReport/DippingReport'

const DebtorCreditorReport = lazy(() => import('../accounts/reports/debtorCreditor/DebtorCreditorReport'));
const CashierReport = lazy(() => import('../accounts/reports/cashierReport/CashierReport'));
const SalesAndCashSummary = lazy(() => import('../pos/reports/salesAndCashSummary/SalesAndCashSummary'));
const ProductsSelectProvider = lazy(() => import('../productAndServices/products/ProductsSelectProvider'));
const StakeholderSelectProvider = lazy(() => import('../masters/stakeholders/StakeholderSelectProvider'));
const SalesManifest = lazy(() => import('../pos/reports/salesManifest/SalesManifest'));
const LedgerSelectProvider = lazy(() => import('../accounts/ledgers/forms/LedgerSelectProvider'));

function QuickReports() {
    const { theme } = useJumboTheme();
    const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

    const { checkOrganizationPermission, organizationHasSubscribed } = useJumboAuth();
    const [stockReportDialogOpen, setStockReportDialogOpen] = useState(false);
    const [itemMovementDialogOpen, setItemMovementDialogOpen] = useState(false);
    const [openCashierReport, setOpenCashierReport] = useState(false);
    const [stockMovementDialogOpen, setStockMovementDialogOpen] = useState(false);
    const [debtorsCreditorsDialogOpen, setDebtorsCreditorsDialogOpen] = useState(false);
    const [openSalesAndCashSummary, setOpenSalesAndCashSummary] = useState(false);
    const [openSalesManifest, setOpenSalesManifest] = useState(false);
    const [openDippingReport, setOpenDippingReport] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const css = useProsERPStyles();

    const handleOpenDialog = (setter: React.Dispatch<React.SetStateAction<boolean>>) => {
        setIsLoading(true);
        setter(true);
        setTimeout(() => setIsLoading(false), 500); // Simulate loading time; adjust as needed
    };

    const handleCloseDialog = () => {
        setOpenDippingReport(false);
        setOpenSalesAndCashSummary(false);
        setDebtorsCreditorsDialogOpen(false);
        setOpenCashierReport(false);
        setStockReportDialogOpen(false);
        setItemMovementDialogOpen(false);
        setStockMovementDialogOpen(false);
        setOpenSalesManifest(false);
    };

    return (
        <>
            <Dialog 
                scroll={belowLargeScreen ? 'body' : 'paper'} 
                fullWidth 
                maxWidth={stockMovementDialogOpen || openDippingReport || openSalesManifest || openCashierReport ? 'lg' : 'md'} 
                fullScreen={belowLargeScreen} 
                open={openCashierReport || openSalesAndCashSummary || debtorsCreditorsDialogOpen || openDippingReport || stockReportDialogOpen || itemMovementDialogOpen || stockMovementDialogOpen || openSalesManifest}
            >
                {openSalesAndCashSummary && <SalesAndCashSummary setOpenSalesAndCashSummary={setOpenSalesAndCashSummary} />}
                {debtorsCreditorsDialogOpen && <DebtorCreditorReport />}
                {openCashierReport && <LedgerSelectProvider><CashierReport setOpenCashierReport={setOpenCashierReport} /></LedgerSelectProvider>}
                {stockReportDialogOpen && <StockReport setOpenDialog={setStockReportDialogOpen} isFromDashboard={true} />}
                {itemMovementDialogOpen && <ProductsSelectProvider><ItemMovement toggleOpen={setItemMovementDialogOpen} isFromDashboard={true} /></ProductsSelectProvider>}
                {stockMovementDialogOpen && <StockMovement toggleOpen={setStockMovementDialogOpen} isFromDashboard={true} />}
                {openDippingReport && <DippingReport/>}
                {openSalesManifest && <StakeholderSelectProvider><SalesManifest setOpenSalesManifest={setOpenSalesManifest} /></StakeholderSelectProvider>}

                {(debtorsCreditorsDialogOpen || openDippingReport) &&
                    <DialogActions className={css.hiddenOnPrint}>
                        <Button sx={{ m: 1 }} size='small' variant='outlined' onClick={handleCloseDialog}>
                            Close
                        </Button>
                    </DialogActions>
                }
            </Dialog>
            <JumboCardQuick
                title={'Quick Reports'}
            >
                {
                    isLoading ? 
                    <LinearProgress />
                    :
                    <Grid container columnSpacing={1} rowSpacing={1} justifyContent={'center'}>
                        {
                            (organizationHasSubscribed(MODULES.FUEL_STATION) || organizationHasSubscribed(MODULES.POINT_OF_SALE)) && checkOrganizationPermission(PERMISSIONS.SALES_REPORTS) &&
                            <Grid 
                                size={{ xs: 6, md: 2, lg: 1.5 }} 
                                p={1}
                                textAlign={'center'}
                                sx={{ 
                                    cursor: 'pointer',
                                    '&:hover': {
                                        bgcolor: 'action.hover',
                                    }
                                }}
                                onClick={() => handleOpenDialog(setOpenSalesAndCashSummary)}
                            >
                                <SummarizeOutlined sx={{ fontSize: '40px' }} />
                                <Typography>Sales & Cash Summary</Typography>
                            </Grid>
                        }
                        {
                            (organizationHasSubscribed(MODULES.POINT_OF_SALE) && checkOrganizationPermission(PERMISSIONS.SALES_REPORTS)) &&
                            <Grid 
                                size={{ xs: 6, md: 2, lg: 1.5 }} 
                                p={1}
                                textAlign={'center'}
                                sx={{ 
                                    cursor: 'pointer',
                                    '&:hover': {
                                        bgcolor: 'action.hover',
                                    }
                                }}
                                onClick={() => handleOpenDialog(setOpenSalesManifest)}
                            >
                                <ListAltOutlined sx={{ fontSize: '40px' }} />
                                <Typography>Sales Manifest</Typography>
                            </Grid>
                        }
                        {
                            (checkOrganizationPermission(PERMISSIONS.ACCOUNTS_REPORTS)) &&
                            <Grid 
                                size={{ xs: 6, md: 2, lg: 1.5 }} 
                                p={1}
                                textAlign={'center'}
                                sx={{ 
                                    cursor: 'pointer',
                                    '&:hover': {
                                        bgcolor: 'action.hover',
                                    }
                                }}
                                onClick={() => handleOpenDialog(setOpenCashierReport)}
                            >
                                <FontAwesomeIcon size='lg' icon={faMoneyBill1} style={{ fontSize: '48px' }} />
                                <Typography>Cashier Report</Typography>
                            </Grid>
                        }
                        {
                            organizationHasSubscribed(MODULES.FUEL_STATION) &&
                            <Grid 
                                size={{ xs: 6, md: 2, lg: 1.5 }} 
                                p={1}
                                textAlign={'center'}
                                sx={{ 
                                    cursor: 'pointer',
                                    '&:hover': {
                                        bgcolor: 'action.hover',
                                    }
                                }}
                                onClick={() => handleOpenDialog(setOpenDippingReport)}
                            >
                                <FontAwesomeIcon size='lg' icon={faTableCells} style={{ fontSize: '48px' }} />
                                <Typography>Dipping Report</Typography>
                            </Grid>
                        }
                        {
                            (organizationHasSubscribed(MODULES.PROCUREMENT_AND_SUPPLY) && checkOrganizationPermission(PERMISSIONS.STORES_REPORTS)) &&
                            <Grid 
                                size={{ xs: 6, md: 2, lg: 1.5 }} 
                                p={1}
                                textAlign={'center'}
                                sx={{ 
                                    cursor: 'pointer',
                                    '&:hover': {
                                        bgcolor: 'action.hover',
                                    }
                                }}
                                onClick={() => handleOpenDialog(setStockReportDialogOpen)}
                            >
                                <FontAwesomeIcon size='lg' icon={faCubes} style={{ fontSize: '48px' }} />
                                <Typography>Stock Report</Typography>
                            </Grid>
                        }
                        {
                            (organizationHasSubscribed(MODULES.PROCUREMENT_AND_SUPPLY) && checkOrganizationPermission(PERMISSIONS.STORES_REPORTS)) &&
                            <Grid 
                                size={{ xs: 6, md: 2, lg: 1.5 }} 
                                p={1}
                                textAlign={'center'}
                                sx={{ 
                                    cursor: 'pointer',
                                    '&:hover': {
                                        bgcolor: 'action.hover',
                                    }
                                }}
                                onClick={() => handleOpenDialog(setItemMovementDialogOpen)}
                            >
                                <ViewTimelineOutlined sx={{ fontSize: '40px' }} />
                                <Typography>Item Movement</Typography>
                            </Grid>
                        }
                        {
                            (organizationHasSubscribed(MODULES.PROCUREMENT_AND_SUPPLY) && checkOrganizationPermission(PERMISSIONS.STORES_REPORTS)) &&
                            <Grid 
                                size={{ xs: 6, md: 2, lg: 1.5 }} 
                                p={1}
                                textAlign={'center'}
                                sx={{ 
                                    cursor: 'pointer',
                                    '&:hover': {
                                        bgcolor: 'action.hover',
                                    }
                                }}
                                onClick={() => handleOpenDialog(setStockMovementDialogOpen)}
                            >
                                <FeedOutlined sx={{ fontSize: '40px' }} />
                                <Typography>Stock Movement</Typography>
                            </Grid>
                        }
                        {
                            checkOrganizationPermission(PERMISSIONS.ACCOUNTS_REPORTS) &&
                            <Grid 
                                size={{ xs: 6, md: 2, lg: 1.5 }} 
                                p={1}
                                textAlign={'center'}
                                sx={{ 
                                    cursor: 'pointer',
                                    '&:hover': {
                                        bgcolor: 'action.hover',
                                    }
                                }}
                                onClick={() => handleOpenDialog(setDebtorsCreditorsDialogOpen)}
                            >
                                <Money sx={{ fontSize: '40px' }} />
                                <Typography>Debtors & Creditors</Typography>
                            </Grid>
                        }
                    </Grid>
                }
            </JumboCardQuick>
        </>
    )
}

export default QuickReports