'use client'
import React, { useState } from 'react'
import { MoreHorizOutlined, ViewTimelineOutlined } from '@mui/icons-material';
import { Dialog, Tooltip, useMediaQuery } from '@mui/material';
import ItemMovement from './ItemMovement';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { JumboDdMenu } from '@jumbo/components';

function StockListItemAction({productStock}) {
   const [openMovementDialog, setOpenMovementDialog] = useState(false);

   //Screen handling constants
  const {theme} = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));
    
    const menuItems = [
      {icon: <ViewTimelineOutlined/>, title: 'Movement', action: 'movement'}
    ];
  
    const handleItemAction = (menuItem) => {
      switch (menuItem.action) {
        case 'movement':
          setOpenMovementDialog(true);
        break;
      default:
      }
    }

  return  (
    <React.Fragment>
      <Dialog
        open={openMovementDialog}
        scroll={'paper'}
        fullWidth   
        fullScreen={belowLargeScreen}
        maxWidth='md'
      >
        <ItemMovement productStock={productStock} toggleOpen={setOpenMovementDialog} />
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
      </React.Fragment>
  )
}

export default StockListItemAction