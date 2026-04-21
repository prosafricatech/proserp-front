'use client'
import React, { useState } from 'react';
import { 
  Grid, 
  LinearProgress, 
  Tooltip, 
  Typography, 
  Alert, 
  IconButton, 
  Dialog, 
  useMediaQuery, 
  Tabs, 
  Tab, 
  DialogContent, 
  Button, 
  Box, 
  ListItemText 
} from '@mui/material';
import { HighlightOff } from '@mui/icons-material';
import requisitionsServices from '../../requisitionsServices';
import ApprovedPaymentItemAction from './ApprovedPaymentItemAction';
import paymentServices from '@/components/accounts/transactions/payments/payment-services';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import PaymentOnScreenPreview from '@/components/accounts/transactions/payments/PaymentOnScreenPreview';
import PDFContent from '@/components/pdf/PDFContent';
import PaymentPDF from '@/components/accounts/transactions/payments/PaymentPDF';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { useQuery } from '@tanstack/react-query';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import UnauthorizedAccess from '@/shared/Information/UnauthorizedAccess';
import { ApprovalRequisition } from '../ApprovalRequisitionType';

interface Payment {
  id: number;
  transaction_date: string;
  voucherNo: string;
  reference: string;
  narration: string;
  journals_sum_amount: number;
  currency: {
    code: string;
  };
}

interface DocumentDialogProps {
  payment: Payment;
  authObject: any;
  setOpenDocumentDialog: (open: boolean) => void;
}

const DocumentDialog: React.FC<DocumentDialogProps> = ({ 
  payment, 
  authObject, 
  setOpenDocumentDialog 
}) => {
  const { data, isFetching } = useQuery({ 
    queryKey: ['payment', { id: payment.id }], 
    queryFn: () => paymentServices.show(payment.id)
  });
  const [activeTab, setActiveTab] = useState(0);

  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  if (isFetching) {
    return <LinearProgress />;
  }

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <DialogContent>
      {belowLargeScreen && (
        <Grid container alignItems="center" justifyContent="space-between">
          <Grid size={{xs: 11}}>
            <Tabs 
              value={activeTab} 
              onChange={handleTabChange} 
              aria-label="Payment View Tabs"
            >
              <Tab label="ONSCREEN" />
              <Tab label="PDF" />
            </Tabs>
          </Grid>

          <Grid size={{xs: 1}} textAlign="right">
            <Tooltip title="Close">
              <IconButton 
                size="small" 
                onClick={() => setOpenDocumentDialog(false)}
              >
                <HighlightOff color="primary" />
              </IconButton>
            </Tooltip>
          </Grid>
        </Grid>
      )}
      {belowLargeScreen && activeTab === 0 ?
        <PaymentOnScreenPreview transaction={data} authObject={authObject} /> 
        :
        <PDFContent
          fileName={payment.voucherNo}
          document={<PaymentPDF transaction={data} authObject={authObject} />}
        />
      }
      <Box textAlign="right" marginTop={5}>
        <Button variant="outlined" size='small' color="primary" onClick={() => setOpenDocumentDialog(false)}>
          Close
        </Button>
      </Box>
    </DialogContent>
  );
};

interface ApprovedPaymentListItemProps {
  approvedRequisition: ApprovalRequisition;
  isExpanded: boolean;
}

const ApprovedPaymentListItem: React.FC<ApprovedPaymentListItemProps> = ({ 
  approvedRequisition, 
  isExpanded 
}) => {
  const [openDocumentDialog, setOpenDocumentDialog] = useState(false);
  const { checkOrganizationPermission } = useJumboAuth();
  const { theme } = useJumboTheme();
  const authObject = useJumboAuth();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));
  const [selectedPayment, setSelectedPayment] = React.useState<Payment | null>(null);

  const { data: approvedPayments, isFetching } = useQuery({
    queryKey: ['approvedPayments', { id: approvedRequisition.id }],
    queryFn: async () => requisitionsServices.getApprovedPayments(approvedRequisition.id),
    enabled: !!isExpanded,
  });

  if (isFetching) {
    return <LinearProgress />;
  }

  if (!approvedPayments || approvedPayments.length === 0) {
    return (
      <Alert variant={'outlined'} severity={'info'}>
        No payments present.
      </Alert>
    );
  }

  return (
    <>
      <Typography variant="body1">Payments</Typography>
      {approvedPayments.map((pay: Payment) => (
        <Grid
          key={pay.id}
          paddingLeft={1}
          paddingRight={1}
          columnSpacing={1}
          alignItems={'center'}
          sx={{
            cursor: 'pointer',
            borderTop: 1,
            borderColor: 'divider',
            '&:hover': {
              bgcolor: 'action.hover',
            },
          }}
          container
        >
          <Grid size={{xs: 6, md: 3, lg: 2}}>
            <ListItemText
              primary={
                <Tooltip title={'Date'}>
                  <Typography component="span" lineHeight={1.25} mb={0} noWrap>
                    {readableDate(pay.transaction_date)}
                  </Typography>
                </Tooltip>
              }
            />
          </Grid>
          <Grid size={{xs: 6, md: 3, lg: 3}}>
            <ListItemText
              primary={
                <Tooltip title={'Voucher Number'}>
                  <Typography variant="body1" fontSize={14} lineHeight={1.25} mb={0} noWrap>
                    {pay.voucherNo}
                  </Typography>
                </Tooltip>
              }
              secondary={
                <Tooltip title={'Reference'}>
                  <Typography component="span" fontSize={14} lineHeight={1.25} mb={0}>
                    {pay.reference}
                  </Typography>
                </Tooltip>
              }
            />
          </Grid>
          <Grid size={{xs: 12, md: 3, lg: 3}}>
            <ListItemText
              secondary={
                <Tooltip title={'Narration'}>
                  <Typography component="span" lineHeight={1.25} mb={0}>
                    {pay.narration}
                  </Typography>
                </Tooltip>
              }
            />
          </Grid>
          <Grid 
            size={{xs: 12, md: 2, lg: 3}}
            sx={{ 
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'flex-end'
            }}
          >
            <Tooltip title={'Amount'}>
              <Box sx={{ marginRight: 1 }}>
                <Typography variant="body1" fontSize={14} lineHeight={1.25} mb={0} noWrap>
                  {pay.journals_sum_amount?.toLocaleString("en-US", {
                    style: "currency", 
                    currency: pay.currency.code
                  })}
                </Typography>
              </Box>
            </Tooltip>
          </Grid>
          <Grid size={{xs: 12, md: 1}} textAlign={'end'}>
            <Box display={'flex'} flexDirection={'row'} justifyContent={'flex-end'}> 
              <ApprovedPaymentItemAction 
                payment={pay} 
                approvedRequisition={approvedRequisition}
              />
            </Box>
          </Grid>
        </Grid>
      ))}

      <Dialog
        open={openDocumentDialog}
        fullWidth
        fullScreen={belowLargeScreen}
        maxWidth="md"
        onClose={() => {
          setOpenDocumentDialog(false);
          setSelectedPayment(null);
        }}
        scroll={belowLargeScreen ? 'body' : 'paper'}
      >
        {openDocumentDialog && (
          checkOrganizationPermission(PERMISSIONS.ACCOUNTS_TRANSACTIONS_READ) ? 
            <DocumentDialog 
              payment={selectedPayment!} 
              authObject={authObject} 
              setOpenDocumentDialog={setOpenDocumentDialog}
            /> : 
            <UnauthorizedAccess/>
        )}
      </Dialog>
    </>
  );
};

export default React.memo(ApprovedPaymentListItem);