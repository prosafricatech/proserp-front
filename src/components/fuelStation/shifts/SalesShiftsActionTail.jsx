'use client'
import React, { useState } from 'react';
import { AddOutlined, AddCircleOutlineOutlined, PlaylistAddCheckOutlined } from '@mui/icons-material';
import { Tooltip, Dialog, useMediaQuery, Chip, Box } from '@mui/material';
import { JumboDdMenu } from '@jumbo/components';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import SaleShiftForm from './SaleShiftForm';
import SaleShiftForm2 from './SaleShiftForm2/SaleShiftForm2';

const SalesShiftsActionTail = () => {
  const { checkOrganizationPermission } = useJumboAuth();
  const [openDialog, setOpenDialog] = useState(false);
  const [formType, setFormType] = useState(null); // 'current' or 'beta'

  //Screen handling constants
  const {theme} = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const menuItems = [
    {
      icon: <AddOutlined fontSize="small" />, 
      title: 'Standard Form',
      subtitle: 'Current stable version',
      action: 'current',
      badge: (
        <Chip 
          label="Stable" 
          size="small" 
          color="success" 
          sx={{ height: 20, fontSize: '0.65rem', ml: 1 }} 
        />
      )
    },
    {
      icon: <AddCircleOutlineOutlined fontSize="small" />, 
      title: 'Beta Form',
      subtitle: 'New improved interface',
      action: 'beta',
      badge: (
        <Chip 
          label="Beta" 
          size="small" 
          color="primary" 
          sx={{ height: 20, fontSize: '0.65rem', ml: 1 }} 
        />
      )
    }
  ];

  const handleItemAction = (menuItem) => {
    setFormType(menuItem.action);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormType(null);
  };

  if (!checkOrganizationPermission(PERMISSIONS.FUEL_SALES_SHIFT_CREATE)) {
    return null;
  }

  return (
    <React.Fragment>
      <Dialog 
        maxWidth="lg" 
        scroll={belowLargeScreen ? 'body' : 'paper'} 
        fullWidth 
        fullScreen={belowLargeScreen} 
        open={openDialog}
      >
        {formType === 'beta' ? (
          <SaleShiftForm2 setOpenDialog={handleCloseDialog} />
        ) : formType === 'current' ? (
          <SaleShiftForm setOpenDialog={handleCloseDialog} />
        ) : null}
      </Dialog>
      
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {formType && (
          <Chip 
            label={formType === 'beta' ? 'Beta' : 'Standard'} 
            size="small" 
            color={formType === 'beta' ? 'primary' : 'success'}
            sx={{ height: 24 }}
          />
        )}
        
        <JumboDdMenu
          icon={
            <Tooltip title='New Sales Shift'>
              <AddOutlined/>
            </Tooltip>
          }
          menuItems={menuItems}
          onClickCallback={handleItemAction}
          sx={{ 
            '& .MuiButton-root': { 
              color: formType === 'beta' ? 'primary.main' : formType === 'current' ? 'success.main' : 'inherit' 
            }
          }}
        />
      </Box>
    </React.Fragment>
  );
};

export default SalesShiftsActionTail;