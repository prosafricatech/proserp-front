import { 
  faFileInvoice, 
  faReceipt, 
  faTruckArrowRight 
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  Box, 
  Button, 
  Dialog, 
  DialogActions, 
  DialogContent, 
  DialogTitle, 
  Divider, 
  Grid, 
  IconButton,
  Tab, 
  Tabs, 
  Tooltip, 
  useMediaQuery 
} from '@mui/material';
import { InventoryOutlined } from '@mui/icons-material';
import React, { useState, lazy, Suspense } from 'react';
import posServices from '../../pos-services';
import SaleDeliveryNotes from './SaleDeliveryNotes';
import SaleReceipts from './receipt/SaleReceipts';
import SaleInvoices from './SaleInvoices';
import { useTheme } from '@mui/material/styles';
import { useQuery } from '@tanstack/react-query';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { Organization } from '@/types/auth-types';
import { SalesOrder } from '../SalesOrderType';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import UnauthorizedAccess from '@/shared/Information/UnauthorizedAccess';
import { DispatchReportOnScreen } from './saleDispatchReport/DispatchReportOnScreen';
import { useCounter } from '../CounterProvider';
import SaleAdjustments from './SaleAdjustments';
import { BackdropSpinner } from '@/shared/ProgressIndicators/BackdropSpinner';

// Lazy-loaded components
const SaleInvoiceForm = lazy(() => import('./invoice/SaleInvoiceForm'));
const SaleReceiptForm = lazy(() => import('./receipt/SaleReceiptForm'));
const SalesDispatchForm = lazy(() => import('./dispatch/SalesDispatchForm'));
const SalesDispatchReport = lazy(() => import('./saleDispatchReport/SalesDispatchReport'));
const PDFContent = lazy(() => import('@/components/pdf/PDFContent'));

interface DispatchReportProps {
  organization: Organization;
  sale: SalesOrder;
  setOpenDispatchReport: (open: boolean) => void;
}

const DispatchReport: React.FC<DispatchReportProps> = ({ 
  organization, 
  sale, 
  setOpenDispatchReport 
}) => {
  const { data: saleDispatchReport, isFetching } = useQuery({
    queryKey: ['saleDispatchReport', { saleId: sale.id }],
    queryFn: () => posServices.saleDispatchReport(sale.id)
  });
  const [activeTab, setActiveTab] = useState(0);
  const theme = useTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  if (isFetching) {
    return <BackdropSpinner />;
  }

  if (!saleDispatchReport) return null;

  return (
    <>
      <DialogTitle>
        {belowLargeScreen && (
          <Tabs value={activeTab} onChange={handleChange} aria-label="dispatch report tabs">
            <Tab label="ONSCREEN"/>
            <Tab label="PDF"/>
          </Tabs>
        )}
      </DialogTitle>
      <DialogContent>
        <Suspense fallback={<BackdropSpinner />}>
          {belowLargeScreen && activeTab === 0 ? (
            <DispatchReportOnScreen
              organization={organization} 
              dispatchReport={saleDispatchReport}
            />
          ) : (
            <PDFContent 
              fileName={`Dispatch Report For ${saleDispatchReport.saleNo}`} 
              document={
                <SalesDispatchReport 
                  organization={organization} 
                  dispatchReport={saleDispatchReport} 
                />
              } 
            />
          )}
        </Suspense>
      </DialogContent>
      {belowLargeScreen && (
        <DialogActions>
          <Button 
            variant="outlined" 
            size='small' 
            color="primary" 
            onClick={() => setOpenDispatchReport(false)}
          >
            Cancel
          </Button>
        </DialogActions>
      )}
    </>
  );
};

interface DialogProps {
  saleId: number;
  toggleOpen: (open: boolean) => void;
}

const DispatchDialog: React.FC<DialogProps> = ({ saleId, toggleOpen }) => {
  const { data: saleData, isFetching } = useQuery({
    queryKey: ['sale', { id: saleId }],
    queryFn: () => posServices.saleDetails(saleId)
  });

  if (isFetching) {
    return <BackdropSpinner/>;
  }

  return (
    <Suspense fallback={<BackdropSpinner />}>
      {saleData && <SalesDispatchForm toggleOpen={toggleOpen} sale={saleData} />}
    </Suspense>
  );
};

const InvoicesDialog: React.FC<DialogProps> = ({ saleId, toggleOpen }) => {
  const { data: saleData, isFetching } = useQuery({
    queryKey: ['sale', { id: saleId }],
    queryFn: () => posServices.saleDetails(saleId)
  });

  if (isFetching) {
    return <BackdropSpinner/>;
  }

  return (
    <Suspense fallback={<BackdropSpinner />}>
      {saleData && <SaleInvoiceForm toggleOpen={toggleOpen} sale={saleData} />}
    </Suspense>
  );
};

