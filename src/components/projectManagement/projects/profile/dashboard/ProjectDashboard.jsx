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
import { useCurrencySelect } from '@/components/masters/Currencies/CurrencySelectProvider';

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
  const { currencies } = useCurrencySelect();
  const baseCurrency = currencies?.find(c => c.is_base === 1);
  const currencyCode = baseCurrency?.code;

  // Fetch all dashboard figures in one call
  const { data: dashboardFigures, isLoading: isLoadingDashboard } = useQuery({
    queryKey: ['projectDashboardFigures', project?.id],
    queryFn: () => projectsServices.getProjectDashboardFigures(project?.id),
    enabled: !!project?.id,
  });

  useEffect(() => {
    reFetchProject();
    setIsDashboardTab(true);
  }, [reFetchProject, setIsDashboardTab]);

  // Calculate percentages from unified data
  const progressiveRevenuePercent = dashboardFigures?.contract_sum 
    ? ((dashboardFigures?.progressive_revenue / dashboardFigures?.contract_sum) * 100).toFixed(1)
    : 0;

  const budgetSpentPercent = dashboardFigures?.budget
    ? ((dashboardFigures?.cost_to_date / dashboardFigures?.budget) * 100).toFixed(1)
    : 0;

  // Format currency with two decimal places and space between amount and currency code
  const formatCurrency = (value) => {
    const amount = Number(value) || 0;
    // Always show two decimal places
    const formatted = amount.toLocaleString('en-TZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `${currencyCode ? currencyCode + ' ' : ''}${formatted}`;
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

              {isLoadingDashboard ? (
                <>
                  <Skeleton variant="text" height={80} />
                  <Skeleton variant="text" height={80} />
                  <Skeleton variant="rectangular" height={8} sx={{ mt: 2 }} />
                  <Skeleton variant="text" height={80} />
                  <Skeleton variant="rectangular" height={8} sx={{ mt: 2 }} />
                </>
              ) : (
                <>
                  <StatItem label="Contract Sum" value={formatCurrency(dashboardFigures?.contract_sum)} />
                  <StatItem label="Certified Revenue" value={formatCurrency(dashboardFigures?.certified_revenue)} />
                  <StatItem label="Progressive Revenue" value={formatCurrency(dashboardFigures?.progressive_revenue)} />
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
                  <StatItem label="Gross Profit to Date" value={formatCurrency(dashboardFigures?.gross_profit_to_date)} />
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

              {isLoadingDashboard ? (
                <>
                  <Skeleton variant="text" height={80} />
                  <Skeleton variant="text" height={80} />
                  <Skeleton variant="rectangular" height={8} sx={{ mt: 2 }} />
                </>
              ) : (
                <>
                  <StatItem label="Total Budget" value={formatCurrency(dashboardFigures?.budget)} />
                  <StatItem label="Cost to Date" value={formatCurrency(dashboardFigures?.cost_to_date)} />
                  <StatItem label="Remaining Budget" value={formatCurrency(dashboardFigures?.remaining_budget)} />

                  <Box mt={2}>
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
                    <Typography variant="body2" color="text.secondary">
                      % Spent
                    </Typography>
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

              {isLoadingDashboard ? (
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
                  <Grid size={{ xs: 12, md: 6 }}>
                    <StatItem label="Time %" value={dashboardFigures?.time_progress_percentage ? `${dashboardFigures.time_progress_percentage}%` : ''} />
                    <Box display="flex" alignItems="center" gap={1}>
                      <LinearProgress 
                        variant="determinate" 
                        value={dashboardFigures?.time_progress_percentage || 0} 
                        sx={{ flex: 1 }} 
                      />
                      <Typography variant="body2" color="text.secondary">
                        {dashboardFigures?.time_progress_percentage || 0}%
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <StatItem label="Physical Progress %" value={dashboardFigures?.execution_percentage ? `${dashboardFigures.execution_percentage}%` : ''} />
                    <Box display="flex" alignItems="center" gap={1}>
                      <LinearProgress 
                        variant="determinate" 
                        value={dashboardFigures?.execution_percentage || 0} 
                        color="warning" 
                        sx={{ flex: 1 }} 
                      />
                      <Typography variant="body2" color="text.secondary">
                        {dashboardFigures?.execution_percentage || 0}%
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
