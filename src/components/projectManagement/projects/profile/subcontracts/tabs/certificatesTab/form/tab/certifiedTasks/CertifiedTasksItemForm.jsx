import React, { useEffect, useState } from 'react';
import { Autocomplete, Divider, Grid, IconButton, InputAdornment, LinearProgress, TextField, Tooltip } from '@mui/material';
import { useForm } from 'react-hook-form';
import { AddOutlined, CheckOutlined, DisabledByDefault } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import * as yup from 'yup';
import dayjs from 'dayjs'
import { yupResolver } from '@hookform/resolvers/yup';
import { Div } from '@jumbo/shared';
import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import projectsServices from '@/components/projectManagement/projects/project-services';
import { useProjectProfile } from '@/components/projectManagement/projects/profile/ProjectProfileProvider';
import { useQuery } from '@tanstack/react-query';

const CertifiedTasksItemForm= ({
  setClearFormKey,
  submitMainForm,
  submitItemForm,
  setSubmitItemForm,
  setIsDirty,
  index = -1,
  setShowForm = null,
  taskItem,
  tasksItems = [],
  CertificateDate,
  setTasksItems, 
  subContract,
  certificate
}) => {
    const { deliverable_groups, setFetchDeliverables, projectTimelineActivities, setFetchTimelineActivities} = useProjectProfile();
    const [isAdding, setIsAdding] = useState(false);
    const [isRetrievingDetails, setIsRetrievingDetails] = useState(false);
    const [unitToDisplay, setUnitToDisplay] = useState(taskItem && taskItem.unit_symbol);

    useEffect(() => {
        if (!deliverable_groups) {
            setFetchDeliverables(true);
        } else {
            setFetchDeliverables(false)
        }

        if (!projectTimelineActivities) {
            setFetchTimelineActivities(true);
        } else {
            setFetchTimelineActivities(false)
        }

    }, [projectTimelineActivities, deliverable_groups, setFetchDeliverables, setFetchTimelineActivities]);

    const validationSchema = yup.object({
        project_subcontract_task_id: yup
            .number()
            .required("Project Task is required")
            .typeError("Project Task is required"),
        certified_quantity: yup
            .number()
            .required("Quantity is required")
            .typeError("Quantity is required")

            // RULE 1: certified should not exceed un-certified units
            .test("min-certified", function (value) {
                const { response_uncertified_quantity } = this.parent;

                if (response_uncertified_quantity == null) return true;

                if (value > response_uncertified_quantity) {
                    return this.createError({
                        message: `Certified Quantity cannot exceed un-certified (${response_uncertified_quantity})`,
                    });
                }

                return true;
            })

            // RULE 2: certified ≤ executed
            .test("max-executed", function (value) {
                const { response_executed_quantity } = this.parent;

                if (response_executed_quantity == null) return true;

                if (value > response_executed_quantity) {
                    return this.createError({
                        message: `Certified Quantity cannot exceed executed quantity (${response_executed_quantity})`,
                    });
                }

                return true;
            }),
    });

    const { handleSubmit, setValue, formState: { errors, dirtyFields }, watch, reset } = useForm({
        resolver: yupResolver(validationSchema),
        defaultValues: {
            id: taskItem?.id,
            project_subcontract_task_id: taskItem?.project_subcontract_task_id,
            certified_quantity: taskItem?.certified_quantity,
            remarks: taskItem?.remarks,
            task: taskItem?.task,
            response_uncertified_quantity: taskItem?.response_uncertified_quantity,
            response_executed_quantity: taskItem?.response_executed_quantity,
            unit_symbol: taskItem && taskItem.unit_symbol,
        },
        context: { taskItem }
    });  

    useEffect(() => {
        setIsDirty(Object.keys(dirtyFields).length > 0);
    }, [dirtyFields, setIsDirty, watch]);

    const updateItems = async (formData) => {
        setIsAdding(true);

        if (index > -1) {
            const updatedItems = [...tasksItems];

            updatedItems[index] = {
                ...tasksItems[index],
                ...formData 
            };

            await setTasksItems(updatedItems);
            setClearFormKey(prevKey => prevKey + 1);

        } else {
            await setTasksItems(prevItems => [...prevItems, formData]);
            if (submitItemForm) submitMainForm();
            setSubmitItemForm(false);
            setClearFormKey(prevKey => prevKey + 1);
        }

        reset();
        setIsAdding(false);
        setShowForm && setShowForm(false);
    };

    const retrieveTaskDetails = async (taskId) => {
        setIsRetrievingDetails(true);
        const details =  await projectsServices.showSubcontractTaskDetails(taskId, CertificateDate)
        setValue('response_uncertified_quantity', details?.uncertified_quantity);
        setValue('response_executed_quantity', details?.executed_quantity);
        setIsRetrievingDetails(false);
    }

    useEffect(() => {
        if (submitItemForm) {
            handleSubmit(updateItems, () => {
                setSubmitItemForm(false);
            })();
        }
    }, [submitItemForm]);

    const { data: subContractTasks, isLoading } = useQuery({
        queryKey: ['subContractTasks', { id: certificate ? certificate.project_subcontract_id : subContract?.id }],
        queryFn: async () => projectsServices.getSubContractTasks(certificate ? certificate.project_subcontract_id : subContract?.id),
    });

    if (isAdding) {
        return <LinearProgress />;
    }

  return (
    <Grid container spacing={1} marginTop={0.5}>
        <Grid size={{xs: 12, md: 8}}>
            <Div sx={{ mt: 1 }}>
                {   isLoading ? 
                    <LinearProgress/>
                    :
                    <Autocomplete
                        options={subContractTasks || []}
                        loading={isLoading}
                        isOptionEqualToValue={(option, value) => option.id === value?.id}
                        getOptionLabel={(option) => option.project_task?.name || option.name}
                        defaultValue={taskItem?.task || null}
                        onChange={(e, newValue) => {
                            if (newValue) {
                                setUnitToDisplay(newValue.measurement_unit?.symbol);
                                setValue("task", newValue?.project_task);
                                setValue("project_subcontract_task_id", newValue.project_task_id, {
                                    shouldValidate: true,
                                    shouldDirty: true,
                                });

                                retrieveTaskDetails(newValue.project_task_id);
                            } else {
                                setUnitToDisplay(null);
                                setValue("task", null);
                                setValue("project_subcontract_task_id", null, {
                                    shouldValidate: true,
                                    shouldDirty: true,
                                });
                            }
                        }}
                        renderOption={(props, option) => (
                            <li {...props} key={option.id}>
                                {option.project_task?.name}
                            </li>
                        )}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Project Task"
                                size="small"
                                fullWidth
                                error={!!errors?.project_subcontract_task_id}
                                helperText={errors?.project_subcontract_task_id?.message}
                            />
                        )}
                    />
                }
            </Div>
        </Grid>

        <Grid size={{xs: 12, md: 4}}>
            <Div sx={{ mt: 1 }}>
                {isRetrievingDetails ? (
                    <LinearProgress />
                ) : (
                    <TextField
                        label="Quantity"
                        fullWidth
                        size="small"
                        defaultValue={watch(`certified_quantity`)}
                        InputProps={{
                            inputComponent: CommaSeparatedField,
                            endAdornment: (
                                <InputAdornment position="end">
                                    {unitToDisplay}
                                </InputAdornment>
                            ),
                        }}
                        error={!!errors?.certified_quantity}
                        helperText={errors?.certified_quantity?.message}
                        onChange={(e) => {
                            setValue('unit_symbol', unitToDisplay)
                            setValue(`certified_quantity`, e.target.value ? sanitizedNumber(e.target.value) : 0, {
                                shouldValidate: true,
                                shouldDirty: true,
                            });
                        }}
                    />
                )}
            </Div>
        </Grid>

        <Grid size={{xs: 12}}>
            <Div sx={{ mt: 1 }}>
                <TextField
                    size="small"
                    fullWidth
                    defaultValue={watch('remarks')}
                    label="Remarks"
                    error={!!errors.description}
                    helperText={errors.description?.message}
                    onChange={(e) => {
                        setValue('remarks', e.target.value, {
                            shouldValidate: true,
                            shouldDirty: true
                        });
                    }}
                />
            </Div>
        </Grid>

        <Grid size={12} textAlign={'end'}>
            <LoadingButton
                loading={false}
                variant='contained'
                type='submit'
                size='small'
                onClick={handleSubmit(updateItems)}
                sx={{ marginBottom: 0.5 }}
            >
                {taskItem ? (
                    <><CheckOutlined fontSize='small' /> Done</>
                ) : (
                    <><AddOutlined fontSize='small' /> Add</>
                )}
            </LoadingButton>
            {taskItem && setShowForm && (
                <Tooltip title='Close Edit'>
                    <IconButton size='small' onClick={() => setShowForm(false)}>
                        <DisabledByDefault fontSize='small' color='success' />
                    </IconButton>
                </Tooltip>
            )}
        </Grid>
    </Grid>
  );
};

export default CertifiedTasksItemForm;