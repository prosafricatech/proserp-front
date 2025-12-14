'use client'
import React, { useState } from 'react';
import { AddCircleOutlineOutlined, AddOutlined, PlaylistAddOutlined } from '@mui/icons-material';
import { Tooltip, Dialog, useMediaQuery} from '@mui/material';
import ProductionBatchesForm from './form/ProductionBatchesForm';
import ProductionBatchesForm2 from './form/ProductionBatchesForm2';
import { JumboDdMenu } from '@jumbo/components';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';

const ProductionBatchesActionTail = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [openDialog2, setOpenDialog2] = useState(false);

  //Screen handling constants
  const {theme} = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const menuItems = [
    {icon: <PlaylistAddOutlined/>, title: 'Use BOM', action: 'bom'},
    {icon: <AddCircleOutlineOutlined/>, title: 'Manual Input', action: 'manual'}
  ];

  const handleItemAction = (menuItem) => {
    switch (menuItem.action) {
      case 'bom':
        setOpenDialog2(true);
        break;
      case 'manual':
        setOpenDialog(true);
        break;
        default:
    }
  }

  return (
    <React.Fragment>
      <Dialog maxWidth="lg" scroll={belowLargeScreen ? 'body' : 'paper'} fullWidth fullScreen={belowLargeScreen} open={openDialog || openDialog2}>
        {openDialog && <ProductionBatchesForm toggleOpen={setOpenDialog} />}
        {openDialog2 && <ProductionBatchesForm2 toggleOpen={setOpenDialog2} />}
      </Dialog>
      <JumboDdMenu
        icon={
          <Tooltip title='Actions'>
            <AddOutlined/>
          </Tooltip>
        }
        menuItems={menuItems}
        onClickCallback={handleItemAction}
      />
    </React.Fragment>
  );
};

export default ProductionBatchesActionTail;