'use client'
import React, { useState } from 'react';
import {
  IconButton,
  Tooltip,
  useMediaQuery,
} from '@mui/material';
import VerifiedOutlinedIcon from '@mui/icons-material/VerifiedOutlined';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import VerifyUserFormDialog from './VerifyUserFormDialog';
import { User } from './UserManagementType';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

  interface UserManagementActionTailProps {
    user?: User; 
  }

  const UserManagementActionTail: React.FC<UserManagementActionTailProps> = ({ user }) => {
    const [openDialog, setOpenDialog] = useState(false);
    const { checkOrganizationPermission } = useJumboAuth();
    const dictionary = useDictionary();

  return (
    <>
      {checkOrganizationPermission(PERMISSIONS.USERS_MANAGE) && (
        <Tooltip title={dictionary.userManagement.list.labels.newCreateLabel}>
          <IconButton onClick={() => setOpenDialog(true)}>
            <VerifiedOutlinedIcon />
          </IconButton>
        </Tooltip>
      )}

      <VerifyUserFormDialog
        open={openDialog}
        setOpenDialog={setOpenDialog}
        user={user} 
      />
    </>
  );
};

export default UserManagementActionTail;
