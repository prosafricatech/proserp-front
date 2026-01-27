'use client'

import { Alert, Card, Grid, Typography } from '@mui/material'
import React, { createContext, lazy, useContext, useEffect, useState } from 'react'
import dayjs from 'dayjs'
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { MODULES } from '@/utilities/constants/modules';
import { useRouter } from 'next/navigation';
import { CostCenter } from '../masters/costCenters/CostCenterType';
import { AuthUser } from '@/types/auth-types';
import { useLanguage } from '@/app/[lang]/contexts/LanguageContext'
import QuickLinks from './QuickLinks';

const OrganizationCalendar = lazy(() => import('./OrganizationCalendar'));
const Filters = lazy(() => import('./Filters'));
const LowStockAlerts = lazy(() => import('./procurementCards/LowStockAlerts'));
const DueInvoices = lazy(() => import('./accountsCards/DueInvoices'));
const ExpenseDistributionCard = lazy(() => import('./accountsCards/ExpenseDistributionCard'));
const InventoryValueTrend = lazy(() => import('./procurementCards/InventoryValueTrend'));
const PurchasesAndGrns = lazy(() => import('./procurementCards/PurchasesAndGrns'));
const ProductSalesCard = lazy(() => import('./posCards/ProductSalesCard'));
const ProfitAndLossTrendCard = lazy(() => import('./accountsCards/ProfitAndLossTrendCard'));
const BalanceSheetTrend = lazy(() => import('./accountsCards/BalanceSheetTrend'));
const RevenueDistributionCard = lazy(() => import('./accountsCards/RevenueDistributionCard'));
const DippingsCard = lazy(() => import('./fuelStationCards/DippingsCard'));
const QuickReports = lazy(() => import('./QuickReports'));

interface DashboardContextType {
  chartFilters: ChartFilters;
  setChartFilters: React.Dispatch<React.SetStateAction<ChartFilters>>;
}

interface ChartFilters {
  from: string;
  to: string;
  cost_center_ids: string | number[];
  costCenters: CostCenter[] | undefined;
}

interface Subscription {
  id?: string;
  days_remaining: number;
  status: string;
  modules: { id: string; name: string; settings?: { id: string; value: any }[] }[];
  successor?: any;
  [key: string]: any;
}

const DashboardContext = createContext<DashboardContextType>({} as DashboardContextType);

export const useDashboardSettings = () => useContext(DashboardContext);

