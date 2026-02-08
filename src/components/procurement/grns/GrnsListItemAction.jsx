'use client'
import { AttachmentOutlined, HighlightOff, MoreHorizOutlined, VisibilityOutlined } from '@mui/icons-material';
import { Box, Button, Dialog, DialogContent, Grid, IconButton, LinearProgress, Tab, Tabs, Tooltip, useMediaQuery } from '@mui/material';
import React, { useState } from 'react';
import GrnPDF from './GrnPDF';
import { useCurrencySelect } from '../../masters/Currencies/CurrencySelectProvider';
import AttachmentForm from '../../filesShelf/attachments/AttachmentForm';
import GrnOnScreenPreview from './GrnOnScreenPreview';
import { useQuery } from '@tanstack/react-query';
import grnServices from './grn-services';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import PDFContent from '@/components/pdf/PDFContent';
import { JumboDdMenu } from '@jumbo/components';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';

const DocumentDialog = ({ grn_id, organization, checkOrganizationPermission, setOpenDocumentDialog }) => {
  const { currencies } = useCurrencySelect();
  const baseCurrency = currencies.find((currency) => !!currency?.is_base);

  const { data: grn, isPending: isFetching } = useQuery({
    queryKey: ['grns', { id: grn_id }],
    queryFn: () => grnServices.grnDetails(grn_id),
  });

  //Screen handling constants
  const {theme} = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));
  
  const [activeTab, setActiveTab] = useState(0);

  if (isFetching) {
    return <LinearProgress />;
  }

  const handleTabChange = (e, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <DialogContent>
      {belowLargeScreen && (
        <Grid container alignItems="center" justifyContent="space-between" marginBottom={2}>
          <Grid size={11}>
            <Tabs 
              value={activeTab} 
              onChange={handleTabChange} 
              aria-label="grn tabs"
            >
              <Tab label="ONSCREEN" />
              <Tab label="PDF" />
            </Tabs>
          </Grid>

          <Grid size={1} textAlign="right">
            <Tooltip title="Close">
              <IconButton 
                size='small' 
                onClick={() => setOpenDocumentDialog(false)}
              >
                <HighlightOff color="primary" />
              </IconButton>
            </Tooltip>
          </Grid>
        </Grid>
      )}
      { belowLargeScreen && activeTab === 0 ?
        <GrnOnScreenPreview grn={grn} baseCurrency={baseCurrency} organization={organization} checkOrganizationPermission={checkOrganizationPermission}/>
        :
        <PDFContent fileName={grn.grnNo} document={<GrnPDF grn={grn} baseCurrency={baseCurrency} organization={organization} checkOrganizationPermission={checkOrganizationPermission}/>}/>
      }
      {belowLargeScreen &&
        <Box textAlign="right" marginTop={5}>
          <Button variant="outlined" size='small' color="primary" onClick={() => setOpenDocumentDialog(false)}>
          Close
          </Button>
        </Box>
      }
    </DialogContent>
  );
};

const AttachDialog= ({grn, setAttachDialog}) => {
  return (
    <AttachmentForm setAttachDialog={setAttachDialog} attachment_sourceNo={grn.grnNo} attachmentable_type={'grn'} attachment_name={'Grn'} attachmentable_id={grn.id}/>
  )
}

const GrnsListItemAction = ({grn}) => {
  const [openDocumentDialog, setOpenDocumentDialog] = useState(false);
  const [attachDialog, setAttachDialog] = useState(false);
  const {checkOrganizationPermission, authOrganization : {organization}} = useJumboAuth();

  //Screen handling constants
  const {theme} = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const menuItems = [
    {icon: <VisibilityOutlined/> , title: "View", action: "open"},
    {icon: <AttachmentOutlined/> , title : "Attach" , action : "attach"},
  ];

  const handleItemAction = (menuItem) => {
    switch (menuItem.action) {
      case 'open':
        setOpenDocumentDialog(true);
        break;
      case 'attach':
        setAttachDialog(true);
        break;
      default:
      break;
    }
  }

  return (
    <>
      <Dialog
        open={openDocumentDialog || attachDialog}
        scroll={(belowLargeScreen || !openDocumentDialog) ? 'body' : 'paper'}
        fullWidth
        fullScreen={belowLargeScreen}
        maxWidth="md" 
        onClose={() => {
          setOpenDocumentDialog(false);
        }}
      >
        {openDocumentDialog && <DocumentDialog grn_id={grn.id} checkOrganizationPermission={checkOrganizationPermission} setOpenDocumentDialog={setOpenDocumentDialog} organization={organization} />}
        {attachDialog && <AttachDialog grn={grn} setAttachDialog={setAttachDialog}/>}
      </Dialog>
      <JumboDdMenu
        icon={
          <Tooltip title='Actions'>
            <MoreHorizOutlined fontSize='small'/>
          </Tooltip>
      }
        menuItems={menuItems}
        onClickCallback={handleItemAction}
      />
    </>
  );
};

export default GrnsListItemAction;
