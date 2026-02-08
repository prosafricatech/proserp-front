'use client'

import React, { createContext, useContext, useState, useCallback } from 'react';
import { LinearProgress } from '@mui/material';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import projectsServices from '../project-services';

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
    return <LinearProgress />;
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