function Dashboard() {
  const { authOrganization, checkOrganizationPermission, organizationHasSubscribed, authUser } = useJumboAuth();
  const active_subscriptions: any = authOrganization?.organization?.active_subscriptions || [];
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const lang = useLanguage();

  const [chartFilters, setChartFilters] = useState<ChartFilters>({
    from: dayjs().startOf('month').toISOString(),
    to: dayjs().endOf('day').toISOString(),
    cost_center_ids: ((authUser as AuthUser | null)?.user?.is_admin || checkOrganizationPermission('CostCenters:All')) ? 'all' : (authOrganization?.costCenters ? authOrganization.costCenters.map((cost_center: CostCenter) => cost_center.id) : []),
    costCenters: authOrganization?.costCenters && authOrganization.costCenters
  });

  const alertingSubscriptions = active_subscriptions.filter((subscription: Subscription) => !subscription?.successor && subscription.days_remaining <= 20);

  useEffect(() => {
    if (!authOrganization?.organization) {
      router.push(`/${lang}/organizations`);
    }
  }, [authOrganization]);

  const haveFuelStation = (chartFilters.costCenters || []).filter((cost_center: CostCenter) => 
    cost_center?.type === 'Fuel Station'
  ).length > 0;

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <React.Fragment>
      {
        authOrganization?.organization && (
          <DashboardContext.Provider value={{ chartFilters, setChartFilters }}>
            {
              active_subscriptions.length === 0 &&
              <Card sx={{ my: 1, p: 1 }}>
                <Alert sx={{ m: 1 }} severity='warning'>
                  This organization doesn't have any active subscriptions. Please subscribe to the desired modules to continue using ProsERP
                </Alert>
              </Card>
            }
            {
              (alertingSubscriptions.length > 0) && checkOrganizationPermission(PERMISSIONS.SUBSCRIPTIONS_MANAGE) &&
              <Card sx={{ my: 1, p: 1 }}>
                {
                  alertingSubscriptions.map((subscription: Subscription) => (
                    <Alert key={subscription.id} sx={{ m: 1 }} severity={subscription.days_remaining > 0 ? 'warning' : 'error'}>
                      {`Your subscription for `}
                      <Typography component="span" fontWeight={'bold'}>
                        {subscription.modules.map(module => module.name).join(', ')}
                      </Typography>
                      {` has `}<Typography component="span" fontWeight={'bold'}>{subscription.status}.</Typography>{` Please renew in time to avoid service interruption.`}
                    </Alert>
                  ))
                }
              </Card>
            }
            <Grid container spacing={1}>
              {
                (active_subscriptions.length > 0 && (
                  checkOrganizationPermission(PERMISSIONS.ACCOUNTS_REPORTS) ||
                  checkOrganizationPermission(PERMISSIONS.PURCHASES_REPORTS) ||
                  checkOrganizationPermission([PERMISSIONS.SALES_REPORTS, PERMISSIONS.ACCOUNTS_REPORTS], true)
                )) &&
                <Grid size={{ xs: 12 }}>
                  <Filters />
                </Grid>
              }
              {
                (organizationHasSubscribed(MODULES.ACCOUNTS_AND_FINANCE) && checkOrganizationPermission(PERMISSIONS.ACCOUNTS_REPORTS)) &&
                <React.Fragment>
                  {
                    chartFilters.costCenters && chartFilters.costCenters.filter(cost_center => cost_center.type === 'Fuel Station').length > 0 &&
                    <Grid size={{ xs: 12, xl: 8 }}>
                      <DippingsCard />
                    </Grid>
                  }
                  <Grid size={{ xs: 12, md: 6, xl: 4 }}>
                    <ProfitAndLossTrendCard />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6, xl: 4 }}>
                    <BalanceSheetTrend />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6, xl: 4 }}>
                    <RevenueDistributionCard />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6, xl: 4 }}>
                    <ExpenseDistributionCard />
                  </Grid>
                </React.Fragment>
              }
              {
                (organizationHasSubscribed(MODULES.PROCUREMENT_AND_SUPPLY) && checkOrganizationPermission(PERMISSIONS.STORES_REPORTS)) &&
                <React.Fragment>
                  {
                    checkOrganizationPermission(PERMISSIONS.ACCOUNTS_REPORTS) &&
                    <Grid size={{ xs: 12, md: 6, xl: 4 }}>
                      <InventoryValueTrend />
                    </Grid>
                  }
                  <Grid size={{ xs: 12, md: 6, xl: 4 }}>
                    <LowStockAlerts />
                  </Grid>
                </React.Fragment>
              }
              {
                (organizationHasSubscribed(MODULES.PROCUREMENT_AND_SUPPLY) && checkOrganizationPermission(PERMISSIONS.PURCHASES_REPORTS)) &&
                <Grid size={{ xs: 12, md: 6, xl: haveFuelStation ? 4 : 6 }}>
                  <PurchasesAndGrns />
                </Grid>
              }
              {
                (organizationHasSubscribed(MODULES.ACCOUNTS_AND_FINANCE) && checkOrganizationPermission(PERMISSIONS.ACCOUNTS_REPORTS)) &&
                <Grid size={{ xs: 12, md: 6, xl: haveFuelStation ? 4 : 6 }}>
                  <DueInvoices />
                </Grid>
              }
              {
                active_subscriptions.length > 0 && 1 < 0 &&
                <Grid size={{ xs: 12, md: 6, xl: 4 }}>
                  <OrganizationCalendar />
                </Grid>
              }
              {
                ((organizationHasSubscribed(MODULES.POINT_OF_SALE) || organizationHasSubscribed(MODULES.FUEL_STATION)) && checkOrganizationPermission([PERMISSIONS.SALES_REPORTS, PERMISSIONS.ACCOUNTS_REPORTS], true)) &&
                <Grid size={{ xs: 12, xl: haveFuelStation ? 8 : 12 }}>
                  <ProductSalesCard />
                </Grid>
              }
              {
                active_subscriptions.length > 0 &&
                <Grid size={{ xs: 12 }} textAlign={'center'}>
                  <QuickLinks />
                </Grid>
              }
              {
                active_subscriptions.length > 0 && checkOrganizationPermission([
                  PERMISSIONS.STORES_REPORTS,
                  PERMISSIONS.ACCOUNTS_REPORTS,
                  PERMISSIONS.SALES_REPORTS
                ]) &&
                <Grid size={{ xs: 12 }} textAlign={'center'}>
                  <QuickReports />
                </Grid>
              }
            </Grid>
          </DashboardContext.Provider>
        )
      }
    </React.Fragment>
  )
}

export default Dashboard