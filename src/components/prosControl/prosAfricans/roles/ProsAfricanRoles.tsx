import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import { ExpandMoreOutlined } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import { Accordion, AccordionDetails, AccordionSummary, Box, Button, Checkbox, Divider, Grid, LinearProgress, Typography } from '@mui/material';
import React, { useState } from 'react'
import prosAfricansServices from '../prosAfricansServices';
import NewProsAfricanRoleForm from './NewProsAfricanRoleForm';
import { useSnackbar } from 'notistack';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PROS_CONTROL_PERMISSIONS } from '@/utilities/constants/prosControlPermissions';
import axios from 'axios';

interface Permission {
  id: number;
  name: string;
}

interface Role {
  id: number;
  name: string;
  description?: string;
  pros_permissions: Permission[];
}

interface RoleAccordionProps {
  role: Role;
}

const ProsAfricansRoles = () => {
  const { checkPermission } = useJumboAuth();
  const { showDialog, hideDialog } = useJumboDialog();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  const { data: permissions = [], isLoading: isLoadingPermissions } = useQuery<Permission[]>({
    queryKey: ['prosAfricansPermissionsOptions'],
    queryFn: prosAfricansServices.permissionOptions
  });

  const { data: roles = [], isLoading: isLoadingRoles, isFetching: isFetchingRoles } = useQuery<Role[]>({
    queryKey: ['prosAfricansRoles'],
    queryFn: prosAfricansServices.roles
  });

  if (isLoadingRoles || isLoadingPermissions || isFetchingRoles) {
    return <LinearProgress/>;
  }

  const deleteRole = (role: Role) => {
    showDialog({
      variant: 'confirm',
      title: `Delete ${role.name} role?`,
      content: `All users with this role won't have it anymore`,
      onYes: async() => {
        hideDialog();
        try {
          const res = await axios.delete(`/prosafricans/${role.id}/roles`, { data: { role_id: role.id } });
          enqueueSnackbar(res.data.message, {
            variant: 'success'
          });
          queryClient.invalidateQueries({ queryKey: ['prosAfricansRoles'] });
        } catch (err: any) {
          if (err?.response?.data?.message) {
            enqueueSnackbar(err.response.data.message, {
              variant: 'error'
            });
          }
        }
      }
    });
  };

  const RoleAccordion: React.FC<RoleAccordionProps> = ({ role }) => {
    const [checkedPermissions, setCheckedPermissions] = useState<number[]>(role.pros_permissions.map(permission => permission.id));
    const [isSavingRole, setIsSavingRole] = useState(false);
    const [roleIsNotTouched, setRoleIsNotTouched] = useState(true);

    const saveRole = async (role: Role) => {
      setIsSavingRole(true);
      try {
        const response = await axios.put(`/prosafricans/${role.id}/roles`, {
          pros_permission_ids: checkedPermissions
        });
        enqueueSnackbar(response.data.message, {
          variant: 'success'
        });
        queryClient.invalidateQueries({ queryKey: ['prosAfricansRoles'] });
      } catch (error: any) {
        if (error?.response?.data?.message) {
          enqueueSnackbar(error.response.data.message, {
            variant: 'error'
          });
        }
      } finally {
        setIsSavingRole(false);
      }
    };

    const handlePermissionChange = (e: React.ChangeEvent<HTMLInputElement>, permissionId: number) => {
      setRoleIsNotTouched(false);
      if (e.target.checked) {
        setCheckedPermissions(prev => [...prev, permissionId]);
      } else {
        setCheckedPermissions(prev => prev.filter(id => id !== permissionId));
      }
    };

    return (
      <Grid size={12}>
        <Accordion>
          <AccordionSummary
            expandIcon={<ExpandMoreOutlined/>}
            aria-controls="panel1a-content"
            id="panel1a-header"
          >
            <Typography variant='h4'>
              {role.name}
            </Typography>
            {
              role.description && (<Typography ml={1} variant={'caption'}>- {role.description}</Typography>)
            }
          </AccordionSummary>
          <AccordionDetails>
            <Grid container>
              {
                permissions.map((permission) => {
                  return (
                    <Grid size={{xs: 12, md: 6, lg: 4}} key={permission.id}>
                      <Checkbox 
                        value={permission.id}
                        disabled={role.id === 1 || (role.id > 1 && !checkPermission(PROS_CONTROL_PERMISSIONS.ROLES_UPDATE))}
                        defaultChecked={role.pros_permissions?.some(obj => obj.id === permission.id)}
                        onChange={(e) => handlePermissionChange(e, permission.id)}
                      />{permission.name}
                    </Grid>
                  );
                })
              }
              {role.id > 1 && 
                <Grid size={12}>
                  <Divider />
                  <Box mt={1} display={'flex'} justifyContent={'flex-end'}>
                    {
                      checkPermission(PROS_CONTROL_PERMISSIONS.ROLES_UPDATE) &&
                      <LoadingButton 
                        disabled={roleIsNotTouched} 
                        loading={isSavingRole} 
                        onClick={() => saveRole(role)} 
                        size='small' 
                        variant='contained' 
                        color='primary'
                      >
                        Save
                      </LoadingButton>
                    }
                    {
                      checkPermission(PROS_CONTROL_PERMISSIONS.ROLES_ADD) && 
                      <Button 
                        sx={{ marginLeft: 0.5 }} 
                        onClick={() => deleteRole(role)} 
                        size='small' 
                        variant='contained' 
                        color='error'
                      >
                        Delete
                      </Button>
                    }
                  </Box>
                </Grid>
              }
            </Grid>
          </AccordionDetails>
        </Accordion>
      </Grid>
    );
  };

  return (
    <Grid mt={1} container rowSpacing={1} columnSpacing={2}>
      {
        checkPermission(PROS_CONTROL_PERMISSIONS.ROLES_ADD) &&
        <Grid size={12}>
          <NewProsAfricanRoleForm/>
        </Grid>
      }
      {
        roles.map((role) => {
          return (
            <RoleAccordion key={role.id} role={role}/>
          );
        })
      }
    </Grid>
  );
};

export default ProsAfricansRoles;