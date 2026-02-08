import { Grid } from '@mui/material'
import React from 'react'
import SubContractTasksActionTail from './SubContractTasksActionTail'
import SubContractTasksListItem from './SubContractTasksListItem'
import projectsServices from '@/components/projectManagement/projects/project-services';
import { useQuery } from '@tanstack/react-query';

function SubContractTaskTab({subContract, isExpanded}) {
    const { data: subContractTasks, isLoading } = useQuery({
        queryKey: ['subContractTasks', { id: subContract.id }],
        queryFn: async () => projectsServices.getSubContractTasks(subContract.id),
        enabled: !!isExpanded,
    });
    
  return (
    <Grid container spacing={2} width={'100%'}>
        <Grid size={{xs: 12}} textAlign={'end'}>
            <SubContractTasksActionTail subContract={subContract} subContractTasks={subContractTasks}/>
        </Grid>
        <Grid size={{xs: 12}}>
            <SubContractTasksListItem subContract={subContract} subContractTasks={subContractTasks} isLoading={isLoading}/>
        </Grid>
    </Grid>
  )
}

export default SubContractTaskTab