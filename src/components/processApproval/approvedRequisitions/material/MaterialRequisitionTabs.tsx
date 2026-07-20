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

        {activeTab === MATERIAL_TAB.PAYMENTS && (
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

        {canRetire && activeTab === MATERIAL_TAB.RETIREMENTS && (
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

        {activeTab === MATERIAL_TAB.STORE_ISSUES && (
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
                  showHeader={true}
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