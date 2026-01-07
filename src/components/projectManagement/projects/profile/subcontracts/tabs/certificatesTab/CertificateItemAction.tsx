'use client';

import {
  DeleteOutlined,
  EditOutlined,
  HighlightOff,
  MoreHorizOutlined,
  VisibilityOutlined,
} from '@mui/icons-material';
import {
  Box,
  Button,
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
import { useSnackbar } from 'notistack';
import React, { useState } from 'react';
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { JumboDdMenu } from '@jumbo/components';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import CertificateForm from './form/CertificateForm';
import projectsServices from '@/components/projectManagement/projects/project-services';
import CertificatePDF from './preview/CertificatePDF';
import CertificateOnScreen from './preview/CertificateOnScreen';
import PDFContent from '@/components/pdf/PDFContent';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { Organization } from '@/types/auth-types';
import { MenuItemProps } from '@jumbo/types';
import { Currency } from '@/components/masters/Currencies/CurrencyType';

interface Certificate {
  id?: number | string;
  certificateNo?: string;
  certificate_date?: string | null;
  remarks?: string | null;
  total_amount?: number | null;
  currency?: Currency | null;
}

const DocumentDialog: React.FC<{
  open: boolean;
  onClose: () => void;
  certificateId: number | string;
  organization?: Organization;
}> = ({ open, onClose, certificateId, organization }) => {
  const { data: certificateDetails, isFetching } = useQuery({
    queryKey: ['CertificateDetails', { id: certificateId }],
    queryFn: () => projectsServices.getCertificateDetails(certificateId),
    enabled: open,
  });

  const [activeTab, setActiveTab] = useState(0);
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  if (isFetching) {
    return (
      <Dialog open fullWidth fullScreen={belowLargeScreen} maxWidth="md">
        <DialogContent>
          <LinearProgress />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} fullScreen={belowLargeScreen} maxWidth="md" fullWidth>
      <DialogContent>
        {belowLargeScreen && (
          <Grid container alignItems="center" justifyContent="space-between" mb={2}>
            <Grid size={11}>
              <Tabs value={activeTab} onChange={(_, tab) => setActiveTab(tab)}>
                <Tab label="ONSCREEN" />
                <Tab label="PDF" />
              </Tabs>
            </Grid>
            <Grid size={1} textAlign="right">
              <Tooltip title="Close">
                <IconButton size="small" onClick={onClose}>
                  <HighlightOff color="primary" />
                </IconButton>
              </Tooltip>
            </Grid>
          </Grid>
        )}

        {belowLargeScreen && activeTab === 0 ? (
          <CertificateOnScreen certificate={certificateDetails} organization={organization as Organization} />
        ) : (
          <PDFContent
            document={<CertificatePDF certificate={certificateDetails} organization={organization as Organization} />}
            fileName={certificateDetails?.certificateNo || 'Certificate'}
          />
        )}

        {belowLargeScreen && (
          <Box textAlign="right" mt={5}>
            <Button variant="outlined" size="small" color="primary" onClick={onClose}>
              Close
            </Button>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

const EditCertificate: React.FC<{
  certificate: Certificate;
  setOpenDialog: (open: boolean) => void;
}> = ({ certificate, setOpenDialog }) => {
  const { data: certificateDetails, isFetching } = useQuery({
    queryKey: ['CertificateDetails', { id: certificate.id }],
    queryFn: () => projectsServices.getCertificateDetails(certificate.id),
  });

  if (isFetching) return <LinearProgress />;

  return <CertificateForm setOpenDialog={setOpenDialog} certificate={certificateDetails} />;
};

const CertificateItemAction: React.FC<{ certificate: Certificate }> = ({ certificate }) => {
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openPreviewDialog, setOpenPreviewDialog] = useState(false);
  const { showDialog, hideDialog } = useJumboDialog();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { authOrganization } = useJumboAuth();
  const organization = authOrganization?.organization;

  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const { mutate: deleteCertificate } = useMutation({
    mutationFn: () => projectsServices.deleteCertificate(certificate.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['Certificates'] });
      enqueueSnackbar('Certificate deleted successfully', { variant: 'success' });
    },
    onError: (error: any) => {
      enqueueSnackbar(error?.response?.data?.message || 'Failed to delete certificate', { variant: 'error' });
    },
  });

  const menuItems = [
    { icon: <VisibilityOutlined fontSize="small" />, title: 'View', action: 'view' },
    { icon: <EditOutlined fontSize="small" />, title: 'Edit', action: 'edit' },
    { icon: <DeleteOutlined fontSize="small" color="error" />, title: 'Delete', action: 'delete' },
  ];

  const handleItemAction = (menu: MenuItemProps) => {
    switch (menu.action) {
      case 'view':
        setOpenPreviewDialog(true);
        break;
      case 'edit':
        setOpenEditDialog(true);
        break;
      case 'delete':
        showDialog({
          title: 'Confirm Delete',
          content: 'Are you sure you want to delete this certificate?',
          onYes: () => {
            deleteCertificate();
            hideDialog();
          },
          onNo: hideDialog,
          variant: 'confirm',
        });
        break;
      default:
        break;
    }
  };

  return (
    <>
      <Dialog
        open={openEditDialog}
        onClose={() => setOpenEditDialog(false)}
        fullWidth
        fullScreen={belowLargeScreen}
        maxWidth="lg"
        scroll={belowLargeScreen ? 'body' : 'paper'}
      >
        <EditCertificate certificate={certificate} setOpenDialog={setOpenEditDialog} />
      </Dialog>

      <DocumentDialog
        open={openPreviewDialog}
        onClose={() => setOpenPreviewDialog(false)}
        certificateId={certificate.id as number}
        organization={organization}
      />

      <JumboDdMenu
        icon={
          <Tooltip title="Actions">
            <MoreHorizOutlined fontSize="small" />
          </Tooltip>
        }
        menuItems={menuItems}
        onClickCallback={handleItemAction}
      />
    </>
  );
};

export default CertificateItemAction;