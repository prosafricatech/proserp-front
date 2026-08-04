'use client';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import PDFContent from '@/components/pdf/PDFContent';
import { FileExportGrid } from '@/components/sharedComponents/FileExportGrid';
import PreviewTopBar from '@/components/sharedComponents/PreviewTopBar';
import { JumboDdMenu } from '@jumbo/components';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import {
  AttachmentOutlined,
  HighlightOff,
  MoreHorizOutlined,
  VisibilityOutlined,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  IconButton,
  Skeleton,
  Tooltip,
  useMediaQuery,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import AttachmentForm from '../../filesShelf/attachments/AttachmentForm';
import { useCurrencySelect } from '../../masters/Currencies/CurrencySelectProvider';
import grnServices from './grn-services';
import GrnOnScreenPreview from './GrnOnScreenPreview';
import GrnPDF from './GrnPDF';

const DocumentDialog = ({
  grn_id,
  organization,
  checkOrganizationPermission,
  setOpenDocumentDialog,
}) => {
  const { currencies } = useCurrencySelect();
  const baseCurrency = currencies.find((currency) => !!currency?.is_base);

  const { data: grn, isPending: isFetching } = useQuery({
    queryKey: ['grns', { id: grn_id }],
    queryFn: () => grnServices.grnDetails(grn_id),
  });

  //Screen handling constants
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const [activeTab, setActiveTab] = useState(0);
  const [showOnScreen, setShowOnScreen] = useState(true);

  if (isFetching) {
    return (
      <div style={{ width: '100%', padding: '16px' }}>
        <Skeleton
          variant='text'
          width={180}
          height={32}
          style={{ borderRadius: 4, marginLeft: 'auto' }}
        />
        <Skeleton
          variant='rectangular'
          width='100%'
          height={48}
          style={{ borderRadius: 4 }}
        />
        <Skeleton
          variant='rectangular'
          width='100%'
          height={32}
          style={{ borderRadius: 4 }}
        />
      </div>
    );
  }

  const handleTabChange = (e, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <DialogContent>
      <PreviewTopBar
        fileExportGrid={
          <FileExportGrid
            exportPdf
            handlePdf={() => {
              setShowOnScreen((prev) => !prev);
            }}
          />
        }
        closeButton={
          <IconButton
            size='small'
            color='primary'
            onClick={() => setOpenDocumentDialog(false)}
          >
            <HighlightOff color='primary' />
          </IconButton>
        }
      />
      {showOnScreen ? (
        <GrnOnScreenPreview
          grn={grn}
          baseCurrency={baseCurrency}
          organization={organization}
          checkOrganizationPermission={checkOrganizationPermission}
        />
      ) : (
        <PDFContent
          fileName={grn.grnNo}
          document={
            <GrnPDF
              grn={grn}
              baseCurrency={baseCurrency}
              organization={organization}
              checkOrganizationPermission={checkOrganizationPermission}
            />
          }
        />
      )}
      {belowLargeScreen && (
        <Box textAlign='right' marginTop={5}>
          <Button
            variant='outlined'
            size='small'
            color='primary'
            onClick={() => setOpenDocumentDialog(false)}
          >
            Close
          </Button>
        </Box>
      )}
    </DialogContent>
  );
};

const AttachDialog = ({ grn, setAttachDialog }) => {
  return (
    <AttachmentForm
      setAttachDialog={setAttachDialog}
      attachment_sourceNo={grn.grnNo}
      attachmentable_type={'grn'}
      attachment_name={'Grn'}
      attachmentable_id={grn.id}
    />
  );
};

const GrnsListItemAction = ({ grn }) => {
  const [openDocumentDialog, setOpenDocumentDialog] = useState(false);
  const [attachDialog, setAttachDialog] = useState(false);
  const {
    checkOrganizationPermission,
    authOrganization: { organization },
  } = useJumboAuth();

  //Screen handling constants
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const menuItems = [
    { icon: <VisibilityOutlined />, title: 'View', action: 'open' },
    { icon: <AttachmentOutlined />, title: 'Attach', action: 'attach' },
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
  };

  return (
    <>
      <Dialog
        open={openDocumentDialog || attachDialog}
        scroll={belowLargeScreen || !openDocumentDialog ? 'body' : 'paper'}
        fullWidth
        fullScreen={belowLargeScreen}
        maxWidth='md'
        onClose={() => {
          setOpenDocumentDialog(false);
        }}
      >
        {openDocumentDialog && (
          <DocumentDialog
            grn_id={grn.id}
            checkOrganizationPermission={checkOrganizationPermission}
            setOpenDocumentDialog={setOpenDocumentDialog}
            organization={organization}
          />
        )}
        {attachDialog && (
          <AttachDialog grn={grn} setAttachDialog={setAttachDialog} />
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

export default GrnsListItemAction;
