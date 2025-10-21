import React from 'react';
import { Box, Grid, Typography, Divider, Button, useTheme } from '@mui/material';
import QRCode from 'qrcode';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';

interface Organization {
  name: string;
  address?: string;
  tin?: string;
  vrn?: string;
  phone?: string;
  tra_serial_number?: string;
  email?: string;
}

interface SaleItem {
  product: {
    name: string;
  };
  quantity: number;
  rate: number;
  measurement_unit: {
    symbol: string;
  };
  vat_exempted?: number;
}

interface VFDReceipt {
  verification_url: string;
  created_at: string;
  receipt_time: string;
  customer_name?: string;
  customer_tin?: string;
  customer_vrn?: string;
  verification_code: string;
}

interface Stakeholder {
  name: string;
  tin?: string;
  vrn?: string;
  email?: string;
  phone?: string;
}

interface Creator {
  name: string;
}

interface Currency {
  code: string;
}

interface SalesOutlet {
  name: string;
}

interface Sale {
  saleNo: string;
  vat_percentage: number;
  sale_items: SaleItem[];
  amount: number;
  currency: Currency;
  vfd_receipt?: VFDReceipt;
  transaction_date: string;
  reference?: string;
  stakeholder: Stakeholder;
  creator: Creator;
  sales_outlet: SalesOutlet;
}

interface ReceiptPreviewOnScreenProps {
  setOpenReceiptDialog: (open: boolean) => void;
  organization: Organization;
  sale: Sale;
}

