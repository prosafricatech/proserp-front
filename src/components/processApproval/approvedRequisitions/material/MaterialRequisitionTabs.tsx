'use client';

import React from 'react';
import { Grid, Tab, Tabs } from '@mui/material';
import { MaterialApprovalRequisition } from '../ApprovalRequisitionType';
import ApprovedPurchaseListItem from '../approvedPurchase/ApprovedPurchaseListItem';
import ApprovedPaymentListItem from '../approvedPayment/ApprovedPaymentListItem';
import ApprovedIssueListItem from '../approvedIssue/ApprovedIssueListItem';
import ImprestRetirementActionTail from '../imprestRetirement/ImprestRetirementActionTail';
import ImprestRetirementListItem from '../imprestRetirement/ImprestRetirementListItem';

// Fixed slots for the non-retirement tabs; Retirements and Store Issues shift
// depending on whether can_retire is true, since Retirements only renders then.
export const MATERIAL_TAB = {
  PURCHASE_ORDERS: 0,
  PAYMENTS: 1,
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
  const canRetire = !!approvedRequisition?.can_retire;
  const retirementTabIndex = canRetire ? 2 : -1;
  const storeIssueTabIndex = canRetire ? 3 : 2;

  return (
    <Grid container spacing={1}>
      <Grid size={{ xs: 12 }}>
        <Tabs
          value={activeTab}
          onChange={(_, value) => setActiveTab(value)}
          variant='scrollable'
          scrollButtons='auto'
          allowScrollButtonsMobile
        >
          <Tab label='Purchase Orders' />
          <Tab label='Payments' />
          {canRetire && <Tab label='Retirements' />}
          <Tab label='Store Issues' />
        </Tabs>
      </Grid>
      <Grid size={{ xs: 12 }}>
        {activeTab === MATERIAL_TAB.PURCHASE_ORDERS && (
          <ApprovedPurchaseListItem
            approvedRequisition={approvedRequisition as any}
            isExpanded={isExpanded}
          />
        )}

        {activeTab === MATERIAL_TAB.PAYMENTS && (
          <ApprovedPaymentListItem
            approvedRequisition={approvedRequisition}
            isExpanded={isExpanded}
            showHeader={true}
          />
        )}

        {canRetire && activeTab === retirementTabIndex && (
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

        {activeTab === storeIssueTabIndex && (
          <ApprovedIssueListItem
            approvedRequisition={approvedRequisition}
            isExpanded={isExpanded}
            showHeader={true}
          />
        )}
      </Grid>
    </Grid>
  );
}

export default React.memo(MaterialRequisitionTabs);