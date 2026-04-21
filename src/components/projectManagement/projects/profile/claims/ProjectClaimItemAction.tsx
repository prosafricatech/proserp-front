'use client';

import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import PDFContent from '@/components/pdf/PDFContent';
import projectsServices from '@/components/projectManagement/projects/project-services';
import { JumboDdMenu } from '@jumbo/components';
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { MenuItemProps } from '@jumbo/types';
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
  Checkbox,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  LinearProgress,
  Stack,
  Tab,
  Tabs,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import React, { useState } from 'react';
import ClaimOnscreen from './ClaimOnscreen';
import ClaimPDF from './ClaimPDF';
import ProjectClaimsForm from './form/ProjectClaimsForm';

interface DocumentDialogProps {
  open: boolean;
  onClose: () => void;
  claimId: number;
  organization: any;
}

interface EditClaimProps {
  claim: any;
  setOpenDialog: (open: boolean) => void;
}

interface ProjectClaimItemActionProps {
  claim: any;
}

const DocumentDialog: React.FC<DocumentDialogProps> = ({
  open,
  onClose,
  claimId,
  organization,
}) => {
  const { data: claimDetails, isFetching } = useQuery({
    queryKey: ['claim-details', claimId],
    queryFn: () => projectsServices.getClaimDetails(claimId),
    enabled: open && !!claimId,
  });

  const [activeTab, setActiveTab] = useState<number>(0);
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));
  const [openDetails, setOpenDetails] = useState(false);

  const handleDetailsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    setOpenDetails(isChecked);
  };

  if (isFetching) {
    return (
      <Dialog open fullWidth fullScreen={belowLargeScreen} maxWidth='md'>
        <LinearProgress />
      </Dialog>
    );
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth='md'
      fullScreen={belowLargeScreen}
    >
      {(!belowLargeScreen || activeTab === 1) && (
        <DialogTitle>
          <Stack
            direction={'row'}
            justifyContent={'center'}
            alignItems={'center'}
          >
            <Typography>With Claim Derivations</Typography>
            <Checkbox checked={openDetails} onChange={handleDetailsChange} />
          </Stack>
        </DialogTitle>
      )}

      <DialogContent>
        {belowLargeScreen && (
          <Grid
            container
            alignItems='center'
            justifyContent='space-between'
            mb={2}
          >
            <Grid size={11}>
              <Tabs value={activeTab} onChange={(_, tab) => setActiveTab(tab)}>
                <Tab label='ONSCREEN' />
                <Tab label='PDF' />
              </Tabs>
            </Grid>

            <Grid size={1} textAlign='right'>
              <Tooltip title='Close'>
                <IconButton size='small' onClick={onClose}>
                  <HighlightOff color='primary' />
                </IconButton>
              </Tooltip>
            </Grid>
          </Grid>
        )}

        {belowLargeScreen && activeTab === 0 ? (
          <ClaimOnscreen claim={claimDetails} organization={organization} />
        ) : (
          <PDFContent
            document={
              <ClaimPDF
                claim={claimDetails}
                organization={organization}
                openDetails={openDetails}
              />
            }
            fileName={claimDetails?.claimNo}
          />
        )}

        {belowLargeScreen && (
          <Box textAlign='right' mt={5}>
            <Button variant='outlined' size='small' onClick={onClose}>
              Close
            </Button>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

const EditClaim: React.FC<EditClaimProps> = ({ claim, setOpenDialog }) => {
  const { data: claimDetails, isFetching } = useQuery({
    queryKey: ['claimDetails', claim.id],
    queryFn: () => projectsServices.getClaimDetails(claim.id),
    enabled: !!claim?.id,
  });

  if (isFetching) return <LinearProgress />;

  return (
    <ProjectClaimsForm claim={claimDetails} setOpenDialog={setOpenDialog} />
  );
};

const ProjectClaimItemAction: React.FC<ProjectClaimItemActionProps> = ({
  claim,
}) => {
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openPreviewDialog, setOpenPreviewDialog] = useState(false);

  const { showDialog, hideDialog } = useJumboDialog();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  const { authOrganization } = useJumboAuth();
  const organization = authOrganization?.organization;

  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const { mutate: deleteClaim } = useMutation({
    mutationFn: (id: number) => projectsServices.deleteClaim(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ['projectProjectClaims'],
      });
      enqueueSnackbar(data.message, { variant: 'success' });
    },
    onError: (error: any) => {
      enqueueSnackbar(error?.response?.data?.message || 'Delete failed', {
        variant: 'error',
      });
    },
  });

  const menuItems = [
    { icon: <VisibilityOutlined />, title: 'View', action: 'view' },
    { icon: <EditOutlined />, title: 'Edit', action: 'edit' },
    {
      icon: <DeleteOutlined color='error' />,
      title: 'Delete',
      action: 'delete',
    },
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
          content: 'Are you sure you want to delete this Claim?',
          variant: 'confirm',
          onYes: () => {
            hideDialog();
            deleteClaim(claim.id);
          },
          onNo: hideDialog,
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
        maxWidth='lg'
        fullScreen={belowLargeScreen}
        scroll={belowLargeScreen ? 'body' : 'paper'}
      >
        {openEditDialog && (
          <EditClaim claim={claim} setOpenDialog={setOpenEditDialog} />
        )}
      </Dialog>

      <DocumentDialog
        open={openPreviewDialog}
        onClose={() => setOpenPreviewDialog(false)}
        claimId={claim.id}
        organization={organization}
      />

      <JumboDdMenu
        icon={
          <Tooltip title='Actions'>
            <MoreHorizOutlined />
          </Tooltip>
        }
        menuItems={menuItems}
        onClickCallback={handleItemAction}
      />
    </>
  );
};

export default ProjectClaimItemAction;
