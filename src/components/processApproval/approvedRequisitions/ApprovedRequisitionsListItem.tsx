import React, { useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Badge,
  Chip,
  Grid,
  ListItemText,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import RemoveIcon from '@mui/icons-material/Remove';
import AddIcon from '@mui/icons-material/Add';
import ApprovedPurchaseActionTail from './approvedPurchase/ApprovedPurchaseActionTail';
import ApprovedPurchaseListItem from './approvedPurchase/ApprovedPurchaseListItem';
import ApprovedPaymentActionTail from './approvedPayment/ApprovedPaymentActionTail';
import ApprovedPaymentListItem from './approvedPayment/ApprovedPaymentListItem';
import ApprovalItemAction from '../listItem/tabs/ApprovalItemAction';
import { CreditScoreOutlined, ShoppingCartOutlined, VerifiedRounded } from '@mui/icons-material';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { ApprovalRequisition, PaymentApprovalRequisition, PurchaseApprovalRequisition } from './ApprovalRequisitionType';

interface ApprovedRequisitionsListItemProps {
  approvedRequisition: ApprovalRequisition;
}

const ApprovedRequisitionsListItem: React.FC<ApprovedRequisitionsListItemProps> = ({ 
  approvedRequisition 
}) => {
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const { checkOrganizationPermission } = useJumboAuth();

  const handleChange = (id: number) => {
    setExpanded(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const isPayment = approvedRequisition.process_type === 'PAYMENT';
  const paymentsCount = isPayment ? (approvedRequisition as PaymentApprovalRequisition).payments_count : 0;
  const purchasesCount = !isPayment ? (approvedRequisition as PurchaseApprovalRequisition).purchase_orders_count : 0;
  const paymentsOrPurchasesCount = isPayment ? paymentsCount : purchasesCount;

  const isFullyProcessed = isPayment 
    ? (approvedRequisition as PaymentApprovalRequisition).is_fully_paid 
    : (approvedRequisition as PurchaseApprovalRequisition).is_fully_ordered;
  const hasProcessItems = paymentsOrPurchasesCount > 0;

  return (
    <Accordion
      key={approvedRequisition.id}
      expanded={!!expanded[approvedRequisition.id]}
      onChange={() => handleChange(approvedRequisition.id)}
      square
      sx={{ 
        borderRadius: 2, 
        borderTop: 2,
        borderColor: 'divider',
        '&:hover': {
          bgcolor: 'action.hover',
        },
      }}
    >
      <AccordionSummary
        expandIcon={expanded[approvedRequisition.id] ? <RemoveIcon /> : <AddIcon />}
        sx={{
          px: 2,
          flexDirection: 'row-reverse',
          '.MuiAccordionSummary-content': {
            alignItems: 'center',
            '&.Mui-expanded': {
              margin: '10px 0',
            }
          },
          '.MuiAccordionSummary-expandIconWrapper': {
            borderRadius: 1,
            border: 1,
            color: 'text.secondary',  
            transform: 'none',
            mr: 0.5,
            '&.Mui-expanded': {
              transform: 'none',
              color: 'primary.main',
              borderColor: 'primary.main',
            },
            '& svg': {
              fontSize: '0.9rem',
            },
          },
        }}
      >
        <Grid 
          container
          spacing={1}
          alignItems="center"
          width={'100%'}
          sx={{ paddingLeft: 1, paddingRight: 1 }}
        >
          <Grid size={{ xs: 12, md: 2 }}>
            <Tooltip title="Requisition No.">
              <Typography>{approvedRequisition.requisition.requisitionNo}</Typography>
            </Tooltip>
            <Tooltip title="Approval Date">
              <Typography variant="caption">
                {readableDate(approvedRequisition.approval_date)}
              </Typography>
            </Tooltip>
          </Grid>

          <Grid size={{ xs: 12, md: 2.5 }}>
            <Tooltip title="Process">
              <Typography textTransform="capitalize">
                {approvedRequisition.process_type.toLowerCase()}
              </Typography>
            </Tooltip>
            <Tooltip title="Cost Center">
              <Chip
                size="small"
                label={approvedRequisition.requisition.cost_center?.name}
              />
            </Tooltip>
          </Grid>

          <Grid size={{ xs: 12, md: 4, lg: 4.8 }}>
            <ListItemText
              secondary={
                <Tooltip title="Remarks">
                  <Typography component="span" fontSize={14}>
                    {approvedRequisition.remarks}
                  </Typography>
                </Tooltip>
              }
            />
          </Grid>

          <Grid size={{ xs: 8, md: 2.5, lg: 1.7 }}>
            <Tooltip title="Amount">
              <Typography>
                {(approvedRequisition.amount + approvedRequisition.vat_amount)?.toLocaleString('en-US', {
                  style: 'currency',
                  currency: approvedRequisition.currency?.code,
                })}
              </Typography>
            </Tooltip>
            <Tooltip title="Status">
              <Chip
                size="small"
                label={approvedRequisition.status_label}
                color="success"
              />
            </Tooltip>
          </Grid>

          <Grid size={{ xs: 4, md: 1 }}>
            <Stack
              direction="row"
              spacing={1.5}
              justifyContent="flex-end"
              alignItems="center"
              mt={2}
            >
              {(hasProcessItems && (!isFullyProcessed || paymentsOrPurchasesCount > 1)) && (
                <Tooltip title={isPayment ? 'Payments Count' : 'Purchase Orders Count'}>
                  <Badge
                    badgeContent={paymentsOrPurchasesCount}
                    color="info"
                  >
                    {isPayment ? (
                      <CreditScoreOutlined fontSize="small" />
                    ) : (
                      <ShoppingCartOutlined fontSize="small" />
                    )}
                  </Badge>
                </Tooltip>
              )}

              {isFullyProcessed && (
                <Tooltip title={isPayment ? 'Fully Paid' : 'Fully Ordered'}>
                  <VerifiedRounded fontSize="small" color="success" />
                </Tooltip>
              )}
            </Stack>
          </Grid>
        </Grid>
      </AccordionSummary>

      <AccordionDetails sx={{ 
        backgroundColor: 'background.paper',
        marginBottom: 3
      }}>
        <Grid container spacing={1}>
          <Grid size={{ xs: 12 }} sx={{ textAlign: 'end' }}>
            <Grid container spacing={1} justifyContent="flex-end">
              <Grid>
                <ApprovalItemAction approval={approvedRequisition as any} hideOtherActions />
              </Grid>
              <Grid>
                {!isPayment && 
                  checkOrganizationPermission([PERMISSIONS.APPROVED_REQUISITIONS_PURCHASE]) && 
                  !(approvedRequisition as PurchaseApprovalRequisition).is_fully_ordered && (
                    <ApprovedPurchaseActionTail
                      approvedRequisition={approvedRequisition as PurchaseApprovalRequisition}
                      isExpanded={expanded[approvedRequisition.id]}
                    />
                  )}
                {isPayment &&
                  checkOrganizationPermission([PERMISSIONS.APPROVED_REQUISITIONS_PAY]) && 
                  !(approvedRequisition as PaymentApprovalRequisition).is_fully_paid && (
                    <ApprovedPaymentActionTail
                      approvedRequisition={approvedRequisition as PaymentApprovalRequisition}
                      isExpanded={expanded[approvedRequisition.id]}
                    />
                  )}
              </Grid>
            </Grid>
          </Grid>

          <Grid size={{ xs: 12 }}>
            {isPayment ? (
              <ApprovedPaymentListItem
                approvedRequisition={approvedRequisition as PaymentApprovalRequisition}
                isExpanded={expanded[approvedRequisition.id]}
              />
            ) : (
              <ApprovedPurchaseListItem
                approvedRequisition={approvedRequisition as PurchaseApprovalRequisition}
                isExpanded={expanded[approvedRequisition.id]}
              />
            )}
          </Grid>
        </Grid>
      </AccordionDetails>
    </Accordion>
  );
};

export default React.memo(ApprovedRequisitionsListItem);