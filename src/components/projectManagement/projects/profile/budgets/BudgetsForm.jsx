import React, { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Grid,
  TextField,
  DialogActions,
  Button,
  Dialog,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Alert,
  Tabs,
  Tab,
  InputLabel,
  FormControl,
  Select,
  MenuItem,
  Autocomplete,
  LinearProgress,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { useSnackbar } from 'notistack';
import { DateTimePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import { useProjectProfile } from '../ProjectProfileProvider';
import { Div } from '@jumbo/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import projectsServices from '../../project-services';
import LedgerItemsTab from './budgetItems/tabs/LedgerItemsTab';
import LedgerItemsRow from './budgetItems/tabs/LedgerItemsRow';
import ProductItemsTab from './budgetItems/tabs/ProductItemsTab';
import ProductItemsRow from './budgetItems/tabs/ProductItemsRow';
import CostCenterSelector from '@/components/masters/costCenters/CostCenterSelector';
import SubContractTasksTab from './budgetItems/tabs/SubContractTasksTab';
import SubContractTasksRow from './budgetItems/tabs/SubContractTasksRow';

const BudgetsForm = ({ setOpenDialog, budget=null, isProjectBudget=true }) => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const { authOrganization } = useJumboAuth();
  const organization = authOrganization?.organization;
  const costCenters = authOrganization?.costCenters;
  const { project } = useProjectProfile();
  const [activeTab, setActiveTab] = useState(0);
  const [boundToOption, setBoundToOption] = useState('');
  const [selectedBoundTo, setSelectedBoundTo] = useState(null)
  const [selectedItemable, setSelectedItemable] = useState(null);
  const [serverError, setServerError] = useState(null);
  const [ledgerItems, setLedgerItems] = useState(budget ? budget.ledger_items : []);
  const [productItems, setProductItems] = useState(budget ? budget.product_items : []);
  const [subContractItems, setSubContractItems] = useState(budget ? budget.subcontract_task_items : []);
  // Store subcontract tasks per project cost center id
  const [subContractItemsByCostCenter, setSubContractItemsByCostCenter] = useState({});
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [restoreTargetCostCenter, setRestoreTargetCostCenter] = useState(null);

  const [showWarning, setShowWarning] = useState(false);
  const [showSubcontractLossDialog, setShowSubcontractLossDialog] = useState(false);
  const [pendingCostCenter, setPendingCostCenter] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const [submitItemForm, setSubmitItemForm] = useState(false);

  const addBudgetMutation = useMutation({
    mutationFn: (data) => projectsServices.addBudget(data),
    onSuccess: (data) => {
      setOpenDialog(false);
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['projectBudgets'] });
      queryClient.invalidateQueries({ queryKey: ['budgets-list'] });
    },
    onError: (err) => {
      if (err.response?.status === 400) setServerError(err.response?.data?.validation_errors);
      else enqueueSnackbar(err.response?.data?.message, { variant: 'error' });
    },
  });

  const editBudgetMutation = useMutation({
    mutationFn: (data) => projectsServices.EditBudget(data),
    onSuccess: (data) => {
      setOpenDialog(false);
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['projectBudgets'] });
      queryClient.invalidateQueries({ queryKey: ['budgets-list'] });
    },
    onError: (err) => {
      if (err.response?.status === 400) setServerError(err.response?.data?.validation_errors);
      else enqueueSnackbar(err.response?.data?.message, { variant: 'error' });
    },
  });

  const saveMutation = useMemo(() => (budget ? editBudgetMutation.mutate : addBudgetMutation.mutate), [budget, editBudgetMutation.mutate, addBudgetMutation.mutate]);
  const isPending = budget ? editBudgetMutation.isPending : addBudgetMutation.isPending;

  useEffect(() => {
    setLedgerItems(budget?.ledger_items || []);
    setProductItems(budget?.product_items || []);
    setSubContractItems(budget?.subcontract_task_items || []);
  }, [budget]);

  const validationSchema = yup.object({
    name: yup.string().required('Budget name is required'),
    start_date: yup.string().required('Start Date is required'),
    end_date: yup.string().required('End Date is required'),
    cost_center_id: yup
      .number()
      .required('Cost Center is required')
      .positive('Cost Center is Required')
      .typeError('Cost Center is Required'),
  });

  const { register, setValue, watch, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      id: budget?.id,
      name: budget?.name,
      start_date: budget?.start_date,
      end_date: budget?.end_date,
      cost_center_id: project?.cost_center?.id || budget?.cost_center_id ,
      remarks: budget?.remarks || '',
    },
  });

  // Determine the project id to use for timeline activities
  const selectedCostCenterId = watch('cost_center_id');
  const selectedCostCenter = useMemo(() => costCenters?.find(c => c.id === selectedCostCenterId), [costCenters, selectedCostCenterId]);
  const timelineProjectId = selectedCostCenter?.cost_centerable_id || project?.id;

    // Track previous project-typed cost center for dialog logic
  const prevProjectCostCenterRef = React.useRef(selectedCostCenter?.cost_centerable_id);
  useEffect(() => {
    prevProjectCostCenterRef.current = selectedCostCenter?.cost_centerable_id;
  }, [selectedCostCenter?.cost_centerable_id]);

  const { data: timelineActivitiesData, isFetching: isTimelineActivitiesFetching } = useQuery({
    queryKey: ['projectTimelineActivities', timelineProjectId],
    queryFn: () => projectsServices.showProjectTimelineActivities(timelineProjectId),
    enabled: !!timelineProjectId,
  });

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

  const allTasks = getTaskOptions(timelineActivitiesData);

  // Autofill bound_to and budget_itemable_id for all items when Bound To and Task are selected
  useEffect(() => {
    if (selectedBoundTo && selectedItemable?.id) {
      setLedgerItems((items) => items.map(item => ({
        ...item,
        bound_to: selectedBoundTo,
        budget_itemable_id: selectedItemable.id
      })));
      setProductItems((items) => items.map(item => ({
        ...item,
        bound_to: selectedBoundTo,
        budget_itemable_id: selectedItemable.id
      })));
      setSubContractItems((items) => items.map(item => ({
        ...item,
        bound_to: selectedBoundTo,
        budget_itemable_id: selectedItemable.id,
        project_task: selectedItemable ?? null,
        project_task_id: selectedItemable?.id ?? null
      })));
    }
  }, [selectedBoundTo, selectedItemable]);

  // Clear bound_to and budget_itemable_id for all items when cost center changes to null
  useEffect(() => {
    if (!selectedCostCenter?.cost_centerable_id) {
      setLedgerItems((items) => items.map(item => ({ ...item, bound_to: null, budget_itemable_id: null })));
      setProductItems((items) => items.map(item => ({ ...item, bound_to: null, budget_itemable_id: null })));
      setSubContractItems((items) => items.map(item => ({ ...item, bound_to: null, budget_itemable_id: null })));
    }
  }, [selectedCostCenter?.cost_centerable_id]);

  const handleSubmitForm = (data) => {
    const payload = {
      ...data,
      ledger_items: ledgerItems,
      product_items: productItems,
      subcontract_task_items: subContractItems,
    };
    saveMutation(payload);
  };

  const submitMainForm = () => {
    handleSubmit((data) => handleSubmitForm(data))();
  };

  const onSubmit = (data) => {
    if (activeTab === 0 && isDirty) {
      setShowWarning(true);
      return;
    }
    handleSubmitForm(data);
  };

  const handleConfirmSubmitWithoutAdd = () => {
    setShowWarning(false);
    setIsDirty(false);
    setSubmitItemForm(false);
    submitMainForm();
  };

  const handleAddAndSubmit = () => {
    setShowWarning(false);
    setSubmitItemForm(true);
  };

  return (
    <>
      <DialogTitle textAlign="center" sx={{ pb: 1 }}>
        {budget ? `Edit ${budget?.name} Budget` : isProjectBudget ? 'New Project Budget' : 'New Budget'}
      </DialogTitle>
      <DialogContent>
        {/* Restore dialog should be rendered at the top level, not inside Grid */}
        <Dialog open={showRestoreDialog} onClose={() => setShowRestoreDialog(false)}>
          <DialogTitle>Restore Previous Subcontract Tasks?</DialogTitle>
          <DialogContent>
            <DialogContentText>
              You have previous Subcontract Tasks for this cost center. Would you like to restore them or start with a blank list?
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setShowRestoreDialog(false);
              setValue('cost_center_id', restoreTargetCostCenter?.id, {
                shouldValidate: true,
                shouldDirty: true,
              });
              setSubContractItems([]);
              setRestoreTargetCostCenter(null);
              if (activeTab === 2 && !restoreTargetCostCenter?.cost_centerable_id) {
                setActiveTab(0);
              }
            }} color="inherit">
              Start New
            </Button>
            <Button onClick={() => {
              setShowRestoreDialog(false);
              setValue('cost_center_id', restoreTargetCostCenter?.id, {
                shouldValidate: true,
                shouldDirty: true,
              });
              setSubContractItems(subContractItemsByCostCenter[restoreTargetCostCenter.cost_centerable_id] || []);
              setRestoreTargetCostCenter(null);
              if (activeTab === 2 && !restoreTargetCostCenter?.cost_centerable_id) {
                setActiveTab(0);
              }
            }} color="primary" variant="contained">
              Restore Previous
            </Button>
          </DialogActions>
        </Dialog>
        <Grid container spacing={1.5} alignItems="center" justifyContent="center" sx={{ mt: 1 }}>
            <Grid size={{xs: 12, md: 4}}>
              <TextField
                label="Budget Name"
                size="small"
                fullWidth
                error={!!errors?.name}
                helperText={errors?.name?.message}
                {...register('name')}
              />
            </Grid>

            <Grid size={{xs: 12, md: 4}}>
              <DateTimePicker
                label="Start Date"
                fullWidth
                minDate={dayjs(organization.recording_start_date)}
                defaultValue={budget ? dayjs(budget.start_date) : null}
                slotProps={{
                  textField: {
                    size: 'small',
                    fullWidth: true,
                    readOnly: true,
                    error: !!errors?.start_date,
                    helperText: errors?.start_date?.message,
                  },
                }}
                onChange={(newValue) => {
                  setServerError(null);
                  setValue('start_date', newValue ? newValue.toISOString() : null, { shouldValidate: true, shouldDirty: true });
                }}
              />
            </Grid>

            <Grid size={{xs: 12, md: 4}}>
              <DateTimePicker
                label="End Date"
                fullWidth
                minDate={dayjs(watch('start_date'))}
                defaultValue={budget ? dayjs(budget.end_date) : null}
                slotProps={{
                  textField: {
                    size: 'small',
                    fullWidth: true,
                    readOnly: true,
                    error: !!errors?.end_date,
                    helperText: errors?.end_date?.message,
                  },
                }}
                onChange={(newValue) => {
                  setServerError(null);
                  setValue('end_date', newValue ? newValue.toISOString() : null, { shouldValidate: true, shouldDirty: true });
                }}
              />
            </Grid>

            {serverError?.date_overlap && (
              <Grid size={12}>
                <Alert severity="error" variant="outlined">{serverError.date_overlap[0]}</Alert>
              </Grid>
            )}

            <Grid size={{ xs: 12, md: 4 }}>
              <CostCenterSelector
                label='Cost Center'
                frontError={errors.cost_center_id}
                defaultValue={
                  (budget && budget.cost_center) ||
                  (costCenters.length === 1 ? costCenters[0] : null)
                }
                multiple={false}
                onChange={(newValue) => {
                  // Always update subContractItemsByCostCenter before dialog logic
                  let updatedSubContractItemsByCostCenter = { ...subContractItemsByCostCenter };
                  if (selectedCostCenter?.cost_centerable_id) {
                    updatedSubContractItemsByCostCenter[selectedCostCenter.cost_centerable_id] = subContractItems;
                  }
                  // If switching from project to non-project, save current tasks and clear
                  if (!newValue?.cost_centerable_id && selectedCostCenter?.cost_centerable_id) {
                    setSubContractItemsByCostCenter(updatedSubContractItemsByCostCenter);
                    setSubContractItems([]);
                  }
                  // If switching between two project cost centers and there is data, show dialog
                  else if (
                    newValue?.cost_centerable_id &&
                    selectedCostCenter?.cost_centerable_id &&
                    newValue?.cost_centerable_id !== selectedCostCenter?.cost_centerable_id &&
                    subContractItems.length > 0
                  ) {
                    setSubContractItemsByCostCenter(updatedSubContractItemsByCostCenter);
                    setPendingCostCenter(newValue);
                    setShowSubcontractLossDialog(true);
                    return; // Don't change cost center yet
                  }
                  // If switching to a project cost center with saved tasks, prompt to restore
                  if (
                    newValue?.cost_centerable_id &&
                    updatedSubContractItemsByCostCenter[newValue.cost_centerable_id]?.length > 0
                  ) {
                    setSubContractItemsByCostCenter(updatedSubContractItemsByCostCenter);
                    setRestoreTargetCostCenter(newValue);
                    setShowRestoreDialog(true);
                    return;
                  }
                  setSubContractItemsByCostCenter(updatedSubContractItemsByCostCenter);
                  setValue('cost_center_id', newValue?.id, {
                    shouldValidate: true,
                    shouldDirty: true,
                  });
                  if (activeTab === 2 && !newValue?.cost_centerable_id) {
                    setActiveTab(0);
                  }
                  {/* Dialog for restoring previous subcontract tasks */}
                  <Dialog open={showRestoreDialog} onClose={() => setShowRestoreDialog(false)}>
                    <DialogTitle>Restore Previous Subcontract Tasks?</DialogTitle>
                    <DialogContent>
                      <DialogContentText>
                        You have previous Subcontract Tasks for this cost center. Would you like to restore them or start with a blank list?
                      </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                      <Button onClick={() => {
                        setShowRestoreDialog(false);
                        setValue('cost_center_id', restoreTargetCostCenter?.id, {
                          shouldValidate: true,
                          shouldDirty: true,
                        });
                        setSubContractItems([]);
                        setRestoreTargetCostCenter(null);
                        if (activeTab === 2 && !restoreTargetCostCenter?.cost_centerable_id) {
                          setActiveTab(0);
                        }
                      }} color="inherit">
                        Start New
                      </Button>
                      <Button onClick={() => {
                        setShowRestoreDialog(false);
                        setValue('cost_center_id', restoreTargetCostCenter?.id, {
                          shouldValidate: true,
                          shouldDirty: true,
                        });
                        setSubContractItems(subContractItemsByCostCenter[restoreTargetCostCenter.cost_centerable_id] || []);
                        setRestoreTargetCostCenter(null);
                        if (activeTab === 2 && !restoreTargetCostCenter?.cost_centerable_id) {
                          setActiveTab(0);
                        }
                      }} color="primary" variant="contained">
                        Restore Previous
                      </Button>
                    </DialogActions>
                  </Dialog>
                }}
              />
                  {/* Dialog for subcontract task data loss warning */}
                  <Dialog open={showSubcontractLossDialog} onClose={() => setShowSubcontractLossDialog(false)}>
                    <DialogTitle>Subcontract Tasks Will Be Lost</DialogTitle>
                    <DialogContent>
                      <DialogContentText>
                        Changing the cost center will clear all current Subcontract Tasks. Do you want to continue?
                      </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                      <Button onClick={() => setShowSubcontractLossDialog(false)} color="inherit">
                        Cancel
                      </Button>
                      <Button
                        onClick={() => {
                          setShowSubcontractLossDialog(false);
                          setSubContractItems([]);
                          setValue('cost_center_id', pendingCostCenter?.id, {
                            shouldValidate: true,
                            shouldDirty: true,
                          });
                          if (activeTab === 2 && !pendingCostCenter?.cost_centerable_id) {
                            setActiveTab(0);
                          }
                          setPendingCostCenter(null);
                        }}
                        color="warning"
                        variant="contained"
                      >
                        Continue
                      </Button>
                    </DialogActions>
                  </Dialog>
            </Grid> 

            {selectedCostCenter?.cost_centerable_id && (
              <>
                {(isTimelineActivitiesFetching) ? (
                  <Grid size={{xs: 12, md: 8}}>
                    <LinearProgress />
                  </Grid>
                ) : (
                  <>
                    <Grid size={{xs: 12, md: 4}} textAlign="center">
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
                            disabled={isTimelineActivitiesFetching}
                          >
                            <MenuItem value="Task">Task</MenuItem>
                            {/* <MenuItem value="Deliverable">Deliverable</MenuItem> */}
                          </Select>
                        </FormControl>
                      </Div>
                    </Grid>
                    <Grid size={{xs: 12, md: 4}} textAlign="center">
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
                          disabled={isTimelineActivitiesFetching}
                        />
                      </Div>
                    </Grid>
                  </>
                )}
              </>
            )}

            <Grid size={{ xs: 12, md: selectedCostCenter?.cost_centerable_id ? 12 : 8 }}>
              <Div>
                <TextField
                  label="Remarks"
                  size="small"
                  fullWidth
                  multiline
                  rows={2}
                  {...register('remarks')}
                />
              </Div>
            </Grid>

            <Grid size={12}>
              <Tabs
                value={activeTab}
                onChange={(e, newValue) => {
                  setActiveTab(newValue);
                }}
                variant="scrollable"
                scrollButtons="auto"
                allowScrollButtonsMobile
              >
                <Tab label="Expense Items" />
                <Tab label="Product Items" />
                {selectedCostCenter?.cost_centerable_id && 
                  <Tab label="Subcontract Task" />
                }
              </Tabs>
            </Grid>

            <Grid size={12}>
              {activeTab === 0 && (
                <>
                  <LedgerItemsTab
                    ledgerItems={ledgerItems}
                    setLedgerItems={setLedgerItems}
                    submitMainForm={submitMainForm}
                    submitItemForm={submitItemForm}
                    setSubmitItemForm={setSubmitItemForm}
                    setIsDirty={setIsDirty}
                  />
                  {ledgerItems?.map((ledgerItem, index) => (
                    <LedgerItemsRow
                      key={`${ledgerItem?.id ?? 'new'}-${index}`}
                      ledgerItem={ledgerItem}
                      index={index}
                      ledgerItems={ledgerItems}
                      setLedgerItems={setLedgerItems}
                      submitMainForm={submitMainForm}
                      setSubmitItemForm={setSubmitItemForm}
                      submitItemForm={submitItemForm}
                      setIsDirty={setIsDirty}
                    />
                  ))}
                </>
              )}
              {activeTab === 1 && (
                <>
                  <ProductItemsTab
                    productItems={productItems}
                    setProductItems={setProductItems}
                    submitMainForm={submitMainForm}
                    submitItemForm={submitItemForm}
                    setSubmitItemForm={setSubmitItemForm}
                    setIsDirty={setIsDirty}
                  />
                  {productItems?.map((productItem, index) => (
                    <ProductItemsRow
                      key={`${productItem?.id ?? 'new'}-${index}`}
                      productItem={productItem}
                      index={index}
                      productItems={productItems}
                      setProductItems={setProductItems}
                    />
                  ))}
                </>
              )}
              {activeTab === 2 && selectedCostCenter?.cost_centerable_id && (
                <>
                  {!(boundToOption === 'Task' && selectedItemable?.id) ? (
                    <Alert severity="info" sx={{ mb: 2 }}>
                      Please select <b>Bound To</b> and <b>Select Task</b> for adding Subcontract Tasks.
                    </Alert>
                  ) : (
                    <SubContractTasksTab
                      subContractItems={subContractItems}
                      setSubContractItems={setSubContractItems}
                      submitMainForm={submitMainForm}
                      submitItemForm={submitItemForm}
                      setSubmitItemForm={setSubmitItemForm}
                      setIsDirty={setIsDirty}
                    />
                  )}
                  {subContractItems?.map((subContractItem, index) => (
                    <SubContractTasksRow
                      key={`${subContractItem?.id ?? 'new'}-${index}`}
                      subContractItem={subContractItem}
                      index={index}
                      subContractItems={subContractItems}
                      setSubContractItems={setSubContractItems}
                    />
                  ))}
                </>
              )}
            </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button size="small" onClick={() => setOpenDialog(false)}>Cancel</Button>
        <LoadingButton
          type="submit"
          onClick={handleSubmit(onSubmit)}
          variant="contained"
          size="small"
          sx={{ display: 'flex' }}
          loading={isPending}
        >
          Submit
        </LoadingButton>
      </DialogActions>
      <Dialog open={showWarning} onClose={() => setShowWarning(false)}>
        <DialogTitle>Unsaved Expense Item</DialogTitle>
        <DialogContent>
          <DialogContentText>
            You have unsaved changes in Expense Items form. Do you want to add the item first, or submit without adding it?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowWarning(false)} color='inherit'>
            Cancel
          </Button>
          <Button onClick={handleConfirmSubmitWithoutAdd} color='warning' variant='outlined'>
            Submit Without Add
          </Button>
          <LoadingButton onClick={handleAddAndSubmit} variant='contained'>
            Add & Submit
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default BudgetsForm;
