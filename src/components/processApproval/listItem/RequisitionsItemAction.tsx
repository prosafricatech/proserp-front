'use client'
import React, { useContext, useState } from 'react';
import { DeleteOutlined, EditOutlined, HighlightOff, VisibilityOutlined } from '@mui/icons-material';
import { Box, Button, Dialog, DialogActions, DialogContent, Grid, IconButton, LinearProgress, Tab, Tabs, Tooltip, useMediaQuery } from '@mui/material';
import { useSnackbar } from 'notistack';
import RequisitionsForm from '../form/RequisitionsForm';
import RequisitionsOnScreen from '../RequisitionsOnScreen';
import RequisitionPDF from '../RequisitionPDF';
import requisitionsServices from '../requisitionsServices';
import PDFContent from '../../pdf/PDFContent';
import { requisitionContext } from '../Requisitions';
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import dayjs from 'dayjs';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { Requisition } from '../RequisitionType';
import { Organization } from '@/types/auth-types';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';

dayjs.extend(isSameOrAfter);

interface EditRequisitionProps {
  requisition: Requisition;
  setOpenEditDialog: (value: boolean) => void;
}

interface DocumentDialogProps {
  openDocumentDialog: boolean;
  setOpenDocumentDialog: (value: boolean) => void;
  requisition: Requisition;
  organization: Organization;
}

interface RequisitionsItemActionProps {
  requisition: Requisition;
}

const EditRequisition: React.FC<EditRequisitionProps> = ({ requisition, setOpenEditDialog }) => {
  const { data: requisitionDetails, isFetching } = useQuery({
    queryKey: ['requisitionDetails', { id: requisition.id }],
    queryFn: async () => await requisitionsServices.getRequisitionDetails(requisition.id),
    refetchOnWindowFocus: true
  });

  if (isFetching) {
    return <LinearProgress />;
  }

  return (
    <RequisitionsForm 
      toggleOpen={setOpenEditDialog} 
      requisition={requisitionDetails} 
    />
  );
};

const DocumentDialog: React.FC<DocumentDialogProps> = ({ 
  openDocumentDialog, 
  setOpenDocumentDialog, 
  requisition, 
  organization 
}) => {
  const { data: requisitionDetails, isFetching } = useQuery({
    queryKey: ['requisitionDetails', { id: requisition.id }],
    queryFn: async () => await requisitionsServices.getRequisitionDetails(requisition.id)
  });

  const [selectedTab, setSelectedTab] = useState(0);
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  const isPurchaseProcess = requisition?.approval_chain?.process_type?.toLowerCase() === 'purchase';
  const forcePDFView = isPurchaseProcess && !belowLargeScreen;
  const showTabs = !isPurchaseProcess || (isPurchaseProcess && belowLargeScreen);

  if (isFetching) {
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
        <Box>
          {showTabs && (
            <Grid container alignItems="center" justifyContent="space-between">
              <Grid size={{xs: belowLargeScreen ? 11 : 12}}>
                <Tabs value={selectedTab} onChange={handleTabChange}>
                  <Tab label="On Screen" />
                  <Tab label="PDF" />
                </Tabs>
              </Grid>

              {belowLargeScreen && (
                <Grid size={{xs: 1}} textAlign="right">
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
          )}

          <Box>
            {forcePDFView ? (
              <PDFContent
                document={<RequisitionPDF organization={organization} requisition={requisitionDetails} />}
                fileName={requisition.requisitionNo}
              />
            ) : (
              <>
                {selectedTab === 0 && (
                  <RequisitionsOnScreen
                    belowLargeScreen={belowLargeScreen}
                    requisition={requisitionDetails}
                    organization={organization}
                  />
                )}
                {selectedTab === 1 && (
                  <PDFContent
                    document={<RequisitionPDF organization={organization} requisition={requisitionDetails} />}
                    fileName={requisition.requisitionNo}
                  />
                )}
              </>
            )}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ margin: 2 }}>
        <Button
          variant="outlined"
          size='small'
          color="primary"
          onClick={() => setOpenDocumentDialog(false)}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const RequisitionsItemAction: React.FC<RequisitionsItemActionProps> = ({ requisition }) => {
  const { showDialog, hideDialog } = useJumboDialog();
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const { setIsEditAction } = useContext(requisitionContext);
  const [openDocumentDialog, setOpenDocumentDialog] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { authOrganization } = useJumboAuth();
  const organization = authOrganization?.organization;
  const { checkOrganizationPermission } = useJumboAuth();
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const deleteRequisition = useMutation({
    mutationFn: requisitionsServices.deleteRequisiton,
    onSuccess: (data: { message: string }) => {
      queryClient.invalidateQueries({ queryKey: ['requisitions'] });
      enqueueSnackbar(data.message, { variant: 'success' });
    },
    onError: (error: any) => {
      enqueueSnackbar(error?.response?.data.message, { variant: 'error' });
    },
  });

  const handleDelete = () => {
    showDialog({
      title: 'Confirm Delete?',
      content: 'If you click yes, this Requisition will be deleted',
      onYes: () => {
        hideDialog();
        deleteRequisition.mutate(requisition.id);
      },
      onNo: () => hideDialog(),
      variant: 'confirm',
    });
  };

  const canEditOrDelete =
    requisition.approvals.length === 0 &&
    (checkOrganizationPermission(PERMISSIONS.REQUISITIONS_BACKDATE) ||
      dayjs(requisition.requisition_date).isSameOrAfter(
        dayjs().startOf('day')
      ));

  return (
    <>
      <Dialog
        open={openEditDialog || openDocumentDialog}
        onClose={() => {
          setOpenEditDialog(false);
          setOpenDocumentDialog(false);
        }}
        scroll={belowLargeScreen ? 'body' : 'paper'}
        fullWidth
        fullScreen={belowLargeScreen}
        maxWidth={openEditDialog ? 'lg' : 'md'}
      >
        {openEditDialog && <EditRequisition requisition={requisition} setOpenEditDialog={setOpenEditDialog} />}
        {openDocumentDialog && (
          <DocumentDialog 
            requisition={requisition} 
            organization={organization as Organization} 
            setOpenDocumentDialog={setOpenDocumentDialog} 
            openDocumentDialog={openDocumentDialog}
          />
        )}
      </Dialog>

      <Tooltip title="View">
        <IconButton onClick={() => setOpenDocumentDialog(true)}>
          <VisibilityOutlined />
        </IconButton>
      </Tooltip>

      {
        canEditOrDelete &&(
        <>
          <Tooltip title="Edit">
            <IconButton onClick={() => {
              setOpenEditDialog(true);
              setIsEditAction(true);
            }}>
              <EditOutlined />
            </IconButton>
          </Tooltip>

          <Tooltip title="Delete">
            <IconButton onClick={handleDelete}>
              <DeleteOutlined color="error" />
            </IconButton>
          </Tooltip>
        </>
      )}
    </>
  );
};

export default RequisitionsItemAction;