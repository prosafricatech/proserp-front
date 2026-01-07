import { Button, DialogActions, DialogContent, DialogTitle, Tab, Tabs, Typography } from '@mui/material';
import React, { createContext, useContext, useMemo, useState } from 'react';
import { useProjectProfile } from '../ProjectProfileProvider';
import * as yup from 'yup';
import dayjs from 'dayjs';
import DescriptionTab from './tab/DescriptionTab';
import TaskProgress from './tab/taskProgress/TaskProgress';
import TaskProgressRow from './tab/taskProgress/TaskProgressRow';
import { useSnackbar } from 'notistack';
import { LoadingButton } from '@mui/lab';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import projectsServices from '../../project-services';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const UpdateFormContext = createContext();
export const useUpdateFormContext = () => useContext(UpdateFormContext);

function UpdatesForm({ setOpenDialog, update }) {
    const { project } = useProjectProfile();
    const [activeTab, setActiveTab] = useState(0);
    const [descriptionContent, setDescriptionContent] = useState(update && JSON.parse(update.description)[0]);
    const queryClient = useQueryClient();
    const { enqueueSnackbar } = useSnackbar();
    const [taskProgressItems, setTaskProgressItems] = useState(update?.task_executions ?
        update.task_executions?.map(task_execution => ({
        ...task_execution,
        project_task_id: task_execution.task?.id, 
    })) : []);

    const { mutate: addProjectUpdates, isPending } = useMutation({
        mutationFn: projectsServices.addProjectUpdates,
        onSuccess: (data) => {
            setOpenDialog(false);
            enqueueSnackbar(data.message, { variant: 'success' });
            queryClient.invalidateQueries({queryKey: ['projectUpdates']});
        },
        onError: (error) => {
            enqueueSnackbar(error.response.data.message, {
                variant: 'error',
            });
        },
    });

    const { mutate: updateProjectUpdates, isPending: isEditUpdate } = useMutation({
        mutationFn: projectsServices.updateProjectUpdates,
        onSuccess: (data) => {
            setOpenDialog(false);
            enqueueSnackbar(data.message, { variant: 'success' });
            queryClient.invalidateQueries({queryKey: ['projectUpdates']});
        },
        onError: (error) => {
            enqueueSnackbar(error.response.data.message, {
                variant: 'error',
            });
        },
    });

    const validationSchema = yup.object({
        update_date: yup.date().required('Update Date is required').typeError('Update Date is required'),
    });

    const { handleSubmit } = useForm({
        resolver: yupResolver(validationSchema),
        defaultValues: {
            id: update?.id,
            project_id: project.id,
            update_date: dayjs(),
            description: update?.description,
            tasks_executions: update ? update.tasks_executions : [],
        },
    });

    const saveMutation = useMemo(() => {
        return update ? updateProjectUpdates : addProjectUpdates;
    }, [addProjectUpdates, updateProjectUpdates, update]);

    const onSubmit = (formData) => {
        formData.description = [descriptionContent];
        formData.tasks_executions = taskProgressItems;
        saveMutation(formData);
    };

    return (
        <UpdateFormContext.Provider value={{ taskProgressItems, setTaskProgressItems, activeTab }}>
            <Typography textAlign={'center'} variant='h4' paddingTop={1}>
                {update ? `Edit Project Update` : `New Project Update`}
            </Typography>
            <DialogTitle>
                <Tabs
                    value={activeTab}
                    onChange={(e, newValue) => setActiveTab(newValue)}
                    variant="scrollable"
                    scrollButtons="auto"
                    allowScrollButtonsMobile
                >
                    <Tab label="Description" />
                    <Tab label="Tasks Progress" />
                </Tabs>
            </DialogTitle>
            <DialogContent>
                {activeTab === 0 && (
                    <DescriptionTab
                        descriptionContent={descriptionContent}
                        setDescriptionContent={setDescriptionContent}
                        update={update}
                    />
                )}
                {activeTab === 1 && (
                    <>
                        <TaskProgress update={update} />
                        {taskProgressItems.map((item, index) => (
                            <TaskProgressRow key={index} index={index} taskProgressItem={item} />
                        ))}
                    </>
                )}
            </DialogContent>
            <DialogActions>
                <Button size="small" onClick={() => setOpenDialog(false)}>
                    Cancel
                </Button>
                <LoadingButton
                    type="submit"
                    onClick={handleSubmit((data) => onSubmit(data))}
                    variant="contained"
                    size="small"
                    sx={{ display: 'flex' }}
                    loading={isPending || isEditUpdate}
                >
                    Submit
                </LoadingButton>
            </DialogActions>
        </UpdateFormContext.Provider>
    );
}

export default UpdatesForm;