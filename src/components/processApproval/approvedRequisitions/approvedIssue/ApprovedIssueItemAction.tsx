'use client';

import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import PDFContent from '@/components/pdf/PDFContent';
import inventoryConsumptionsServices from '@/components/procurement/inventoryConsumptions/inventoryConsumptionsServices';
import InventoryConsumptionPDF from '@/components/procurement/inventoryConsumptions/InventoryConsumptionPDF';
import InventoryConsumptionsOnScreen from '@/components/procurement/inventoryConsumptions/InventoryConsumptionsOnScreen';
import inventoryTransferServices from '@/components/procurement/stores/[store_id]/inventoryTransfer/inventoryTransfer-services';
import InventoryTransferOnScreen from '@/components/procurement/stores/[store_id]/inventoryTransfer/InventoryTransferOnScreen';
import InventoryTransferPDF from '@/components/procurement/stores/[store_id]/inventoryTransfer/InventoryTransferPDF';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { HighlightOff, VisibilityOutlined } from '@mui/icons-material';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  Grid,
  IconButton,
  LinearProgress,
  Tab,
  Tabs,
  Tooltip,
  useMediaQuery,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import React, { useState } from 'react';

interface ApprovedIssueItemActionProps {
  issue: any;
}

const PreviewDialog: React.FC<{ issue: any; toggleOpen: (open: boolean) => void }> = ({
  issue,
  toggleOpen,
}) => {
  const isTransfer = issue?.issue_type === 'transfer';
  const { authOrganization } = useJumboAuth();
  const authObject = useJumboAuth();
  const organization = authOrganization?.organization;
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));
  const [activeTab, setActiveTab] = useState(0);

  const { data, isFetching } = useQuery({
    queryKey: [isTransfer ? 'transferDetails' : 'inventoryConsumption', { id: issue.id }],
    queryFn: () =>
      isTransfer
        ? inventoryTransferServices.transferDetails(issue.id)
        : inventoryConsumptionsServices.show(issue.id),
  });

  if (isFetching) {
    return <LinearProgress />;
  }

  const docNo = isTransfer ? data?.transferNo : data?.consumptionNo;

  const onScreen = isTransfer ? (
    <InventoryTransferOnScreen transfer={data} organization={organization} />
  ) : (
    <InventoryConsumptionsOnScreen inventoryConsumption={data} authObject={authObject} />
  );

  const pdf = isTransfer ? (
    <InventoryTransferPDF transfer={data} organization={organization} />
  ) : (
    <InventoryConsumptionPDF inventoryConsumption={data} authObject={authObject} />
  );

  return (
    <>
      <DialogContent>
        {belowLargeScreen && (
          <Grid container alignItems='center' justifyContent='space-between' marginBottom={2}>
            <Grid size={11}>
              <Tabs value={activeTab} onChange={(_, value) => setActiveTab(value)}>
                <Tab label='ONSCREEN' />
                <Tab label='PDF' />
              </Tabs>
            </Grid>
            <Grid size={1} textAlign='right'>
              <Tooltip title='Close'>
                <IconButton size='small' onClick={() => toggleOpen(false)}>
                  <HighlightOff color='primary' />
                </IconButton>
              </Tooltip>
            </Grid>
          </Grid>
        )}

        {belowLargeScreen ? (
          activeTab === 0 ? (
            onScreen
          ) : (
            <PDFContent fileName={docNo} document={pdf} />
          )
        ) : (
          <PDFContent fileName={docNo} document={pdf} />
        )}
      </DialogContent>
      <DialogActions>
        {belowLargeScreen && (
          <Box textAlign='right' marginTop={5}>
            <Button variant='outlined' size='small' color='primary' onClick={() => toggleOpen(false)}>
              Close
            </Button>
          </Box>
        )}
      </DialogActions>
    </>
  );
};

function ApprovedIssueItemAction({ issue }: ApprovedIssueItemActionProps) {
  const [openDocumentDialog, setOpenDocumentDialog] = useState(false);
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  return (
    <>
      <Dialog
        open={openDocumentDialog}
        scroll={belowLargeScreen ? 'body' : 'paper'}
        fullWidth
        fullScreen={belowLargeScreen}
        maxWidth='md'
        onClose={() => setOpenDocumentDialog(false)}
      >
        {openDocumentDialog && (
          <PreviewDialog issue={issue} toggleOpen={setOpenDocumentDialog} />
        )}
      </Dialog>

      <Tooltip title='View'>
        <IconButton size='small' onClick={() => setOpenDocumentDialog(true)}>
          <VisibilityOutlined fontSize='small' />
        </IconButton>
      </Tooltip>
    </>
  );
}

export default React.memo(ApprovedIssueItemAction);
