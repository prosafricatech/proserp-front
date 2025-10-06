import { DeleteOutlined, EditOutlined, HighlightOff, MoreHorizOutlined, VisibilityOutlined } from '@mui/icons-material';
import { Box, Button, Dialog,DialogContent,Grid,IconButton,LinearProgress,Tab,Tabs,Tooltip, useMediaQuery } from '@mui/material';
import { useSnackbar } from 'notistack';
import { useState } from 'react';
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import PDFContent from '@/components/pdf/PDFContent';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { JumboDdMenu } from '@jumbo/components';
import projectsServices from '@/components/projectManagement/projects/project-services';
import SubContractMaterialUsedOnScreen from './SubContractMaterialUsedOnScreen';
import SubContractMaterialUsedPDF from './SubContractMaterialUsedPDF';

const DocumentDialog = ({ setOpenDocumentDialog, SubContractMaterialUsed, organization }) => {
    const {data:SubContractMaterialUsedDetails,isFetching} = useQuery({
        queryKey: ['SubContractMaterialUsedDetails',{id:SubContractMaterialUsed.id}],
        queryFn: async() => projectsServices.getSubContractMaterialUsedDetails(SubContractMaterialUsed.id)
    });
    const [selectedTab, setSelectedTab] = useState(0);
  
    //Screen handling constants
    const {theme} = useJumboTheme();
    const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));
  
    const handleTabChange = (event, newValue) => {
      setSelectedTab(newValue);
    };
  
    if(isFetching){
      return <LinearProgress/>;
    }
  
    return (
      <>
        <DialogContent>
          {belowLargeScreen ? (
              <Box>
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
              <Box>
                {selectedTab === 0 && (
                  <SubContractMaterialUsedOnScreen SubContractMaterialUsedDetails={SubContractMaterialUsedDetails} setOpenDocumentDialog={setOpenDocumentDialog} organization={organization} />
                )}
                {selectedTab === 1 && (
                  <PDFContent
                    document={<SubContractMaterialUsedPDF organization={organization} SubContractMaterialUsedDetails={SubContractMaterialUsedDetails} />}
                    fileName={SubContractMaterialUsed.issueNo}
                  />
                )}
              </Box>
            </Box>
          ) : (
            <PDFContent
              document={<SubContractMaterialUsedPDF organization={organization} SubContractMaterialUsedDetails={SubContractMaterialUsedDetails} />}
              fileName={SubContractMaterialUsed.issueNo}
            />
          )}
        </DialogContent>
        {belowLargeScreen &&
          <Box textAlign="right" margin={2}>
            <Button variant="outlined" size='small' color="primary" onClick={() => setOpenDocumentDialog(false)}>
            Close
            </Button>
          </Box>
        }
      </>
    );
};

const SubContractMaterialUsedItemAction = ({ SubContractMaterialUsed}) => {
    const {showDialog,hideDialog} = useJumboDialog();
    const [openDocumentDialog, setOpenDocumentDialog] = useState(false);
    const { enqueueSnackbar } = useSnackbar();
    const queryClient = useQueryClient();
    const { authOrganization: { organization }} = useJumboAuth();

    //Screen handling constants
    const {theme} = useJumboTheme();
    const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

    // React Query v5 syntax for useMutation
    const { mutate: deleteSubContractMaterialUsed } = useMutation({
        mutationFn: projectsServices.deleteSubContractMaterialUsed,
        onSuccess: (data) => {
            queryClient.invalidateQueries({queryKey: ['SubContractMaterialUsed']});
            enqueueSnackbar(data.message, {
                variant: 'success',
            });
        },
        onError: (error) => {
            enqueueSnackbar(error?.response?.message,{variant : 'error'});
        },
    });

    const menuItems = [
        {icon: <VisibilityOutlined />, title: "View", action: "open" },
        {icon: <EditOutlined/>, title: 'Edit', action: 'edit'},
        {icon: <DeleteOutlined color='error'/>, title: 'Delete', action: 'delete'}
    ];

  const handleItemAction = (menuItem) => {
    switch (menuItem.action) {
      case 'open':
        setOpenDocumentDialog(true);
        break;
      case 'delete':
        showDialog({
            title: 'Confirm Delete',
            content: 'Are you sure you want to delete this Material Used?',
            onYes: () =>{ 
                hideDialog();
                deleteSubContractMaterialUsed(SubContractMaterialUsed.id)
            },
            onNo: () => hideDialog(),
            variant:'confirm'
        });
        break;
        default:
        break;
    }
  }

  return (
    <>
        <Dialog
            open={openDocumentDialog}
            fullWidth  
            fullScreen={belowLargeScreen}
            maxWidth={'md'} 
            scroll={belowLargeScreen ? 'body' : 'paper'}
            onClose={() => setOpenDocumentDialog(false)}
        >
          {!!openDocumentDialog && <DocumentDialog SubContractMaterialUsed={SubContractMaterialUsed} organization={organization} setOpenDocumentDialog={setOpenDocumentDialog} openDocumentDialog={openDocumentDialog}/>}
        </Dialog>
        <JumboDdMenu
            icon={
                <Tooltip title='Actions'>
                    <MoreHorizOutlined/>
                </Tooltip>
            }
            menuItems={menuItems}
            onClickCallback={handleItemAction}
        />
    </>
  );
};

export default SubContractMaterialUsedItemAction;