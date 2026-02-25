'use client'

import { createContext, useContext, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import projectsServices from '../project-services';
import { Skeleton } from '@mui/material';
import { Div } from '@jumbo/shared';
import { Stack } from '@mui/system';

const ProjectProfileContext = createContext({});

export const useProjectProfile = () => useContext(ProjectProfileContext);

function ProjectProfileProvider({ children }) {
  const params = useParams();
  const [isDashboardTab, setIsDashboardTab] = useState(false);
  const [extraValues, setExtraValues] = useState({});

  const { data: project, isLoading, refetch: reFetchProject } = useQuery({
    queryKey: ['showProject', { id: params.id }],
    queryFn: projectsServices.showProject,
  });
  
  // Use useCallback to memoize the update function
  const updateProjectProfile = useCallback((newValues) => {
    setExtraValues((prevValues) => ({
      ...prevValues,
      ...newValues,
    }));
  }, []);

  if (isLoading) {
    return (
      <Div sx={{ width: '100%', p: 2 }}>
        <Stack spacing={2} sx={{ width: '100%' }}>
          <Skeleton variant="text" width="50%" height={48} sx={{ borderRadius: 1 }} />
          <Skeleton variant="rectangular" width="100%" height={48} sx={{ borderRadius: 1 }} />
          <Skeleton variant="rectangular" width="100%" height={48} sx={{ borderRadius: 1 }} />
          <Skeleton variant="rectangular" width="100%" height={48} sx={{ borderRadius: 1 }} />
          <Skeleton variant="rectangular" width="100%" height={48} sx={{ borderRadius: 1 }} />
          <Skeleton variant="rectangular" width="100%" height={48} sx={{ borderRadius: 1 }} />
          <Skeleton variant="rectangular" width="100%" height={48} sx={{ borderRadius: 1 }} />
          <Skeleton variant="rectangular" width="100%" height={48} sx={{ borderRadius: 1 }} />
          <Skeleton variant="rectangular" width="100%" height={48} sx={{ borderRadius: 1 }} />
          <Skeleton variant="rectangular" width="100%" height={48} sx={{ borderRadius: 1 }} />
        </Stack>
      </Div>
    );
  }

  // Optional chaining to prevent errors if project is undefined
  document.title = project?.name || 'Project';

  const contextValue = {
    project,
    ...extraValues,
    reFetchProject,
    isDashboardTab,
    setIsDashboardTab,
    updateProjectProfile, 
  };

  return (
    <ProjectProfileContext.Provider value={contextValue}>
      {children}
    </ProjectProfileContext.Provider>
  );
}

export default ProjectProfileProvider;