const ReceiptDialog: React.FC<DialogProps> = ({ saleId, toggleOpen }) => {
  const { data: saleData, isFetching } = useQuery({
    queryKey: ['sale', { id: saleId }],
    queryFn: () => posServices.saleDetails(saleId)
  });

  if (isFetching) {
    return <BackdropSpinner/>;
  }

  return (
    <Suspense fallback={<BackdropSpinner />}>
      {saleData && <SaleReceiptForm toggleOpen={toggleOpen} sale={saleData} />}
    </Suspense>
  );
};

interface SalesListItemTabsProps {
  sale: SalesOrder;
  activeTab: number;
  expanded: boolean;
  setActiveTab: (value: number) => void;
}

const SalesListItemTabs: React.FC<SalesListItemTabsProps> = ({ 
  sale, 
  activeTab, 
  expanded, 
  setActiveTab 
}) => {
  const { checkOrganizationPermission, authOrganization } = useJumboAuth();
  const organization = authOrganization?.organization;
  const [openDispatchReport, setOpenDispatchReport] = useState(false);
  const [openDispatchDialog, setOpenDispatchDialog] = useState(false);
  const [openInvoicesDialog, setOpenInvoicesDialog] = useState(false);
  const [openReceiptDialog, setOpenReceiptDialog] = useState(false);
  const {activeCounter} = useCounter();
  
  const accountsPersonnel = checkOrganizationPermission([
    PERMISSIONS.ACCOUNTS_MASTERS_READ,
    PERMISSIONS.ACCOUNTS_TRANSACTIONS_CREATE
  ]);

  const theme = useTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  if (sale?.status?.toLowerCase() === 'pending') {
    return null;
  }

  const getTabIndex = () => {
    if (!sale.is_instant_sale) {
      return {
        receipts: 1,
        invoices: 2
      };
    }
    return {
      receipts: sale.payment_method === 'On Account' ? 0 : -1,
      invoices: sale.payment_method === 'On Account' ? 1 : 0
    };
  };

  const tabIndex = getTabIndex();

  return (
    <>
      <Grid size={12}>
        <Divider/>
        <Tabs
          value={activeTab}
          onChange={(e: React.SyntheticEvent, newValue: number) => setActiveTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          aria-label="sales item tabs"
        >
          {!sale.is_instant_sale && (
            <Tab label="Dispatches" aria-label="dispatches tab"/>
          )}
          {accountsPersonnel && !sale.vfd_receipt && (!sale.is_instant_sale || sale.payment_method === 'On Account') && (
            <Tab label="Receipts" aria-label="receipts tab"/>
          )}
          {accountsPersonnel && !sale.vfd_receipt && (!!sale.is_invoiceable || !!sale.is_invoiced) && (
            <Tab label="Invoices" aria-label="invoices tab"/>
          )}
          {accountsPersonnel && !!sale.is_invoiced &&
            <Tab label="Adjustments"/>
          }
        </Tabs>
      </Grid>

      {/* Dispatches */}
      {activeTab === 0 && !sale.is_instant_sale && (
        <Grid container spacing={2} sx={{ width: '100%' }}>
          <Grid size={12} sx={{ textAlign: 'right' }}>
            <Tooltip title={belowLargeScreen ? 
              `Download Dispatch Report For ${sale.saleNo}` : 
              `View Dispatch Report For ${sale.saleNo}`
            }>
              <IconButton 
                onClick={() => setOpenDispatchReport(true)}
                aria-label="dispatch report"
              >
                <InventoryOutlined/>
              </IconButton>
            </Tooltip>
            {
             !sale.is_instant_sale && sale.status !== 'Pending' && sale.status !== 'Fulfilled' && (checkOrganizationPermission([PERMISSIONS.SALES_DISPATCH_NOT_FULLY_PAID]) || (checkOrganizationPermission([PERMISSIONS.SALES_DISPATCH]) && !!sale.is_fully_paid)) && 
             (
              <Tooltip title={`Dispatch ${sale.saleNo}`}>
                <IconButton 
                  onClick={() => setOpenDispatchDialog(true)}
                  aria-label="dispatch item"
                >
                  <FontAwesomeIcon icon={faTruckArrowRight} size={'xs'} />
                </IconButton>
              </Tooltip>
            )}
          </Grid>
          <Grid size={12}>
            <SaleDeliveryNotes sale={sale} expanded={expanded}/>
          </Grid>
        </Grid>
      )}

      {/* Receipts */}
      {accountsPersonnel && 
       !sale.vfd_receipt && 
       (!sale.is_instant_sale || sale.payment_method === 'On Account') && 
       activeTab === (sale.is_instant_sale ? tabIndex.receipts : 1) && (
        <Grid container spacing={2} sx={{ width: '100%' }}>
          {activeCounter?.id !== 'all' && !!sale.is_receiptable && (
            <Grid size={12} sx={{ textAlign: 'right' }}>
              <Tooltip title={`Receipt For ${sale.saleNo}`}>
                <IconButton 
                  onClick={() => setOpenReceiptDialog(true)}
                  aria-label="create receipt"
                >
                  <FontAwesomeIcon icon={faReceipt} size={'xs'} />
                </IconButton>
              </Tooltip>
            </Grid>
          )}
          <Grid size={12}>
            <SaleReceipts sale={sale} expanded={expanded} activeTab={activeTab}/>
          </Grid>
        </Grid>
      )}

      {/* Invoices */}
      {accountsPersonnel && 
       !sale.vfd_receipt && 
       activeTab === (sale.is_instant_sale ? tabIndex.invoices : 2) && 
       (!!sale.is_invoiceable || !!sale.is_invoiced) && (
        <Grid container spacing={2} sx={{ width: '100%' }}>
          <Grid size={12} sx={{ textAlign: 'right' }}>
            {!!sale.is_invoiceable && (
              <Tooltip title={`Invoice ${sale.saleNo}`}>
                <IconButton 
                  onClick={() => setOpenInvoicesDialog(true)}
                  aria-label="create invoice"
                >
                  <FontAwesomeIcon icon={faFileInvoice} size={'xs'} />
                </IconButton>
              </Tooltip>
            )}
          </Grid>
          <Grid size={12}>
            <SaleInvoices sale={sale} expanded={expanded} activeTab={activeTab}/>
          </Grid>
        </Grid>
      )}

      {accountsPersonnel && !sale.vfd_receipt && activeTab === (!sale.is_instant_sale ? 3 : (sale.payment_method === 'On Account' ? 2 : 1)) && !!sale.is_invoiced &&
        <Grid container width={'100%'}>
          <Grid size={12}>
            <SaleAdjustments sale={sale} expanded={expanded} activeTab={activeTab}/>
          </Grid>
        </Grid>
      }
      
      {/* Dialogs */}
      <Dialog
        open={openDispatchReport}
        maxWidth="lg"
        fullScreen={belowLargeScreen}
        fullWidth
        onClose={() => setOpenDispatchReport(false)}
      >
        {checkOrganizationPermission(PERMISSIONS.SALES_READ) ? (
          <DispatchReport 
            organization={organization as Organization} 
            sale={sale} 
            setOpenDispatchReport={setOpenDispatchReport}
          />
        ) : (
          <UnauthorizedAccess/>
        )}
      </Dialog>

      <Dialog
        open={openDispatchDialog}
        maxWidth="lg"
        fullScreen={belowLargeScreen}
        scroll={belowLargeScreen ? 'body' : 'paper'}
        fullWidth
        onClose={() => setOpenDispatchDialog(false)}
      >
        {checkOrganizationPermission(PERMISSIONS.SALES_DISPATCH) ? (
          <DispatchDialog saleId={Number(sale.id)} toggleOpen={setOpenDispatchDialog}/>
        ) : (
          <UnauthorizedAccess/>
        )}
      </Dialog>

      <Dialog
        open={openInvoicesDialog}
        maxWidth="lg"
        fullScreen={belowLargeScreen}
        scroll={belowLargeScreen ? 'body' : 'paper'}
        fullWidth
        onClose={() => setOpenInvoicesDialog(false)}
      >
        {checkOrganizationPermission(PERMISSIONS.SALES_EDIT) ? (
          <InvoicesDialog saleId={Number(sale.id)} toggleOpen={setOpenInvoicesDialog}/>
        ) : (
          <UnauthorizedAccess/>
        )}
      </Dialog>

      <Dialog
        open={openReceiptDialog}
        maxWidth="md"
        fullScreen={belowLargeScreen}
        scroll={belowLargeScreen ? 'body' : 'paper'}
        fullWidth
        onClose={() => setOpenReceiptDialog(false)}
      >
        {checkOrganizationPermission(PERMISSIONS.SALES_EDIT) ? (
          <ReceiptDialog saleId={Number(sale.id)} toggleOpen={setOpenReceiptDialog}/>
        ) : (
          <UnauthorizedAccess/>
        )}
      </Dialog>
    </>
  );
};

export default SalesListItemTabs;