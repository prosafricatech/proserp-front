import React from 'react';
import { Grid, Tab, Tabs } from '@mui/material';
import { MaterialApprovalRequisition } from '../ApprovalRequisitionType';
import ApprovedPurchaseListItem from '../approvedPurchase/ApprovedPurchaseListItem';
import ApprovedPaymentListItem from '../approvedPayment/ApprovedPaymentListItem';
import ApprovedIssueListItem from '../approvedIssue/ApprovedIssueListItem';

interface MaterialRequisitionTabsProps {
  approvedRequisition: MaterialApprovalRequisition;
  isExpanded: boolean;
}

function MaterialRequisitionTabs({
  approvedRequisition,
  isExpanded,
}: MaterialRequisitionTabsProps) {
  const [activeTab, setActiveTab] = React.useState(0);

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
          <Tab label='Store Issues' />
        </Tabs>
      </Grid>
      <Grid size={{ xs: 12 }}>
        {activeTab === 0 && (
          <ApprovedPurchaseListItem
            approvedRequisition={approvedRequisition as any}
            isExpanded={isExpanded}
          />
        )}
        {activeTab === 1 && (
          <ApprovedPaymentListItem
            approvedRequisition={approvedRequisition}
            isExpanded={isExpanded}
            showHeader={true}
          />
        )}
        {activeTab === 2 && (
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
