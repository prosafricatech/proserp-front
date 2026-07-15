import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import ledgerServices from '@/components/accounts/ledgers/ledger-services';
import LedgerStatementOnScreen from '@/components/accounts/ledgers/list/ledgerStatement/LedgerStatementOnScreen';
import PDFContent from '@/components/pdf/PDFContent';
import { FileExportGrid } from '@/components/sharedComponents/FileExportGrid';
import PreviewTopBar from '@/components/sharedComponents/PreviewTopBar';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { HighlightOff } from '@mui/icons-material';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Skeleton,
  Stack,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import ProjectLiabilityDocumentPDF from './ProjectLiabilityDocumentPDF';

const ProjectLiabilityDocumentDialog = ({
  openDialog,
  onClose,
  baseCurrency,
  organization,
  user,
  liabilitiesPaylod,
  activeTab,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [showOnScreen, setShowOnScreen] = useState(true);
  const { theme } = useJumboTheme();
  const smallScreen = useMediaQuery(theme.breakpoints.down('md'));

  const hasSelectedLedger = Boolean(liabilitiesPaylod?.ledger_id);

  const { data: transactions, isLoading } = useQuery({
    queryKey: ['budgetItemsDetails', liabilitiesPaylod],
    queryFn: async () => ledgerServices.statement(liabilitiesPaylod),
    enabled: openDialog && hasSelectedLedger,
  });

  const exportedData = {
    transactionsData: transactions,
    authOrganization: organization,
    user: user,
    ledgerName: liabilitiesPaylod?.liabilityName,
    increasesWith: liabilitiesPaylod?.increasesWith,
  };

  const handlExcelExport = async (exportedData) => {
    setIsExporting(true);
    try {
      const blob = await ledgerServices.exportLedgerStatement(exportedData);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${'Ledger_Statement_Report_'} ${readableDate(exportedData.transactionsData?.filters?.from, true)} - ${readableDate(exportedData.transactionsData?.filters?.to, true)}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.log('error exporting: ', e);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog
      open={openDialog}
      fullWidth
      fullScreen={smallScreen}
      maxWidth={'lg'}
    >
      <DialogTitle>
        <Typography textAlign={'center'}>
          {liabilitiesPaylod?.liabilityName ?? 'Liability'} Statement
        </Typography>
        <PreviewTopBar
          fileExportGrid={
            <FileExportGrid
              exportExcel
              handlExcelExport={() => handlExcelExport(exportedData)}
              exportPdf
              handlePdf={() => {
                setShowOnScreen((prev) => !prev);
              }}
              exportingExcel={isExporting}
            />
          }
          closeButton={
            <IconButton
              size='small'
              color='primary'
              onClick={() => onClose(false)}
            >
              <HighlightOff color='primary' />
            </IconButton>
          }
        />
      </DialogTitle>
      <DialogContent>
        {isLoading ? (
          <Grid container width={'100%'}>
            <Grid size={12}>
              <Stack spacing={2} sx={{ width: '100%', mb: 2 }}>
                <Skeleton
                  variant='text'
                  width={180}
                  height={32}
                  sx={{ borderRadius: 1, marginLeft: 'auto' }}
                />
                <Skeleton
                  variant='rectangular'
                  width='100%'
                  height={48}
                  sx={{ borderRadius: 1 }}
                />
                <Skeleton
                  variant='rectangular'
                  width='100%'
                  height={32}
                  sx={{ borderRadius: 1 }}
                />
              </Stack>
            </Grid>
          </Grid>
        ) : showOnScreen ? (
          <LedgerStatementOnScreen
            transactionsData={transactions}
            authOrganization={organization}
            increasesWith={liabilitiesPaylod?.increasesWith}
          />
        ) : (
          <PDFContent
            fileName='Liability report'
            document={
              <ProjectLiabilityDocumentPDF
                transactionsData={transactions}
                authOrganization={organization}
                user={user}
                ledgerName={liabilitiesPaylod?.liabilityName}
                increasesWith={liabilitiesPaylod?.increasesWith}
                activeTab={activeTab}
              />
            }
          />
        )}
      </DialogContent>
      <DialogActions>
        <Box
          textAlign='right'
          margin={2}
          display={'flex'}
          alignContent={'center'}
        >
          <Button
            variant='outlined'
            size='small'
            color='primary'
            onClick={() => onClose(false)}
          >
            Close
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default ProjectLiabilityDocumentDialog;
