"use client";

import { useState } from 'react';
import { useFieldArray, useForm, SubmitHandler } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Grid,
  TextField,
  DialogActions,
  Button,
  DialogContent,
  Tooltip,
  IconButton,
  DialogTitle,
  Divider,
  Tabs,
  Tab,
  Stack,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { useSnackbar } from 'notistack';
import { AddOutlined, DisabledByDefault, KeyboardArrowLeftOutlined, KeyboardArrowRightOutlined } from '@mui/icons-material';
import LedgerSelect from '../../accounts/ledgers/forms/LedgerSelect';
import ProductSelect from '../../productAndServices/products/ProductSelect';
import StoreSelector from '../../procurement/stores/StoreSelector';
import { useProductsSelect } from '../../productAndServices/products/ProductsSelectProvider';
import { useLedgerSelect } from '../../accounts/ledgers/forms/LedgerSelectProvider';
import UsersSelector from '../../sharedComponents/UsersSelector';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import stationServices from './station-services';

interface ShiftTeamForm {
  id?: number;
  name: string;
  ledger_ids: number[];
  description?: string;
}

interface FuelPumpForm {
  id?: number;
  name: string;
  product_id: number | '';
  tank_id: number | '';
  tank?: { id: number; name: string };
}

interface StationFormData {
  id?: number;
  name: string;
  address: string;
  user_ids: number[];
  shift_teams: ShiftTeamForm[];
  fuel_pumps: FuelPumpForm[];
}

interface Station {
  id: number;
  name: string;
  address?: string;
  users: { id: number; name?: string }[];
  shift_teams: {
    id: number;
    name: string;
    ledgers: { id: number }[];
    description?: string;
  }[];
  fuel_pumps: {
    id: number;
    name: string;
    product_id: number;
    tank_id: number;
  }[];
  tanks: { id: number; name: string }[];
}

interface Props {
  setOpenDialog: (open: boolean) => void;
  station?: Station | null;
}

const validationSchema = yup.object({
  name: yup.string().required("Station name is required"),
  address: yup.string().nullable(),
  user_ids: yup.array().of(yup.number()).nullable(),
  shift_teams: yup
    .array()
    .of(
      yup.object().shape({
        name: yup.string().required("Shift name is required"),
        ledger_ids: yup.array().of(yup.number()).min(1, "At least one ledger is required"),
        description: yup.string().nullable(),
      })
    )
    .min(1, 'At least one Shift team is required'),
  fuel_pumps: yup
    .array()
    .of(
      yup.object().shape({
        name: yup.string().required("Pump name is required"),
        product_id: yup.number().required("Fuel type is required"),
        tank_id: yup.number().required("Tank is required"),
      })
    )
    .min(1, 'At least one Fuel Pump is required'),
});

