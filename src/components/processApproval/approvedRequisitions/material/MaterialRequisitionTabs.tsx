'use client';

import React from 'react';
import { Grid, Tab, Tabs } from '@mui/material';
import { MaterialApprovalRequisition } from '../ApprovalRequisitionType';
import ApprovedPurchaseListItem from '../approvedPurchase/ApprovedPurchaseListItem';
import ApprovedPaymentListItem from '../approvedPayment/ApprovedPaymentListItem';
import ApprovedIssueListItem from '../approvedIssue/ApprovedIssueListItem';
import ImprestRetirementActionTail from '../imprestRetirement/ImprestRetirementActionTail';
import ImprestRetirementListItem from '../imprestRetirement/ImprestRetirementListItem';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import ApprovedPurchaseActionTail from '../approvedPurchase/ApprovedPurchaseActionTail';
import ApprovedPaymentActionTail from '../approvedPayment/ApprovedPaymentActionTail';
import ApprovedIssueActionTail from '../approvedIssue/ApprovedIssueActionTail';

export const MATERIAL_TAB = {
  PURCHASE_ORDERS: 0,
  PAYMENTS: 1,
  RETIREMENTS: 2,
  STORE_ISSUES: 3,
} as const;

interface MaterialRequisitionTabsProps {
  approvedRequisition: MaterialApprovalRequisition;
  isExpanded: boolean;
  activeTab: number;
  setActiveTab: React.Dispatch<React.SetStateAction<number>>;
}

