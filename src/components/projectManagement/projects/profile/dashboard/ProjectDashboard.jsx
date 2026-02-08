'use client'

import { Dialog, Grid, LinearProgress, Tooltip } from '@mui/material'
import React, { useEffect, useState } from 'react'
import { useProjectProfile } from '../ProjectProfileProvider';
import ProgressBullet from './ProgressBullet';
import BudgetBullet from './BudgetBullet';
import { EditOutlined, MoreHorizOutlined } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import projectsServices from '../../project-services';
import { JumboDdMenu } from '@jumbo/components';
import ProjectFormDialog from '../../ProjectFormDialog';

const EditProject = ({ project, setOpenEditDialog }) => {
  const {
    data: projectData,
    isLoading,
    refetch: reFetchProjectAfterEdit,
  } = useQuery({
    queryKey: ['showProject', { id: project.id }],
    queryFn: projectsServices.showProject,
  });

  if (isLoading) {
    return <LinearProgress />;
  }

  return (
    <ProjectFormDialog
      reFetchProjectAfterEdit={reFetchProjectAfterEdit}
      project={projectData}
      setOpenDialog={setOpenEditDialog}
    />
  );
};

function ProjectDashboard() {
  const { project, isDashboardTab, setIsDashboardTab, reFetchProject } =
  useProjectProfile();
  const [openEditDialog, setOpenEditDialog] = useState(false);

  const menuItems = [{ icon: <EditOutlined />, title: 'Edit', action: 'edit' }];

  const handleItemAction = (menuItem) => {
    switch (menuItem.action) {
      case 'edit':
        setOpenEditDialog(true);
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    reFetchProject();
    setIsDashboardTab(true);
  }, [isDashboardTab, reFetchProject, setIsDashboardTab]);

  return (
    <>
      <Grid container width={'100%'}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <ProgressBullet />
          <BudgetBullet />
        </Grid>

        <Grid size={{ xs: 12 }} textAlign="end">
          <JumboDdMenu
            icon={
              <Tooltip title="Actions">
                <MoreHorizOutlined />
              </Tooltip>
            }
            menuItems={menuItems}
            onClickCallback={handleItemAction}
          />
        </Grid>
      </Grid>

      <Dialog
        open={openEditDialog}
        scroll="paper"
        fullWidth
        maxWidth="md"
      >
        <EditProject project={project} setOpenEditDialog={setOpenEditDialog} />
      </Dialog>
    </>
  );
}

export default ProjectDashboard;
