import { Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';
import { CloseOutlined } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import { Alert, Autocomplete, Chip, Collapse, FormControl, FormControlLabel, FormHelperText, Grid, IconButton, LinearProgress, Radio, RadioGroup, TextField, Button } from '@mui/material';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from "yup";
import { yupResolver } from '@hookform/resolvers/yup';
import supportServices from '../support-services';
import { useQuery, useMutation } from '@tanstack/react-query';
import organizationServices from '@/components/organizations/organizationServices';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { PROS_CONTROL_PERMISSIONS } from '@/utilities/constants/prosControlPermissions';

interface OrganizationOption {
  id: string;
  name: string;
}

interface DatabaseFormData {
  databases: OrganizationOption[];
  action: string;
  password: string;
}

interface DatabaseActionRequest extends DatabaseFormData {
  password: string;
}

function DatabaseActions() {
    const { data: organizations = [], isLoading } = useQuery<OrganizationOption[]>({
      queryKey: ['organizationOptions'],
      queryFn: organizationServices.getOptions
    });
    
    const { checkPermission } = useJumboAuth();
    const [migrationResponse, setMigrationResponse] = useState('');
    const [alertSeverity, setAlertSeverity] = useState<'success' | 'error'>('success');
    const [alertOpen, setAlertOpen] = useState(false);
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedData, setSelectedData] = useState<DatabaseFormData | null>(null);
    const [isLoadingSubmit, setIsLoadingSubmit] = useState(false);

    const validationSchema = yup.object({
        databases: yup
            .array()
            .required('Please select at least one database')
            .test('notEmpty', 'Please select at least one database', (value) => {
                return value && value.length > 0;
            }).typeError('Please select at least one database'),
        action: yup
            .string()
            .required('Database action is required'),
        password: yup
            .string()
            .test('required-if-dialog-open', 'Please enter your password to confirm action', function (value) {
                if (openDialog && !value) {
                    return false;
                }
                return true;
        }),
    });

    const { handleSubmit, setValue, watch, trigger, getValues, formState: { errors } } = useForm<DatabaseFormData>({
        resolver: yupResolver(validationSchema) as any,
        defaultValues: {
            databases: [],
            action: '',
            password: ''
        }
    });

    const runMigration = useMutation({
      mutationFn: (data: DatabaseActionRequest) => supportServices.runDatabaseActions(data),
      onSuccess: (data) => {
          if (data?.message) {
              setMigrationResponse(data.message);
              setAlertOpen(true);
          }
          setAlertSeverity('success');
          setIsLoadingSubmit(false);
      },
      onError: (error: any) => {
          setMigrationResponse(error?.response?.data?.message || 'Something went wrong');
          setAlertOpen(true);
          setAlertSeverity('error');
          setIsLoadingSubmit(false);
      }
    });

    const onSubmit = async (data: DatabaseFormData) => {
        setSelectedData(data);
        setOpenDialog(true);
    };

    const handleConfirm = async () => {
        const isValid = await trigger();
        
        if (!isValid) {
            return;
        }
    
        setIsLoadingSubmit(true);
        setOpenDialog(false);

        const passwordValue = getValues('password');
        if (selectedData) {
          runMigration.mutate({ ...selectedData, password: passwordValue });
        }

        setValue('password', '');
        setIsLoadingSubmit(false);
    };

    if (isLoading) {
        return <LinearProgress />;
    }

    const databaseOptions: OrganizationOption[] = [
      { id: 'core', name: 'Core Database' }, 
      { id: 'organizations', name: 'Organization Databases' }, 
      ...organizations
    ];

    const currentDatabases = watch('databases');
    const currentAction = watch('action');
    const currentPassword = watch('password');

    return (
        <>
            <form onSubmit={handleSubmit(onSubmit)}>
                <Grid container spacing={2} padding={2}>
                    <Grid size={12}>
                        <Autocomplete
                            multiple
                            getOptionLabel={(option: OrganizationOption) => option.name}
                            isOptionEqualToValue={(option: OrganizationOption, value: OrganizationOption) => option.id === value.id}
                            value={currentDatabases}
                            options={databaseOptions}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    size="small"
                                    fullWidth
                                    label="Select Database"
                                    error={!!errors.databases}
                                    helperText={errors.databases?.message}
                                />
                            )}
                            renderTags={(tagValue, getTagProps) =>
                                tagValue.map((option, index) => {
                                    const { key, ...restProps } = getTagProps({ index });
                                    return <Chip {...restProps} key={option.id + "-" + key} label={option.name} />;
                                })
                            }
                            onChange={(event, newValue: OrganizationOption[]) => {
                                const coreDB = newValue.find(db => db.id === 'core');
                                const allOrganizations = newValue.find(db => db.id === 'organizations');
                                let databases = newValue;
                                if (coreDB) {
                                    databases = [coreDB];
                                } else if (allOrganizations) {
                                    databases = [allOrganizations];
                                }
                                setValue('databases', databases.length > 0 ? databases : [], { shouldValidate: true, shouldDirty: true });
                            }}
                        />
                    </Grid>
                    <Grid size={{xs: 12, md: 11}}>
                        <FormControl component="fieldset" error={!!errors.action}>
                            <RadioGroup
                                row
                                value={currentAction}
                                onChange={(e) => {
                                    setValue('action', e.target.value, { shouldValidate: true, shouldDirty: true });
                                }}
                            >
                                {checkPermission([PROS_CONTROL_PERMISSIONS.DATABASE_MIGRATE]) && (
                                    <>
                                        <FormControlLabel value="up" control={<Radio />} label="Migrate:Up" />
                                        <FormControlLabel value="down" control={<Radio />} label="Migrate:Down" />
                                        <FormControlLabel value="removeTrashed" control={<Radio />} label="Database:RemoveTrashed" />
                                    </>
                                )}
                                {checkPermission(PROS_CONTROL_PERMISSIONS.DATABASE_REFRESH) && watch('databases').length > 0 && (
                                    <>
                                        {!watch('databases').find(database => database.id === 'core') &&
                                            <FormControlLabel value="refresh" control={<Radio />} label="Migrate:Refresh" />}
                                        {watch('databases').find(database => database.id === 'core') &&
                                            <FormControlLabel value="constantsReseed" control={<Radio />} label="Constants:Reseed" />}
                                    </>
                                )}
                                {checkPermission(PROS_CONTROL_PERMISSIONS.DATABASE_RUN_SCRIPTS) &&
                                    <FormControlLabel value="runScripts" control={<Radio />} label="Run Scripts" />}
                            </RadioGroup>
                            <FormHelperText error>{errors.action?.message}</FormHelperText>
                        </FormControl>
                    </Grid>
                    <Grid size={{xs: 12, md: 1}} textAlign={'end'}>
                        <LoadingButton 
                          type="submit" 
                          variant="contained" 
                          loading={runMigration.isPending || isLoadingSubmit} 
                          size="small"
                        >
                            Execute
                        </LoadingButton>
                    </Grid>
                </Grid>

                <Collapse in={alertOpen}>
                    <Alert
                        severity={alertSeverity}
                        variant="filled"
                        action={
                            <IconButton
                                aria-label="close"
                                color="inherit"
                                size="small"
                                onClick={() => setAlertOpen(false)}
                            >
                                <CloseOutlined fontSize="inherit" />
                            </IconButton>
                        }
                        sx={{ mb: 2 }}
                    >
                        {migrationResponse}
                    </Alert>
                </Collapse>
            </form>

            <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ textAlign: "center" }}>
                    <Typography
                        component="span"
                        fontWeight="bold"
                        sx={{ color: 'red', fontSize: '1.2rem' }}
                    >
                        {
                            selectedData?.action === "up" ? "Migrate:Up?" :
                            selectedData?.action === "down" ? "Migrate:Down?" :
                            selectedData?.action === "refresh" ? "Migrate:Refresh?" :
                            selectedData?.action === "constantsReseed" ? "Constants:Reseed?" :
                            selectedData?.action === "runScripts" ? "Run Scripts?" :
                            selectedData?.action === "removeTrashed" ? "Database:RemoveTrashed?" :
                            "Unknown Action"
                        }
                    </Typography> 

                    <Typography variant="body1" mt={1}>
                       Please enter your password below to confirm
                    </Typography>
                </DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        type="password"
                        label="Enter Password"
                        value={currentPassword}
                        onChange={(e) => {
                            setValue('password', e.target.value, { shouldValidate: true, shouldDirty: true });
                        }}
                        error={!!errors.password}
                        helperText={errors.password?.message}
                        size="small"
                        margin="dense"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
                    <Button onClick={handleConfirm} variant="contained">Confirm</Button>
                </DialogActions>
            </Dialog>
        </>
    );
}

export default DatabaseActions;