const ReceiptPreviewOnScreen: React.FC<ReceiptPreviewOnScreenProps> = ({ 
  setOpenReceiptDialog, 
  organization, 
  sale 
}) => {
  const theme = useTheme();
  const [qrCodeDataUrl, setQrCodeDataUrl] = React.useState<string | null>(null);

  const vatFactor = sale.vat_percentage * 0.01;

  // Total for only items requiring VAT inclusive
  const totalAmountForVAT = sale.sale_items.filter(item => item.vat_exempted !== 1).reduce((total, item) => {
    return total + (item.rate * item.quantity);
  }, 0);

  const vatAmount = totalAmountForVAT * sale.vat_percentage / 100; // Total VAT

  const generateQRCodeDataUrl = async (url: string): Promise<string | null> => {
    try {
      return await QRCode.toDataURL(url);
    } catch (error) {
      console.error('Failed to generate QR code:', error);
      return null;
    }
  };

  React.useEffect(() => {
    if (sale.vfd_receipt?.verification_url) {
      generateQRCodeDataUrl(sale.vfd_receipt.verification_url).then(setQrCodeDataUrl);
    }
  }, [sale.vfd_receipt]);

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString("en-US", { 
      style: "currency", 
      currency: sale.currency.code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const formatNumber = (value: number) => {
    return value.toLocaleString('en-US', { 
      maximumFractionDigits: 2, 
      minimumFractionDigits: 2 
    });
  };

  const grandTotal = sale.amount + vatAmount;

  return (
    <Box sx={{ padding: 2, color: 'text.primary' }}>
      {/* Organization Information */}
      <Grid container spacing={1} textAlign="center">
        <Grid size={12}>
          <Typography variant="h6" fontWeight="bold" color="primary.main">
            {organization.name}
          </Typography>
        </Grid>
        {organization.address && (
          <Grid size={12}>
            <Typography variant="body2" color="text.secondary">
              {organization.address}
            </Typography>
          </Grid>
        )}
        {(organization.tin || organization.vrn || organization.phone || organization.tra_serial_number) && (
          <Grid container spacing={1} justifyContent="center" sx={{ mt: 0.5 }}>
            {organization.tin && (
              <Grid container size="auto" spacing={0.5}>
                <Grid>
                  <Typography variant="body2" fontWeight="medium" color="text.primary">TIN:</Typography>
                </Grid>
                <Grid>
                  <Typography variant="body2" color="text.secondary">{organization.tin}</Typography>
                </Grid>
              </Grid>
            )}
            {organization.vrn && (
              <Grid container size="auto" spacing={0.5}>
                <Grid>
                  <Typography variant="body2" fontWeight="medium" color="text.primary">VRN:</Typography>
                </Grid>
                <Grid>
                  <Typography variant="body2" color="text.secondary">{organization.vrn}</Typography>
                </Grid>
              </Grid>
            )}
            {organization.phone && (
              <Grid container size="auto" spacing={0.5}>
                <Grid>
                  <Typography variant="body2" fontWeight="medium" color="text.primary">Phone:</Typography>
                </Grid>
                <Grid>
                  <Typography variant="body2" color="text.secondary">{organization.phone}</Typography>
                </Grid>
              </Grid>
            )}
            {organization.tra_serial_number && (
              <Grid container size="auto" spacing={0.5}>
                <Grid>
                  <Typography variant="body2" fontWeight="medium" color="text.primary">Serial No:</Typography>
                </Grid>
                <Grid>
                  <Typography variant="body2" color="text.secondary">{organization.tra_serial_number}</Typography>
                </Grid>
              </Grid>
            )}
          </Grid>
        )}
        {organization.email && (
          <Grid size={12}>
            <Typography variant="body2" color="text.secondary">
              {organization.email}
            </Typography>
          </Grid>
        )}
        <Grid size={12} sx={{ mt: 1 }}>
          <Typography variant="body2" fontWeight="bold" color="primary.main">
            {sale.sales_outlet.name}
          </Typography>
        </Grid>
      </Grid>

      <Divider sx={{ my: 2, borderColor: 'divider' }} />

      {/* Receipt Information */}
      <Grid container spacing={1}>
        <Grid size={6}>
          <Typography variant="body2" fontWeight="bold" color="text.primary">
            Receipt No.
          </Typography>
        </Grid>
        <Grid size={6} textAlign="right">
          <Typography variant="body2" color="text.primary" fontWeight="medium">
            {sale.saleNo}
          </Typography>
        </Grid>
        <Grid size={6}>
          <Typography variant="body2" fontWeight="bold" color="text.primary">
            Date
          </Typography>
        </Grid>
        <Grid size={6} textAlign="right">
          <Typography variant="body2" color="text.primary">
            {readableDate(sale?.vfd_receipt ? sale.vfd_receipt.created_at : sale.transaction_date)}
          </Typography>
        </Grid>
        {sale?.vfd_receipt && (
          <>
            <Grid size={6}>
              <Typography variant="body2" fontWeight="bold" color="text.primary">
                Time
              </Typography>
            </Grid>
            <Grid size={6} textAlign="right">
              <Typography variant="body2" color="text.primary">
                {sale.vfd_receipt.receipt_time}
              </Typography>
            </Grid>
          </>
        )}
        {sale.reference && (
          <>
            <Grid size={6}>
              <Typography variant="body2" fontWeight="bold" color="text.primary">
                Reference
              </Typography>
            </Grid>
            <Grid size={6} textAlign="right">
              <Typography variant="body2" color="text.primary">
                {sale.reference}
              </Typography>
            </Grid>
          </>
        )}
      </Grid>

      <Divider sx={{ my: 2, borderColor: 'divider' }} />

      {/* Customer Information */}
      <Grid container spacing={1}>
        <Grid size={6}>
          <Typography variant="body2" fontWeight="bold" color="text.primary">
            Customer Name
          </Typography>
        </Grid>
        <Grid size={6} textAlign="right">
          <Typography variant="body2" color="text.primary" fontWeight="medium">
            {sale?.vfd_receipt?.customer_name ? sale.vfd_receipt.customer_name : sale.stakeholder.name}
          </Typography>
        </Grid>
        {(sale?.vfd_receipt?.customer_tin || sale.stakeholder?.tin) && (
          <>
            <Grid size={6}>
              <Typography variant="body2" fontWeight="bold" color="text.primary">
                Customer TIN
              </Typography>
            </Grid>
            <Grid size={6} textAlign="right">
              <Typography variant="body2" color="text.primary">
                {sale?.vfd_receipt?.customer_tin ? sale.vfd_receipt.customer_tin : sale.stakeholder.tin}
              </Typography>
            </Grid>
          </>
        )}
        {(sale?.vfd_receipt?.customer_vrn || sale.stakeholder?.vrn) && (
          <>
            <Grid size={6}>
              <Typography variant="body2" fontWeight="bold" color="text.primary">
                Customer VRN
              </Typography>
            </Grid>
            <Grid size={6} textAlign="right">
              <Typography variant="body2" color="text.primary">
                {sale?.vfd_receipt?.customer_vrn ? sale.vfd_receipt.customer_vrn : sale.stakeholder.vrn}
              </Typography>
            </Grid>
          </>
        )}
        {sale.stakeholder?.email && (
          <>
            <Grid size={6}>
              <Typography variant="body2" fontWeight="bold" color="text.primary">
                Email
              </Typography>
            </Grid>
            <Grid size={6} textAlign="right">
              <Typography variant="body2" color="text.primary">
                {sale.stakeholder.email}
              </Typography>
            </Grid>
          </>
        )}
        {sale.stakeholder?.phone && (
          <>
            <Grid size={6}>
              <Typography variant="body2" fontWeight="bold" color="text.primary">
                Phone
              </Typography>
            </Grid>
            <Grid size={6} textAlign="right">
              <Typography variant="body2" color="text.primary">
                {sale.stakeholder.phone}
              </Typography>
            </Grid>
          </>
        )}
      </Grid>

      <Divider sx={{ my: 2, borderColor: 'divider' }} />

      {/* Sale Items */}
      {sale.sale_items.map((item, index) => (
        <React.Fragment key={index}>
          <Grid container spacing={1}>
            <Grid size={12}>
              <Typography variant="body2" fontWeight="medium" color="text.primary">
                {item.product.name}
              </Typography>
            </Grid>
            <Grid size={6}>
              <Typography variant="body2" color="text.secondary">
                {`${item.quantity} ${item.measurement_unit.symbol} × ${formatNumber(item.rate * (1 + (item?.vat_exempted !== 1 ? vatFactor : 0)))}`}
              </Typography>
            </Grid>
            <Grid size={6} textAlign="right">
              <Typography variant="body2" fontWeight="medium" fontFamily="monospace" color="text.primary">
                {formatNumber(item.quantity * item.rate * (1 + (item?.vat_exempted !== 1 ? vatFactor : 0)))}
              </Typography>
            </Grid>
          </Grid>
          {index < sale.sale_items.length - 1 && (
            <Divider sx={{ my: 1, borderColor: 'divider' }} />
          )}
        </React.Fragment>
      ))}

      <Divider sx={{ my: 2, borderColor: 'divider' }} />

      {/* Total Amount and VAT Amount */}
      <Grid container spacing={1}>
        <Grid size={6}>
          <Typography variant="body2" color="text.primary">
            Subtotal
          </Typography>
        </Grid>
        <Grid size={6} textAlign="right">
          <Typography variant="body2" fontWeight="medium" fontFamily="monospace" color="text.primary">
            {formatCurrency(sale.amount)}
          </Typography>
        </Grid>
        {sale.vat_percentage > 0 && (
          <>
            <Grid size={6}>
              <Typography variant="body2" color="text.primary">
                VAT ({sale.vat_percentage}%)
              </Typography>
            </Grid>
            <Grid size={6} textAlign="right">
              <Typography variant="body2" fontWeight="medium" fontFamily="monospace" color="text.primary">
                {formatCurrency(vatAmount)}
              </Typography>
            </Grid>
            <Grid size={6}>
              <Typography variant="body1" fontWeight="bold" color="primary.main">
                Total
              </Typography>
            </Grid>
            <Grid size={6} textAlign="right">
              <Typography variant="body1" fontWeight="bold" fontFamily="monospace" color="primary.main">
                {formatCurrency(grandTotal)}
              </Typography>
            </Grid>
          </>
        )}
        {sale.vat_percentage === 0 && (
          <>
            <Grid size={6}>
              <Typography variant="body1" fontWeight="bold" color="primary.main">
                Total
              </Typography>
            </Grid>
            <Grid size={6} textAlign="right">
              <Typography variant="body1" fontWeight="bold" fontFamily="monospace" color="primary.main">
                {formatCurrency(sale.amount)}
              </Typography>
            </Grid>
          </>
        )}
      </Grid>

      {sale.vfd_receipt && (
        <>
          <Box sx={{ textAlign: 'center', marginTop: 3, padding: 2, backgroundColor: theme.palette.background.default, borderRadius: 1 }}>
            <Typography variant="subtitle1" fontWeight="bold" color="primary.main">
              Receipt Verification Code
            </Typography>
            <Typography variant="h6" fontWeight="bold" color="text.primary" sx={{ mt: 1 }}>
              {sale.vfd_receipt.verification_code}
            </Typography>
          </Box>
          {qrCodeDataUrl && (
            <Box sx={{ display: 'flex', justifyContent: 'center', marginTop: 2 }}>
              <img src={qrCodeDataUrl} alt="QR Code" style={{ width: 100, height: 100 }} />
            </Box>
          )}
        </>
      )}

      <Box sx={{ textAlign: 'center', marginTop: 3 }}>
        <Typography variant="body2" color="text.secondary">
          Served by: <Typography component="span" fontWeight="medium" color="text.primary">{sale.creator.name}</Typography>
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10, mt: 1, display: 'block' }}>
          Powered by: proserp.co.tz
        </Typography>
      </Box>

      {/* Cancel Button */}
      <Box textAlign="right" marginTop={3}>
        <Button 
          variant="outlined" 
          size='small' 
          color="primary" 
          onClick={() => setOpenReceiptDialog(false)}
          sx={{ mt: 2 }}
        >
          Close
        </Button>
      </Box>
    </Box>
  );
};

export default ReceiptPreviewOnScreen;