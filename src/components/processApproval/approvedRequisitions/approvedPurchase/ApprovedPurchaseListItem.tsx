import React from 'react';
import requisitionsServices from '../../requisitionsServices';
import { Chip, Grid, LinearProgress, Tooltip, Typography, Alert, Box } from '@mui/material';
import ApprovedPurchaseItemAction from './ApprovedPurchaseItemAction';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { useQuery } from '@tanstack/react-query';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { PurchaseApprovalRequisition } from '../ApprovalRequisitionType';
import { Currency } from '@/components/masters/Currencies/CurrencyType';
import { Stakeholder } from '@/components/masters/stakeholders/StakeholderType';

interface Order {
  id: number;
  orderNo: string;
  order_date: string;
  stakeholder: Stakeholder
  status: string;
  amount: number;
  vat_amount: number;
  currency: Currency;
  has_payment_requisition: boolean;
}

interface ApprovedPurchaseListItemProps {
  approvedRequisition: PurchaseApprovalRequisition;
  isExpanded: boolean;
}

function ApprovedPurchaseListItem({ approvedRequisition, isExpanded }: ApprovedPurchaseListItemProps) {
  const { checkOrganizationPermission } = useJumboAuth();

  const {
    data: approvedPurchaseOrders,
    isFetching,
    error,
  } = useQuery({
    queryKey: ['approvedPurchaseOrders', { id: approvedRequisition.id }],
    queryFn: async () => await requisitionsServices.getApprovedPurchaseOrders(approvedRequisition.id),
    enabled: isExpanded,
  });

  if (isFetching) {
    return <LinearProgress />;
  }

  if (error) {
    return (
      <Alert variant="outlined" severity="error">
        Error loading orders: {error.message}
      </Alert>
    );
  }

  if (!approvedPurchaseOrders || approvedPurchaseOrders.length === 0) {
    return (
      <Alert variant="outlined" severity="info">
        No orders present.
      </Alert>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
      case 'Fully Received':
      case 'Instantly Received':
        return 'success';
      case 'Partially Received':
        return 'warning';
      case 'Closed':
        return 'info';
      default:
        return 'primary';
    }
  };

  return (
    <>
      <Typography variant="subtitle1" gutterBottom>
        Orders
      </Typography>
      {approvedPurchaseOrders.map((order: Order) => (
        <Grid
          key={order.id}
          container
          sx={{
            paddingLeft: 1,
            paddingRight: 1,
            cursor: 'pointer',
            borderTop: 1,
            borderColor: 'divider',
            '&:hover': {
              bgcolor: 'action.hover',
            },
          }}
        >
          <Grid size={{ xs: 6, md: 2.5 }}>
            <Tooltip title="Order No.">
              <Typography>{order.orderNo}</Typography>
            </Tooltip>
            <Tooltip title="Date">
              <Typography variant="caption">{readableDate(order.order_date)}</Typography>
            </Tooltip>
          </Grid>

          <Grid size={{ xs: 6, md: 4 }}>
            <Tooltip title="Supplier">
              <Typography>{order.stakeholder.name}</Typography>
            </Tooltip>
          </Grid>

          <Grid 
            size={{ xs: 12, md: 4.5 }}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <Tooltip title="Status">
              <Chip
                size="small"
                label={order.status}
                color={getStatusColor(order.status)}
              />
            </Tooltip>

            {checkOrganizationPermission(PERMISSIONS.PURCHASES_CREATE) && (
              <Tooltip title="Amount">
                <Typography>
                  {(order.amount + order.vat_amount).toLocaleString('en-US', {
                    style: 'currency',
                    currency: order.currency.code,
                  })}
                </Typography>
              </Tooltip>
            )}
          </Grid>

          <Grid size={{ xs: 12, md: 1 }} sx={{ textAlign: 'end' }}>
            <Box display="flex" flexDirection="row" justifyContent="flex-end">
              <ApprovedPurchaseItemAction 
                order={order} 
                approvedRequisition={approvedRequisition}
              />
            </Box>
          </Grid>
        </Grid>
      ))}
    </>
  );
}

export default React.memo(ApprovedPurchaseListItem);