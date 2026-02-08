'use client'

import JumboCardQuick from '@jumbo/components/JumboCardQuick/JumboCardQuick';
import { Dialog, Grid, Typography, useMediaQuery } from '@mui/material';
import React, { useState, ReactNode } from 'react';
import { ListAltOutlined, SummarizeOutlined } from '@mui/icons-material';
import SalesManifest from './salesManifest/SalesManifest';
import StakeholderSelectProvider from '../../masters/stakeholders/StakeholderSelectProvider';
import CashierReport from '../../accounts/reports/cashierReport/CashierReport';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMoneyBill1 } from '@fortawesome/free-regular-svg-icons';
import LedgerSelectProvider from '../../accounts/ledgers/forms/LedgerSelectProvider';
import SalesAndCashSummary from './salesAndCashSummary/SalesAndCashSummary';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { MODULES } from '@/utilities/constants/modules';
import UnsubscribedAccess from '@/shared/Information/UnsubscribedAccess';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import UnauthorizedAccess from '@/shared/Information/UnauthorizedAccess';

function SalesReports() {
    const [openCashierReport, setOpenCashierReport] = useState<boolean>(false);
    const [openSalesAndCashSummary, setOpenSalesAndCashSummary] = useState<boolean>(false);
    const [openSalesManifest, setOpenSalesManifest] = useState<boolean>(false);
    const [report, setReport] = useState<ReactNode>(null);
    const { checkOrganizationPermission, organizationHasSubscribed } = useJumboAuth();
    
    // Screen handling constants
    const { theme } = useJumboTheme();
    const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

    const [mounted, setMounted] = React.useState(false);
    React.useEffect(() => {
       setMounted(true);
    }, []);

    if (!mounted) return null;

    if (!organizationHasSubscribed(MODULES.POINT_OF_SALE)) {
        return <UnsubscribedAccess modules={'Point of Sale (POS)'} />;
    }

    if (!checkOrganizationPermission(PERMISSIONS.SALES_REPORTS)) {
        return <UnauthorizedAccess />;
    }

    return (
        <React.Fragment>
            <LedgerSelectProvider>
                <StakeholderSelectProvider>
                    <Dialog 
                        scroll={belowLargeScreen ? 'body' : 'paper'} 
                        fullScreen={belowLargeScreen} 
                        fullWidth 
                        maxWidth={openSalesAndCashSummary ? 'md' : 'lg'} 
                        open={openCashierReport || openSalesManifest || openSalesAndCashSummary}
                    >
                        {report}
                    </Dialog>
                    <Typography variant={'h4'} mb={2}>POS Reports</Typography>
                    <JumboCardQuick sx={{ height: '100%' }}>
                        <Grid container textAlign={'center'} columnSpacing={2} rowSpacing={2}>
                            {/* Cashier Report Card */}
                            <Grid 
                                sx={{ 
                                    cursor: 'pointer',
                                    '&:hover': {
                                        bgcolor: 'action.hover',
                                    }
                                }} 
                                size={{xs: 6, md: 3, lg: 2}}
                                p={1}
                                textAlign={'center'}
                                onClick={() => {
                                    setReport(<CashierReport setOpenCashierReport={setOpenCashierReport} />);
                                    setOpenCashierReport(true);
                                }}
                            >
                                <FontAwesomeIcon 
                                    size='lg' 
                                    icon={faMoneyBill1}  
                                    style={{ fontSize: '48px' }}
                                />
                                <Typography>Cashier Report</Typography>
                            </Grid>

                            {/* Sales Manifest Card */}
                            <Grid 
                                sx={{ 
                                    cursor: 'pointer',
                                    '&:hover': {
                                        bgcolor: 'action.hover',
                                    }
                                }} 
                                size={{xs: 6, md: 3, lg: 2}}
                                p={1}
                                textAlign={'center'}
                                onClick={() => {
                                    setReport(<SalesManifest setOpenSalesManifest={setOpenSalesManifest} />);
                                    setOpenSalesManifest(true);
                                }}
                            >
                                <ListAltOutlined sx={{ fontSize: '40px' }} />
                                <Typography>Sales Manifest</Typography>
                            </Grid>

                            {/* Sales & Cash Summary Card */}
                            <Grid 
                                sx={{ 
                                    cursor: 'pointer',
                                    '&:hover': {
                                        bgcolor: 'action.hover',
                                    }
                                }} 
                                size={{xs: 6, md: 3, lg: 2}}
                                p={1}
                                textAlign={'center'}
                                onClick={() => {
                                    setReport(<SalesAndCashSummary setOpenSalesAndCashSummary={setOpenSalesAndCashSummary} />);
                                    setOpenSalesAndCashSummary(true);
                                }}
                            >
                                <SummarizeOutlined sx={{ fontSize: '40px' }} />
                                <Typography>Sales & Cash Summary</Typography>
                            </Grid>
                        </Grid>
                    </JumboCardQuick>
                </StakeholderSelectProvider>
            </LedgerSelectProvider>
        </React.Fragment>
    );
}

export default SalesReports;