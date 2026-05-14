import {
  Box,
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  Paper,
  Skeleton,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tooltip,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import React, { SyntheticEvent, useEffect, useState } from 'react';
import projectsServices from '../../../project-services';
import MaterialIssuedSelector from '../../subcontracts/tabs/materialIssued/MaterialIssuedSelector';

interface TaskViewProps {
  setOpenDialog: (value: boolean) => void;
  task: any;
  activity: any;
}

const TaskView = ({ setOpenDialog, task, activity }: TaskViewProps) => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [queryOptions, setQueryOptions] = React.useState({
    queryKey: [task?.id, selectedTab],
    queryParams: {
      id: task?.id,
      aggregated: true,
    },
  });
  const [materialUsed, setMaterialUsed] = useState([]);
  const { data: materialUsedData, isLoading } = useQuery<any>({
    queryKey: [...queryOptions.queryKey, queryOptions.queryParams.aggregated],
    queryFn: async () =>
      await projectsServices.ViewTaskMaterials(queryOptions.queryParams),
  });

  useEffect(() => {
    setMaterialUsed(materialUsedData?.data);
  }, [materialUsedData]);

  const taskDeliverables = task?.deliverables ?? [];

  const handleAggregatedChange = React.useCallback((aggregated: any) => {
    setQueryOptions((state) => ({
      ...state,
      queryParams: {
        ...state.queryParams,
        aggregated,
      },
    }));
  }, []);

  const handleTabChange = (_event: SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  return (
    <>
      <DialogTitle>
        <Typography textAlign={'center'} fontSize={20}>
          {task?.name + ' Task' || 'Task details'}
        </Typography>
        <Stack direction={'row'} gap={4}>
          <Tabs value={selectedTab} onChange={handleTabChange}>
            <Tab label='Deliverables' />
            <Tab label='Material Used' />
          </Tabs>
          {selectedTab === 1 && (
            <MaterialIssuedSelector
              aggregated={queryOptions.queryParams.aggregated}
              onChange={handleAggregatedChange}
            />
          )}
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Box>
          {selectedTab === 0 &&
            (taskDeliverables.length > 0 ? (
              <TableContainer component={Paper}>
                <Table sx={{ minWidth: 700 }} aria-label='Deliverables Table'>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Contribution Percentage</TableCell>
                      <TableCell align='left'>Description</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {taskDeliverables.map((item: any, idx: number) => (
                      <TableRow
                        key={idx}
                        sx={{
                          '&:last-child td, &:last-child th': { border: 0 },
                        }}
                      >
                        <TableCell align='left'>{item.code}</TableCell>
                        <TableCell align='right'>
                          {parseFloat(
                            item.contribution_percentage
                          ).toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </TableCell>
                        <TableCell align='left'>{item.description}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography>No task deliverables for this task</Typography>
            ))}

          {selectedTab === 1 && isLoading && (
            <Box>
              <Stack direction={'column'} gap={1}>
                <Skeleton sx={{ width: '100%', py: 3 }} />
                <Skeleton sx={{ width: '80%', py: 3 }} />
                <Skeleton sx={{ width: '100%', py: 3 }} />
                <Skeleton sx={{ width: '80%', py: 3 }} />
                <Skeleton sx={{ width: '100%', py: 3 }} />
              </Stack>
            </Box>
          )}

          {selectedTab === 1 && !isLoading && (
            <>
              {materialUsed?.length > 0 ? (
                materialUsed.map((item: any, idx: number) => (
                  <React.Fragment key={idx}>
                    <Divider sx={{ my: 1 }} />
                    <Grid container alignItems={'center'}>
                      <Grid size={8}>
                        <Tooltip title='Product Name'>
                          <Typography>{item.product_name}</Typography>
                        </Tooltip>
                      </Grid>
                      <Grid size={4} pl={4}>
                        <Tooltip title='Quantity'>
                          <Typography textAlign={'left'}>
                            {parseFloat(item.quantity).toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}{' '}
                            {item.measurement_unit.name}
                          </Typography>
                        </Tooltip>
                      </Grid>
                    </Grid>
                  </React.Fragment>
                ))
              ) : (
                <Typography>No material used found for this task</Typography>
              )}
            </>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button size='small' onClick={() => setOpenDialog(false)}>
          Cancel
        </Button>
      </DialogActions>
    </>
  );
};

export default TaskView;
