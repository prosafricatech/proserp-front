'use client'
import React, { useState } from 'react';
import { DeleteOutlined, EditOutlined, HighlightOff, MoreHorizOutlined, SellOutlined, VisibilityOutlined } from '@mui/icons-material';
import { Box, Button, Dialog, DialogContent, Grid, IconButton, LinearProgress, Tab, Tabs, Tooltip, useMediaQuery } from '@mui/material';
import { useSnackbar } from 'notistack';
import proformaServices from './proforma-services';
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import ProformaForm from './form/ProformaForm';
import ProformaInvoicePDF from './ProformaInvoicePDF';
import PDFContent from '../../pdf/PDFContent';
import ProformaSaleForm from './form/ProformaSaleForm';
import ProformaOnScreen from '../onScreenPreviews/ProformaOnScreen';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { JumboDdMenu } from '@jumbo/components';
import { Proforma } from './ProformaType';
import { Organization } from '@/types/auth-types';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { MenuItemProps } from '@jumbo/types';
import { useSalesOutlet } from '../outlet/OutletProvider';

interface EditProformaProps {
  proforma: Proforma;
  setOpenEditDialog: (open: boolean) => void;
}

interface SaleProformaProps {
  proforma: Proforma;
  setOpenSaleDialog: (open: boolean) => void;
}

interface DocumentDialogProps {
  openDocumentDialog: boolean;
  setOpenDocumentDialog: (open: boolean) => void;
  proforma: Proforma;
  organization: Organization;
}

const EditProforma: React.FC<EditProformaProps> = ({ proforma, setOpenEditDialog }) => {
  const { data: proformaDetails, isPending } = useQuery({
    queryKey: ['proformaDetails', { id: proforma.id }],
    queryFn: () => proformaServices.getProformaDetails(proforma.id)
  });

  if (isPending) {
    return <LinearProgress />;
  }

  return (
    <ProformaForm toggleOpen={setOpenEditDialog} proforma={proformaDetails} />
  );
};

const SaleProforma: React.FC<SaleProformaProps> = ({ proforma, setOpenSaleDialog }) => {
  const { data: proformaDetails, isPending } = useQuery({
    queryKey: ['proformaDetails', { id: proforma.id }],
    queryFn: () => proformaServices.getProformaDetails(proforma.id)
  });

  if (isPending) {
    return <LinearProgress />;
  }

  return (
    <ProformaSaleForm toggleOpen={setOpenSaleDialog} proforma={proformaDetails} />
  );
};

const DocumentDialog: React.FC<DocumentDialogProps> = ({ 
  openDocumentDialog, 
  setOpenDocumentDialog, 
  proforma, 
  organization 
}) => {
  const { data: proformaDetails, isPending } = useQuery({
    queryKey: ['proformaDetails', { id: proforma.id }],
    queryFn: () => proformaServices.getProformaDetails(proforma.id)
  });
  const [selectedTab, setSelectedTab] = useState(0);

  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  if (isPending) {
    return <LinearProgress />;
  }

  return (
    <Dialog
      open={openDocumentDialog}
      onClose={() => setOpenDocumentDialog(false)}
      fullWidth
      scroll='body'
      maxWidth={'md'}
      fullScreen={belowLargeScreen}
    >
      <DialogContent>
        {belowLargeScreen ? (
          <Box>
            <Grid container alignItems="center" justifyContent="space-between">
              <Grid size={{ xs: 11, md: 12 }}>
                <Tabs value={selectedTab} onChange={handleTabChange}>
                  <Tab label="On Screen" />
                  <Tab label="PDF" />
                </Tabs>
              </Grid>

              {belowLargeScreen && (
                <Grid size={{ xs: 1 }} textAlign="right">
                  <Tooltip title="Close">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => setOpenDocumentDialog(false)}
                    >
                      <HighlightOff color="primary" />
                    </IconButton>
                  </Tooltip>
                </Grid>
              )}
            </Grid>
            <Box>
              {selectedTab === 0 && (
                <ProformaOnScreen 
                  proforma={proformaDetails} 
                  organization={organization} 
                />
              )}
              {selectedTab === 1 && (
                <PDFContent
                  document={<ProformaInvoicePDF organization={organization} proforma={proformaDetails} />}
                  fileName={proforma.proformaNo}
                />
              )}
            </Box>
          </Box>
        ) : (
          <PDFContent
            document={<ProformaInvoicePDF organization={organization} proforma={proformaDetails} />}
            fileName={proforma.proformaNo}
          />
        )}
      </DialogContent>
      {belowLargeScreen && (
        <Box textAlign="right" margin={2}>
          <Button 
            variant="outlined" 
            size='small' 
            color="primary" 
            onClick={() => setOpenDocumentDialog(false)}
          >
            Close
          </Button>
        </Box>
      )}
    </Dialog>
  );
};

