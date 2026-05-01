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
import InventoryValueTrend from '@/components/dashboard/procurementCards/InventoryValueTrend';
import dayjs from 'dayjs';

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
      {typeof value === 'number' ? value.toFixed(2) : value}
    </Typography>
  </Box>
);

function ProjectDashboard() {
  const { project, setIsDashboardTab, reFetchProject } = useProjectProfile();
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const { currencies } = useCurrencySelect();
  const baseCurrency = currencies?.find(c => c.is_base === 1);
  const currencyCode = baseCurrency?.code;
  const hasClient = !!(project?.client_id || project?.client?.id);

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
    ? ((dashboardFigures?.progressive_revenue / dashboardFigures?.contract_sum) * 100).toFixed(2)
    : '0.00';

  const budgetSpentPercent = dashboardFigures?.budget
    ? ((dashboardFigures?.cost_to_date / dashboardFigures?.budget) * 100).toFixed(2)
    : '0.00';

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
        {hasClient && (
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
                          {parseFloat(progressiveRevenuePercent).toFixed(2)}%
                        </Typography>
                      </Box>
                    </Box>
                    <StatItem label="Gross Profit to Date" value={formatCurrency(dashboardFigures?.gross_profit_to_date)} />
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Budgets Card */}
        <Grid size={{ xs: 12, md: 6 }} display="flex">
          <Card elevation={3} sx={{ borderRadius: 3, height: '100%', width: '100%' }}>
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
                  <Box mt={2} paddingBottom={3}>
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                      <Typography variant="body2" color="text.secondary">
                        % Spent
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {parseFloat(budgetSpentPercent).toFixed(2)}%
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      <LinearProgress
                        variant="determinate"
                        value={parseFloat(budgetSpentPercent)}
                        sx={{ height: 8, borderRadius: 5, mt: 1, flex: 1 }}
                      />
                    </Box>
                  </Box>
                  <StatItem label="Remaining Budget" value={formatCurrency(dashboardFigures?.remaining_budget)} />
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Progress Card */}
        <Grid size={{ xs: 12, md: hasClient ? 12 : 12 }} display="flex">
          <Card elevation={3} sx={{ borderRadius: 3, height: '100%', width: '100%' }}>
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
                (() => {
                  const execPercent = dashboardFigures?.execution_percentage ?? 0;
                  const timePercent = Math.min(dashboardFigures?.time_progress_percentage ?? 0, 100);
                  let execColor = 'success';
                  const diff = timePercent - execPercent;
                  if (diff >= 10) {
                    execColor = 'error';
                  } else if (diff >= 5) {
                    execColor = 'warning';
                  }
                  return (
                    <Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                        <Typography variant="body2" color="text.secondary" fontWeight={500}>
                          Execution: {Math.min(100, Number(execPercent).toFixed(2))}%
                        </Typography>
                        <Typography variant="body2" color="text.secondary" fontWeight={500}>
                          Time Elapsed: {Math.min(100, Number(timePercent).toFixed(2))}%
                        </Typography>
                      </Box>
                      <Tooltip
                        title={
                          execColor === 'success'
                            ? 'Execution is on track with time elapsed.'
                            : execColor === 'warning'
                            ? 'Execution is lagging behind time elapsed. Monitor closely.'
                            : execColor === 'error'
                            ? 'Execution is significantly behind schedule.'
                            : 'Progress status.'
                        }
                      >
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(Number(execPercent) || 0, 100)}
                          color={execColor}
                          sx={{ flex: 1, height: 8, borderRadius: 5 }}
                        />
                      </Tooltip>
                    </Box>
                  );
                })()
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 12 }}>
          <InventoryValueTrend
            from={project?.commencement_date ? dayjs(project.commencement_date).toISOString() : undefined}
            to={project?.completion_date ? dayjs(project.completion_date).toISOString() : undefined}
            cost_center_ids={project?.cost_center?.id ? [project.cost_center.id] : undefined}
          />
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
