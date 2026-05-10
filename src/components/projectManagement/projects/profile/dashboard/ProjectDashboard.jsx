'use client';

import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import financialReportsServices from '@/components/accounts/reports/financial-reports-services';
import { useCurrencySelect } from '@/components/masters/Currencies/CurrencySelectProvider';
import PDFContent from '@/components/pdf/PDFContent';
import { faFileExcel } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import {
  AccountBalanceWalletOutlined,
  EditOutlined,
  HighlightOff,
  Money,
  PaidOutlined,
  TimelineOutlined,
} from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Dialog,
  DialogActions,
  DialogContent,
  Divider,
  Grid,
  IconButton,
  LinearProgress,
  Skeleton,
  Tab,
  Tabs,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';
import projectsServices from '../../project-services';
import ProjectForm from '../../ProjectFormDialog';
import { useProjectProfile } from '../ProjectProfileProvider';
import ProjectInventoryValueOnScreen from './ProjectInventoryValueOnScreen';
import ProjectInventoryValuePDF from './ProjectInventoryValuePDF';
import ProjectLiabilitiesOnScreen from './ProjectLiabilitiesOnScreen';
import ProjectLiabilitiesPDF from './ProjectLiabilitiesPDF';

const EditProject = ({ project, setOpenEditDialog }) => {
  return <ProjectForm project={project} setOpenDialog={setOpenEditDialog} />;
};

const StatItem = ({ label, value }) => (
  <Box mb={2}>
    <Typography variant='body2' color='text.secondary'>
      {label}
    </Typography>
    <Typography variant='h4'>
      {typeof value === 'number' ? value.toFixed(2) : value}
    </Typography>
  </Box>
);

