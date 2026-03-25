import { useState } from 'react';
import {
  Alert,
  Box,
  Chip,
  Dialog,
  Grid,
  IconButton,
  LinearProgress,
  Skeleton,
  Tooltip,
  Typography,
  useMediaQuery,
  DialogActions,
  Button,
  DialogContent,
  DialogTitle,
  Tabs,
  Tab,
  Checkbox,
  Stack
} from '@mui/material';
import { HighlightOff, VisibilityOutlined } from '@mui/icons-material';
import PDFContent from '@/components/pdf/PDFContent';
import projectsServices from '../../project-services';
import { useQuery } from '@tanstack/react-query';
import { useCurrencySelect } from '@/components/masters/Currencies/CurrencySelectProvider';
import LedgerSelect from '@/components/accounts/ledgers/forms/LedgerSelect';
import LedgerStatementDialogContent from '@/components/accounts/ledgers/list/ledgerStatement/LedgerStatementDialogContent';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import BudgetsPDF from './preview/BudgetsPDF';
import BudgetsOnscreen from './preview/BudgetsOnscreen';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { useProjectProfile } from '../ProjectProfileProvider';

function BudgetsDocumentDialog({ openBudgetsDialog, onClose, budgetDetails, baseCurrency, organization }) {
  const [tab, setTab] = useState(0);
  const [withDetails, setWithDetails] = useState(false);
  const [pdfKey, setPdfKey] = useState(0);
  const { theme } = useJumboTheme();
  const { project } = useProjectProfile();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const { data: timelineActivitiesData, isFetching: isTimelineActivitiesFetching } = useQuery({
    queryKey: ['projectTimelineActivities', project?.id],
    queryFn: () => projectsServices.showProjectTimelineActivities(project?.id),
    enabled: !!project?.id,
  });

  const getTaskOptions = (activities, depth = 0) => {
    if (!Array.isArray(activities)) {
      return [];
    }
  
    return activities.flatMap(activity => {
      const { children, tasks } = activity;
  
      const tasksOptions = (tasks || []).map(task => ({
        id: task.id,
        label: task.name
      }));
  
      const tasksFromgroupChildren = getTaskOptions(children, depth + 1);
  
      return [...tasksOptions, ...tasksFromgroupChildren];
    });
  };

  const allTasks = getTaskOptions(timelineActivitiesData);

  // When toggling details, force PDF rerender
  const handleDetailsChange = (e) => {
    setWithDetails(e.target.checked);
    setPdfKey((prev) => prev + 1);
  };

  if (isTimelineActivitiesFetching) { 
    return (
      <Grid container width={'100%'}>
        <Grid size={12}>
          <Stack spacing={2} sx={{ width: '100%', mb: 2 }}>
            <Skeleton variant="text" width={180} height={32} sx={{ borderRadius: 1, marginLeft: 'auto' }} />
            <Skeleton variant="rectangular" width="100%" height={48} sx={{ borderRadius: 1 }} />
            <Skeleton variant="rectangular" width="100%" height={32} sx={{ borderRadius: 1 }} />
          </Stack>
        </Grid>
      </Grid>
    );
  }

  return (
    <Dialog open={openBudgetsDialog} onClose={onClose} maxWidth="md" fullWidth fullScreen={belowLargeScreen}>
      <DialogTitle>
        <Stack direction={'row'} justifyContent={'center'} alignItems={'center'} position={'relative'}>
          <Typography>With More Details</Typography>
          <Checkbox checked={withDetails} onChange={handleDetailsChange} />
          {belowLargeScreen && (
            <Tooltip title="Close">
              <IconButton size="small" onClick={onClose} sx={{ position: 'absolute', right: 5 }}>
                <HighlightOff color="primary" />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      </DialogTitle>
      <Tabs value={tab} onChange={(_, v) => setTab(v)}>
        <Tab label="PDF" />
        <Tab label="On Screen" />
      </Tabs>
      <DialogContent>
        {tab === 0 ? (
          <PDFContent
            key={pdfKey}
            fileName="Budgets"
            document={<BudgetsPDF allTasks={allTasks} budgetDetails={budgetDetails} baseCurrency={baseCurrency} withDetails={withDetails} organization={organization} />}
          />
        ) : (
          <BudgetsOnscreen organization={organization} budgetDetails={budgetDetails} baseCurrency={baseCurrency} withDetails={withDetails} />
        )}
      </DialogContent>
      {!belowLargeScreen && (
        <DialogActions>
          <Button onClick={onClose} variant="outlined" color="primary">Close</Button>
        </DialogActions>
      )}
    </Dialog>
  );
}

function BudgetsAccordionDetails({ budget, expanded }) {
  const { currencies } = useCurrencySelect();
  const baseCurrency = currencies?.find(c => c.is_base === 1);
  const [searchQueryNames, setSearchQueryNames] = useState([]);
  const [ledgerDialogOpen, setLedgerDialogOpen] = useState(false);
  const [ledgerFilters, setLedgerFilters] = useState(null);
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));
  const { authOrganization: { organization } } = useJumboAuth();

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

  const filteredExpenses = budgetItemsDetails?.expenses_budgeted?.filter(expense =>
    searchQueryNames.length === 0 || searchQueryNames.includes(expense.name)
  );

  // Dialog state for viewing all expenses
  const [openBudgetsDialog, setOpenBudgetsDialog] = useState(false);

  const totalBudgetedAmount = filteredExpenses?.reduce((total, item) => total + item?.budgeted, 0) || 0;
  const totalSpentAmount = filteredExpenses?.reduce((total, item) => total + item?.spent, 0) || 0;

  const handleViewLedger = (item) => {
    setLedgerFilters({
      from: budget?.start_date,
      to: budget?.end_date,
      cost_center_ids: budget?.cost_center_id ? [budget.cost_center_id] : 'all',
      ledger_id: item?.ledger_id,
      ledgerName: item?.name,
      increasesWith: item?.increasesWith
    });
    setLedgerDialogOpen(true);
  };
 
  return (
    <>
      {isLoading ? (
        <Grid container width={'100%'}>
          <Grid size={12}>
            <Stack spacing={2} sx={{ width: '100%', mb: 2 }}>
              <Skeleton variant="text" width={180} height={32} sx={{ borderRadius: 1, marginLeft: 'auto' }} />
              <Skeleton variant="rectangular" width="100%" height={48} sx={{ borderRadius: 1 }} />
              <Skeleton variant="rectangular" width="100%" height={32} sx={{ borderRadius: 1 }} />
            </Stack>
          </Grid>
        </Grid>
      ) : (
        <Grid container spacing={1} width={'100%'}>
          {/* Filter & Actions */}
          <Grid container size={12} spacing={2} width={'100%'} justifyContent="flex-end">
            <Grid size={{xs: 12, md: 6}} textAlign="end">
              <LedgerSelect
                multiple
                label="Filter by Expense"
                allowedGroups={['Expenses']}
                onChange={(newValue) => setSearchQueryNames(newValue.map(l => l.name))}
              />
            </Grid>
          </Grid>

          {/* Summary */}
          <Grid container size={12} spacing={2} width={'100%'} paddingBottom={1}>
            <Grid size={{xs: 12, md: 4}}>
              <Typography variant="subtitle1" color="textSecondary">Total Budgeted</Typography>
              <Typography variant="h5">
                {totalBudgetedAmount?.toLocaleString('en-US', { style: 'currency', currency: baseCurrency?.code })}
              </Typography>
            </Grid>
            <Grid size={{xs: 12, md: 4}}>
              <Typography variant="subtitle1" color="textSecondary">Total Spent</Typography>
              <Typography variant="h5">
                {totalSpentAmount?.toLocaleString('en-US', { style: 'currency', currency: baseCurrency?.code })}
              </Typography>
            </Grid>
            <Grid size={{xs: 12, md: 4}}>
              <Typography variant="subtitle1" color="textSecondary">Percentage Spent</Typography>
              <Typography variant="h5">
                {(totalBudgetedAmount ? (totalSpentAmount / totalBudgetedAmount * 100).toFixed(2) : 0)}%
              </Typography>
              <Button size="small" sx={{ mt: 1 }} variant="outlined" onClick={() => setOpenBudgetsDialog(true)}>
                View Details
              </Button>
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
            {filteredExpenses?.length > 0 ? filteredExpenses.map((item, index) => {
              const percentageSpent = (item?.budgeted === 0) ? Infinity : (item?.spent / item?.budgeted) * 100;

              return (
                <Grid
                  key={index}
                  container
                  size={12}
                  width={'100%'}
                  columnSpacing={2}
                  alignItems="center"
                  sx={{
                    cursor: 'pointer',
                    borderTop: 1,
                    borderColor: 'divider',
                    '&:hover': { bgcolor: 'action.hover' },
                    padding: 1,
                  }}
                >
                  <Grid size={{xs: 7, md: 5.7}}>
                    <Tooltip title="Name">
                      <Typography variant="h6">{item?.name}</Typography>
                    </Tooltip>
                  </Grid>
                  <Grid size={{xs: 5, md: 2.3}}>
                    <Tooltip title="Budgeted">
                      <Typography variant="h6">
                        {item?.budgeted.toLocaleString('en-US', { style: 'currency', currency: baseCurrency?.code })}
                      </Typography>
                    </Tooltip>
                  </Grid>
                  <Grid size={{xs: 8, md: 2}}>
                    <Tooltip title="Spent">
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <Typography variant="h6">
                          {item?.spent.toLocaleString('en-US', { style: 'currency', currency: baseCurrency?.code })}
                        </Typography>
                        <Tooltip title={`View ${item?.name}`}>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewLedger(item);
                            }}
                          >
                            <VisibilityOutlined fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Tooltip>
                  </Grid>
                  <Grid size={{xs: 4, md: 2}}>
                    <Tooltip title="Percentage Spent">
                      <Chip
                        label={
                          percentageSpent === Infinity
                            ? 'unbudgeted'
                            : `${percentageSpent.toFixed(2)}%`
                        }
                        color={percentageSpent === Infinity ? 'error' : getPercentageColor(percentageSpent)}
                        size="small"
                      />
                    </Tooltip>
                  </Grid>
                  <Grid size={12} paddingTop={1}>
                    <Tooltip title="Percentage Spent">
                      <Box sx={{ width: '100%', textAlign: 'center' }}>
                        <LinearProgress
                          variant="determinate"
                          value={percentageSpent === Infinity ? 100 : percentageSpent}
                          color={percentageSpent === Infinity ? 'error' : getPercentageColor(percentageSpent)}
                          sx={{ height: 15, borderRadius: 5,
                            ...(percentageSpent === Infinity && {
                              backgroundColor: (theme) => theme.palette.error.main,
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: (theme) => theme.palette.error.main,
                              },
                            })
                          }}
                        />
                      </Box>
                    </Tooltip>
                  </Grid>
                </Grid>
              );
            }) : (
              <Alert variant="outlined" severity="info">No expenses budgeted found</Alert>
            )}
          </Grid>
        </Grid>
      )}

      {ledgerDialogOpen && (
        <Dialog
          open={ledgerDialogOpen}
          onClose={() => setLedgerDialogOpen(false)}
          maxWidth="md"
          fullWidth
          fullScreen={belowLargeScreen}
        >
          <LedgerStatementDialogContent
            commingFilters={ledgerFilters}
            setOpen={setLedgerDialogOpen}
          />
        </Dialog>
      )}
    </>
  );
}

export default BudgetsAccordionDetails;
