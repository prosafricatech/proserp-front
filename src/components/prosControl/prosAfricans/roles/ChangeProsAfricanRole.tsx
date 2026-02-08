import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import { LoadingButton } from '@mui/lab';
import { Button, Checkbox, LinearProgress, Box } from '@mui/material';
import { useSnackbar } from 'notistack';
import React, { useState } from 'react'
import prosAfricansServices from '../prosAfricansServices';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PROS_CONTROL_PERMISSIONS } from '@/utilities/constants/prosControlPermissions';
import UnauthorizedAccess from '@/shared/Information/UnauthorizedAccess';

interface Role {
  id: number;
  name: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  roles: Role[];
}

interface ChangeProsAfricanRoleProps {
  user: User;
}

function ChangeProsAfricanRole({ user }: ChangeProsAfricanRoleProps) {
  const { checkPermission } = useJumboAuth();
  const [userIsNotTouched, setUserIsNotTouched] = useState(true);
  const [selectedRoles, setSelectedRoles] = useState<number[]>(user.roles.map(role => role.id));
  const { hideDialog } = useJumboDialog();
  const { enqueueSnackbar } = useSnackbar(); 
  const queryClient = useQueryClient();
  
  const { data: prosAfricansRoles = [], isLoading } = useQuery<Role[]>({
    queryKey: ['prosAfricansRoles'],
    queryFn: prosAfricansServices.roles
  });

  const saveUserRoles = useMutation({
    mutationFn: () => prosAfricansServices.saveUserRoles(user, selectedRoles),
    onSuccess: (data) => {
      hideDialog();
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['prosAfricans'] });
    },
    onError: (error: any) => {
      enqueueSnackbar(error.response?.data?.message, { variant: 'error' });
    }
  });

  if (!checkPermission(PROS_CONTROL_PERMISSIONS.PROSAFRICANS_MANAGE)) {
    return <UnauthorizedAccess/>;
  }

  if (isLoading) {
    return <LinearProgress/>;
  }

  const handleRoleChange = (e: React.ChangeEvent<HTMLInputElement>, roleId: number) => {
    setUserIsNotTouched(false);
    if (e.target.checked) {
      setSelectedRoles(prev => [...prev, roleId]);
    } else {
      setSelectedRoles(prev => prev.filter(id => id !== roleId));
    }
  };

  return (
    <>
      {
        prosAfricansRoles.map((role) => {
          return (
            <Box component="span" key={role.id} sx={{ display: 'block', mb: 1 }}>
              <Checkbox
                defaultChecked={user.roles.some(userRole => userRole.id === role.id)}
                value={role.id} 
                onChange={(e) => handleRoleChange(e, role.id)}
              />
              {role.name}
            </Box>
          );
        })
      }
      <Box display={'flex'} justifyContent={'flex-end'} mt={2}>
        <LoadingButton 
          disabled={userIsNotTouched} 
          loading={saveUserRoles.isPending} 
          onClick={() => saveUserRoles.mutate()} 
          size='small' 
          variant='contained' 
          color='primary'
          sx={{ mr: 1 }}
        >
          Save
        </LoadingButton>
        <Button size='small' onClick={hideDialog}>Cancel</Button>
      </Box>
    </>
  );
}

export default ChangeProsAfricanRole;