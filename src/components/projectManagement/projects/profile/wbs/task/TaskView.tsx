import {
  Box,
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
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
      aggregated: false,
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

  const formatNumber = (value: number | string) =>
    parseFloat(String(value || 0)).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const formatDate = (value?: string) => {
    if (!value) return '-';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '-';
    return parsed.toLocaleDateString('en-GB');
  };

  const isAggregated = Boolean(queryOptions.queryParams.aggregated);

  return (
    <>
      <DialogTitle sx={{ pb: 1 }}>
        <Typography textAlign={'center'} fontSize={20} fontWeight={700}>
          {task?.name + ' Task' || 'Task details'}
        </Typography>
        <Typography textAlign={'center'} variant='body2' color='text.secondary' mt={0.5}>
          {activity?.name || 'Task details and resource usage'}
        </Typography>

        <Paper variant='outlined' sx={{ mt: 2, borderRadius: 2, p: 1.5 }}>
          <Tabs
            value={selectedTab}
            onChange={handleTabChange}
            variant='fullWidth'
            sx={{ minHeight: 40 }}
          >
            <Tab label='Deliverables' />
            <Tab label='Material Used' />
          </Tabs>

          {selectedTab === 1 && (
            <Box
              sx={{
                mt: 1.5,
                pt: 1,
                borderTop: 1,
                borderColor: 'divider',
                display: 'flex',
                justifyContent: { xs: 'flex-start', md: 'flex-end' },
              }}
            >
              <MaterialIssuedSelector
                aggregated={queryOptions.queryParams.aggregated}
                onChange={handleAggregatedChange}
              />
            </Box>
          )}
        </Paper>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          {selectedTab === 0 &&
            (taskDeliverables.length > 0 ? (
              <TableContainer component={Paper} variant='outlined' sx={{ borderRadius: 2 }}>
                <Table
                  sx={{
                    minWidth: 700,
                    tableLayout: 'fixed',
                    '& .MuiTableCell-root': {
                      border: 1,
                      borderColor: 'divider',
                    },
                  }}
                  aria-label='Deliverables Table'
                >
                  <TableHead sx={{ bgcolor: 'action.hover' }}>
                    <TableRow>
                      <TableCell sx={{ width: '25%' }}>Name</TableCell>
                      <TableCell sx={{ width: '25%' }}>Contribution Percentage</TableCell>
                      <TableCell sx={{ width: '50%' }} align='left'>Description</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {taskDeliverables.map((item: any, idx: number) => (
                      <TableRow
                        key={idx}
                        sx={{
                          '&:hover': { bgcolor: 'action.hover' },
                        }}
                      >
                        <TableCell align='left'>{item.code}</TableCell>
                        <TableCell align='right'>
                          {formatNumber(item.contribution_percentage)}
                        </TableCell>
                        <TableCell align='left'>{item.description}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Paper variant='outlined' sx={{ p: 2, borderRadius: 2 }}>
                <Typography color='text.secondary'>No task deliverables for this task</Typography>
              </Paper>
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
                <TableContainer component={Paper} variant='outlined' sx={{ borderRadius: 2 }}>
                  <Table
                    sx={{
                      minWidth: 700,
                      tableLayout: 'fixed',
                      '& .MuiTableCell-root': {
                        border: 1,
                        borderColor: 'divider',
                      },
                    }}
                    aria-label='Material Used Table'
                  >
                    <TableHead sx={{ bgcolor: 'action.hover' }}>
                      <TableRow>
                        <TableCell sx={{ width: '10%' }}>S/N</TableCell>
                        {!isAggregated && (
                          <TableCell sx={{ width: '15%' }}>Date</TableCell>
                        )}
                        <TableCell sx={{ width: isAggregated ? '65%' : '55%' }}>Product</TableCell>
                        <TableCell sx={{ width: '20%' }}>Quantity</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {materialUsed.map((item: any, idx: number) => (
                        <TableRow key={idx} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                          <TableCell align='center'>{idx + 1}.</TableCell>
                          {!isAggregated && (
                            <TableCell>
                              <Tooltip title='Issued Date'>
                                <Typography>{formatDate(item.date)}</Typography>
                              </Tooltip>
                            </TableCell>
                          )}
                          <TableCell>
                            <Tooltip title='Product Name'>
                              <Typography>{item.product_name}</Typography>
                            </Tooltip>
                          </TableCell>
                          <TableCell align='right'>
                            <Tooltip title='Quantity'>
                              <Typography>
                                {formatNumber(item.quantity)} {item.measurement_unit?.symbol}
                              </Typography>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Paper variant='outlined' sx={{ p: 2, borderRadius: 2 }}>
                  <Typography color='text.secondary'>No material used found for this task</Typography>
                </Paper>
              )}
            </>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button size='small' variant='outlined' onClick={() => setOpenDialog(false)}>
          Cancel
        </Button>
      </DialogActions>
    </>
  );
};

export default TaskView;
