'use client';

import useProsERPStyles from '@/app/helpers/style-helpers';
import LedgerSelectProvider from '@/components/accounts/ledgers/forms/LedgerSelectProvider';
import StakeholderSelectProvider from '@/components/masters/stakeholders/StakeholderSelectProvider';
import { faReceipt, faTableCells } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import JumboCardQuick from '@jumbo/components/JumboCardQuick/JumboCardQuick';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import {
  Button,
  Dialog,
  DialogActions,
  Grid,
  Typography,
  useMediaQuery,
} from '@mui/material';
import React, { ReactNode, useState } from 'react';
import DippingReport from './dippingReport/DippingReport';
import FuelVouchersReport from './FuelVouchersReport/FuelVouchersReport';

const FuelStationReports: React.FC = () => {
  const css = useProsERPStyles();

  const [openReportDialog, setOpenReportDialog] = useState<boolean>(false);
  const [report, setReport] = useState<ReactNode | null>(null);

  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const openReport = (Component: React.ComponentType) => {
    setReport(<Component />);
    setOpenReportDialog(true);
  };

  return (
    <StakeholderSelectProvider>
      <LedgerSelectProvider>
        <Typography variant='h4' mb={2}>
          Fuel Station Reports
        </Typography>

        <Dialog
          scroll={belowLargeScreen ? 'body' : 'paper'}
          fullWidth
          maxWidth='lg'
          open={openReportDialog}
          onClose={() => setOpenReportDialog(false)}
        >
          {report}
          <DialogActions className={css.hiddenOnPrint}>
            <Button
              sx={{ m: 1 }}
              size='small'
              variant='outlined'
              onClick={() => setOpenReportDialog(false)}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>

        <JumboCardQuick sx={{ height: '100%' }}>
          <Grid container textAlign='center' columnSpacing={2} rowSpacing={2}>
            {/* Dipping Report */}
            <Grid
              sx={{
                cursor: 'pointer',
                '&:hover': { bgcolor: 'action.hover' },
              }}
              size={{ xs: 6, md: 3, lg: 2 }}
              p={2}
              onClick={() => openReport(DippingReport)}
            >
              <FontAwesomeIcon
                size='lg'
                icon={faTableCells}
                style={{ fontSize: '48px' }}
              />
              <Typography mt={1}>Dipping Report</Typography>
            </Grid>

            {/* Fuel Vouchers Report */}
            <Grid
              sx={{
                cursor: 'pointer',
                '&:hover': { bgcolor: 'action.hover' },
              }}
              size={{ xs: 6, md: 3, lg: 2 }}
              p={2}
              onClick={() => openReport(FuelVouchersReport)}
            >
              <FontAwesomeIcon
                size='lg'
                icon={faReceipt}
                style={{ fontSize: '48px' }}
              />
              <Typography mt={1}>Fuel Vouchers</Typography>
            </Grid>
          </Grid>
        </JumboCardQuick>
      </LedgerSelectProvider>
    </StakeholderSelectProvider>
  );
};

export default FuelStationReports;
