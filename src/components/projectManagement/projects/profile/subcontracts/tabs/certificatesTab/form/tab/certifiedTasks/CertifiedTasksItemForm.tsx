'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Autocomplete,
  Grid,
  IconButton,
  InputAdornment,
  LinearProgress,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import {
  AddOutlined,
  CheckOutlined,
  DisabledByDefault,
} from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import { Div } from '@jumbo/shared';
import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import projectsServices from '@/components/projectManagement/projects/project-services';
import { useQuery } from '@tanstack/react-query';

/* ================= TYPES ================= */

interface ProjectTask {
  id?: number | string;
  name?: string;
  rate?: number;
  measurement_unit?: {
    symbol?: string;
  };
}

interface SubContractTask {
  id: number | string;
  project_task: ProjectTask;
  rate?: number;
}

interface CertifiedTaskItem {
  id?: number | string;
  project_subcontract_task_id?: number | string;
  task?: ProjectTask;
  certified_quantity?: number | string;
  remarks?: string;
  response_uncertified_quantity?: number;
  response_executed_quantity?: number;
  unit_symbol?: string;
  rate?: number;
  measurement_unit?: {
    symbol: string;
  };
}


interface CertifiedTasksItemFormProps {
  setClearFormKey: React.Dispatch<React.SetStateAction<number>>;
  submitMainForm: () => void;
  submitItemForm: boolean;
  setSubmitItemForm: (value: boolean) => void;
  setIsDirty: (value: boolean) => void;
  index?: number;
  setShowForm?: (value: boolean) => void;
  taskItem?: CertifiedTaskItem;
  tasksItems: CertifiedTaskItem[];
  CertificateDate: string;
  setTasksItems: React.Dispatch<React.SetStateAction<CertifiedTaskItem[]>>;
  subContract?: { id?: number | string };
  certificate?: { project_subcontract_id?: number | string };
}

interface FormValues {
  id?: number | string;
  project_subcontract_task_id?: number | string;
  certified_quantity?: number | string;
  remarks?: string;
  task?: ProjectTask;
  response_uncertified_quantity?: number;
  response_executed_quantity?: number;
  rate?: number;
}

/* ================= VALIDATION ================= */

const validationSchema = yup.object({
  project_subcontract_task_id: yup
    .number()
    .required('Project Task is required')
    .typeError('Project Task is required'),

  certified_quantity: yup
    .number()
    .required('Quantity is required')
    .positive('Quantity must be positive')
    .typeError('Valid quantity is required')
    .test('min-certified', function (value) {
      const { response_uncertified_quantity } = this.parent;
      if (response_uncertified_quantity == null || value == null) return true;
      return (
        value <= response_uncertified_quantity ||
        this.createError({
          message: `Certified Quantity cannot exceed un-certified (${response_uncertified_quantity})`,
        })
      );
    })
    .test('max-executed', function (value) {
      const { response_executed_quantity } = this.parent;
      if (response_executed_quantity == null || value == null) return true;
      return (
        value <= response_executed_quantity ||
        this.createError({
          message: `Certified Quantity cannot exceed executed quantity (${response_executed_quantity})`,
        })
      );
    }),
});

/* ================= COMPONENT ================= */

