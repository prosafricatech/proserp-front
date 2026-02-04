'use client';

import useProsERPStyles from '@/app/helpers/style-helpers';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import UnauthorizedAccess from '@/shared/Information/UnauthorizedAccess';
import UnsubscribedAccess from '@/shared/Information/UnsubscribedAccess';
import { MODULES } from '@/utilities/constants/modules';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import JumboCardQuick from '@jumbo/components/JumboCardQuick';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { InsightsOutlined, ShoppingCartOutlined } from '@mui/icons-material';
import {
  Button,
  Dialog,
  DialogActions,
  Grid,
  Typography,
  useMediaQuery,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import CurrencySelectProvider from '../../masters/currencies/CurrencySelectProvider';
import StakeholderSelectProvider from '../../masters/stakeholders/StakeholderSelectProvider';
import ProductInsights from './productInsights/ProductInsights';
import PurchasesReport from './PurchasesReport';

function ProcurementReports() {
  const css = useProsERPStyles();
  const [openDialog, setOpenDialog] = useState(false);
  const [report, setReport] = useState(null);
  const [mounted, setMounted] = useState(false);

  //Screen handling constants
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const { checkOrganizationPermission, organizationHasSubscribed } =
    useJumboAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

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
            maxWidth={'md'}
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
                    setReport(<PurchasesReport />);
                    setOpenDialog(true);
                  }}
                >
                  <ShoppingCartOutlined sx={{ fontSize: '40px' }} />
                  <Typography>Purchases Report</Typography>
                </Grid>
              )}
            </Grid>
          </JumboCardQuick>
        </React.Fragment>
      </CurrencySelectProvider>
    </StakeholderSelectProvider>
  );
}

export default ProcurementReports;
