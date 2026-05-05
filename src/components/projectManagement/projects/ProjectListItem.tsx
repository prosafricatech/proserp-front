import React from 'react';
import {
  Divider,
  Grid,
  Tooltip,
  Typography,
} from '@mui/material';
import ProjectListItemAction from './ProjectListItemAction';
import { Project } from './ProjectTypes';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/app/[lang]/contexts/LanguageContext';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { useQuery } from '@tanstack/react-query';
import projectsServices from './project-services';

interface ProjectItemProps {
  project: Project;
}

const ProjectListItem: React.FC<ProjectItemProps> = ({ project }) => {
  const router = useRouter();
  const lang = useLanguage();
  const { authUser } = useJumboAuth();
  const userId = authUser?.user?.id;
  const isAdministrator = authUser?.user?.organization_roles?.some(
    (role: { name?: string }) => role.name === 'Administrator'
  );

  const { data: projectUsersData } = useQuery({
    queryKey: ['projectUsersList', project.id],
    queryFn: () => projectsServices.projectUsersList({ project_id: project.id }),
    enabled: !isAdministrator,
  });

  const isUserInvolved =
    isAdministrator ||
    !projectUsersData ||
    projectUsersData?.data?.some((u: { id: string }) => u.id === userId);

  if (!isUserInvolved) return null;
  
  return (
    <>
      <Divider />
      <Grid
        container
        alignItems="center"
        columnSpacing={1}
        width={'100%'}
        px={2}
        py={1}
        sx={{
          cursor: 'pointer',
          '&:hover': {
            bgcolor: 'action.hover',
          },
        }}
      >
        <Grid size={{xs: 12, md: 4}}>
          <Tooltip title="Project Name" onClick={() => router.push(`/${lang}/projectManagement/projects/${project.id}`)}>
            <Typography variant="subtitle1" fontSize={14} noWrap>
              {project.name}
            </Typography>
          </Tooltip>
        </Grid>
        <Grid size={{xs: 12, md: 6}}>
          <Tooltip title="Description">
            <Typography variant="body2" color="text.secondary" noWrap>
              {project.description || '—'}
            </Typography>
          </Tooltip>
        </Grid>
        <Grid size={{xs: 12, md: 2}}textAlign="end">
          <ProjectListItemAction project={project} />
        </Grid>
      </Grid>
    </>
  );
};

export default ProjectListItem;
