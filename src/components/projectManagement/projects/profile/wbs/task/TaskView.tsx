import JumboListToolbar from '@jumbo/components/JumboList/components/JumboListToolbar';
import JumboRqList from '@jumbo/components/JumboReactQuery/JumboRqList';
import JumboSearch from '@jumbo/components/JumboSearch';
import {
  Box,
  Button,
  Card,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Typography,
} from '@mui/material';
import React, { SyntheticEvent, useRef, useState } from 'react';
import projectsServices from '../../../project-services';
import MaterialIssuedSelector from '../../subcontracts/tabs/materialIssued/MaterialIssuedSelector';
import TaskViewListItem from './TaskViewListItem';
import TaskViewSummary from './TaskViewSummary';

interface TaskViewProps {
  setOpenDialog: (value: boolean) => void;
  task: any;
  activity: any;
}

const TaskView = ({ setOpenDialog, task, activity }: TaskViewProps) => {
  const listRef = useRef<any>(null);
  const [selectedTab, setSelectedTab] = useState(0);
  const [queryOptions, setQueryOptions] = React.useState({
    queryKey: 'taskMaterialsUsed',
    queryParams: {
      id: task?.id,
      aggregated: true,
      keyword: '',
    },
    countKey: 'total',
    dataKey: 'data',
  });

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

  const handleOnChange = React.useCallback((keyword: string) => {
    setQueryOptions((state) => ({
      ...state,
      queryParams: {
        ...state.queryParams,
        keyword: keyword,
      },
    }));
  }, []);

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

  const taskSubtitle = task.weighted_percentage
    ? task.weighted_percentage.toLocaleString() +
      '% of ' +
      (activity?.name || 'Task details and resource usage')
    : activity?.name || 'Task details and resource usage';

  const renderMaterial = React.useCallback(
    (material: any) => {
      return <TaskViewListItem material={material} isAggregated={isAggregated} />;
    },
    [isAggregated]
  );

  return (
    <>
      <DialogTitle sx={{ pb: 1 }}>
        <Typography textAlign={'center'} fontSize={20} fontWeight={700}>
          {task?.name + ' Task' || 'Task details'}
        </Typography>
        <Typography
          textAlign={'center'}
          variant='body2'
          color='text.secondary'
          mt={0.5}
        >
          {taskSubtitle}
        </Typography>

        <TaskViewSummary task={task} />

        <Paper variant='outlined' sx={{ mt: 2, borderRadius: 2, pt: 1.5 }}>
          <Tabs
            value={selectedTab}
            onChange={handleTabChange}
            variant='fullWidth'
            sx={{ minHeight: 40 }}
          >
            <Tab label='Deliverables' />
            <Tab label='Material Used' />
          </Tabs>
        </Paper>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          {selectedTab === 0 &&
            (taskDeliverables.length > 0 ? (
              <TableContainer
                component={Paper}
                variant='outlined'
                sx={{ borderRadius: 2 }}
              >
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
                      <TableCell sx={{ width: '25%' }}>Code</TableCell>
                      <TableCell sx={{ width: '50%' }} align='left'>
                        Description
                      </TableCell>
                      <TableCell sx={{ width: '25%' }}>
                        Contribution Percentage
                      </TableCell>
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
                        <TableCell align='left'>{item.description}</TableCell>
                        <TableCell align='right'>
                          {formatNumber(item.contribution_percentage)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Paper variant='outlined' sx={{ p: 2, borderRadius: 2 }}>
                <Typography color='text.secondary'>
                  No task deliverables for this task
                </Typography>
              </Paper>
            ))}

          {selectedTab === 1 && (
            <JumboRqList
              ref={listRef}
              wrapperComponent={Card}
              service={projectsServices.ViewTaskMaterials}
              primaryKey={queryOptions.queryParams.aggregated ? 'product_id' : 'id'}
              queryOptions={queryOptions}
              itemsPerPage={10}
              itemsPerPageOptions={[5, 8, 10, 15, 20]}
              renderItem={renderMaterial}
              componentElement='div'
              wrapperSx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
              }}
              toolbar={
                <JumboListToolbar
                  hideItemsPerPage={true}
                  actionTail={
                    <Stack direction='row'>
                      {selectedTab === 1 && (
                        <MaterialIssuedSelector
                          aggregated={queryOptions.queryParams.aggregated}
                          onChange={handleAggregatedChange}
                        />
                      )}
                      <JumboSearch
                        onChange={handleOnChange}
                        value={queryOptions.queryParams.keyword}
                      />
                    </Stack>
                  }
                ></JumboListToolbar>
              }
            />
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button
          size='small'
          variant='outlined'
          onClick={() => setOpenDialog(false)}
        >
          Close
        </Button>
      </DialogActions>
    </>
  );
};

export default TaskView;
