import { useLanguage } from '@/app/[lang]/contexts/LanguageContext';
import { Divider, Grid, Tooltip, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import React from 'react';
import ProjectListItemAction from './ProjectListItemAction';
import { Project } from './ProjectTypes';

interface ProjectItemProps {
  project: Project;
}

const ProjectListItem: React.FC<ProjectItemProps> = ({ project }) => {
  const router = useRouter();
  const lang = useLanguage();

  return (
    <>
      <Divider />
      <Grid
        container
        alignItems='center'
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
        <Grid size={{ xs: 12, md: 4 }}>
          <Tooltip
            title='Project Name'
            onClick={() =>
              router.push(`/${lang}/projectManagement/projects/${project.id}`)
            }
          >
            <Typography variant='subtitle1' fontSize={14} noWrap>
              {project.name}
            </Typography>
          </Tooltip>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Tooltip title='Description'>
            <Typography variant='body2' color='text.secondary' noWrap>
              {project.description || '—'}
            </Typography>
          </Tooltip>
        </Grid>
        <Grid size={{ xs: 12, md: 2 }} textAlign='end'>
          <ProjectListItemAction project={project} />
        </Grid>
      </Grid>
    </>
  );
};

export default ProjectListItem;
