import JumboCardQuick from '@jumbo/components/JumboCardQuick/JumboCardQuick'
import { AutoStoriesOutlined, FormatListNumberedRtl, Inventory2Outlined, ListOutlined, LocalGasStation, PointOfSaleOutlined, QrCodeOutlined, QrCode2Rounded, ReceiptOutlined, ShoppingCartOutlined } from '@mui/icons-material'
import { Grid, LinearProgress, Typography } from '@mui/material'
import React, { useState } from 'react'
import DashboardQuickLink from '../procurement/reports/productInsights/DashboardQuickLink'
import { useJumboAuth } from '@/app/providers/JumboAuthProvider'
import { MODULES } from '@/utilities/constants/modules'
import { PERMISSIONS } from '@/utilities/constants/permissions'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/app/[lang]/contexts/LanguageContext'

function QuickLinks() {
    const router = useRouter();
    const lang = useLanguage();
    const { checkOrganizationPermission, organizationHasSubscribed } = useJumboAuth();
    const [isLoading, setIsLoading] = useState(false);

    const handleNavigation = (path: string) => {
        setIsLoading(true);
        router.push(`/${lang}${path}`);
        setTimeout(() => setIsLoading(false), 500); // Simulate loading time; adjust as needed
    };

    return (
        <JumboCardQuick
            title={'Quick Links'}
        >
            {isLoading && <LinearProgress />}
            <Grid container columnSpacing={1} rowSpacing={1} justifyContent={'center'}>
                {
                    organizationHasSubscribed(MODULES.PROJECT_MANAGEMENT) && checkOrganizationPermission([
                        PERMISSIONS.PROJECTS_READ,
                        PERMISSIONS.PROJECTS_CREATE,
                        PERMISSIONS.PROJECTS_EDIT,
                        PERMISSIONS.PROJECTS_DELETE
                    ]) &&
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
                        onClick={() => handleNavigation('/projectManagement/projects')}
                    >
                        <ListOutlined sx={{ fontSize: '40px' }} />
                        <Typography>Projects</Typography>
                    </Grid>
                }
                {
                    organizationHasSubscribed(MODULES.MANUFACTURING_AND_PROCESSING) &&
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
                        onClick={() => handleNavigation('/manufacturing/batches')}
                    >
                        <QrCodeOutlined sx={{ fontSize: '40px' }} />
                        <Typography>Batches</Typography>
                    </Grid>
                }
                {
                    (organizationHasSubscribed(MODULES.FUEL_STATION) && checkOrganizationPermission([
                        PERMISSIONS.FUEL_SALES_SHIFT_READ,
                        PERMISSIONS.FUEL_SALES_SHIFT_CREATE,
                        PERMISSIONS.FUEL_SALES_SHIFT_UPDATE,
                        PERMISSIONS.FUEL_SALES_SHIFT_DELETE,
                        PERMISSIONS.FUEL_SALES_SHIFT_CLOSE
                    ])) &&
                    <Grid 
                        size={{ xs: 6, md: 2, lg: 1 }} 
                        p={1}
                        textAlign={'center'}
                        sx={{ 
                            cursor: 'pointer',
                            '&:hover': {
                                bgcolor: 'action.hover',
                            }
                        }}
                        onClick={() => handleNavigation('/fuelStations/salesShifts')} 
                    >
                        <LocalGasStation sx={{ fontSize: '40px' }} />
                        <Typography>Sales Shift</Typography>
                    </Grid>
                }
                {
                    (organizationHasSubscribed(MODULES.POINT_OF_SALE) && checkOrganizationPermission([
                        PERMISSIONS.SALES_READ,
                        PERMISSIONS.SALES_CREATE,
                        PERMISSIONS.SALES_EDIT,
                        PERMISSIONS.SALES_COMPLETE
                    ])) &&
                    <Grid 
                        size={{ xs: 6, md: 2, lg: 1 }} 
                        p={1}
                        textAlign={'center'}
                        sx={{ 
                            cursor: 'pointer',
                            '&:hover': {
                                bgcolor: 'action.hover',
                            }
                        }}
                        onClick={() => handleNavigation('/pos/sales-counters')}
                    >
                        <PointOfSaleOutlined sx={{ fontSize: '40px' }} />
                        <Typography>Sales</Typography>
                    </Grid>
                }
                {
                    (organizationHasSubscribed(MODULES.PROCUREMENT_AND_SUPPLY) && checkOrganizationPermission([
                        PERMISSIONS.PURCHASES_READ,
                        PERMISSIONS.PURCHASES_CREATE,
                        PERMISSIONS.PURCHASES_RECEIVE
                    ])) &&
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
                        onClick={() => handleNavigation('/procurement/purchases')}
                    >
                        <ShoppingCartOutlined sx={{ fontSize: '40px' }} />
                        <Typography>Purchases</Typography>
                    </Grid>
                }
                {
                    organizationHasSubscribed(MODULES.PROCESS_APPROVAL) && 
                    checkOrganizationPermission([
                        PERMISSIONS.REQUISITIONS_READ,
                        PERMISSIONS.REQUISITIONS_CREATE,
                        PERMISSIONS.REQUISITIONS_EDIT
                    ]) &&
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
                        onClick={() => handleNavigation('/requisitions')}
                    >
                        <FormatListNumberedRtl sx={{ fontSize: '40px' }} />
                        <Typography>Requisitions</Typography>
                    </Grid>
                }
                {
                    (organizationHasSubscribed(MODULES.ACCOUNTS_AND_FINANCE) && checkOrganizationPermission(PERMISSIONS.ACCOUNTS_TRANSACTIONS_READ)) &&
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
                        onClick={() => handleNavigation('/accounts/transactions')}
                    >
                        <ReceiptOutlined sx={{ fontSize: '40px' }} />
                        <Typography>Transactions</Typography>
                    </Grid>
                }
                {
                    (organizationHasSubscribed(MODULES.ACCOUNTS_AND_FINANCE) && checkOrganizationPermission(PERMISSIONS.ACCOUNTS_MASTERS_READ)) &&
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
                        onClick={() => handleNavigation('/accounts/ledgers')}
                    >
                        <AutoStoriesOutlined sx={{ fontSize: '40px' }} />
                        <Typography>Ledgers</Typography>
                    </Grid>
                }
                {
                    (organizationHasSubscribed(MODULES.PROCUREMENT_AND_SUPPLY) && checkOrganizationPermission([
                        PERMISSIONS.STORES_READ,
                        PERMISSIONS.STORES_CREATE
                    ])) &&
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
                        onClick={() => handleNavigation('/procurement/stores')}
                    >
                        <Inventory2Outlined sx={{ fontSize: '40px' }} />
                        <Typography>Stores</Typography>
                    </Grid>
                }
                {
                    ((organizationHasSubscribed(MODULES.PROCUREMENT_AND_SUPPLY) && checkOrganizationPermission([
                        PERMISSIONS.STORES_REPORTS, 
                        PERMISSIONS.PURCHASES_REPORTS,
                        PERMISSIONS.ACCOUNTS_REPORTS
                    ], true))) &&
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
                    >
                        <DashboardQuickLink/>
                    </Grid>
                }
                {
                    (organizationHasSubscribed(MODULES.PROCUREMENT_AND_SUPPLY) && checkOrganizationPermission([
                        PERMISSIONS.PRODUCTS_READ,
                        PERMISSIONS.PRODUCTS_CREATE,
                        PERMISSIONS.PRODUCTS_EDIT
                    ])) &&
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
                        onClick={() => handleNavigation('/procurement/products')}
                    >
                        <QrCode2Rounded sx={{ fontSize: '40px' }} />
                        <Typography>Products</Typography>
                    </Grid>
                }
            </Grid>
        </JumboCardQuick>
    )
}

export default QuickLinks