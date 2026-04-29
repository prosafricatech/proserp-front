import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import LedgerSelect from '@/components/accounts/ledgers/forms/LedgerSelect';
import LedgerStatementDialogContent from '@/components/accounts/ledgers/list/ledgerStatement/LedgerStatementDialogContent';
import { useCurrencySelect } from '@/components/masters/Currencies/CurrencySelectProvider';
import PDFContent from '@/components/pdf/PDFContent';
import { faFileExcel } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { HighlightOff, VisibilityOutlined } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  LinearProgress,
  Skeleton,
  Stack,
  Switch,
  Tab,
  Tabs,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import projectsServices from '../../project-services';
import { useProjectProfile } from '../ProjectProfileProvider';
import BudgetsOnscreen from './preview/BudgetsOnscreen';
import BudgetsPDF from './preview/BudgetsPDF';

function BudgetsDocumentDialog({
  openBudgetsDialog,
  onClose,
  budgetDetails,
  baseCurrency,
  organization,
  forceWithDetails = false,
}) {
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));
  const canShowOnScreen = belowLargeScreen;
  const [tab, setTab] = useState(forceWithDetails && canShowOnScreen ? 0 : belowLargeScreen ? 1 : 0);
  const [withDetails, setWithDetails] = useState(forceWithDetails);
  const [groupingMode, setGroupingMode] = useState('default');
  const [pdfKey, setPdfKey] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const { project } = useProjectProfile();

  useEffect(() => {
    if (forceWithDetails) {
      setWithDetails(true);
      setTab(canShowOnScreen ? 0 : 0);
    }
  }, [forceWithDetails, canShowOnScreen]);

  const {
    data: timelineActivitiesData,
    isFetching: isTimelineActivitiesFetching,
  } = useQuery({
    queryKey: ['projectTimelineActivities', project?.id],
    queryFn: () => projectsServices.showProjectTimelineActivities(project?.id),
    enabled: !!project?.id,
  });

  const getTaskOptions = (activities, depth = 0) => {
    if (!Array.isArray(activities)) {
      return [];
    }

    return activities.flatMap((activity) => {
      const { children, tasks } = activity;

      const tasksOptions = (tasks || []).map((task) => ({
        id: task.id,
        label: task.name,
      }));

      const tasksFromgroupChildren = getTaskOptions(children, depth + 1);

      return [...tasksOptions, ...tasksFromgroupChildren];
    });
  };

  const allTasks = getTaskOptions(timelineActivitiesData);

  // When toggling details, force PDF rerender
  const handleDetailsChange = (e) => {
    if (forceWithDetails) return;
    setWithDetails(e.target.checked);
    if (!e.target.checked) {
      setGroupingMode('default');
    }
    setPdfKey((prev) => prev + 1);
  };

  const handleGroupingModeChange = (e) => {
    setGroupingMode(e.target.value);
    setPdfKey((prev) => prev + 1);
  };

  if (isTimelineActivitiesFetching) {
    return (
      <Grid container width={'100%'}>
        <Grid size={12}>
          <Stack spacing={2} sx={{ width: '100%', mb: 2 }}>
            <Skeleton
              variant='text'
              width={180}
              height={32}
              sx={{ borderRadius: 1, marginLeft: 'auto' }}
            />
            <Skeleton
              variant='rectangular'
              width='100%'
              height={48}
              sx={{ borderRadius: 1 }}
            />
            <Skeleton
              variant='rectangular'
              width='100%'
              height={32}
              sx={{ borderRadius: 1 }}
            />
          </Stack>
        </Grid>
      </Grid>
    );
  }

  const exportedData = {
    allTasks: allTasks,
    budgetDetails: budgetDetails,
    baseCurrency: baseCurrency,
    withDetails: withDetails,
    grouping_mode: withDetails ? groupingMode : 'default',
    organization: organization,
  };

  const handleExcelExport = async (exportedData) => {
    setIsExporting(true);
    try {
      const blob =
        await projectsServices.exportBudgetItemsDetailsExcel(exportedData);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${budgetDetails?.name || 'budget'}-details.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error('error exporting excel: ', e);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog
      open={openBudgetsDialog}
      onClose={onClose}
      maxWidth='md'
      fullWidth
      fullScreen={belowLargeScreen}
    >
      <DialogTitle>
        <Box
          display='flex'
          alignItems='center'
          justifyContent='space-between'
          position='relative'
        >
          <Box display='flex' alignItems='center'>
            {!forceWithDetails && (
              <>
                <Typography>Detailed</Typography>
                <Switch
                  checked={withDetails}
                  onChange={handleDetailsChange}
                  slotProps={{ input: { 'aria-label': 'controlled' } }}
                />
              </>
            )}
            {(withDetails || forceWithDetails) && (
              <FormControl size='small' sx={{ ml: 2 }}>
                <Box display='flex' alignItems='center'>
                  <Typography>Group By Task</Typography>
                  <Switch
                    checked={groupingMode === 'task'}
                    onChange={(e) => {
                      handleGroupingModeChange({
                        target: { value: e.target.checked ? 'task' : 'default' },
                      });
                    }}
                    slotProps={{ input: { 'aria-label': 'group by task' } }}
                  />
                </Box>
              </FormControl>
            )}
          </Box>
          {belowLargeScreen ? (
            <Box display='flex' alignItems='center' gap={1}>
              {!forceWithDetails && (
                <LoadingButton
                  size='small'
                  onClick={() => handleExcelExport(exportedData)}
                  color='success'
                  variant='contained'
                  loading={isExporting}
                  startIcon={<FontAwesomeIcon icon={faFileExcel} />}
                >
                  Excel
                </LoadingButton>
              )}
              <Tooltip title='Close'>
                <IconButton size='small' onClick={onClose}>
                  <HighlightOff color='primary' />
                </IconButton>
              </Tooltip>
            </Box>
          ) : (
            !forceWithDetails && (
              <LoadingButton
                size='small'
                onClick={() => handleExcelExport(exportedData)}
                color='success'
                variant='contained'
                loading={isExporting}
                startIcon={<FontAwesomeIcon icon={faFileExcel} />}
                sx={{ ml: 2 }}
              >
                Excel
              </LoadingButton>
            )
          )}
        </Box>
      </DialogTitle>

      {/* Tabs Row */}
      <Grid container alignItems='center' sx={{ px: 3, pb: 1 }}>
        <Grid item>
          {canShowOnScreen && (
            <Tabs value={tab} onChange={(_, v) => setTab(v)}>
              {forceWithDetails ? (
                [
                  <Tab key='onscreen' label='On Screen' />,
                  <Tab key='pdf' label='PDF' />,
                ]
              ) : (
                [
                  <Tab key='pdf' label='PDF' />,
                  <Tab key='onscreen' label='On Screen' />,
                ]
              )}
            </Tabs>
          )}
        </Grid>
      </Grid>

      <DialogContent>
        {forceWithDetails ? (
          canShowOnScreen && tab === 0 ? (
            <BudgetsOnscreen
              allTasks={allTasks}
              organization={organization}
              budgetDetails={budgetDetails}
              baseCurrency={baseCurrency}
              withDetails={withDetails}
              groupingMode={withDetails ? groupingMode : 'default'}
              hideSummary={forceWithDetails}
            />
          ) : (
            <PDFContent
              key={pdfKey}
              fileName='Budgets'
              document={
                <BudgetsPDF
                  allTasks={allTasks}
                  budgetDetails={budgetDetails}
                  baseCurrency={baseCurrency}
                  withDetails={withDetails}
                  groupingMode={withDetails ? groupingMode : 'default'}
                  hideSummary={forceWithDetails}
                  organization={organization}
                />
              }
            />
          )
        ) : tab === 0 ? (
          <PDFContent
            key={pdfKey}
            fileName='Budgets'
            document={
              <BudgetsPDF
                allTasks={allTasks}
                budgetDetails={budgetDetails}
                baseCurrency={baseCurrency}
                withDetails={withDetails}
                groupingMode={withDetails ? groupingMode : 'default'}
                hideSummary={forceWithDetails}
                organization={organization}
              />
            }
          />
        ) : (
          canShowOnScreen && (
          <BudgetsOnscreen
            allTasks={allTasks}
            organization={organization}
            budgetDetails={budgetDetails}
            baseCurrency={baseCurrency}
            withDetails={withDetails}
            groupingMode={withDetails ? groupingMode : 'default'}
            hideSummary={forceWithDetails}
          />
          )
        )}
      </DialogContent>
      {!belowLargeScreen && (
        <DialogActions>
          <Button onClick={onClose} variant='outlined' color='primary'>
            Close
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
}

function BudgetsAccordionDetails({ budget, expanded }) {
  const { currencies } = useCurrencySelect();
  const baseCurrency = currencies?.find((c) => c.is_base === 1);
  const [searchQueryNames, setSearchQueryNames] = useState([]);
  const [ledgerDialogOpen, setLedgerDialogOpen] = useState(false);
  const [ledgerFilters, setLedgerFilters] = useState(null);
  const [budgetedPdfDialogOpen, setBudgetedPdfDialogOpen] = useState(false);
  const [budgetedPdfDetails, setBudgetedPdfDetails] = useState(null);
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));
  const {
    authOrganization: { organization },
  } = useJumboAuth();

  // React Query v5 syntax
  const { data: budgetItemsDetails, isLoading } = useQuery({
    queryKey: ['budgetItemsDetails', { id: budget.id }],
    queryFn: () => projectsServices.getbudgetItemsDetails(budget.id),
    enabled: !!expanded,
  });

  const getPercentageColor = (percentage) => {
    if (percentage <= 50) return 'success';
    if (percentage > 50 && percentage < 75) return 'warning';
    return 'error';
  };

  const filteredExpenses = budgetItemsDetails?.expenses_budgeted?.filter(
    (expense) =>
      searchQueryNames.length === 0 || searchQueryNames.includes(expense.name)
  );

  // Dialog state for viewing all expenses
  const [openBudgetsDialog, setOpenBudgetsDialog] = useState(false);

  const totalBudgetedAmount =
    filteredExpenses?.reduce((total, item) => total + item?.budgeted, 0) || 0;
  const totalSpentAmount =
    filteredExpenses?.reduce((total, item) => total + item?.spent, 0) || 0;

  const handleViewLedger = (item) => {
    setLedgerFilters({
      from: budget?.start_date,
      to: budget?.end_date,
      cost_center_ids: budget?.cost_center_id ? [budget.cost_center_id] : 'all',
      ledger_id: item?.ledger_id,
      ledgerName: item?.name,
      increasesWith: item?.increasesWith,
    });
    setLedgerDialogOpen(true);
  };

  const handleViewBudgeted = async (item) => {
    try {
      const response = await projectsServices.getBudgetedCostItems(
        budget?.id,
        item?.ledger_id
      );

      const normalizeBudgetDetails = (payload, fallbackName) => {
        const rawPayload = payload?.budgetDetails || payload?.budget_details || payload;

        if (Array.isArray(rawPayload)) {
          const hasSubcontractItems = rawPayload.some(
            (entry) => entry?.project_task_id || entry?.expense_ledger_id
          );
          const hasProductItems = rawPayload.some(
            (entry) => entry?.product_name || entry?.product || entry?.unit_symbol
          );

          if (hasSubcontractItems) {
            return {
              name: fallbackName,
              subcontract_task_items: rawPayload,
            };
          }

          if (hasProductItems) {
            return {
              name: fallbackName,
              product_items: rawPayload,
            };
          }

          return {
            name: fallbackName,
            ledger_items: rawPayload,
          };
        }

        if (rawPayload && typeof rawPayload === 'object') {
          return {
            ...rawPayload,
            name: rawPayload.name || fallbackName,
          };
        }

        return {
          name: fallbackName,
          ledger_items: [],
          product_items: [],
          subcontract_task_items: [],
        };
      };

      const normalized = normalizeBudgetDetails(response, item?.name);
      setBudgetedPdfDetails(normalized);
      setBudgetedPdfDialogOpen(true);
    } catch (error) {
      console.error('error fetching budgeted cost items: ', error);
    }
  };

  return (
    <>
      {isLoading ? (
        <Grid container width={'100%'}>
          <Grid size={12}>
            <Stack spacing={2} sx={{ width: '100%', mb: 2 }}>
              <Skeleton
                variant='text'
                width={180}
                height={32}
                sx={{ borderRadius: 1, marginLeft: 'auto' }}
              />
              <Skeleton
                variant='rectangular'
                width='100%'
                height={48}
                sx={{ borderRadius: 1 }}
              />
              <Skeleton
                variant='rectangular'
                width='100%'
                height={32}
                sx={{ borderRadius: 1 }}
              />
            </Stack>
          </Grid>
        </Grid>
      ) : (
        <Grid container spacing={1} width={'100%'}>
          {/* Filter & Actions */}
          <Grid
            container
            size={12}
            spacing={2}
            width={'100%'}
            justifyContent='flex-end'
          >
            <Grid size={{ xs: 12, md: 6 }} textAlign='end'>
              <LedgerSelect
                multiple
                label='Filter by Expense'
                allowedGroups={['Expenses']}
                onChange={(newValue) =>
                  setSearchQueryNames(newValue.map((l) => l.name))
                }
              />
            </Grid>
          </Grid>

          {/* Summary */}
          <Grid
            container
            size={12}
            spacing={2}
            width={'100%'}
            paddingBottom={1}
          >
            <Grid size={{ xs: 12, md: 4 }}>
              <Typography variant='subtitle1' color='textSecondary'>
                Total Budgeted
              </Typography>
              <Typography variant='h5'>
                {totalBudgetedAmount?.toLocaleString('en-US', {
                  style: 'currency',
                  currency: baseCurrency?.code,
                })}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Typography variant='subtitle1' color='textSecondary'>
                Total Spent
              </Typography>
              <Typography variant='h5'>
                {totalSpentAmount?.toLocaleString('en-US', {
                  style: 'currency',
                  currency: baseCurrency?.code,
                })}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }} container alignItems='center'>
              <Grid size={{ xs: 11, md: 11 }}>
                <Typography variant='subtitle1' color='textSecondary'>
                  Percentage Spent
                </Typography>
                <Typography variant='h5'>
                  {totalBudgetedAmount
                    ? ((totalSpentAmount / totalBudgetedAmount) * 100).toFixed(
                        2
                      )
                    : 0}
                  %
                </Typography>
              </Grid>
            </Grid>
            <Grid
              size={{ xs: 12, md: 1 }}
              display='flex'
              justifyContent='flex-end'
            >
              <Tooltip title='View Budget Details'>
                <IconButton
                  size='small'
                  sx={{ mt: 1 }}
                  onClick={() => setOpenBudgetsDialog(true)}
                >
                  <VisibilityOutlined fontSize='small' />
                </IconButton>
              </Tooltip>
            </Grid>
          </Grid>
          {/* Budgets Document Dialog */}
          <BudgetsDocumentDialog
            openBudgetsDialog={openBudgetsDialog}
            onClose={() => setOpenBudgetsDialog(false)}
            budgetDetails={budgetItemsDetails}
            baseCurrency={baseCurrency}
            organization={organization}
          />

          {/* Expenses */}
          <Grid size={12} paddingTop={1} width={'100%'}>
            {filteredExpenses?.length > 0 ? (
              filteredExpenses.map((item, index) => {
                const percentageSpent =
                  item?.budgeted === 0
                    ? Infinity
                    : (item?.spent / item?.budgeted) * 100;

                return (
                  <Grid
                    key={index}
                    container
                    size={12}
                    width={'100%'}
                    columnSpacing={2}
                    alignItems='center'
                    sx={{
                      cursor: 'pointer',
                      borderTop: 1,
                      borderColor: 'divider',
                      '&:hover': { bgcolor: 'action.hover' },
                      padding: 1,
                    }}
                  >
                    <Grid size={{ xs: 7, md: 5.7 }}>
                      <Tooltip title='Name'>
                        <Typography variant='h6'>{item?.name}</Typography>
                      </Tooltip>
                    </Grid>
                    <Grid size={{ xs: 5, md: 2.3 }}>
                      <Tooltip title='Budgeted, click to view'>
                        <Typography
                          variant='h6'
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewBudgeted(item);
                          }}
                          sx={{
                            cursor: 'pointer',
                            '&:hover': { color: 'primary.main' },
                          }}
                        >
                          {item?.budgeted.toLocaleString('en-US', {
                            style: 'currency',
                            currency: baseCurrency?.code,
                          })}
                        </Typography>
                      </Tooltip>
                    </Grid>
                    <Grid size={{ xs: 8, md: 2 }}>
                      <Tooltip title='Spent, click to view'>
                        <Box display='flex' alignItems='center' gap={0.5}>
                          <Typography
                            variant='h6'
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewLedger(item);
                            }}
                            sx={{
                              cursor: 'pointer',
                              '&:hover': { color: 'primary.main' },
                            }}
                          >
                            {item?.spent.toLocaleString('en-US', {
                              style: 'currency',
                              currency: baseCurrency?.code,
                            })}
                          </Typography>
                        </Box>
                      </Tooltip>
                    </Grid>
                    <Grid size={{ xs: 4, md: 2 }}>
                      <Tooltip title='Percentage Spent'>
                        <Chip
                          label={
                            percentageSpent === Infinity
                              ? 'unbudgeted'
                              : `${percentageSpent.toFixed(2)}%`
                          }
                          color={
                            percentageSpent === Infinity
                              ? 'error'
                              : getPercentageColor(percentageSpent)
                          }
                          size='small'
                        />
                      </Tooltip>
                    </Grid>
                    <Grid size={12} paddingTop={1}>
                      <Tooltip title='Percentage Spent'>
                        <Box sx={{ width: '100%', textAlign: 'center' }}>
                          <LinearProgress
                            variant='determinate'
                            value={
                              percentageSpent === Infinity
                                ? 100
                                : percentageSpent
                            }
                            color={
                              percentageSpent === Infinity
                                ? 'error'
                                : getPercentageColor(percentageSpent)
                            }
                            sx={{
                              height: 15,
                              borderRadius: 5,
                              ...(percentageSpent === Infinity && {
                                backgroundColor: (theme) =>
                                  theme.palette.error.main,
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor: (theme) =>
                                    theme.palette.error.main,
                                },
                              }),
                            }}
                          />
                        </Box>
                      </Tooltip>
                    </Grid>
                  </Grid>
                );
              })
            ) : (
              <Alert variant='outlined' severity='info'>
                No expenses budgeted found
              </Alert>
            )}
          </Grid>
        </Grid>
      )}

      {ledgerDialogOpen && (
        <Dialog
          open={ledgerDialogOpen}
          onClose={() => setLedgerDialogOpen(false)}
          maxWidth='md'
          fullWidth
          fullScreen={belowLargeScreen}
        >
          <LedgerStatementDialogContent
            commingFilters={ledgerFilters}
            setOpen={setLedgerDialogOpen}
          />
        </Dialog>
      )}

      {budgetedPdfDialogOpen && budgetedPdfDetails && (
        <BudgetsDocumentDialog
          openBudgetsDialog={budgetedPdfDialogOpen}
          onClose={() => setBudgetedPdfDialogOpen(false)}
          budgetDetails={budgetedPdfDetails}
          baseCurrency={baseCurrency}
          organization={organization}
          forceWithDetails={true}
        />
      )}
    </>
  );
}

export default BudgetsAccordionDetails;
