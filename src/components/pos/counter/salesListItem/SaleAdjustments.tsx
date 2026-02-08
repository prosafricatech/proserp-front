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
  useMediaQuery,
} from '@mui/material';
import { ContentPasteSearchOutlined, DeleteOutlined, EditOutlined } from '@mui/icons-material';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import SaleAdjustmentAction from './invoice/saleAdjustment/SaleAdjustmentAction';
import { useQuery } from '@tanstack/react-query';
import { SalesOrder } from '../SalesOrderType';
import { Currency } from '@/components/masters/Currencies/CurrencyType';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { BackdropSpinner } from '@/shared/ProgressIndicators/BackdropSpinner';

interface SaleAdjustmentsProps {
  expanded: boolean;
  sale: SalesOrder;
  activeTab: number;
}

interface Adjustment {
  id: number;
  adjustmentableNo: string;
  transaction_date: string;
  type: 'debit' | 'credit';
  narration?: string;
  VoucherNo: number;
  amount: number;
  currency: Currency;
}

const SaleAdjustments: React.FC<SaleAdjustmentsProps> = ({ expanded, sale, activeTab }) => {
  const [selectedAdjustment, setSelectedAdjustment] = useState<Adjustment | null>(null);
  const [openAdjustmentDeleteDialog, setOpenAdjustmentDeleteDialog] = useState(false);
  const [openAdjustmentEditDialog, setOpenAdjustmentEditDialog] = useState(false);
  const [openDocumentDialog, setOpenDocumentDialog] = useState(false);

  const { data: saleAdjustments, isLoading } = useQuery<Adjustment[]>({
    queryKey: ['SaleAdjustments', { saleId: sale.id }],
    queryFn: () => posServices.saleRelatableAdjustments(sale.id),
    enabled:
      !!expanded &&
      activeTab === (!sale.is_instant_sale ? 3 : sale.payment_method === 'On Account' ? 2 : 1),
  });

  //Screen handling constants
  const {theme} = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  return (
    <>
      {isLoading && <BackdropSpinner />}

      {saleAdjustments?.length ? (
        saleAdjustments.map((adjustment, index) => (
          <Grid
            key={`${adjustment.id}-${index}`} // ✅ Fix: ensure uniqueness
            sx={{
              cursor: 'pointer',
              borderTop: 1,
              borderColor: 'divider',
              '&:hover': {
                bgcolor: 'action.hover',
              },
              px: 1,
            }}
            container
            spacing={1}
            alignItems="center"
            mb={1}
          >
            <Grid size={{ xs: 6, md: 3, lg: 3 }}>
              <Tooltip title="Transaction Date">
                <Typography>{readableDate(adjustment.transaction_date)}</Typography>
              </Tooltip>
            </Grid>

            <Grid size={{ xs: 6, md: 2, lg: 2 }}>
              <Tooltip title="Type">
                <Typography>
                  {adjustment.type === 'debit' ? 'Debit Note' : 'Credit Note'}
                </Typography>
              </Tooltip>
              <Tooltip title="Adjustment No.">
                <Typography>{adjustment.adjustmentableNo}</Typography>
              </Tooltip>
            </Grid>

            <Grid size={{ xs: 6, md: 2, lg: 2 }}>
              <Tooltip title="Narration">
                <Typography>{adjustment.narration}</Typography>
              </Tooltip>
            </Grid>

            <Grid size={{ xs: 6, md: 3, lg: 3 }} textAlign="end">
              <Tooltip title="Amount">
                <Typography>
                  {adjustment.amount?.toLocaleString('en-US', {
                    style: 'currency',
                    currency: adjustment.currency.code,
                  })}
                </Typography>
              </Tooltip>
            </Grid>

            <Grid size={{ xs: 12, md: 2, lg: 2 }}>
              <Box display="flex" flexDirection="row" justifyContent="flex-end">
                <Tooltip title={belowLargeScreen ? `Download Adjustment ${adjustment.VoucherNo}` : `View Adjustment ${adjustment.VoucherNo}`}>
                  <IconButton
                    onClick={() => {
                      setSelectedAdjustment(adjustment);
                      setOpenDocumentDialog(true);
                    }}
                  >
                    {
                      <ContentPasteSearchOutlined fontSize={'small'}/>
                    }
                  </IconButton>
              </Tooltip>
                <Tooltip title={`Edit ${adjustment.adjustmentableNo}`}>
                  <IconButton
                    onClick={() => {
                      setSelectedAdjustment(adjustment);
                      setOpenAdjustmentEditDialog(true);
                    }}
                  >
                    <EditOutlined fontSize="small" />
                  </IconButton>
                </Tooltip>

                <Tooltip title={`Delete ${adjustment.adjustmentableNo}`}>
                  <IconButton
                    onClick={() => {
                      setSelectedAdjustment(adjustment);
                      setOpenAdjustmentDeleteDialog(true);
                    }}
                  >
                    <DeleteOutlined color="error" fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Grid>
          </Grid>
        ))
      ) : (
        !isLoading && (
          <Alert variant="outlined" severity="info">
            No Sale Adjustments found
          </Alert>
        )
      )}

      {/* SaleAdjustmentItemAction */}
      <SaleAdjustmentAction
        openDocumentDialog={openDocumentDialog}
        setOpenDocumentDialog={setOpenDocumentDialog}
        setOpenAdjustmentEditDialog={setOpenAdjustmentEditDialog}
        openAdjustmentDeleteDialog={openAdjustmentDeleteDialog}
        openAdjustmentEditDialog={openAdjustmentEditDialog}
        setOpenAdjustmentDeleteDialog={setOpenAdjustmentDeleteDialog}
        selectedAdjustment={selectedAdjustment}
        setSelectedAdjustment={setSelectedAdjustment as any}
      />
    </>
  );
};

export default SaleAdjustments;