const StationsForm = ({ setOpenDialog, station }: Props) => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [activeTab, setActiveTab] = useState(0);

  const { productOptions } = useProductsSelect();
  const { ungroupedLedgerOptions } = useLedgerSelect();

  const { mutate: addStation, isPending: isAdding } = useMutation({
    mutationFn: stationServices.add,
    onSuccess: (data: { message?: string }) => {
      setOpenDialog(false);
      enqueueSnackbar(data.message || 'Station created successfully', { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['stations'] });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to create station';
      enqueueSnackbar(message, { variant: 'error' });
    },
  });

  const { mutate: editStation, isPending: isEditing } = useMutation({
    mutationFn: stationServices.update,
    onSuccess: (data: { message?: string }) => {
      setOpenDialog(false);
      enqueueSnackbar(data.message || 'Station updated successfully', { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['stations'] });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to update station';
      enqueueSnackbar(message, { variant: 'error' });
    },
  });

  const saveMutation = station ? editStation : addStation;
  const isLoading = isAdding || isEditing;

  const {
    control,
    register,
    setValue,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm<StationFormData>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      id: station?.id,
      name: station?.name || '',
      address: station?.address || '',
      user_ids: station?.users?.map((u) => u.id) || [],
      shift_teams: station?.shift_teams?.length
        ? station.shift_teams.map((s) => ({
            id: s.id,
            name: s.name,
            ledger_ids: s.ledgers?.map((l) => l.id) || [],
            description: s.description || '',
          }))
        : [{ name: '', ledger_ids: [], description: '' }],
      fuel_pumps: station?.fuel_pumps?.length
        ? station.fuel_pumps.map((p) => ({
            id: p.id,
            name: p.name,
            product_id: p.product_id,
            tank_id: p.tank_id,
            tank: station.tanks.find(t => t.id === p.tank_id),
          }))
        : [{ name: '', product_id: '', tank_id: '' }],
    },
  });

  const { fields: shiftFields, append: appendShift, remove: removeShift } = useFieldArray({
    control,
    name: 'shift_teams',
  });

  const { fields: pumpFields, append: appendPump, remove: removePump } = useFieldArray({
    control,
    name: 'fuel_pumps',
  });

  const onSubmit: SubmitHandler<StationFormData> = (data) => {
    const cleanedData = {
      ...data,
      shift_teams: data.shift_teams.filter((team) => team.name?.trim()),
      fuel_pumps: data.fuel_pumps.filter((pump) => pump.name?.trim()),
    };

    saveMutation(cleanedData);
  };

  return (
    <>
      <DialogTitle textAlign="center">{station ? `Edit ${station.name}` : 'New Station'}</DialogTitle>

      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)} autoComplete="off">
          <Grid container columnSpacing={2} rowSpacing={1}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                size="small"
                fullWidth
                label="Station name"
                error={!!errors.name}
                helperText={errors.name?.message}
                {...register('name')}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                size="small"
                fullWidth
                label="Address"
                error={!!errors.address}
                helperText={errors.address?.message}
                {...register('address')}
              />
            </Grid>

            <Grid size={12}>
              <UsersSelector
                label="Users"
                multiple
                defaultValue={station?.users || [] as any}
                onChange={(users) => setValue('user_ids', users?.map((u: any) => u.id) || [])}
              />
            </Grid>

            <Grid size={12} mt={3}>
              <Tabs
                value={activeTab}
                onChange={(_, v) => setActiveTab(v)}
                variant="scrollable"
                scrollButtons="auto"
                allowScrollButtonsMobile
              >
                <Tab label="Shift Teams" />
                <Tab label="Fuel Pumps" />
              </Tabs>
            </Grid>

            {/* SHIFT TEAMS TAB */}
            {activeTab === 0 && (
              <Grid size={12} container spacing={2} mt={2}>
                {shiftFields.map((field, index) => (
                  <Grid key={field.id} size={12}>
                    <Divider sx={{ mb: 1.5 }} />
                    <Grid container spacing={2} alignItems="flex-start">
                      <Grid size={{ xs: 12, md: 5 }}>
                        <TextField
                          size="small"
                          fullWidth
                          label="Team Name"
                          error={!!errors.shift_teams?.[index]?.name}
                          helperText={errors.shift_teams?.[index]?.name?.message}
                          {...register(`shift_teams.${index}.name`)}
                        />
                      </Grid>

                      <Grid size={{ xs: 12, md: 5 }}>
                        <LedgerSelect
                          label="Ledgers"
                          allowedGroups={['Cash and cash equivalents', 'Banks']}
                          multiple
                          defaultValue={ungroupedLedgerOptions.filter((l) =>
                            watch(`shift_teams.${index}.ledger_ids`)?.includes(l.id)
                          )}
                          frontError={errors.shift_teams?.[index]?.ledger_ids}
                          onChange={(ledgers: any) =>
                            setValue(
                              `shift_teams.${index}.ledger_ids`,
                              ledgers?.map((l: any) => l.id) || [],
                              { shouldValidate: true }
                            )
                          }
                        />
                      </Grid>

                      <Grid size={{ xs: 12, md: 1 }}>
                        {shiftFields.length > 1 && (
                          <Tooltip title="Remove shift team">
                            <IconButton
                              color="error"
                              size="small"
                              onClick={() => removeShift(index)}
                              sx={{ mt: 1 }}
                            >
                              <DisabledByDefault />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Grid>

                      <Grid size={12}>
                        <TextField
                          label="Description"
                          size="small"
                          fullWidth
                          multiline
                          rows={2}
                          {...register(`shift_teams.${index}.description`)}
                        />
                      </Grid>
                    </Grid>
                  </Grid>
                ))}

                <Grid size={12} sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<AddOutlined />}
                    onClick={() => appendShift({ name: '', ledger_ids: [], description: '' })}
                  >
                    Add Shift Team
                  </Button>
                </Grid>
              </Grid>
            )}

            {/* FUEL PUMPS TAB */}
            {activeTab === 1 && (
              <Grid size={12} container spacing={2} mt={2}>
                {pumpFields.map((field, index) => (
                  <Grid key={field.id} size={12}>
                    <Divider sx={{ mb: 1.5 }} />
                    <Grid container spacing={2} alignItems="flex-start">
                      <Grid size={{ xs: 12, md: 4 }}>
                        <ProductSelect
                          label="Fuel"
                          multiple={false}
                          frontError={errors.fuel_pumps?.[index]?.product_id}
                          defaultValue={productOptions.find(
                            (p) => p.id === watch(`fuel_pumps.${index}.product_id`)
                          )}
                          onChange={(product: any) =>
                            setValue(`fuel_pumps.${index}.product_id`, product?.id || '', {
                              shouldValidate: true,
                            })
                          }
                        />
                      </Grid>

                      <Grid size={{ xs: 12, md: 4 }}>
                        <TextField
                          size="small"
                          fullWidth
                          label="Pump Name"
                          error={!!errors.fuel_pumps?.[index]?.name}
                          helperText={errors.fuel_pumps?.[index]?.name?.message}
                          {...register(`fuel_pumps.${index}.name`)}
                        />
                      </Grid>

                      <Grid size={{ xs: 12, md: 3 }}>
                        <StoreSelector
                          label="Tank"
                          allowSubStores
                          frontError={errors.fuel_pumps?.[index]?.tank_id as any}
                          defaultValue={watch(`fuel_pumps.${index}.tank`)}
                          onChange={(store: any) => {
                            setValue(`fuel_pumps.${index}.tank`, store);
                            setValue(`fuel_pumps.${index}.tank_id`, store?.id || '', {
                              shouldValidate: true,
                            });
                          }}
                        />
                      </Grid>

                      <Grid size={{ xs: 12, md: 1 }}>
                        {pumpFields.length > 1 && (
                          <Tooltip title="Remove pump">
                            <IconButton
                              color="error"
                              size="small"
                              onClick={() => removePump(index)}
                              sx={{ mt: 1 }}
                            >
                              <DisabledByDefault />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Grid>
                    </Grid>
                  </Grid>
                ))}

                <Grid size={12} sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<AddOutlined />}
                    onClick={() => appendPump({ name: '', product_id: '', tank_id: '' })}
                  >
                    Add Fuel Pump
                  </Button>
                </Grid>
              </Grid>
            )}
          </Grid>
        </form>
      </DialogContent>

      <DialogActions>
        <Stack direction="row" spacing={2} justifyContent="flex-end">
          <Button size="small" onClick={() => setOpenDialog(false)}>
            Cancel
          </Button>

          {activeTab > 0 && (
            <Button
              size="small"
              variant="outlined"
              startIcon={<KeyboardArrowLeftOutlined />}
              onClick={() => setActiveTab(activeTab - 1)}
            >
              Previous
            </Button>
          )}

          {activeTab < 1 && (
            <Button
              size="small"
              variant="outlined"
              endIcon={<KeyboardArrowRightOutlined />}
              onClick={() => setActiveTab(activeTab + 1)}
            >
              Next
            </Button>
          )}

          {activeTab === 1 && (
            <LoadingButton
              variant="contained"
              size="small"
              loading={isLoading}
              onClick={handleSubmit(onSubmit)}
            >
              {station ? 'Update Station' : 'Create Station'}
            </LoadingButton>
          )}
        </Stack>
      </DialogActions>
    </>
  );
};

export default StationsForm;