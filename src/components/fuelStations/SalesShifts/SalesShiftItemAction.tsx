import React from 'react';
import { IconButton, Tooltip, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import { MoreVert, Edit, Delete, Visibility } from '@mui/icons-material';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { SalesShift } from './SalesShiftType';

interface SalesShiftItemActionProps {
  salesShift: SalesShift;
}

const SalesShiftItemAction: React.FC<SalesShiftItemActionProps> = ({ salesShift }) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const { checkOrganizationPermission } = useJumboAuth();
  
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    handleClose();
  };

  const handleDelete = () => {
    handleClose();
  };

  const handleView = () => {
    handleClose();
  };

  return (
    <>
      <Tooltip title="Actions">
        <IconButton
          size="small"
          onClick={handleClick}
        >
          <MoreVert />
        </IconButton>
      </Tooltip>
      
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {/* View Action - Always available */}
        <MenuItem onClick={handleView}>
          <ListItemIcon>
            <Visibility fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>

        {/* Edit Action - Only if user has permission */}
        {checkOrganizationPermission(PERMISSIONS. FUEL_SALES_SHIFT_UPDATE) && (
          <MenuItem onClick={handleEdit}>
            <ListItemIcon>
              <Edit fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit</ListItemText>
          </MenuItem>
        )}

        {/* Delete Action - Only if user has permission */}
        {checkOrganizationPermission(PERMISSIONS. FUEL_SALES_SHIFT_DELETE) && (
          <MenuItem onClick={handleDelete}>
            <ListItemIcon>
              <Delete fontSize="small" />
            </ListItemIcon>
            <ListItemText>Delete</ListItemText>
          </MenuItem>
        )}
      </Menu>
    </>
  );
};

export default SalesShiftItemAction;