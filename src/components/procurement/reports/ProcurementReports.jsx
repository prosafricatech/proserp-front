'use client';

import useProsERPStyles from '@/app/helpers/style-helpers';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import UnauthorizedAccess from '@/shared/Information/UnauthorizedAccess';
import UnsubscribedAccess from '@/shared/Information/UnsubscribedAccess';
import { MODULES } from '@/utilities/constants/modules';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import JumboCardQuick from '@jumbo/components/JumboCardQuick';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import {
  InsightsOutlined,
  ReceiptLongOutlined,
  ShoppingCartOutlined,
} from '@mui/icons-material';
import {
  Button,
  Dialog,
  DialogActions,
  Grid,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { useSearchParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import CurrencySelectProvider from '../../masters/Currencies/CurrencySelectProvider';
import StakeholderSelectProvider from '../../masters/stakeholders/StakeholderSelectProvider';
import ProductInsights from './productInsights/ProductInsights';
import PurchasesManifestReport from './purchasesManifest/PurchasesManifestReport';
import PurchasesReport from './PurchasesReport';

function ProcurementReports() {
  const css = useProsERPStyles();
  const [openDialog, setOpenDialog] = useState(false);
  const [report, setReport] = useState(null);
  const [reportName, setReportName] = useState('');
  const [mounted, setMounted] = useState(false);
  const searchParams = useSearchParams();

  //Screen handling constants
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const { checkOrganizationPermission, organizationHasSubscribed } =
    useJumboAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-open report dialog if ?report= param is present
  useEffect(() => {
    if (!mounted) return;
    const reportParam = searchParams.get('report');
    if (!reportParam) return;
    if (reportParam === 'product-insights') {
      setReport(<ProductInsights />);
      setOpenDialog(true);
    } else if (reportParam === 'purchases-report') {
      setReport(<PurchasesReport />);
      setOpenDialog(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, searchParams]);

  if (!mounted) return null; // ⛔ Prevent mismatch during hydration

  if (!organizationHasSubscribed(MODULES.PROCUREMENT_AND_SUPPLY)) {
    return <UnsubscribedAccess modules={'Procurement & Supply'} />;
  }

  return !checkOrganizationPermission([PERMISSIONS.PURCHASES_REPORTS]) ? (
    <UnauthorizedAccess />
  ) : (
    <StakeholderSelectProvider>
      <CurrencySelectProvider>
        <React.Fragment>
          <Dialog
            scroll={belowLargeScreen ? 'body' : 'paper'}
            fullWidth
            fullScreen={belowLargeScreen}
            maxWidth={reportName !== 'PurchasesManifestReport' ? 'md' : 'lg'}
            open={openDialog}
          >
            {report}
            <DialogActions className={css.hiddenOnPrint}>
              <Button
                sx={{ m: 1 }}
                size='small'
                variant='outlined'
                onClick={() => {
                  setOpenDialog(false);
                }}
              >
                Close
              </Button>
            </DialogActions>
          </Dialog>
          <Typography variant={'h4'} mb={2}>
            Procurement & Supply Reports
          </Typography>
          <JumboCardQuick sx={{ height: '100%' }}>
            <Grid
              container
              textAlign={'center'}
              columnSpacing={2}
              rowSpacing={2}
            >
              <Grid
                sx={{
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                }}
                size={{ xs: 6, md: 3, lg: 2 }}
                p={1}
                textAlign={'center'}
                onClick={() => {
                  setReportName('ProductInsights');
                  setReport(<ProductInsights />);
                  setOpenDialog(true);
                }}
              >
                <InsightsOutlined sx={{ fontSize: '40px' }} />
                <Typography>Product Insights</Typography>
              </Grid>
              {checkOrganizationPermission(PERMISSIONS.PURCHASES_REPORTS) && (
                <Grid
                  sx={{
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                  }}
                  size={{ xs: 6, md: 3, lg: 2 }}
                  p={1}
                  textAlign={'center'}
                  onClick={() => {
                    setReportName('PurchasesReport');
                    setReport(<PurchasesReport />);
                    setOpenDialog(true);
                  }}
                >
                  <ShoppingCartOutlined sx={{ fontSize: '40px' }} />
                  <Typography>Purchases Report</Typography>
                </Grid>
              )}
              <Grid
                sx={{
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                }}
                size={{ xs: 6, md: 3, lg: 2 }}
                p={1}
                textAlign={'center'}
                onClick={() => {
                  setReportName('PurchasesManifestReport');
                  setReport(
                    <PurchasesManifestReport setOpenDialog={setOpenDialog} />
                  );
                  setOpenDialog(true);
                }}
              >
                <ReceiptLongOutlined sx={{ fontSize: '40px' }} />
                <Typography>Purchases Manifest</Typography>
              </Grid>
            </Grid>
          </JumboCardQuick>
        </React.Fragment>
      </CurrencySelectProvider>
    </StakeholderSelectProvider>
  );
}

export default ProcurementReports;