interface ProformaItemActionProps {
  proforma: Proforma;
}

const ProformaItemAction: React.FC<ProformaItemActionProps> = ({ proforma }) => {
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openSaleDialog, setOpenSaleDialog] = useState(false);
  const { showDialog, hideDialog } = useJumboDialog();
  const [openDocumentDialog, setOpenDocumentDialog] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { authOrganization, checkOrganizationPermission } = useJumboAuth();
  const organization = authOrganization?.organization;
  const {activeOutlet} = useSalesOutlet();

  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const { mutate: deleteProforma } = useMutation({
    mutationFn: proformaServices.deleteProforma,
    onSuccess: (data: { message: string }) => {
      queryClient.invalidateQueries({ queryKey: ['proformaInvoices'] });
      enqueueSnackbar(data.message, { variant: 'success' });
    },
    onError: (error: any) => {
      enqueueSnackbar(error?.response?.data.message, { variant: 'error' });
    },
  });

  const menuItems = [
    { icon: <VisibilityOutlined />, title: "View", action: "open" },
    checkOrganizationPermission(PERMISSIONS.SALES_CREATE) && String(activeOutlet?.id) !== 'all' && { icon: <SellOutlined />, title: 'Sale', action: 'sale' },
    checkOrganizationPermission(PERMISSIONS.PROFORMA_INVOICES_EDIT) && String(activeOutlet?.id) !== 'all' && { icon: <EditOutlined />, title: 'Edit', action: 'edit' },
    checkOrganizationPermission(PERMISSIONS.PROFORMA_INVOICES_DELETE) && { icon: <DeleteOutlined color='error' />, title: 'Delete', action: 'delete' }
  ].filter(menuItem => !!menuItem);

  const handleItemAction = (menuItem: MenuItemProps) => {
    switch (menuItem.action) {
      case 'edit':
        setOpenEditDialog(true);
        break;
      case 'delete':
        showDialog({
          title: 'Confirm Proforma',
          content: 'Are you sure you want to delete this Proforma?',
          onYes: () => {
            hideDialog();
            deleteProforma(proforma.id);
          },
          onNo: () => hideDialog(),
          variant: 'confirm'
        });
        break;
      case 'sale':
        setOpenSaleDialog(true);
        break;
      case 'open':
        setOpenDocumentDialog(true);
        break;
      default:
        break;
    }
  };

  return (
    <>
      <Dialog
        open={openEditDialog || openSaleDialog || openDocumentDialog}
        onClose={() => {
          setOpenEditDialog(false);
          setOpenSaleDialog(false);
          setOpenDocumentDialog(false);
        }}
        scroll={belowLargeScreen ? 'body' : 'paper'}
        fullWidth
        fullScreen={belowLargeScreen}
        maxWidth="lg"
      >
        {!!openEditDialog && <EditProforma proforma={proforma} setOpenEditDialog={setOpenEditDialog} />}
        {!!openSaleDialog && <SaleProforma proforma={proforma} setOpenSaleDialog={setOpenSaleDialog} />}
        {!!openDocumentDialog && (
          <DocumentDialog 
            proforma={proforma} 
            organization={organization as Organization} 
            setOpenDocumentDialog={setOpenDocumentDialog} 
            openDocumentDialog={openDocumentDialog}
          />
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

export default ProformaItemAction;