import { Button, DialogActions, DialogContent, DialogTitle, Tab, Tabs, Typography } from '@mui/material';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
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

function UpdatesForm({ setOpenDialog, update, setIsUpdateFormOpen=() => {} }) {
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
    const [savedUpdateId, setSavedUpdateId] = useState(update?.id || null);

    const isAutoSavingRef = useRef(false);
    const hasPendingAutoSaveRef = useRef(false);
    const lastChangeAtRef = useRef(null);
    const hasMountedRef = useRef(false);
    const isInitializingAutoSaveRef = useRef(true);
    const hasUserInteractedRef = useRef(false);
    const hasQueuedAutoSaveCycleRef = useRef(false);
    const lastFormSnapshotRef = useRef(null);
    const AUTO_SAVE_DEBUG = true;
    const AUTO_SAVE_INTERVAL = 1 * 60 * 1000;
    const AUTO_SAVE_TICK = 1000;
    
    // Track removed task progress items
    const [removedTaskProgressItems, setRemovedTaskProgressItems] = useState([]);

    const { mutateAsync: addProjectUpdates, isPending } = useMutation({
        mutationFn: projectsServices.addProjectUpdates,
    });
    const { mutateAsync: updateProjectUpdates, isPending: isEditUpdate } = useMutation({
        mutationFn: projectsServices.updateProjectUpdates,
    });

    const validationSchema = yup.object({
        update_date: yup.date().required('Update Date is required').typeError('Update Date is required'),
    });

    const { handleSubmit, getValues, setValue } = useForm({
        resolver: yupResolver(validationSchema),
        defaultValues: {
            id: update?.id,
            project_id: project.id,
            update_date: dayjs(),
            description: update?.description,
            tasks_executions: update ? update.tasks_executions : [],
        },
    });

    const autoSaveDebug = useCallback((message, meta = {}) => {
        if (!AUTO_SAVE_DEBUG) return;
        console.log('[UpdatesForm][autosave]', message, meta);
    }, [AUTO_SAVE_DEBUG]);

    const toSnapshot = useCallback((value) => {
        try {
            return JSON.stringify(value ?? null);
        } catch {
            return null;
        }
    }, []);

    const markAutoSaveChange = useCallback(() => {
    if (!hasMountedRef.current) return;
    if (!hasUserInteractedRef.current) {
        autoSaveDebug('Change ignored (no user interaction yet)');
        return;
    }
    if (hasPendingAutoSaveRef.current) {
        hasQueuedAutoSaveCycleRef.current = true;
        autoSaveDebug('Change detected while countdown active (keeping existing countdown)');
        return;
    }
    hasPendingAutoSaveRef.current = true;
    lastChangeAtRef.current = Date.now();
    autoSaveDebug('Countdown started', {
        saveInMs: AUTO_SAVE_INTERVAL,
    });
    }, [AUTO_SAVE_INTERVAL, autoSaveDebug]);

    const markUserInteraction = useCallback(() => {
    if (!hasUserInteractedRef.current) {
        autoSaveDebug('User interaction detected (autosave can start tracking changes)');
    }
    hasUserInteractedRef.current = true;
    }, [autoSaveDebug]);

    const resetAutoSaveTracking = useCallback(() => {
    hasPendingAutoSaveRef.current = false;
    lastChangeAtRef.current = null;
    hasQueuedAutoSaveCycleRef.current = false;
    autoSaveDebug('Countdown reset/cleared');
    }, [autoSaveDebug]);

    // Unified snapshot watcher for all relevant state
    useEffect(() => {
        const formState = { descriptionContent, taskProgressItems, id: savedUpdateId };
        const nextSnapshot = toSnapshot(formState);
        if (isInitializingAutoSaveRef.current) return;

        if (lastFormSnapshotRef.current === null) {
            lastFormSnapshotRef.current = nextSnapshot;
            autoSaveDebug('Initial form snapshot captured');
            return;
        }

        if (lastFormSnapshotRef.current === nextSnapshot) return;

        lastFormSnapshotRef.current = nextSnapshot;
        markAutoSaveChange();
    }, [descriptionContent, taskProgressItems, savedUpdateId, toSnapshot, markAutoSaveChange, autoSaveDebug]);

    useEffect(() => {
        hasMountedRef.current = true;
        lastFormSnapshotRef.current = toSnapshot({ descriptionContent, taskProgressItems, id: savedUpdateId });
        const initTimer = setTimeout(() => {
            isInitializingAutoSaveRef.current = false;
        }, 0);
        return () => {
            clearTimeout(initTimer);
            isInitializingAutoSaveRef.current = true;
            lastFormSnapshotRef.current = null;
            resetAutoSaveTracking();
        };
    }, [toSnapshot, resetAutoSaveTracking, descriptionContent, taskProgressItems, savedUpdateId]);

    useEffect(() => {
        const interval = setInterval(async () => {
            if (!hasPendingAutoSaveRef.current) return;
            if (!lastChangeAtRef.current) return;
            if (isAutoSavingRef.current) return;

            const elapsed = Date.now() - lastChangeAtRef.current;
            if (elapsed < AUTO_SAVE_INTERVAL) return;

            const saveStartedAt = Date.now();
            isAutoSavingRef.current = true;
            autoSaveDebug('Autosave started', { elapsedMs: elapsed });

            try {
                // Compose formData for save
                const formData = {
                    id: savedUpdateId,
                    project_id: project.id,
                    update_date: dayjs(),
                    description: [descriptionContent],
                    tasks_executions: taskProgressItems,
                };
                // Dynamic mutation selection
                const isUpdateMutation = !!formData.id;
                let response;
                if (isUpdateMutation) {
                    response = await updateProjectUpdates(formData);
                } else {
                    response = await addProjectUpdates(formData);
                    const createdId = response?.id || response?.data?.id;
                    if (createdId) {
                        setSavedUpdateId(createdId);
                        setValue('id', createdId, { shouldValidate: false, shouldDirty: false });
                        autoSaveDebug('Created new update, future autosaves will use update mutation', { id: createdId });
                    }
                }
                queryClient.invalidateQueries({ queryKey: ['projectUpdates'] });
                autoSaveDebug('Autosave completed');
            } catch (error) {
                autoSaveDebug('Autosave failed', { error: error?.message || 'unknown error' });
            } finally {
                isAutoSavingRef.current = false;
                if (hasQueuedAutoSaveCycleRef.current) {
                    hasPendingAutoSaveRef.current = true;
                    lastChangeAtRef.current = Date.now();
                    hasQueuedAutoSaveCycleRef.current = false;
                    autoSaveDebug('Queued changes detected after autosave, starting new countdown journey', {
                        saveInMs: AUTO_SAVE_INTERVAL,
                    });
                    return;
                }
                if (!lastChangeAtRef.current || lastChangeAtRef.current <= saveStartedAt) {
                    resetAutoSaveTracking();
                }
            }
        }, AUTO_SAVE_TICK);
        return () => clearInterval(interval);
    }, [AUTO_SAVE_INTERVAL, AUTO_SAVE_TICK, savedUpdateId, descriptionContent, taskProgressItems, addProjectUpdates, updateProjectUpdates, setValue, autoSaveDebug, resetAutoSaveTracking, project.id, queryClient]);

    const onSubmit = (formData) => {
        const isUpdateMutation = !!savedUpdateId;
        const submitData = {
            ...formData,
            id: savedUpdateId,
            description: [descriptionContent],
            tasks_executions: taskProgressItems,
        };
        if (isUpdateMutation) {
            updateProjectUpdates(submitData);
        } else {
            addProjectUpdates(submitData);
        }
    };

    useEffect(() => {
      setIsUpdateFormOpen(true);
      return () => {
        setIsUpdateFormOpen(false);
      };
    }, []);

    return (
        <div onChangeCapture={markUserInteraction} onInputCapture={markUserInteraction}>
            <UpdateFormContext.Provider value={{ taskProgressItems, setTaskProgressItems, removedTaskProgressItems, setRemovedTaskProgressItems, activeTab }}>
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
                    <Button size="small" onClick={() => {setOpenDialog(false); setIsUpdateFormOpen(false);}}>
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
        </div>
    );
}

export default UpdatesForm;