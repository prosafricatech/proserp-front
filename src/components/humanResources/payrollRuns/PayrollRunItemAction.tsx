'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/app/[lang]/contexts/LanguageContext';
import { JumboDdMenu } from '@jumbo/components';
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import { MenuItemProps } from '@jumbo/types';
import {
  CheckCircleOutline,
  HighlightOff,
  MoreHorizOutlined,
  ReceiptLongOutlined,
} from '@mui/icons-material';
import {
  Box,
  Dialog,
  DialogContent,
  Grid,
  IconButton,
  LinearProgress,
  Tab,
  Tabs,
  Tooltip,
  useMediaQuery,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import humanResourcesServices from '../humanResourcesServices';
import PayslipOnScreen from './PayslipOnScreen';
import PayslipPDF from './PayslipPDF';
import PDFContent from '@/components/pdf/PDFContent';
import { PayrollRunType } from './PayrollRunType';

interface DocumentDialogProps {
  payrollRun: PayrollRunType;
  setOpenDocumentDialog: React.Dispatch<React.SetStateAction<boolean>>;
}

const DocumentDialog: React.FC<DocumentDialogProps> = ({
  payrollRun,
  setOpenDocumentDialog,
}) => {
  const { data: runData, isFetching } = useQuery({
    queryKey: ['payrollRun', payrollRun.id],
    queryFn: () => humanResourcesServices.showPayrollRun(payrollRun.id),
  });

  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));
  const [activeTab, setActiveTab] = useState(0);

  if (isFetching) return <LinearProgress />;

  // Get organization data - need to fetch it or get it from context/props
  const organization = {
    name: 'Organization',
    settings: {
      main_color: '#2113AD',
      light_color: '#bec5da',
      contrast_text: '#FFFFFF',
    },
  };

  return (
    <DialogContent>
      {belowLargeScreen && (
        <Grid container alignItems="center" justifyContent="space-between" mb={2}>
          <Grid size={11}>
            <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
              <Tab label="ONSCREEN" />
              <Tab label="PDF" />
            </Tabs>
          </Grid>
          <Grid size={1} textAlign="right">
            <Tooltip title="Close">
              <IconButton size="small" onClick={() => setOpenDocumentDialog(false)}>
                <HighlightOff color="primary" />
              </IconButton>
            </Tooltip>
          </Grid>
        </Grid>
      )}
      {belowLargeScreen && activeTab === 0 ? (
        <PayslipOnScreen payrollRun={runData} />
      ) : (
        <PDFContent
          document={<PayslipPDF payrollRun={runData} organization={organization as any} />}
          fileName={`Payslip-${runData?.employee?.first_name}-${runData?.employee?.last_name}`}
        />
      )}
      {belowLargeScreen && (
        <Box textAlign="right" mt={5}>
          <Tooltip title="Close">
            <IconButton onClick={() => setOpenDocumentDialog(false)}>
              <HighlightOff color="primary" />
            </IconButton>
          </Tooltip>
        </Box>
      )}
    </DialogContent>
  );
};

const PayrollRunItemAction = ({ payrollRun }: { payrollRun: PayrollRunType }) => {
  const { showDialog, hideDialog } = useJumboDialog();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const [openDocumentDialog, setOpenDocumentDialog] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  const { data: runDetails, isFetching } = useQuery({
    queryKey: ['payrollRun', payrollRun.id],
    queryFn: () => humanResourcesServices.showPayrollRun(payrollRun.id),
    enabled: openDocumentDialog,
  });

  const { mutate: finalizePayrollRun } = useMutation({
    mutationFn: humanResourcesServices.finalizePayrollRun,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payrollRuns'] });
      enqueueSnackbar('Payroll Run Finalized Successfully', {
        variant: 'success',
      });
    },
    onError: (error: any) => {
      enqueueSnackbar('Error Finalizing Payroll Run', { variant: 'error' });
      console.log('error finalizing payroll run: ', error);
    },
  });

  const isFinalized = (payrollRun.status || '').toLowerCase() === 'finalized';

  const menuItems = [
    {
      icon: <ReceiptLongOutlined color='primary' />,
      title: 'Full Payslip Detail',
      action: 'viewPayslip',
    },
    {
      icon: <CheckCircleOutline color={isFinalized ? 'disabled' : 'success'} />,
      title: isFinalized ? 'Already Finalized' : 'Finalize',
      action: 'finalize',
      disabled: isFinalized,
    },
  ];

  const handleItemAction = (menuItem: MenuItemProps) => {
    switch (menuItem.action) {
      case 'viewPayslip':
        setOpenDocumentDialog(true);
        break;
      case 'finalize':
        if (isFinalized) return;
        showDialog({
          title: 'Finalize Payroll Run',
          content: 'Are you sure you want to finalize this payroll run?',
          onYes: () => {
            hideDialog();
            finalizePayrollRun(payrollRun.id);
          },
          onNo: () => hideDialog(),
          variant: 'confirm',
        });
        break;
      default:
        break;
    }
  };

  // Get organization data - need to fetch it or get it from context/props
  const organization = {
    name: 'Organization',
    settings: {
      main_color: '#2113AD',
      light_color: '#bec5da',
      contrast_text: '#FFFFFF',
    },
  };

  return (
    <>
      <Dialog
        open={openDocumentDialog}
        scroll="paper"
        fullScreen={belowLargeScreen}
        fullWidth
        maxWidth="lg"
        onClose={() => setOpenDocumentDialog(false)}
      >
        {!belowLargeScreen && (
          <Grid container alignItems="center" justifyContent="space-between" sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
            <Grid size={11}>
              <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
                <Tab label="ONSCREEN" />
                <Tab label="PDF" />
              </Tabs>
            </Grid>
            <Grid size={1} textAlign="right">
              <Tooltip title="Close">
                <IconButton size="small" onClick={() => setOpenDocumentDialog(false)}>
                  <HighlightOff color="primary" />
                </IconButton>
              </Tooltip>
            </Grid>
          </Grid>
        )}
        {isFetching ? (
          <LinearProgress />
        ) : (
          <Box>
            {activeTab === 0 && <PayslipOnScreen payrollRun={runDetails} />}
            {activeTab === 1 && (
              <PDFContent
                document={<PayslipPDF payrollRun={runDetails} organization={organization as any} />}
                fileName={`Payslip-${runDetails?.employee?.first_name}-${runDetails?.employee?.last_name}`}
              />
            )}
          </Box>
        )}
      </Dialog>

      <JumboDdMenu
        icon={
          <Tooltip title='Actions'>
            <MoreHorizOutlined fontSize='small' />
          </Tooltip>
        }
        menuItems={menuItems}
        onClickCallback={handleItemAction}
      />
    </>
  );
};

export default PayrollRunItemAction;
