'use client';
import { JumboDdMenu } from '@jumbo/components';
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import {
  DeleteOutlined,
  EditOutlined,
  MoreHorizOutlined,
  VisibilityOutlined,
} from '@mui/icons-material';
import { Dialog, Tooltip, useMediaQuery } from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { useState } from 'react';
import projectsServices from '../../../project-services';
import { useProjectProfile } from '../../ProjectProfileProvider';
import TasksForm from './TasksForm';
import TaskView from './TaskView';

const TasksItemAction = ({ task, activity }) => {
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const { showDialog, hideDialog } = useJumboDialog();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { project } = useProjectProfile();

  //Screen handling constants
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  // React Query v5 syntax for useMutation
  const { mutate: deleteTask } = useMutation({
    mutationFn: projectsServices.deleteTask,
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ['projectTimelineActivities', project?.id],
      });
      enqueueSnackbar(data.message, {
        variant: 'success',
      });
    },
    onError: (error) => {
      enqueueSnackbar(error?.response?.data.message, { variant: 'error' });
    },
  });

  const menuItems = [
    { icon: <VisibilityOutlined />, title: 'View', action: 'view' },
    { icon: <EditOutlined />, title: 'Edit', action: 'edit' },
    {
      icon: <DeleteOutlined color='error' />,
      title: 'Delete',
      action: 'delete',
    },
  ];

  const handleItemAction = (menuItem) => {
    switch (menuItem.action) {
      case 'view':
        setOpenViewDialog(true);
        break;
      case 'edit':
        setOpenEditDialog(true);
        break;
      case 'delete':
        showDialog({
          title: 'Confirm Delete',
          content: 'Are you sure you want to delete this Task?',
          onYes: () => {
            hideDialog();
            deleteTask(task.id);
          },
          onNo: () => hideDialog(),
          variant: 'confirm',
        });
        break;
      default:
        break;
    }
  };

  return (
    <>
      <Dialog
        open={openEditDialog || openViewDialog}
        fullWidth
        fullScreen={belowLargeScreen}
        maxWidth={openEditDialog ? 'md' : 'lg'}
        scroll={belowLargeScreen ? 'body' : 'paper'}
      >
        {openEditDialog && (
          <TasksForm
            task={task}
            activity={activity}
            setOpenDialog={setOpenEditDialog}
          />
        )}
        {openViewDialog && (
          <TaskView
            setOpenDialog={setOpenViewDialog}
            task={task}
            activity={activity}
          />
        )}
      </Dialog>
      <JumboDdMenu
        icon={
          <Tooltip title='Actions'>
            <MoreHorizOutlined />
          </Tooltip>
        }
        menuItems={menuItems}
        onClickCallback={handleItemAction}
      />
    </>
  );
};

export default TasksItemAction;
