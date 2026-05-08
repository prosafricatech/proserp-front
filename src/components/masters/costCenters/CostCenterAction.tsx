'use client'

import { EditOutlined, MoreHorizOutlined } from '@mui/icons-material';
import { Dialog, LinearProgress, Skeleton, Tooltip } from '@mui/material';
import { useSnackbar } from 'notistack';
import React, { useState } from 'react';
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import costCenterservices from './cost-center-services';
import CostCenterForm from './CostCenterForm';
import { JumboDdMenu } from '@jumbo/components';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MenuItemProps } from '@jumbo/types';
import { CostCenter } from './CostCenterType';

interface EditCostCenterProps {
  costCenterId: number;
  setOpenDialog: (open: boolean) => void;
}

function EditCostCenter({ costCenterId, setOpenDialog }: EditCostCenterProps) {
  const { data: costCenter, isFetching } = useQuery<CostCenter>({
    queryKey: ['cost-center', costCenterId],
    queryFn: () => costCenterservices.costCenterDetails(costCenterId),
  });

  if (isFetching) {
        return (
      <div style={{ width: '100%', padding: '16px' }}>
        <Skeleton variant="text" width={180} height={32} style={{ borderRadius: 4, marginLeft: 'auto' }} />
        <Skeleton variant="rectangular" width="100%" height={48} style={{ borderRadius: 4 }} />
        <Skeleton variant="rectangular" width="100%" height={32} style={{ borderRadius: 4 }} />
      </div>
    );
  }

  return (
    <CostCenterForm setOpenDialog={setOpenDialog} costCenter={costCenter} />
  );
}

interface CostCenterItemActionProps {
  costCenter: CostCenter;
}

const CostCenterItemAction = ({ costCenter }: CostCenterItemActionProps) => {
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const { showDialog, hideDialog } = useJumboDialog();

  const menuItems: MenuItemProps[] = [
    { 
      icon: <EditOutlined />, 
      title: 'Edit', 
      action: 'edit' 
    }
  ];

  const handleItemAction = (menuItem: MenuItemProps) => {
    switch (menuItem.action) {
      case 'edit':
        setOpenEditDialog(true);
        break;
      case 'delete':
        showDialog({
          title: 'Confirm Cost Center',
          content: 'Are you sure you want to delete this Cost Center?',
          onYes: () => { 
            hideDialog();
            // deleteCostCenter(costCenter.id);
          },
          onNo: () => hideDialog(),
          variant: 'confirm'
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
        maxWidth="sm" 
        onClose={() => setOpenEditDialog(false)}
      >
        <EditCostCenter 
          costCenterId={costCenter.id} 
          setOpenDialog={setOpenEditDialog} 
        />
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

export default CostCenterItemAction;