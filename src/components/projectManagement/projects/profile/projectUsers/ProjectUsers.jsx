'use client';

import React from 'react';
import { Card, Grid } from '@mui/material';
import JumboRqList from '@jumbo/components/JumboReactQuery/JumboRqList/JumboRqList';
import JumboSearch from '@jumbo/components/JumboSearch/JumboSearch';
import JumboListToolbar from '@jumbo/components/JumboList/components/JumboListToolbar/JumboListToolbar';
import { useParams } from 'next/navigation';
import { useProjectProfile } from '../ProjectProfileProvider';
import projectsServices from '../../project-services';
import ProjectUsersListItem from './ProjectUsersListItem';
import ProjectUsersActionTail from './ProjectUsersActionTail';

const ProjectUsers = () => {
  const params = useParams();
  const { project } = useProjectProfile();
  const listRef = React.useRef();

  const [queryOptions, setQueryOptions] = React.useState({
    queryKey: 'projectUsers',
    queryParams: { 
      id: params.id, 
      keyword: '', 
      project_id: project?.id,
      from: null,
      to: null
    },
    countKey: 'total',
    dataKey: 'data',
  });

  React.useEffect(() => {
    setQueryOptions((state) => ({
      ...state,
      queryParams: { ...state.queryParams, id: params.id },
    }));
  }, [params]);

  const ProjectUsers = React.useCallback((user) => {
    return <ProjectUsersListItem user={user} />;
  }, []);

  const handleOnChange = React.useCallback((keyword) => {
    setQueryOptions((state) => ({
      ...state,
      queryParams: {
        ...state.queryParams,
        keyword,
      },
    }));
  }, []);

  return (
    <JumboRqList
      ref={listRef}
      wrapperComponent={Card}
      service={projectsServices.projectUsersList}
      primaryKey="id"
      queryOptions={queryOptions}
      itemsPerPage={10}
      itemsPerPageOptions={[5, 10, 15, 20]}
      renderItem={ProjectUsers}
      componentElement="div"
      wrapperSx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
      }}
      toolbar={
        <JumboListToolbar
          hideItemsPerPage
          actionTail={
            <Grid container columnSpacing={1} rowSpacing={1} justifyContent={'end'}>
              <Grid size={{xs: 10, md: 11}}>
                <JumboSearch
                  onChange={handleOnChange}
                  value={queryOptions.queryParams.keyword}
                />
              </Grid>
              
              <Grid size={{xs: 1, md: 1}}>
                <ProjectUsersActionTail />
              </Grid>
            </Grid>
          }
        />
      }
    />
  );
};

export default ProjectUsers;