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
  LinearProgress,
  Skeleton
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
import { useQuery } from '@tanstack/react-query';
import projectsServices from '../../project-services';

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

  // Fetch revenue data
  const { data: revenueData, isLoading: isLoadingRevenue } = useQuery({
    queryKey: ['projectRevenue', project?.id],
    queryFn: () => projectsServices.getProjectRevenue(project?.id),
    enabled: !!project?.id,
  });

  // Fetch budget data
  const { data: budgetData, isLoading: isLoadingBudget } = useQuery({
    queryKey: ['projectBudget', project?.id],
    queryFn: () => projectsServices.getProjectBudget(project?.id),
    enabled: !!project?.id,
  });

  // Fetch progress data
  const { data: progressData, isLoading: isLoadingProgress } = useQuery({
    queryKey: ['projectProgress', project?.id],
    queryFn: () => projectsServices.getProjectProgress(project?.id),
    enabled: !!project?.id,
  });

  useEffect(() => {
    reFetchProject();
    setIsDashboardTab(true);
  }, [reFetchProject, setIsDashboardTab]);

  // Calculate percentages
  const progressiveRevenuePercent = revenueData?.contract_sum 
    ? ((revenueData?.progressive_revenue / revenueData?.contract_sum) * 100).toFixed(1)
    : 0;
  
  const certifiedRevenuePercent = revenueData?.contract_sum
    ? ((revenueData?.certified_revenue / revenueData?.contract_sum) * 100).toFixed(1)
    : 0;

  const budgetSpentPercent = budgetData?.budget
    ? ((budgetData?.cost_to_date / budgetData?.budget) * 100).toFixed(1)
    : 0;

  // Format currency
  const formatCurrency = (value) => {
    if (!value) return '0 TZS';
    return new Intl.NumberFormat('en-TZ').format(value) + ' TZS';
  };

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
          <Card elevation={3} sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <PaidOutlined color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6" fontWeight={600}>
                  Revenue
                </Typography>
              </Box>

              {isLoadingRevenue ? (
                <>
                  <Skeleton variant="text" height={80} />
                  <Skeleton variant="text" height={80} />
                  <Skeleton variant="rectangular" height={8} sx={{ mt: 2 }} />
                  <Skeleton variant="text" height={80} />
                  <Skeleton variant="rectangular" height={8} sx={{ mt: 2 }} />
                </>
              ) : (
                <>
                  <StatItem label="Contract Sum" value={formatCurrency(revenueData?.contract_sum)} />
                  <StatItem label="Progressive Revenue" value={formatCurrency(revenueData?.progressive_revenue)} />
                  
                  <Box mt={2} mb={2}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <LinearProgress
                        variant="determinate"
                        value={parseFloat(progressiveRevenuePercent)}
                        sx={{ height: 8, borderRadius: 5, mt: 1, flex: 1 }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        {progressiveRevenuePercent}%
                      </Typography>
                    </Box>
                  </Box>

                  <StatItem label="Certified Revenue" value={formatCurrency(revenueData?.certified_revenue)} />
                  
                  <Box mt={2}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <LinearProgress
                        variant="determinate"
                        value={parseFloat(certifiedRevenuePercent)}
                        sx={{ height: 8, borderRadius: 5, mt: 1, flex: 1 }}
                        color="success"
                      />
                      <Typography variant="body2" color="text.secondary">
                        {certifiedRevenuePercent}%
                      </Typography>
                    </Box>
                  </Box>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Budgets Card */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card elevation={3} sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <AccountBalanceWalletOutlined color="success" sx={{ mr: 1 }} />
                <Typography variant="h6" fontWeight={600}>
                  Budgets
                </Typography>
              </Box>

              {isLoadingBudget ? (
                <>
                  <Skeleton variant="text" height={80} />
                  <Skeleton variant="text" height={80} />
                  <Skeleton variant="rectangular" height={8} sx={{ mt: 2 }} />
                </>
              ) : (
                <>
                  <StatItem label="Total Budget" value={formatCurrency(budgetData?.budget)} />
                  <StatItem label="Cost to Date" value={formatCurrency(budgetData?.cost_to_date)} />

                  <Box mt={2}>
                    <Typography variant="body2" color="text.secondary">
                      % Spent
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                      <LinearProgress
                        variant="determinate"
                        value={parseFloat(budgetSpentPercent)}
                        sx={{ height: 8, borderRadius: 5, mt: 1, flex: 1 }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        {budgetSpentPercent}%
                      </Typography>
                    </Box>
                  </Box>
                </>
              )}
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

              {isLoadingProgress ? (
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Skeleton variant="text" height={80} />
                    <Skeleton variant="rectangular" height={8} />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Skeleton variant="text" height={80} />
                    <Skeleton variant="rectangular" height={8} />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Skeleton variant="text" height={80} />
                    <Skeleton variant="rectangular" height={8} />
                  </Grid>
                </Grid>
              ) : (
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <StatItem label="Time %" value="" />
                    <Box display="flex" alignItems="center" gap={1}>
                      <LinearProgress 
                        variant="determinate" 
                        value={progressData?.time_progress || 0} 
                        sx={{ flex: 1 }} 
                      />
                      <Typography variant="body2" color="text.secondary">
                        {progressData?.time_progress || 0}%
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 12, md: 4 }}>
                    <StatItem label="Physical Progress %" value="" />
                    <Box display="flex" alignItems="center" gap={1}>
                      <LinearProgress 
                        variant="determinate" 
                        value={progressData?.physical_progress || 0} 
                        color="warning" 
                        sx={{ flex: 1 }} 
                      />
                      <Typography variant="body2" color="text.secondary">
                        {progressData?.physical_progress || 0}%
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 12, md: 4 }}>
                    <StatItem label="Certified Progress %" value="" />
                    <Box display="flex" alignItems="center" gap={1}>
                      <LinearProgress 
                        variant="determinate" 
                        value={progressData?.certified_progress || 0} 
                        color="success" 
                        sx={{ flex: 1 }} 
                      />
                      <Typography variant="body2" color="text.secondary">
                        {progressData?.certified_progress || 0}%
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              )}
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
