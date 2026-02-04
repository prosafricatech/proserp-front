'use client'

import React, { useState } from 'react';
import { LoadingButton } from '@mui/lab';
import { Button, Checkbox, LinearProgress, Dialog, DialogTitle, DialogContent, DialogActions, Grid } from '@mui/material';
import { Box } from '@mui/system';
import { useSnackbar } from 'notistack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import axios from '@/lib/services/config';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import UnauthorizedAccess from '@/shared/Information/UnauthorizedAccess';
import { Span } from '@jumbo/shared';
import { Organization, User } from '@/types/auth-types';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import organizationServices from '../../organizationServices';

interface Role {
  id: string;
  name: string;
}

interface ChangeUserRolesProps {
  setOpenEditDialog: (open: boolean) => void;
  openEditDialog: boolean;
  user: User;
  organization: Organization;
}

interface SaveRolesResponse {
  message: string;
}

export const ChangeUserRoles: React.FC<ChangeUserRolesProps> = ({ 
  setOpenEditDialog, 
  openEditDialog, 
  user, 
  organization 
}) => {
  const { checkOrganizationPermission } = useJumboAuth();
  const [userIsNotTouched, setUserIsNotTouched] = useState(true);
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const dictionary = useDictionary();
  const changeRolesDict = dictionary.organizations.profile.usersTab.changeRoles.dialog;

  const [selectedRoles, setSelectedRoles] = useState<string[]>(
    user.organization_roles?.map((role: Role) => role.id) || []
  );

  const { data: organizationRoles, isPending } = useQuery<Role[]>({
    queryKey: [`organizationRoles_${organization.id}`],
    queryFn: async () => {
      const response = await axios.get<Role[]>(`/api/organizations/${organization.id}/roles`);
      return response.data;
    }
  });

  const saveUserRoles = useMutation<SaveRolesResponse, Error, void>({
    mutationFn: async () => {
      if (userIsNotTouched) {
        throw new Error(changeRolesDict.validation.noChanges);
      }
      return await organizationServices.saveUserRoles(organization?.id, user?.id, selectedRoles);
    },
    onSuccess: (data) => {
      setOpenEditDialog(false);
      enqueueSnackbar(changeRolesDict.messages.success, { 
        variant: 'success' 
      });
      queryClient.invalidateQueries({ 
        queryKey: [`organizationUsers_${organization.id}`] 
      });
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      enqueueSnackbar(
        changeRolesDict.messages.error, 
        { variant: 'error' }
      );
    }
  });

  if (!checkOrganizationPermission(PERMISSIONS.USERS_MANAGE)) {
    return <UnauthorizedAccess />;
  }

  if (isPending || !organizationRoles) {
    return <LinearProgress />;
  }

  const handleRoleChange = (e: React.ChangeEvent<HTMLInputElement>, roleId: string) => {
    setUserIsNotTouched(false);
    if (e.target.checked) {
      setSelectedRoles([...selectedRoles, roleId]);
    } else {
      setSelectedRoles(selectedRoles.filter(id => id !== roleId));
    }
  };

  return (
    <Dialog 
      open={openEditDialog} 
      onClose={() => setOpenEditDialog(false)} 
      maxWidth="md" 
      fullWidth
    >
      <DialogTitle>
        {changeRolesDict.title.replace('{userName}', user.name)}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2}>
          {organizationRoles.map((role: Role) => (
            <Grid size={{xs: 4}} key={role.id}>
              <Span>
                <Checkbox
                  checked={selectedRoles.includes(role.id)}
                  onChange={(e) => handleRoleChange(e, role.id)}
                />
                {role.name}
              </Span>
            </Grid>
          ))}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Box display={'flex'} justifyContent={'flex-end'}>
          <LoadingButton 
            disabled={userIsNotTouched} 
            loading={saveUserRoles.isPending} 
            onClick={() => saveUserRoles.mutate()} 
            size='small' 
            variant='contained' 
            color='primary'
          >
            {changeRolesDict.saveButton}
          </LoadingButton>
          <Button 
            size='small' 
            onClick={() => setOpenEditDialog(false)}
          >
            {changeRolesDict.cancelButton}
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};