const DashboardDocumentDialog = ({
  setOpenDocumentDialog,
  document,
  fileName,
  onScreenContent,
  exportedData,
  documentType,
}) => {
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));
  const [selectedTab, setSelectedTab] = useState(0);
  const [isExporting, setIsExporting] = useState(false);

  const handleTabChange = (_event, newValue) => {
    setSelectedTab(newValue);
  };

  const handlExcelExport = async (exportedData) => {
    setIsExporting(true);
    try {
      const blob =
        documentType === 'liabilities'
          ? await projectsServices.exportProjectLiabilitiesExcel(exportedData)
          : await projectsServices.exportProjectInventoryValuesReportExcel(
              exportedData
            );
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      const excelName =
        documentType === 'liabilities'
          ? 'project-liabilities-report'
          : 'project-inventory-value-report';
      a.download = `${excelName}${'_' + dayjs().format('DD MMM YYYY, HH:mm')}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);

      // console.log('blob: ', blob);
    } catch (e) {
      console.log('error exporting: ', e);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <DialogContent>
        {belowLargeScreen ? (
          <Box>
            <Grid container alignItems='center' justifyContent='space-between'>
              <Grid size={{ xs: 11 }}>
                <Tabs value={selectedTab} onChange={handleTabChange}>
                  <Tab label='On Screen' />
                  <Tab label='PDF' />
                </Tabs>
              </Grid>
              <Grid size={{ xs: 1 }} textAlign='right'>
                <Tooltip title='Close'>
                  <IconButton
                    size='small'
                    color='primary'
                    onClick={() => setOpenDocumentDialog(false)}
                  >
                    <HighlightOff color='primary' />
                  </IconButton>
                </Tooltip>
              </Grid>
            </Grid>
            <Box>
              {selectedTab === 0 && onScreenContent}
              {selectedTab === 1 && (
                <PDFContent document={document} fileName={fileName} />
              )}
            </Box>
          </Box>
        ) : (
          <PDFContent document={document} fileName={fileName} />
        )}
      </DialogContent>
      <DialogActions>
        <Box
          textAlign='right'
          margin={2}
          display={'flex'}
          alignContent={'center'}
          gap={2}
        >
          <LoadingButton
            size='small'
            onClick={() => handlExcelExport(exportedData)}
            loading={isExporting}
            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
            color='success'
            variant='contained'
          >
            <FontAwesomeIcon icon={faFileExcel} color='green' /> Excel
          </LoadingButton>
          {belowLargeScreen && (
            <Button
              variant='outlined'
              size='small'
              color='primary'
              onClick={() => setOpenDocumentDialog(false)}
            >
              Close
            </Button>
          )}
        </Box>
      </DialogActions>
    </>
  );
};

function ProjectDashboard() {
  const { project, setIsDashboardTab, reFetchProject } = useProjectProfile();
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDocumentDialog, setOpenDocumentDialog] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const { currencies } = useCurrencySelect();
  const { authOrganization } = useJumboAuth();
  const organization = authOrganization?.organization;
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));
  const baseCurrency = currencies?.find((c) => c.is_base === 1);
  const currencyCode = baseCurrency?.code;
  const hasClient = !!(project?.client_id || project?.client?.id);
  const [liabilitiesTotal, setLiabilitiesTotal] = useState(0);
  const [isExporting, setIsExporting] = useState(false);

  // Fetch all dashboard figures in one call
  const { data: dashboardFigures, isLoading: isLoadingDashboard } = useQuery({
    queryKey: ['projectDashboardFigures', project?.id],
    queryFn: () => projectsServices.getProjectDashboardFigures(project?.id),
    enabled: !!project?.id,
  });

  const processInventoryValues = (data, aggregateBy) => {
    if (!data || data.length === 0) return [];

    const allCategories = Array.from(
      new Set(data.flatMap((item) => Object.keys(item.groupedValues || {})))
    );

    return data.map((item) => {
      const transformedItem = {
        name:
          aggregateBy === 'day'
            ? dayjs(item.asOf).format('ddd, MMM D, YYYY')
            : item.asOf,
      };

      let totalValue = 0;

      allCategories.forEach((category) => {
        const value = item.groupedValues?.[category]?.balanceValue || 0;
        transformedItem[category] = value;
        totalValue += value;
      });

      transformedItem['Total Value'] = totalValue;

      return transformedItem;
    });
  };

  // fetch liabilities (creditors)
  const params = {
    as_at: dayjs().toISOString(),
    cost_center_ids: [project?.id],
  };
  const { data: liabilites, isLoading: liabilitesLoading } = useQuery({
    queryKey: [project?.id],
    queryFn: () => financialReportsServices.creditors(params),
    enabled: !!project?.id,
  });

  useEffect(() => {
    const total = liabilites?.creditors?.reduce(
      (acc, item) => (acc += item.amount),
      0
    );
    setLiabilitiesTotal(total);
  }, [liabilites]);

  // fetch inventory values
  const inventoryValuesParam = {
    from: dayjs().toISOString(),
    // from: project?.commencement_date
    //   ? dayjs(project.commencement_date).toISOString()
    //   : undefined,

    to: project?.completion_date
      ? dayjs(project.completion_date).toISOString()
      : undefined,

    cost_center_ids: project?.cost_center?.id
      ? [project.cost_center.id]
      : undefined,

    aggregate_by: 'day',
    group_by: 'product_category',
  };
  const { data: inventoryValues = [], isLoading: inventoryValuesLoading } =
    useQuery({
      queryKey: ['inventoryValueTrend', project?.id],
      queryFn: async () => {
        const res =
          await financialReportsServices.inventoryValue(inventoryValuesParam);
        return processInventoryValues(res);
      },
    });

  useEffect(() => {
    reFetchProject();
    setIsDashboardTab(true);
  }, [reFetchProject, setIsDashboardTab]);

  // Calculate percentages from unified data
  const progressiveRevenuePercent = dashboardFigures?.contract_sum
    ? (
        (dashboardFigures?.progressive_revenue /
          dashboardFigures?.contract_sum) *
        100
      ).toFixed(2)
    : '0.00';

  const budgetSpentPercent = dashboardFigures?.budget
    ? (
        (dashboardFigures?.cost_to_date / dashboardFigures?.budget) *
        100
      ).toFixed(2)
    : '0.00';

  // Format currency with two decimal places and space between amount and currency code
  const formatCurrency = (value) => {
    const amount = Number(value) || 0;
    // Always show two decimal places
    const formatted = amount.toLocaleString('en-TZ', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `${currencyCode ? currencyCode + ' ' : ''}${formatted}`;
  };

  const liabilityRows = (liabilites?.creditors || []).map((creditor) => ({
    label: creditor.name,
    value: creditor.amount,
  }));

  const inventorySnapshot = inventoryValues?.[0];
  const inventoryRows = inventorySnapshot
    ? Object.entries(inventorySnapshot)
        .filter(([key]) => key !== 'name' && key !== 'Total Value')
        .map(([key, value]) => ({ label: key, value }))
    : [];

  const inventoryTotal = inventorySnapshot?.['Total Value'] || 0;

  const canOpenLiabilitiesPdf = liabilityRows.length > 0;
  const canOpenInventoryPdf = inventoryRows.length > 0;

  const handleOpenDocumentDialog = (report) => {
    setSelectedReport(report);
    setOpenDocumentDialog(true);
  };

  const handleCloseDocumentDialog = () => {
    setOpenDocumentDialog(false);
    setSelectedReport(null);
  };

  const selectedRows =
    selectedReport === 'liabilities' ? liabilityRows : inventoryRows;
  const selectedTitle =
    selectedReport === 'liabilities'
      ? 'Project Liabilities Summary'
      : 'Project Inventory Value Summary';
  const selectedTotal =
    selectedReport === 'liabilities' ? liabilitiesTotal : inventoryTotal;
  const selectedFileName = `${selectedTitle} ${
    project?.name || project?.project_name || 'Project'
  }`;
  const selectedDocument =
    selectedReport === 'liabilities' ? (
      <ProjectLiabilitiesPDF
        organization={organization}
        project={project}
        currencyCode={currencyCode}
        rows={selectedRows}
        total={selectedTotal}
      />
    ) : (
      <ProjectInventoryValuePDF
        organization={organization}
        project={project}
        currencyCode={currencyCode}
        rows={selectedRows}
        total={selectedTotal}
      />
    );
  const selectedOnScreenContent =
    selectedReport === 'liabilities' ? (
      <ProjectLiabilitiesOnScreen
        rows={selectedRows}
        total={selectedTotal}
        currencyCode={currencyCode}
      />
    ) : (
      <ProjectInventoryValueOnScreen
        rows={selectedRows}
        total={selectedTotal}
        currencyCode={currencyCode}
      />
    );

  let exportedData;

  if (selectedReport === 'liabilities') {
    exportedData = {
      organization: organization,
      project: project,
      currencyCode: currencyCode,
      rows: selectedRows,
      total: selectedTotal,
    };
  } else {
    exportedData = {
      organization: organization,
      project: project,
      currencyCode: currencyCode,
      rows: selectedRows,
      total: selectedTotal,
    };
  }

  return (
    <>
      <Grid container spacing={3} width={'100%'}>
        {/* Edit Button */}
        <Grid size={12} display='flex' justifyContent='flex-end'>
          <Tooltip title='Edit Project'>
            <IconButton
              onClick={() => setOpenEditDialog(true)}
              sx={{
                backgroundColor: 'primary.main',
                color: '#fff',
                '&:hover': { backgroundColor: 'primary.dark' },
              }}
            >
              <EditOutlined />
            </IconButton>
          </Tooltip>
        </Grid>

        {/* Progress Card */}
        <Grid size={{ xs: 12, md: hasClient ? 12 : 12 }} display='flex'>
          <Card
            elevation={3}
            sx={{ borderRadius: 3, height: '100%', width: '100%' }}
          >
            <CardContent>
              <Box display='flex' alignItems='center' mb={3}>
                <TimelineOutlined color='warning' sx={{ mr: 1 }} />
                <Typography variant='h6' fontWeight={600}>
                  Project Progress
                </Typography>
              </Box>

              {isLoadingDashboard ? (
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Skeleton variant='text' height={80} />
                    <Skeleton variant='rectangular' height={8} />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Skeleton variant='text' height={80} />
                    <Skeleton variant='rectangular' height={8} />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Skeleton variant='text' height={80} />
                    <Skeleton variant='rectangular' height={8} />
                  </Grid>
                </Grid>
              ) : (
                (() => {
                  const execPercent =
                    dashboardFigures?.execution_percentage ?? 0;
                  const timePercent = Math.min(
                    dashboardFigures?.time_progress_percentage ?? 0,
                    100
                  );
                  let execColor = 'success';
                  const diff = timePercent - execPercent;
                  if (diff >= 10) {
                    execColor = 'error';
                  } else if (diff >= 5) {
                    execColor = 'warning';
                  }
                  return (
                    <Box>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          mb: 0.5,
                        }}
                      >
                        <Typography
                          variant='body2'
                          color='text.secondary'
                          fontWeight={500}
                        >
                          Execution:{' '}
                          {Math.min(100, Number(execPercent).toFixed(2))}%
                        </Typography>
                        <Typography
                          variant='body2'
                          color='text.secondary'
                          fontWeight={500}
                        >
                          Time Elapsed:{' '}
                          {Math.min(100, Number(timePercent).toFixed(2))}%
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
                          variant='determinate'
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

        {/* Revenue Card */}
        {hasClient && (
          <Grid size={{ xs: 12, md: 6 }}>
            <Card elevation={3} sx={{ borderRadius: 3, height: '100%' }}>
              <CardContent>
                <Box display='flex' alignItems='center' mb={2}>
                  <PaidOutlined color='primary' sx={{ mr: 1 }} />
                  <Typography variant='h6' fontWeight={600}>
                    Revenue
                  </Typography>
                </Box>

                {isLoadingDashboard ? (
                  <>
                    <Skeleton variant='text' height={80} />
                    <Skeleton variant='text' height={80} />
                    <Skeleton variant='rectangular' height={8} sx={{ mt: 2 }} />
                    <Skeleton variant='text' height={80} />
                    <Skeleton variant='rectangular' height={8} sx={{ mt: 2 }} />
                  </>
                ) : (
                  <>
                    <StatItem
                      label='Contract Sum'
                      value={formatCurrency(dashboardFigures?.contract_sum)}
                    />
                    <StatItem
                      label='Certified Revenue'
                      value={formatCurrency(
                        dashboardFigures?.certified_revenue
                      )}
                    />
                    <StatItem
                      label='Progressive Revenue'
                      value={formatCurrency(
                        dashboardFigures?.progressive_revenue
                      )}
                    />
                    <Box mt={2} mb={2}>
                      <Box display='flex' alignItems='center' gap={1}>
                        <LinearProgress
                          variant='determinate'
                          value={parseFloat(progressiveRevenuePercent)}
                          sx={{ height: 8, borderRadius: 5, mt: 1, flex: 1 }}
                        />
                        <Typography variant='body2' color='text.secondary'>
                          {parseFloat(progressiveRevenuePercent).toFixed(2)}%
                        </Typography>
                      </Box>
                    </Box>
                    <StatItem
                      label='Gross Profit to Date'
                      value={formatCurrency(
                        dashboardFigures?.gross_profit_to_date
                      )}
                    />
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Budgets Card */}
        <Grid size={{ xs: 12, md: 6 }} display='flex'>
          <Card
            elevation={3}
            sx={{ borderRadius: 3, height: '100%', width: '100%' }}
          >
            <CardContent>
              <Box display='flex' alignItems='center' mb={2}>
                <AccountBalanceWalletOutlined color='success' sx={{ mr: 1 }} />
                <Typography variant='h6' fontWeight={600}>
                  Budgets
                </Typography>
              </Box>

              {isLoadingDashboard ? (
                <>
                  <Skeleton variant='text' height={80} />
                  <Skeleton variant='text' height={80} />
                  <Skeleton variant='rectangular' height={8} sx={{ mt: 2 }} />
                </>
              ) : (
                <>
                  <StatItem
                    label='Total Budget'
                    value={formatCurrency(dashboardFigures?.budget)}
                  />
                  <StatItem
                    label='Cost to Date'
                    value={formatCurrency(dashboardFigures?.cost_to_date)}
                  />
                  <Box mt={2} paddingBottom={3}>
                    <Box
                      display='flex'
                      alignItems='center'
                      justifyContent='space-between'
                      mb={1}
                    >
                      <Typography variant='body2' color='text.secondary'>
                        % Spent
                      </Typography>
                      <Typography variant='body2' color='text.secondary'>
                        {parseFloat(budgetSpentPercent).toFixed(2)}%
                      </Typography>
                    </Box>
                    <Box display='flex' alignItems='center' gap={1}>
                      <LinearProgress
                        variant='determinate'
                        value={parseFloat(budgetSpentPercent)}
                        sx={{ height: 8, borderRadius: 5, mt: 1, flex: 1 }}
                      />
                    </Box>
                  </Box>
                  <StatItem
                    label='Remaining Budget'
                    value={formatCurrency(dashboardFigures?.remaining_budget)}
                  />
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Liabilities */}
        <Grid size={{ xs: 12, md: 6 }} display='flex'>
          <Card
            elevation={3}
            sx={{
              borderRadius: 3,
              height: '100%',
              width: '100%',
              maxHeight: 350,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <CardHeader
              avatar={<Money color='success' />}
              title={
                <Typography variant='h6' fontWeight={600}>
                  Liabilities
                </Typography>
              }
            />
            <CardContent
              sx={{
                flex: 1,
                overflowY: 'auto',
                maxHeight: 350,
                width: '100%',
              }}
            >
              {liabilitesLoading ? (
                <>
                  <Skeleton variant='text' height={80} />
                  <Skeleton variant='text' height={80} />
                  <Skeleton variant='rectangular' height={8} sx={{ mt: 2 }} />
                </>
              ) : liabilites?.creditors.length ? (
                liabilites?.creditors.map((l, i) => (
                  <React.Fragment key={i}>
                    <Divider />
                    <Grid container size={12} sx={{ py: 1, px: 1 }}>
                      <Grid size={8}>
                        <Tooltip title='Name'>
                          <Typography>{l.name}</Typography>
                        </Tooltip>
                      </Grid>
                      <Grid size={4}>
                        <Tooltip title='Amount'>
                          <Typography textAlign={'right'}>
                            {parseFloat(l.amount).toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </Typography>
                        </Tooltip>
                      </Grid>
                    </Grid>
                  </React.Fragment>
                ))
              ) : (
                <Alert variant='outlined' severity='info'>
                  No Liabilities Found
                </Alert>
              )}
            </CardContent>
            <CardActions>
              <Grid container size={12} sx={{ py: 1, px: 1 }}>
                <Grid size={6}>
                  <Tooltip title='Total'>
                    <Typography>Total</Typography>
                  </Tooltip>
                </Grid>
                <Grid size={6}>
                  <Tooltip title='value'>
                    <Typography
                      textAlign={'right'}
                      onClick={() =>
                        canOpenLiabilitiesPdf &&
                        handleOpenDocumentDialog('liabilities')
                      }
                      sx={{
                        cursor: canOpenLiabilitiesPdf ? 'pointer' : 'default',
                        '&:hover': canOpenLiabilitiesPdf
                          ? {
                              color: 'primary.main',
                            }
                          : undefined,
                      }}
                    >
                      {parseFloat(liabilitiesTotal).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </Typography>
                  </Tooltip>
                </Grid>
              </Grid>
            </CardActions>
          </Card>
        </Grid>

        {/* Inventory value */}
        <Grid size={{ xs: 12, md: 6 }} display='flex'>
          <Card
            elevation={3}
            sx={{
              borderRadius: 3,
              height: '100%',
              width: '100%',
              maxHeight: 350,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <CardHeader
              avatar={
                <AccountBalanceWalletOutlined color='success' sx={{ mr: 1 }} />
              }
              title={
                <Typography variant='h6' fontWeight={600}>
                  Inventry value
                </Typography>
              }
            />
            <CardContent
              sx={{
                flex: 1,
                overflowY: 'auto',
                maxHeight: 350,
                width: '100%',
              }}
            >
              {inventoryValuesLoading ? (
                <>
                  <Skeleton variant='text' height={80} />
                  <Skeleton variant='text' height={80} />
                  <Skeleton variant='rectangular' height={8} sx={{ mt: 2 }} />
                </>
              ) : inventoryValues?.length ? (
                inventoryValues.map((iv, i) => {
                  if (i > 0) return;
                  return Object.entries(iv).map(([key, value], idx) => {
                    if (key === 'Total Value' || key === 'name') return;
                    return (
                      <React.Fragment key={idx + 0.1}>
                        <Divider />
                        <Grid container size={12} sx={{ py: 1, px: 1 }}>
                          <Grid size={6}>
                            <Tooltip title={key}>
                              <Typography>{key}</Typography>
                            </Tooltip>
                          </Grid>
                          <Grid size={6}>
                            <Tooltip title='value'>
                              <Typography textAlign={'right'}>
                                {parseFloat(value).toLocaleString('en-US', {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </Typography>
                            </Tooltip>
                          </Grid>
                        </Grid>
                      </React.Fragment>
                    );
                  });
                })
              ) : (
                <Alert variant='outlined' severity='info'>
                  No inventory values found for now
                </Alert>
              )}
            </CardContent>
            <CardActions>
              {inventoryValues?.length > 0 &&
                inventoryValues.map((iv, i) => {
                  if (i > 0) return;
                  return Object.entries(iv).map(([key, value], idx) => {
                    if (key !== 'Total Value') return;
                    return (
                      <Grid container size={12} sx={{ py: 1, px: 1 }} key={idx}>
                        <Grid size={6}>
                          <Tooltip title={key}>
                            <Typography>{key}</Typography>
                          </Tooltip>
                        </Grid>
                        <Grid size={6}>
                          <Tooltip title='value'>
                            <Typography
                              textAlign={'right'}
                              onClick={() =>
                                canOpenInventoryPdf &&
                                handleOpenDocumentDialog('inventory')
                              }
                              sx={{
                                cursor: canOpenInventoryPdf
                                  ? 'pointer'
                                  : 'default',
                                '&:hover': canOpenInventoryPdf
                                  ? {
                                      color: 'primary.main',
                                    }
                                  : undefined,
                              }}
                            >
                              {parseFloat(value).toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </Typography>
                          </Tooltip>
                        </Grid>
                      </Grid>
                    );
                  });
                })}
            </CardActions>
          </Card>
        </Grid>
      </Grid>

      <Dialog
        open={openDocumentDialog}
        fullWidth
        fullScreen={belowLargeScreen}
        maxWidth='md'
        scroll={belowLargeScreen ? 'body' : 'paper'}
        onClose={handleCloseDocumentDialog}
      >
        {openDocumentDialog && selectedReport && (
          <DashboardDocumentDialog
            setOpenDocumentDialog={handleCloseDocumentDialog}
            fileName={selectedFileName}
            document={selectedDocument}
            onScreenContent={selectedOnScreenContent}
            exportedData={exportedData}
            documentType={selectedReport}
          />
        )}
      </Dialog>

      <Dialog open={openEditDialog} scroll='paper' fullWidth maxWidth='md'>
        <EditProject project={project} setOpenEditDialog={setOpenEditDialog} />
      </Dialog>
    </>
  );
}

export default ProjectDashboard;
