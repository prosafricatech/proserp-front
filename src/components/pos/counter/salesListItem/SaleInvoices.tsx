'use client'
import React, { useState } from 'react';
import posServices from '../../pos-services';
import { 
  Alert, 
  Box, 
  Grid, 
  IconButton,
  Tooltip, 
  Typography, 
  useMediaQuery 
} from '@mui/material';
import { 
  ContentPasteSearchOutlined, 
  DeleteOutlined, 
  EditOutlined, 
  TuneOutlined
} from '@mui/icons-material';
import SaleInvoiceItemAction from './invoice/SaleInvoiceItemAction';
import { useQuery } from '@tanstack/react-query';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { SalesOrder } from '../SalesOrderType';
import { BackdropSpinner } from '@/shared/ProgressIndicators/BackdropSpinner';

export interface Invoice {
  id: number;
  invoiceNo: string;
  transaction_date: string;
  internal_reference?: string;
  customer_reference?: string;
  narration?: string;
  vfd_receipt: any;
}

interface SaleInvoicesProps {
  expanded: boolean;
  sale: SalesOrder;
  activeTab: number;
}

const SaleInvoices: React.FC<SaleInvoicesProps> = ({ 
  expanded, 
  sale, 
  activeTab 
}) => {
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [openInvoiceDeleteDialog, setOpenInvoiceDeleteDialog] = useState(false);
  const [openAdjustmentDialog, setOpenAdjustmentDialog] = useState(false);
  const [openInvoiceEditDialog, setOpenInvoiceEditDialog] = useState(false);
  const [openDocumentDialog, setOpenDocumentDialog] = useState(false);
  
  // Screen handling constants
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const { data: saleInvoices, isLoading } = useQuery({
    queryKey: ['SaleInvoices', { saleId: sale.id }],
    queryFn: () => posServices.saleInvoices(sale.id),
    enabled: !!expanded && activeTab === (
      !sale.is_instant_sale ? 2 : (sale.payment_method === 'On Account' ? 1 : 0)
    ),
  });

  return (
    <>
      {isLoading && <BackdropSpinner/>}
      {saleInvoices?.length > 0 ? (
        saleInvoices.map((invoice: Invoice) => (
          <Grid
            key={invoice.id}
            sx={{
              cursor: 'pointer',
              borderTop: 1,
              borderColor: 'divider',
              '&:hover': {
                bgcolor: 'action.hover',
              },
              paddingX: 1,
            }}
            columnSpacing={2}
            alignItems={'center'}
            mb={1}
            container
          >
            <Grid size={{xs: 6, md: 4, lg: 4}}>
              <Tooltip title={'Invoice No.'}>
                <Typography fontWeight={'bold'}>{invoice.invoiceNo}</Typography>
              </Tooltip>
              <Tooltip title={'Invoice Date'}>
                <Typography>
                  {readableDate(invoice.transaction_date)}
                </Typography>
              </Tooltip>
            </Grid>
            <Grid size={{xs: 6, md: 4, lg: 2}}>
              <Tooltip title={'Internal Reference'}>
                <Typography>{invoice.internal_reference}</Typography>
              </Tooltip>
              <Tooltip title={'Customer Reference'}>
                <Typography variant='caption'>{invoice.customer_reference}</Typography>
              </Tooltip>
            </Grid>
            <Grid size={{xs: 12, md: 4, lg: 4}} mt={0.5}>
              <Tooltip title={'Narration'}>
                <Typography>{invoice.narration}</Typography>
              </Tooltip>
            </Grid>
            <Grid size={{xs: 12, md: 12, lg: 2}}>
              <Box
                display={'flex'}
                flexDirection={'row'}
                justifyContent={'flex-end'}
              >
                <Tooltip 
                  title={belowLargeScreen ? 
                    `Download Invoice ${invoice.invoiceNo}` : 
                    `View Invoice ${invoice.invoiceNo}`
                  }
                >
                  <IconButton
                    onClick={() => {
                      setSelectedInvoice(invoice);
                      setOpenDocumentDialog(true);
                    }}
                  >
                    <ContentPasteSearchOutlined fontSize={'small'}/>
                  </IconButton>
                </Tooltip>
                {invoice.vfd_receipt === null &&
                  <Tooltip  title={`Adjustment For ${invoice.invoiceNo}`}>
                    <IconButton 
                      onClick={() => {
                        setSelectedInvoice(invoice);
                        setOpenAdjustmentDialog(true);
                      }}
                    >
                      <TuneOutlined fontSize={'small'} />
                    </IconButton>
                  </Tooltip>
                }
                {invoice.vfd_receipt === null && (
                  <Tooltip title={`Edit ${invoice.invoiceNo}`}>
                    <IconButton 
                      onClick={() => {
                        setSelectedInvoice(invoice);
                        setOpenInvoiceEditDialog(true);
                      }}
                    >
                      <EditOutlined fontSize={'small'} />
                    </IconButton>
                  </Tooltip>
                )}
                {invoice.vfd_receipt === null && (
                  <Tooltip title={`Delete ${invoice.invoiceNo}`}>
                    <IconButton
                      onClick={() => {
                        setSelectedInvoice(invoice);
                        setOpenInvoiceDeleteDialog(true);
                      }}
                    >
                      <DeleteOutlined color="error" fontSize={'small'} />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            </Grid>
          </Grid>
        ))
      ) : (
        !isLoading && <Alert variant='outlined' severity='info'>No Invoices found</Alert> 
      )}

      {/* InvoiceItemAction */}
      <SaleInvoiceItemAction
        openDocumentDialog={openDocumentDialog}
        setOpenDocumentDialog={setOpenDocumentDialog}
        setOpenInvoiceEditDialog={setOpenInvoiceEditDialog}
        openInvoiceDeleteDialog={openInvoiceDeleteDialog}
        openInvoiceEditDialog={openInvoiceEditDialog}
        setOpenInvoiceDeleteDialog={setOpenInvoiceDeleteDialog} 
        setOpenAdjustmentDialog={setOpenAdjustmentDialog}
        openAdjustmentDialog={openAdjustmentDialog}
        selectedInvoice={selectedInvoice}
        setSelectedInvoice={setSelectedInvoice}
      />
    </>      
  );
};

export default SaleInvoices;