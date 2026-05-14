import {
  Box,
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  Skeleton,
  Stack,
  Tab,
  Tabs,
  Tooltip,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import React, { SyntheticEvent, useEffect, useState } from 'react';
import projectsServices from '../../../project-services';

interface TaskViewProps {
  setOpenDialog: (value: boolean) => void;
  task: any;
  activity: any;
}

const TaskView = ({ setOpenDialog, task, activity }: TaskViewProps) => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [materialUsed, setMaterialUsed] = useState([]);
  const { data: materialUsedData, isLoading } = useQuery<any>({
    queryKey: [task?.id, selectedTab],
    queryFn: async () => await projectsServices.ViewTaskMaterials(task),
  });

  useEffect(() => {
    setMaterialUsed(materialUsedData?.data);
  }, [materialUsedData]);

  const taskDeliverables = task?.deliverables ?? [];

  const handleTabChange = (_event: SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  return (
    <>
      <DialogTitle>
        <Typography textAlign={'center'}>
          {task?.name + ' Task' || 'Task details'}
        </Typography>
        <Tabs value={selectedTab} onChange={handleTabChange}>
          <Tab label='Deliverables' />
          <Tab label='Material Used' />
        </Tabs>
      </DialogTitle>
      <DialogContent>
        <Box>
          {selectedTab === 0 &&
            (taskDeliverables.length > 0 ? (
              taskDeliverables.map((item: any, idx: number) => (
                <React.Fragment key={idx}>
                  <Divider sx={{ my: 1 }} />
                  <Grid container alignItems={'center'}>
                    <Grid size={2}>
                      <Tooltip title='code'>
                        <Typography>{item.code}</Typography>
                      </Tooltip>
                    </Grid>
                    <Grid size={2}>
                      <Tooltip title='Contribution Percentage'>
                        <Typography>{item.contribution_percentage}</Typography>
                      </Tooltip>
                    </Grid>
                    <Grid size={8}>
                      <Tooltip title='Description'>
                        <Typography>{item.description}</Typography>
                      </Tooltip>
                    </Grid>
                  </Grid>
                </React.Fragment>
              ))
            ) : (
              <Typography>No task deliverables for this task</Typography>
            ))}

          {selectedTab === 1 &&
            (isLoading ? (
              <Box>
                <Stack direction={'column'} gap={1}>
                  <Skeleton sx={{ width: '100%', py: 3 }} />
                  <Skeleton sx={{ width: '80%', py: 3 }} />
                  <Skeleton sx={{ width: '100%', py: 3 }} />
                  <Skeleton sx={{ width: '80%', py: 3 }} />
                  <Skeleton sx={{ width: '100%', py: 3 }} />
                </Stack>
              </Box>
            ) : materialUsed?.length > 0 ? (
              materialUsed.map((item: any, idx: number) => (
                <React.Fragment key={idx}>
                  <Divider sx={{ my: 1 }} />
                  <Grid container alignItems={'center'}>
                    <Grid size={8}>
                      <Tooltip title='Product Name'>
                        <Typography>{item.product_name}</Typography>
                      </Tooltip>
                    </Grid>
                    <Grid size={4}>
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
                    {/* <Grid size={4}>
                      <Tooltip title='Measurement Unit'>
                        <Typography>{item.measurement_unit.name}</Typography>
                      </Tooltip>
                    </Grid> */}
                  </Grid>
                </React.Fragment>
              ))
            ) : (
              <Typography>No material used found for this task</Typography>
            ))}
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
