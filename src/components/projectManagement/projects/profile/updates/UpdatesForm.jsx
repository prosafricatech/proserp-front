import {
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  Tab,
  Tabs,
  Typography
} from '@mui/material';
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState
} from 'react';
import { useProjectProfile } from '../ProjectProfileProvider';
import * as yup from 'yup';
import dayjs from 'dayjs';
import DescriptionTab from './tab/DescriptionTab';
import TaskProgress from './tab/taskProgress/TaskProgress';
import TaskProgressRow from './tab/taskProgress/TaskProgressRow';
import { LoadingButton } from '@mui/lab';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import projectsServices from '../../project-services';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const UpdateFormContext = createContext();
export const useUpdateFormContext = () => useContext(UpdateFormContext);

function UpdatesForm({ setOpenDialog, update, setIsUpdateFormOpen = () => {} }) {
  const { project } = useProjectProfile();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState(0);
  const [descriptionContent, setDescriptionContent] = useState(
    update ? JSON.parse(update.description)[0] : null
  );

  const [taskProgressItems, setTaskProgressItems] = useState(
    update?.task_executions
      ? update.task_executions.map(te => ({
          ...te,
          project_task_id: te.task?.id,
        }))
      : []
  );

  const [isSaving, setIsSaving] = useState(false);

  const formIdRef = useRef(update?.id || null);
  const isAutoSavingRef = useRef(false);
  const hasPendingAutoSaveRef = useRef(false);
  const lastChangeAtRef = useRef(null);
  const lastSnapshotRef = useRef(null);

  const AUTO_SAVE_INTERVAL = 60 * 1000;
  const AUTO_SAVE_TICK = 1000;

  const addMutation = useMutation({
    mutationFn: projectsServices.addProjectUpdates,
    onSuccess: data => {
      if (data?.id) {
        formIdRef.current = data.id;
      }
      queryClient.invalidateQueries({ queryKey: ['projectUpdates'] });
    }
  });

  const updateMutation = useMutation({
    mutationFn: projectsServices.updateProjectUpdates,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectUpdates'] });
    }
  });

  const validationSchema = yup.object({
    update_date: yup.date().required()
  });

  const { handleSubmit } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      id: update?.id,
      project_id: project.id,
      update_date: dayjs()
    }
  });

  const buildSnapshot = () =>
    JSON.stringify({
      descriptionContent,
      taskProgressItems
    });

  useEffect(() => {
    const snapshot = buildSnapshot();

    if (lastSnapshotRef.current === null) {
      lastSnapshotRef.current = snapshot;
      return;
    }

    if (snapshot !== lastSnapshotRef.current) {
      lastSnapshotRef.current = snapshot;

      if (!hasPendingAutoSaveRef.current) {
        hasPendingAutoSaveRef.current = true;
        lastChangeAtRef.current = Date.now();
      }
    }
  }, [descriptionContent, taskProgressItems]);

  useEffect(() => {
    const interval = setInterval(async () => {
      if (!hasPendingAutoSaveRef.current) return;
      if (!lastChangeAtRef.current) return;
      if (isAutoSavingRef.current) return;

      const elapsed = Date.now() - lastChangeAtRef.current;
      if (elapsed < AUTO_SAVE_INTERVAL) return;

      isAutoSavingRef.current = true;
      setIsSaving(true);

      try {
        const payload = {
          id: formIdRef.current,
          project_id: project.id,
          description: [descriptionContent],
          tasks_executions: taskProgressItems,
          update_date: dayjs()
        };

        if (!formIdRef.current) {
          const response = await projectsServices.addProjectUpdates(payload);
          if (response?.id) {
            formIdRef.current = response.id;
          }
          queryClient.invalidateQueries({ queryKey: ['projectUpdates'] });
        } else {
          await projectsServices.updateProjectUpdates(payload);
          queryClient.invalidateQueries({ queryKey: ['projectUpdates'] });
        }
      } finally {
        isAutoSavingRef.current = false;
        setIsSaving(false);
        hasPendingAutoSaveRef.current = false;
        lastChangeAtRef.current = null;
      }
    }, AUTO_SAVE_TICK);

    return () => clearInterval(interval);
  }, [descriptionContent, taskProgressItems, project.id]);

  const onSubmit = () => {
    hasPendingAutoSaveRef.current = false;
    lastChangeAtRef.current = null;
    isAutoSavingRef.current = false;

    const payload = {
      id: formIdRef.current,
      project_id: project.id,
      description: [descriptionContent],
      tasks_executions: taskProgressItems,
      update_date: dayjs()
    };

    if (!formIdRef.current) {
      addMutation.mutate(payload);
    } else {
      updateMutation.mutate(payload);
    }

    setOpenDialog(false);
  };

  useEffect(() => {
    setIsUpdateFormOpen(true);
    return () => setIsUpdateFormOpen(false);
  }, []);

  return (
    <UpdateFormContext.Provider
      value={{
        taskProgressItems,
        setTaskProgressItems,
        activeTab
      }}
    >
      <Typography textAlign="center" variant="h4" paddingTop={1}>
        {update ? "Edit Project Update" : "New Project Update"}
      </Typography>

      {isSaving && (
        <Typography textAlign="center" color="primary">
          Saving...
        </Typography>
      )}

      <DialogTitle>
        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
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
              <TaskProgressRow
                key={index}
                index={index}
                taskProgressItem={item}
              />
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
          onClick={handleSubmit(onSubmit)}
          variant="contained"
          size="small"
          loading={addMutation.isPending || updateMutation.isPending}
        >
          Submit
        </LoadingButton>
      </DialogActions>
    </UpdateFormContext.Provider>
  );
}

export default UpdatesForm;