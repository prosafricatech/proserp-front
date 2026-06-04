'use client';

import { Grid, Tab, Tabs } from '@mui/material';
import React from 'react';
import { PaymentApprovalRequisition } from '../ApprovalRequisitionType';
import ApprovedPaymentActionTail from '../approvedPayment/ApprovedPaymentActionTail';
import ApprovedPaymentListItem from '../approvedPayment/ApprovedPaymentListItem';
import ImprestRetirementActionTail from './ImprestRetirementActionTail';
import ImprestRetirementListItem from './ImprestRetirementListItem';

interface ImprestRequisitionTabsProps {
  approvedRequisition: PaymentApprovalRequisition;
  activeTab: number;
  setActiveTab: (value: number) => void;
  isExpanded: boolean;
}

function ImprestRequisitionTabs({
  approvedRequisition,
  activeTab,
  setActiveTab,
  isExpanded,
}: ImprestRequisitionTabsProps) {
  return (
    <Grid container spacing={1}>
      <Grid size={{ xs: 12 }}>
        <Tabs
          value={activeTab}
          onChange={(_event, newValue) => setActiveTab(newValue)}
          aria-label='Imprest tabs'
        >
          <Tab label='Payments' />
          <Tab label='Retirements' />
        </Tabs>
      </Grid>

      {activeTab === 0 && (
        <Grid size={{ xs: 12 }}>
          <Grid container spacing={1} justifyContent='flex-end' mb={1}>
            <Grid>
              <ApprovedPaymentActionTail
                approvedRequisition={approvedRequisition}
                isExpanded={isExpanded}
              />
            </Grid>
          </Grid>
          <ApprovedPaymentListItem
            approvedRequisition={approvedRequisition}
            isExpanded={isExpanded}
          />
        </Grid>
      )}

      {activeTab === 1 && (
        <Grid size={{ xs: 12 }}>
          <Grid container spacing={1} justifyContent='flex-end' mb={1}>
            <Grid size={{ xs: 12 }} textAlign='right'>
              <ImprestRetirementActionTail
                approvedRequisition={approvedRequisition}
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
    </Grid>
  );
}

export default React.memo(ImprestRequisitionTabs);
