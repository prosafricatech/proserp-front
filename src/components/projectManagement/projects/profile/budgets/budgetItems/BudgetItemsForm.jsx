import React, { useEffect, useState } from 'react';
import {
  Grid,
  TextField,
  DialogActions,
  Button,
  DialogContent,
  DialogTitle,
  Tabs,
  Tab,
  Stack,
  Autocomplete,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Alert,
  Tooltip,
} from '@mui/material';
import LedgerItemsTab from './tabs/LedgerItemsTab';
import LedgerItemsRow from './tabs/LedgerItemsRow';
import ProductItemsTab from './tabs/ProductItemsTab';
import ProductItemsRow from './tabs/ProductItemsRow';
import { useProjectProfile } from '../../ProjectProfileProvider';
import dayjs from 'dayjs';
import SubContractTasksTab from './tabs/SubContractTasksTab';
import SubContractTasksRow from './tabs/SubContractTasksRow';
import { useCurrencySelect } from '@/components/masters/Currencies/CurrencySelectProvider';
import { Div } from '@jumbo/shared';
import LedgerSelect from '@/components/accounts/ledgers/forms/LedgerSelect';

const BudgetItemsForm = ({ budget, setOpenDialog }) => {
  const { deliverable_groups, setFetchDeliverables, projectTimelineActivities, setFetchTimelineActivities} = useProjectProfile();
  const [activeTab, setActiveTab] = useState(0);
  const [boundToOption, setBoundToOption] = useState('');
  const [selectedItemable, setSelectedItemable] = useState(null)
  const [selectedBoundTo, setSelectedBoundTo] = useState(null)
  const [searchQueryIds, setSearchQueryIds] = useState([]);
  const { currencies } = useCurrencySelect();
  const baseCurrency = currencies.find(c => c.is_base === 1);

  useEffect(() => {
    if (!deliverable_groups) {
      setFetchDeliverables(true);
    } else {
      setFetchDeliverables(false)
    }

    if (!projectTimelineActivities) {
      setFetchTimelineActivities(true);
    } else {
      setFetchTimelineActivities(false)
    }

  }, [projectTimelineActivities, deliverable_groups, setFetchDeliverables, setFetchTimelineActivities]);

  const deliverablesOptions = (groups, depth = 0) => {
    if (!Array.isArray(groups)) {
      return [];
    }
  
    return groups?.flatMap(group => {
      const { children, deliverables } = group;
      const deliverableOptions = (deliverables || [])?.map(deliverable => ({
        label: deliverable.description,
        id: deliverable.id,
        tasks: deliverable.tasks
      }));
      const groupChildren = deliverablesOptions(children, depth + 1);
      return [...deliverableOptions, ...groupChildren];
    });
  };

  const getTaskOptions = (activities, depth = 0) => {
    if (!Array.isArray(activities)) {
      return [];
    }
  
    return activities.flatMap(activity => {
      const { children, tasks } = activity;
  
      const tasksOptions = (tasks || []).map(task => ({
        id: task.id,
        label: task.name,
        handlers: task.handlers,
        dependencies: task.dependencies,
        quantity: task.quantity,
        measurement_unit: task.measurement_unit,
        start_date: dayjs(task.start_date).format('YYYY-MM-DD'),
        end_date: dayjs(task.end_date).format('YYYY-MM-DD'),
        weighted_percentage: task.weighted_percentage,
        project_deliverable_id: task.project_deliverable_id
      }));
  
      const tasksFromgroupChildren = getTaskOptions(children, depth + 1);
  
      return [...tasksOptions, ...tasksFromgroupChildren];
    });
  };

  const allTasks = getTaskOptions(projectTimelineActivities);
  const deliverables = deliverablesOptions(deliverable_groups);

  const [existingLedgerItems, setExistingLedgerItems] = useState([]);
  const [existingProductItems, setExistingProductItems] = useState([]);
  const [existingSubContractTasks, setExistingSubContractTasks] = useState([]);

  useEffect(() => {
    setExistingLedgerItems(budget.ledger_items || [])
    setExistingProductItems(budget.product_items || [])
    setExistingSubContractTasks(budget.subcontract_task_items || [])
  }, [budget])

  const filteredExistingLedgerItems = selectedItemable?.id
    ? existingLedgerItems.filter(existItem =>
        existItem.bound_to === selectedBoundTo && existItem.budget_itemable_id === selectedItemable?.id
      )
    : existingLedgerItems;

  const filteredExistingProductItems = selectedItemable?.id
    ? existingProductItems.filter(existItem =>
        existItem.bound_to === selectedBoundTo && existItem.budget_itemable_id === selectedItemable?.id
      )
    : existingProductItems;   
    
  const filteredExistingSubContractTasks = selectedItemable?.id
    ? existingSubContractTasks.filter(existItem =>
        existItem.project_task_id === selectedItemable?.id
      )
    : existingSubContractTasks;   

  const filteredLedgerItemsByExpense = filteredExistingLedgerItems?.filter(ledgerItem =>
    searchQueryIds.length === 0 || searchQueryIds.includes(ledgerItem.ledger?.id)
  );  

  const totalExpenseTabAmount = filteredLedgerItemsByExpense.reduce((total, item) => total + ((item.quantity || 0) * (item.rate || 0) * (item.exchange_rate || 1)), 0);
  const totalProductTabAmount = filteredExistingProductItems.reduce((total, item) => total + ((item.quantity || 0) * (item.rate || 0) * (item.exchange_rate || 1)), 0);
  const totalSubContractTabAmount = filteredExistingSubContractTasks.reduce((total, item) => total + ((item.quantity || 0) * (item.rate || 0) * (item.exchange_rate || 1)), 0);

  return (
    <>
      <Typography textAlign={'center'} variant='h4' paddingTop={3}>{`Budget For ${selectedItemable ? selectedItemable?.label : `Project`}`}</Typography>
      <DialogTitle textAlign={'center'}>
        <Grid container width={'100%'} justifyContent="center" alignItems="center" columnSpacing={1}>
          <Grid size={{xs: 12, md: 3.5}} textAlign="center">
            <Div sx={{mt: 1}}>
              <FormControl fullWidth>
                <InputLabel id="bound-to-label" sx={{ textAlign: 'center', margin: -1 }}>Bound To</InputLabel>
                <Select
                  labelId="bound-to-label"
                  value={boundToOption}
                  label="Bound To"
                  size='small'
                  fullWidth
                  onChange={(e) => {
                    setSelectedItemable(null);
                    setSelectedBoundTo(null);
                    setBoundToOption(e.target.value);
                  }}
                >
                  <MenuItem value="Task">Task</MenuItem>
                  {/* <MenuItem value="Deliverable">Deliverable</MenuItem> */}
                </Select>
              </FormControl>
            </Div>
          </Grid>
          <Grid size={{xs: 12, md: 8.5}} textAlign="center">
            <Div sx={{ mt: 1 }}>
              <Autocomplete
                options={boundToOption === 'Task' ? allTasks : boundToOption === 'Deliverable' ? deliverables : []}
                isOptionEqualToValue={(option, value) => option.id === value?.id}
                getOptionLabel={(option) => option.label}
                value={selectedItemable}
                renderInput={(params) => (
                  <TextField {...params} label={`Select ${boundToOption}`} size="small" fullWidth />
                )}
                onChange={(e, newValue) => {
                  if (newValue) {
                    setSelectedItemable(newValue);
                    setSelectedBoundTo(boundToOption === 'Task' ? 'ProjectTask' : 'ProjectDeliverable');
                  } else {
                    setSelectedItemable(null);
                    setSelectedBoundTo(null);
                  }
                }}
                renderOption={(props, option) => (
                  <li {...props} key={option.id}>
                    {option.label}
                  </li>
                )}
              />
            </Div>
          </Grid>
        </Grid>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
        >
          <Tab label="Expense Items"/>
          <Tab label="Product Items"/>
          <Tab label="Subcontract Tasks"/>
        </Tabs>
        
        {activeTab === 0 && <LedgerItemsTab budget={budget} selectedBoundTo={selectedBoundTo} selectedItemable={selectedItemable}/>}
        {activeTab === 1 && <ProductItemsTab budget={budget} selectedBoundTo={selectedBoundTo} selectedItemable={selectedItemable}/>}
        {activeTab === 2 && boundToOption === 'Task' && selectedItemable?.id && <SubContractTasksTab budget={budget} selectedBoundTo={selectedBoundTo} selectedItemable={selectedItemable}/>}

      </DialogTitle>
      <DialogContent>
        <Grid container width={'100%'} columnSpacing={1} justifyContent="center" marginTop={2}>
          <Grid size={{xs: 12}}>
            {activeTab === 0 && filteredExistingLedgerItems.length > 0 && (
              <>
                <Grid container width={'100%'} paddingBottom={1} columnSpacing={1} justifyContent="flex-end" alignItems="center">
                  <Grid size={{xs: 12, md: 6}}>
                    <Tooltip title='Total Expenses Items'>
                      <Typography fontWeight="bold" variant="h4" component="span">
                        {totalExpenseTabAmount?.toLocaleString('en-US', { style: 'currency', currency: baseCurrency?.code })}
                      </Typography>
                    </Tooltip>
                  </Grid>
                  <Grid size={{xs: 12, md: 6}}>
                    <LedgerSelect
                      multiple={true}
                      label="Filter by Expense"
                      allowedGroups={['Expenses']}
                      onChange={(newValue) => { 
                        setSearchQueryIds(newValue.map(ledger => ledger.id));
                      }}
                    />
                  </Grid>
                </Grid>
                {filteredLedgerItemsByExpense.length > 0 ? (
                  filteredLedgerItemsByExpense.map((ledgerItem, index) => (
                    <LedgerItemsRow
                      key={index}
                      ledgerItem={ledgerItem}
                      index={index}
                      existingLedgerItems={filteredLedgerItemsByExpense}
                    />
                  ))
                ) : (
                  <Alert severity="warning">No Expense Items Found</Alert>
                )}
              </>
            )}
            {activeTab === 1 && filteredExistingProductItems.length > 0 && (
              <>
                <Grid container width={'100%'} paddingBottom={1} columnSpacing={1}>
                  <Grid size={{xs: 12, md: 6}}>
                    <Tooltip title='Total Product Items'>
                      <Typography fontWeight="bold" variant="h4" component="span">
                        {totalProductTabAmount?.toLocaleString('en-US', { style: 'currency', currency: baseCurrency?.code })}
                      </Typography>
                    </Tooltip>
                  </Grid>
                </Grid>
                {filteredExistingProductItems.map((productItem, index) => (
                  <ProductItemsRow
                    key={index}
                    productItem={productItem}
                    index={index}
                    existingProductItems={filteredExistingProductItems}
                  />
                ))}
              </>
            )}
            {activeTab === 2 && filteredExistingSubContractTasks.length > 0 && (
              <>
                <Grid container width={'100%'} paddingBottom={1} columnSpacing={1}>
                  <Grid size={{xs: 12, md: 6}}>
                    <Tooltip title='Total Subcontract Tasks'>
                      <Typography fontWeight="bold" variant="h4" component="span">
                        {totalSubContractTabAmount?.toLocaleString('en-US', { style: 'currency', currency: baseCurrency?.code })}
                      </Typography>
                    </Tooltip>  
                  </Grid>
                </Grid>
                {filteredExistingSubContractTasks.map((subContractTask, index) => (
                  <SubContractTasksRow
                    key={index}
                    subContractTask={subContractTask}
                    index={index}
                    existingSubContractTasks={filteredExistingSubContractTasks}
                  />
                ))}
              </>
            )}
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Stack spacing={1} direction="row" justifyContent="center" sx={{ mt: 1, mb: 1 }}>
          <Button size="small" variant="outlined" onClick={() => setOpenDialog(false)}>
            Close
          </Button>
        </Stack>
      </DialogActions>
    </>
  );
};

export default BudgetItemsForm;