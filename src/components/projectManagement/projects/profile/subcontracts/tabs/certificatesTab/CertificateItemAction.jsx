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

const DocumentDialog = ({ open, onClose, certificateId, organization }) => {
  const { data: certificateDetails, isFetching } = useQuery({
    queryKey: ['CertificateDetails', { id: certificateId }],
    queryFn: () => projectsServices.getCertificateDetails(certificateId),
    enabled: open,
  });

  const [activeTab, setActiveTab] = useState(0);
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  if (isFetching)
  return (
    <Dialog open fullWidth fullScreen={belowLargeScreen} maxWidth="sm">
        <LinearProgress/>
    </Dialog>
  );

  return (
    <Dialog open={open} onClose={onClose} fullScreen={belowLargeScreen} maxWidth="lg" fullWidth>
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
          <CertificateOnScreen certificate={certificateDetails} organization={organization} />
        ) : (
          <PDFContent
            document={<CertificatePDF certificate={certificateDetails} organization={organization} />}
            fileName={certificateDetails?.certificateNo}
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

const EditCertificate = ({ certificate, setOpenDialog }) => {
  const { data: CertificateDetails, isFetching } = useQuery({
    queryKey: ['CertificateDetails', { id: certificate.id }],
    queryFn: () => projectsServices.getCertificateDetails(certificate.id),
  });

  if (isFetching) return <LinearProgress />;

  return (
    <CertificateForm
      setOpenDialog={setOpenDialog}
      certificate={CertificateDetails}
    />
  );
};

const CertificateItemAction = ({ certificate }) => {
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
    mutationFn: projectsServices.deleteCertificate,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['Certificates'] });
      enqueueSnackbar(data.message, { variant: 'success' });
    },
    onError: (error) => {
      enqueueSnackbar(error?.response?.data.message, { variant: 'error' });
    },
  });

  const menuItems = [
    { icon: <VisibilityOutlined />, title: 'View', action: 'view' },
    { icon: <EditOutlined />, title: 'Edit', action: 'edit' },
    { icon: <DeleteOutlined color="error" />, title: 'Delete', action: 'delete' },
  ];

  const handleItemAction = (menu) => {
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
          content: 'Are you sure you want to delete this Certificate?',
          onYes: () => {
            hideDialog();
            deleteCertificate(certificate.id);
          },
          onNo: () => hideDialog(),
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
        fullWidth
        fullScreen={belowLargeScreen}
        maxWidth="md"
        scroll={belowLargeScreen ? 'body' : 'paper'}
      >
        {openEditDialog && (
          <EditCertificate
            certificate={certificate}
            setOpenDialog={setOpenEditDialog}
          />
        )}
      </Dialog>

      <DocumentDialog
        open={openPreviewDialog}
        onClose={() => setOpenPreviewDialog(false)}
        certificateId={certificate.id}
        organization={organization}
      />

      <JumboDdMenu
        icon={
          <Tooltip title="Actions">
            <MoreHorizOutlined />
          </Tooltip>
        }
        menuItems={menuItems}
        onClickCallback={handleItemAction}
      />
    </>
  );
};

export default CertificateItemAction;