const CertifiedTasksItemForm: React.FC<CertifiedTasksItemFormProps> = ({
  setClearFormKey,
  submitMainForm,
  submitItemForm,
  setSubmitItemForm,
  setIsDirty,
  index = -1,
  setShowForm,
  taskItem,
  tasksItems = [],
  CertificateDate,
  setTasksItems,
  subContract,
  certificate,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [isRetrievingDetails, setIsRetrievingDetails] = useState(false);
  const [unitToDisplay, setUnitToDisplay] = useState<string | undefined>(
    taskItem?.unit_symbol ||
      taskItem?.task?.measurement_unit?.symbol || taskItem?.measurement_unit?.symbol
  );

  const {
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isDirty: formIsDirty },
  } = useForm<FormValues>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      id: taskItem?.id,
      project_subcontract_task_id: taskItem?.project_subcontract_task_id,
      certified_quantity: taskItem?.certified_quantity,
      remarks: taskItem?.remarks || '',
      task: taskItem?.task,
      response_uncertified_quantity: taskItem?.response_uncertified_quantity,
      response_executed_quantity: taskItem?.response_executed_quantity,
      rate: taskItem?.rate ? taskItem?.rate : taskItem?.task?.rate,
    },
  });

  useEffect(() => {
    setIsDirty(formIsDirty);
  }, [formIsDirty, setIsDirty]);

  const watchedQuantity = watch('certified_quantity');
  const watchedRate = watch('rate');

  const calculatedAmount = useMemo(() => {
    const qty = Number(watchedQuantity) || 0;
    const rate = Number(watchedRate) || 0;
    return qty * rate;
  }, [watchedQuantity, watchedRate]);

  const updateItems = async (formData: FormValues) => {
    setIsAdding(true);

    const newItem: CertifiedTaskItem = {
      ...formData,
      unit_symbol: unitToDisplay,
      rate: watchedRate,
    };

    if (index > -1) {
      const updated = [...tasksItems];
      updated[index] = newItem;
      setTasksItems(updated);
    } else {
      setTasksItems((prev) => [...prev, newItem]);
      if (submitItemForm) {
        submitMainForm();
        setSubmitItemForm(false);
      }
    }

    reset();
    setUnitToDisplay(undefined);
    setClearFormKey((prev) => prev + 1);
    setShowForm?.(false);
    setIsAdding(false);
  };

  useEffect(() => {
    if (submitItemForm) {
      handleSubmit(updateItems)();
    }
  }, [submitItemForm, handleSubmit]);

  const retrieveTaskDetails = async (taskId: number | string) => {
    setIsRetrievingDetails(true);
    try {
      const details = await projectsServices.showSubcontractTaskDetails(
        taskId,
        CertificateDate
      );
      setValue('response_uncertified_quantity', details?.uncertified_quantity ?? 0);
      setValue('response_executed_quantity', details?.executed_quantity ?? 0);
    } finally {
      setIsRetrievingDetails(false);
    }
  };

  const { data: subContractTasks = [], isLoading } = useQuery({
    queryKey: ['subContractTasks', certificate?.project_subcontract_id || subContract?.id],
    queryFn: async () => {
      const id = certificate?.project_subcontract_id || subContract?.id;
      if (!id) return [];
      return projectsServices.getSubContractTasks(id);
    },
    enabled: !!(certificate?.project_subcontract_id || subContract?.id),
  });

  if (isAdding) return <LinearProgress />;

  return (
    <Grid container spacing={1} mt={0.5}>
      <Grid size={{ xs: 12, md: 6 }}>
        <Div sx={{ mt: 0.3 }}>
          {isLoading ? (
            <LinearProgress />
          ) : (
            <Autocomplete<SubContractTask>
              options={subContractTasks}
              getOptionLabel={(o) => o.project_task?.name || ''}
              isOptionEqualToValue={(o, v) => o.id === v?.id}
              value={
                subContractTasks.find(
                  (t: any) => t.id === watch('project_subcontract_task_id')
                ) || null
              }
              onChange={(_, newValue) => {
                if (newValue) {
                  const task = newValue.project_task;
                  setUnitToDisplay(task?.measurement_unit?.symbol);
                  setValue('task', task);
                  setValue('rate', newValue.rate ?? task.rate ?? 0);
                  setValue('project_subcontract_task_id', newValue.id, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                  retrieveTaskDetails(newValue.id);
                } else {
                  setUnitToDisplay(undefined);
                  setValue('task', undefined);
                  setValue('rate', undefined);
                  setValue('project_subcontract_task_id', undefined);
                }
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Project Task"
                  size="small"
                  error={!!errors.project_subcontract_task_id}
                  helperText={errors.project_subcontract_task_id?.message}
                />
              )}
            />
          )}
        </Div>
      </Grid>

      {/* Quantity */}
      <Grid size={{ xs: 12, md: 3 }}>
        <Div sx={{ mt: 0.3 }}>
          {isRetrievingDetails ? (
            <LinearProgress />
          ) : (
            <TextField
              label="Certified Quantity"
              size="small"
              fullWidth
              value={watchedQuantity ?? ''}
              InputProps={{
                inputComponent: CommaSeparatedField as any,
                endAdornment: unitToDisplay ? (
                  <InputAdornment position="end">
                    <Typography variant="caption" color="text.secondary">
                      {unitToDisplay}
                    </Typography>
                  </InputAdornment>
                ) : null,
              }}
              error={!!errors.certified_quantity}
              helperText={errors.certified_quantity?.message}
              onChange={(e) => {
                const num = e.target.value
                  ? sanitizedNumber(e.target.value)
                  : undefined;
                setValue('certified_quantity', num, {
                  shouldDirty: true,
                  shouldValidate: true,
                });
              }}
            />
          )}
        </Div>
      </Grid>

      {/* Amount */}
      <Grid size={{ xs: 12, md: 3 }}>
        <Div sx={{ mt: 0.3 }}>
          <TextField
            label="Amount"
            size="small"
            fullWidth
            value={calculatedAmount.toLocaleString(undefined, {
              minimumFractionDigits: 2,
            })}
            InputProps={{
              readOnly: true,
              inputComponent: CommaSeparatedField as any,
            }}
          />
        </Div>
      </Grid>

      {/* Remarks */}
      <Grid size={12}>
        <Div sx={{ mt: 0.3 }}>
          <TextField
            label="Remarks"
            size="small"
            fullWidth
            multiline
            rows={2}
            value={watch('remarks') ?? ''}
            onChange={(e) =>
              setValue('remarks', e.target.value, { shouldDirty: true })
            }
          />
        </Div>
      </Grid>

      {/* Actions */}
      <Grid size={12} textAlign="end">
        <LoadingButton
          loading={isAdding}
          variant="contained"
          size="small"
          startIcon={taskItem ? <CheckOutlined /> : <AddOutlined />}
          onClick={handleSubmit(updateItems)}
        >
          {taskItem ? 'Done' : 'Add'}
        </LoadingButton>

        {taskItem && setShowForm && (
          <Tooltip title="Cancel Edit">
            <IconButton
              size="small"
              onClick={() => {
                setShowForm(false);
                reset();
              }}
            >
              <DisabledByDefault fontSize="small" color="error" />
            </IconButton>
          </Tooltip>
        )}
      </Grid>
    </Grid>
  );
};

export default CertifiedTasksItemForm;