function MaterialRequisitionTabs({
  approvedRequisition,
  isExpanded,
  activeTab,
  setActiveTab,
}: MaterialRequisitionTabsProps) {
  const { checkOrganizationPermission } = useJumboAuth();
  
  const canRetire = !!approvedRequisition?.can_retire;
  const isFullyOrdered = approvedRequisition?.is_fully_ordered === true;
  const isFullyPaid = approvedRequisition?.is_fully_paid === true;
  const isFullyIssued = approvedRequisition?.is_fully_issued === true;
  const isFullyFulfilled = approvedRequisition?.is_fully_fulfilled === true;
  const purchaseOrdersCount = approvedRequisition?.purchase_orders_count || 0;
  const paymentsCount = approvedRequisition?.payments_count || 0;
  const issuesCount = approvedRequisition?.issues_count || 0;
  const imprestAmount = approvedRequisition?.imprest_amount || 0;

  // "Done" (fully ordered/paid/issued) should only hide the action to raise a
  // new one — a tab with existing history stays visible so it can be reviewed,
  // same as the Purchase Orders / Payments tabs behave for other requisition
  // types. Payments is further gated on there being an imprest portion at all —
  // no point showing an empty Payments tab when nothing was ever routed there.
  const showPurchaseOrdersTab = !isFullyOrdered || purchaseOrdersCount > 0;
  const showPaymentsTab = imprestAmount > 0 || paymentsCount > 0;
  const showRetirementsTab = canRetire && !isFullyFulfilled;
  const showStoreIssuesTab = !isFullyIssued || issuesCount > 0;

  React.useEffect(() => {
    const availableTabs = [];
    if (showPurchaseOrdersTab) availableTabs.push(MATERIAL_TAB.PURCHASE_ORDERS);
    if (showPaymentsTab) availableTabs.push(MATERIAL_TAB.PAYMENTS);
    if (showRetirementsTab) availableTabs.push(MATERIAL_TAB.RETIREMENTS);
    if (showStoreIssuesTab) availableTabs.push(MATERIAL_TAB.STORE_ISSUES);

    if (availableTabs.length > 0 && !availableTabs.includes(activeTab)) {
      setActiveTab(availableTabs[0]);
    }
  }, [activeTab, showPurchaseOrdersTab, showPaymentsTab, showRetirementsTab, showStoreIssuesTab, setActiveTab]);

  const getNextAvailableTab = (currentTab: number): number => {
    const tabs = [];
    if (showPurchaseOrdersTab) tabs.push(MATERIAL_TAB.PURCHASE_ORDERS);
    if (showPaymentsTab) tabs.push(MATERIAL_TAB.PAYMENTS);
    if (showRetirementsTab) tabs.push(MATERIAL_TAB.RETIREMENTS);
    if (showStoreIssuesTab) tabs.push(MATERIAL_TAB.STORE_ISSUES);
    
    if (!tabs.includes(currentTab)) {
      return tabs[0] || MATERIAL_TAB.PURCHASE_ORDERS;
    }
    return currentTab;
  };

  return (
    <Grid container spacing={1}>
      <Grid size={{ xs: 12 }}>
        <Tabs
          value={getNextAvailableTab(activeTab)}
          onChange={(_, value) => setActiveTab(value)}
          variant='scrollable'
          scrollButtons='auto'
          allowScrollButtonsMobile
        >
          {showPurchaseOrdersTab && (
            <Tab value={MATERIAL_TAB.PURCHASE_ORDERS} label='Purchase Orders' />
          )}
          {showPaymentsTab && (
            <Tab value={MATERIAL_TAB.PAYMENTS} label='Payments' />
          )}
          {showRetirementsTab && (
            <Tab value={MATERIAL_TAB.RETIREMENTS} label='Retirements' />
          )}
          {showStoreIssuesTab && (
            <Tab value={MATERIAL_TAB.STORE_ISSUES} label='Store Issues' />
          )}
        </Tabs>
      </Grid>
      <Grid size={{ xs: 12 }}>
        {activeTab === MATERIAL_TAB.PURCHASE_ORDERS && showPurchaseOrdersTab && (
          <Grid size={{ xs: 12 }}>
            <Grid container spacing={1} justifyContent='flex-end' mb={1}>
              <Grid size={{ xs: 12 }} textAlign='right'>
                {
                  checkOrganizationPermission([PERMISSIONS.APPROVED_REQUISITIONS_PURCHASE]) &&
                  !isFullyOrdered && (
                    <ApprovedPurchaseActionTail
                      approvedRequisition={approvedRequisition as any}
                      isExpanded={isExpanded}
                    />
                  )}
              </Grid>
              <Grid size={{ xs: 12 }}>
                <ApprovedPurchaseListItem
                  approvedRequisition={approvedRequisition as any}
                  isExpanded={isExpanded}
                />
              </Grid>
            </Grid>
          </Grid>
        )}

        {activeTab === MATERIAL_TAB.PAYMENTS && showPaymentsTab && (
          <Grid size={{ xs: 12 }}>
            <Grid container spacing={1} justifyContent='flex-end' mb={1}>
              <Grid size={{ xs: 12 }} textAlign='right'>
                {
                  checkOrganizationPermission([PERMISSIONS.APPROVED_REQUISITIONS_PAY]) &&
                  !isFullyPaid && (
                    <ApprovedPaymentActionTail
                      approvedRequisition={approvedRequisition}
                      isExpanded={isExpanded}
                    />
                  )}
              </Grid>
              <Grid size={{ xs: 12 }}>
                <ApprovedPaymentListItem
                  approvedRequisition={approvedRequisition}
                  isExpanded={isExpanded}
                  showHeader={true}
                />
              </Grid>
            </Grid>
          </Grid>
        )}

        {activeTab === MATERIAL_TAB.RETIREMENTS && showRetirementsTab && (
          <Grid size={{ xs: 12 }}>
            <Grid container spacing={1} justifyContent='flex-end' mb={1}>
              <Grid size={{ xs: 12 }} textAlign='right'>
                <ImprestRetirementActionTail
                  approvedRequisition={approvedRequisition as any}
                  isExpanded={isExpanded}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <ImprestRetirementListItem
                  requisitionApprovalId={approvedRequisition.id}
                  approvedRequisition={approvedRequisition}
                />
              </Grid>
            </Grid>
          </Grid>
        )}

        {activeTab === MATERIAL_TAB.STORE_ISSUES && showStoreIssuesTab && (
          <Grid size={{ xs: 12 }}>
            <Grid container spacing={1} justifyContent='flex-end' mb={1}>
              <Grid size={{ xs: 12 }} textAlign='right'>
                {
                  checkOrganizationPermission([PERMISSIONS.INVENTORY_CONSUMPTIONS_CREATE]) &&
                  !isFullyIssued && (
                    <ApprovedIssueActionTail
                      approvedRequisition={approvedRequisition}
                      isExpanded={isExpanded}
                    />
                  )}
              </Grid>
              <Grid size={{ xs: 12 }}>
                <ApprovedIssueListItem
                  approvedRequisition={approvedRequisition}
                  isExpanded={isExpanded}
                />
              </Grid>
            </Grid>
          </Grid>
        )}
      </Grid>
    </Grid>
  );
}

export default React.memo(MaterialRequisitionTabs);