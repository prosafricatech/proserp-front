'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Card, Stack, Typography } from '@mui/material';
import { useParams } from 'next/navigation';
import JumboListToolbar from '@jumbo/components/JumboList/components/JumboListToolbar';
import JumboRqList from '@jumbo/components/JumboReactQuery/JumboRqList';
import JumboSearch from '@jumbo/components/JumboSearch';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { MODULES } from '@/utilities/constants/modules';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import UnsubscribedAccess from '@/shared/Information/UnsubscribedAccess';
import UnauthorizedAccess from '@/shared/Information/UnauthorizedAccess';
import ProjectsActionTail from './ProjectActionTail';
import ProjectListItem from './ProjectListItem';
import { Project } from './ProjectTypes';
import projectsServices from './project-services';
import StakeholderSelectProvider from '@/components/masters/stakeholders/StakeholderSelectProvider';

const Projects = () => {
    const params = useParams<{ project?: string; id?: string; keyword?: string }>();
    const listRef = useRef<any>(null);
    const { organizationHasSubscribed, checkOrganizationPermission } = useJumboAuth();
    const [mounted, setMounted] = useState(false);

    const [queryOptions, setQueryOptions] = useState({
      queryKey: 'projects',
      queryParams: { id: params.id, keyword: '' },
      countKey: 'total',
      dataKey: 'data',
    });

    useEffect(() => {
      setQueryOptions((state) => ({
        ...state,
        queryParams: { ...state.queryParams, id: params.id },
      }));
    }, [params]);

    const renderProject = useCallback((project:Project) => (
        <ProjectListItem project={project} />
      ),
      []
    );

    const handleOnChange = useCallback((keyword: string) => {
      setQueryOptions((state) => ({
        ...state,
        queryParams: {
          ...state.queryParams,
          keyword,
        },
      }));
    }, []);

    useEffect(() => {
      setMounted(true);
    }, []);

    if (!mounted) return null;

    if (!organizationHasSubscribed(MODULES.PROJECT_MANAGEMENT)) {
      return <UnsubscribedAccess modules="Project Management" />;
    }

    if (
      !checkOrganizationPermission([
        PERMISSIONS.PROJECTS_CREATE,
        PERMISSIONS.PROJECTS_READ,
        PERMISSIONS.PROJECTS_EDIT,
      ])
    ) {
      return <UnauthorizedAccess />;
    }

  return (
    <React.Fragment>
      <StakeholderSelectProvider>
        <Typography variant="h4" mb={2}>
          Projects
        </Typography>
        <JumboRqList
          ref={listRef}
          wrapperComponent={Card}
          service={projectsServices.getList}
          primaryKey="id"
          queryOptions={queryOptions}
          itemsPerPage={10}
          itemsPerPageOptions={[5, 8, 10, 15, 20]}
          renderItem={renderProject}
          componentElement="div"
          wrapperSx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
          }}
          toolbar={
            <JumboListToolbar
              hideItemsPerPage={true}
              actionTail={
                <Stack direction="row">
                  <JumboSearch
                    onChange={handleOnChange}
                    value={queryOptions.queryParams.keyword}
                  />
                  <ProjectsActionTail />
                </Stack>
              }
            />
          }
        />
      </StakeholderSelectProvider>
    </React.Fragment>
  );
};

export default Projects;
