'use client'

import {
  Card,
  CardContent,
  Dialog,
  Grid,
  Typography,
  IconButton,
  Tooltip,
  Box,
  LinearProgress
} from '@mui/material'
import { useEffect, useState } from 'react'
import { useProjectProfile } from '../ProjectProfileProvider';
import {
  EditOutlined,
  PaidOutlined,
  AccountBalanceWalletOutlined,
  TimelineOutlined
} from '@mui/icons-material';
import ProjectFormDialog from '../../ProjectFormDialog';

const EditProject = ({ project, setOpenEditDialog }) => {
  return (
    <ProjectFormDialog
      project={project}
      setOpenDialog={setOpenEditDialog}
    />
  );
};

const StatItem = ({ label, value }) => (
  <Box mb={2}>
    <Typography variant="body2" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="h4">
      {value}
    </Typography>
  </Box>
);

function ProjectDashboard() {
  const { project, setIsDashboardTab, reFetchProject } = useProjectProfile();
  const [openEditDialog, setOpenEditDialog] = useState(false);

  useEffect(() => {
    reFetchProject();
    setIsDashboardTab(true);
  }, [reFetchProject, setIsDashboardTab]);

  return (
    <>
      <Grid container spacing={3} width={'100%'}>

        {/* Edit Button */}
        <Grid size={12} display="flex" justifyContent="flex-end">
          <Tooltip title="Edit Project">
            <IconButton
              onClick={() => setOpenEditDialog(true)}
              sx={{
                backgroundColor: 'primary.main',
                color: '#fff',
                '&:hover': { backgroundColor: 'primary.dark' }
              }}
            >
              <EditOutlined />
            </IconButton>
          </Tooltip>
        </Grid>

        {/* Revenue Card */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card elevation={3} sx={{ borderRadius: 3 }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <PaidOutlined color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6" fontWeight={600}>
                  Revenue
                </Typography>
              </Box>

              <StatItem label="Contract Sum" value="1,200,000,000 TZS" />
              <StatItem label="Progressive Revenue" value="750,000,000 TZS" />
              <StatItem label="Certified Revenue" value="620,000,000 TZS" />
            </CardContent>
          </Card>
        </Grid>

        {/* Budgets Card */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card elevation={3} sx={{ borderRadius: 3 }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <AccountBalanceWalletOutlined color="success" sx={{ mr: 1 }} />
                <Typography variant="h6" fontWeight={600}>
                  Budgets
                </Typography>
              </Box>

              <StatItem label="Total Budget" value="900,000,000 TZS" />
              <StatItem label="Actual Used" value="640,000,000 TZS" />

              <Box mt={2}>
                <Typography variant="body2" color="text.secondary">
                  % Spend (71%)
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={71}
                  sx={{ height: 8, borderRadius: 5, mt: 1 }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Progress Card */}
        <Grid size={{ xs: 12 }}>
          <Card elevation={3} sx={{ borderRadius: 3 }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={3}>
                <TimelineOutlined color="warning" sx={{ mr: 1 }} />
                <Typography variant="h6" fontWeight={600}>
                  Project Progress
                </Typography>
              </Box>

              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <StatItem label="Time %" value="68%" />
                  <LinearProgress variant="determinate" value={68} />
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <StatItem label="Cost %" value="71%" />
                  <LinearProgress variant="determinate" value={71} color="success" />
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <StatItem label="Physical Progress %" value="65%" />
                  <LinearProgress variant="determinate" value={65} color="warning" />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

      </Grid>

      <Dialog
        open={openEditDialog}
        scroll="paper"
        fullWidth
        maxWidth="md"
      >
        <EditProject project={project} setOpenEditDialog={setOpenEditDialog} />
      </Dialog>
    </>
  );
}

export default ProjectDashboard;
