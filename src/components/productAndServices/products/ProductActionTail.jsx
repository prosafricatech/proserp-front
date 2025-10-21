import React, { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, IconButton, SpeedDial, SpeedDialAction, SpeedDialIcon, Tab, Tabs, Tooltip, useMediaQuery } from '@mui/material';
import { AddOutlined, DownloadOutlined, MergeOutlined, UploadOutlined } from '@mui/icons-material';
import ProductFormDialogContent from './ProductFormDialogContent';
import ProductRegistrationExcelDownload from './ProductRegistrationExcelDownload';
import ProductsMergeForm from './ProductsMergeForm';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileExcel } from '@fortawesome/free-solid-svg-icons';
import ExcelTemplateDownloadTab from './ExcelTemplateDownloadTab';
import ProductsExcelImport from './ProductsExcelImport';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

const ProductActionTail = () => {
  const [newProductFormOpen, setNewProductFormOpen] = useState(false);
  const [productMergeFormOpen, setProductMergeFormOpen] = useState(false);
  const [speedDialOpen, setSpeedDialOpen] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [excelDialogContent, setExcelDialogContent] = useState(0);
  const dictionary = useDictionary();

  //Screen handling constants
  const {theme} = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const speedDialActions = [
    { icon: <AddOutlined />, name: dictionary.products.list.labels.newCreateLabel, onClick: () => setNewProductFormOpen(true) },
    { icon: <MergeOutlined />, name: dictionary.products.list.labels.mergeLabel, onClick: () => setProductMergeFormOpen(true) },
    { icon: <FontAwesomeIcon icon={faFileExcel} color='green' />, name: dictionary.products.list.labels.downloadLabel, onClick: () => setOpenDialog(true) },
  ];

  return (
    <>
      {belowLargeScreen ? (
        <SpeedDial
          ariaLabel="Product Actions"
          FabProps={{ size: 'small' }}
          sx={{ position:'absolute', height: 55}}
          icon={<SpeedDialIcon/>}
          open={speedDialOpen}
          onClick={() => setSpeedDialOpen(!speedDialOpen)}
          direction="down"
        >
          {speedDialActions.map((action) => (
            <SpeedDialAction
              key={action.name}
              icon={action.icon}
              tooltipTitle={action.name}
              tooltipOpen
              onClick={() => {
                action.onClick();
                setSpeedDialOpen(false);
              }}
            />
          ))}
        </SpeedDial>
      ) : (
        <>
          <Tooltip title={dictionary.products.list.labels.newCreateLabel}>
            <IconButton size='small' onClick={() => setNewProductFormOpen(true) }>
              <AddOutlined />
            </IconButton>
          </Tooltip>
          <Tooltip title={dictionary.products.list.labels.mergeLabel}>
            <IconButton size='small' onClick={() => setProductMergeFormOpen(true)}>
              <MergeOutlined />
            </IconButton>
          </Tooltip>
          <ProductRegistrationExcelDownload />
        </>
      )}
      <Dialog
        open={newProductFormOpen || productMergeFormOpen}
        scroll={'paper'}
        fullWidth
        fullScreen={newProductFormOpen && belowLargeScreen}
        maxWidth={productMergeFormOpen ? 'md' : 'sm'}
      >
        {newProductFormOpen && <ProductFormDialogContent toggleOpen={setNewProductFormOpen} />}
        {productMergeFormOpen && <ProductsMergeForm toggleOpen={setProductMergeFormOpen} />}
      </Dialog>

      <Dialog
        fullWidth
        open={openDialog}
        maxWidth={'md'}
        onClose={() => setOpenDialog(false)}
      >
        <DialogTitle textAlign={'center'}>{excelDialogContent === 0 ? `Download Template` : 'Upload Template'}</DialogTitle>
        <DialogContent>
          <Tabs 
            variant="fullWidth"
            allowScrollButtonsMobile
            value={excelDialogContent}
            onChange={(event, newValue) => setExcelDialogContent(newValue)}
          >
            <Tab label="Download" icon={<DownloadOutlined />} />
            <Tab label="Upload" icon={<UploadOutlined />} />
          </Tabs>
          {excelDialogContent === 0 ? (
            <ExcelTemplateDownloadTab setOpenDialog={setOpenDialog} content={excelDialogContent} />
          ) : (
            <ProductsExcelImport setOpenDialog={setOpenDialog} content={excelDialogContent} />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProductActionTail;
