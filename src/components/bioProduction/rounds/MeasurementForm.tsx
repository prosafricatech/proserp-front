'use client'

import React, { useMemo, useRef, useState } from 'react';
import { CheckOutlined, DeleteOutlined, EditOutlined } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
  LinearProgress,
  Paper,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { DateTimePicker } from '@mui/x-date-pickers';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs, { Dayjs } from 'dayjs';
import { useSnackbar } from 'notistack';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { getErrorMessage } from '@/utilities/helpers/errorHandler';
import BioSelect from '../BioSelect';
import { useBioFarm } from '../FarmFirstPage';
import { unitGroupOptions, useUnitGroups } from '../useUnitGroups';
import { measurementParameterServices, productionUnitServices, roundServices } from '../bio-production-services';
import { rangeText, statusOf } from '../measurementParameters/rangeText';
import { BioFormProps, BioMeasurementParameter, BioProductionUnit } from '../types';
import LineTable, { LineColumn } from './LineTable';
import { RoundRecord } from './roundTypes';

interface Line {
  unitId: number;
  values: Record<number, string>;
}
interface Draft {
  unitIds: number[];
  groupIds: number[];
  /** Kinds of unit (pond, cage, ...): every unit of the farm of that kind. */
  types: string[];
  values: Record<number, string>;
}

const emptyDraft: Draft = { unitIds: [], groupIds: [], types: [], values: {} };
const filled = (value?: string) => value !== undefined && value.trim() !== '';
/** Digits, one decimal point and a leading minus: what a reading can contain. */
const cleanNumber = (value: string) => {
  const cleaned = value.replace(/[^\d.-]/g, '').replace(/(?!^)-/g, '');
  const dot = cleaned.indexOf('.');

  return dot === -1 ? cleaned : cleaned.slice(0, dot + 1) + cleaned.slice(dot + 1).replace(/\./g, '');
};
const storageKey = (farmId: number) => `bio-measure-parameters-${farmId}`;

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <Typography variant='overline' color='text.secondary' display='block' sx={{ letterSpacing: 1, lineHeight: 1.5, mt: 2.5, mb: 1 }}>
    {children}
  </Typography>
);

/**
 * Readings taken at one time, entered the way a feeding record is: when and which parameters, then a line for
 * each unit measured (pick the unit, type what was read, add it). Only the readings actually taken are typed;
 * a unit does not have to be given a value for every parameter, and units not measured are simply left out.
 */
const MeasurementFormBody = ({ setOpenDialog, record = null }: { setOpenDialog: (open: boolean) => void; record?: RoundRecord | null }) => {
  const dictionary = useDictionary();
  const text = dictionary.bioProduction.rounds;
  const mp = dictionary.bioProduction.measurementParameters;
  const common = dictionary.bioProduction.common;
  const types = dictionary.bioProduction.productionUnits.types;
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { authOrganization } = useJumboAuth();
  const { farm } = useBioFarm();
  const unitRef = useRef<HTMLInputElement>(null);

  const firstReading = record?.lines?.[0] as { measured_at?: string } | undefined;
  const [measuredAt, setMeasuredAt] = useState<Dayjs>(firstReading?.measured_at ? dayjs(firstReading.measured_at) : dayjs());
  const [reason, setReason] = useState(record?.reason ?? '');
  const [lines, setLines] = useState<Line[]>(() => {
    const byUnit = new Map<number, Line>();
    (record?.lines ?? []).forEach((line: any) => {
      const own = byUnit.get(line.unit.id) ?? { unitId: line.unit.id as number, values: {} };
      own.values[line.parameter.id] = String(line.value);
      byUnit.set(line.unit.id, own);
    });

    return Array.from(byUnit.values());
  });
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  // Readings are typed for one unit, or once for a whole group and then given to each unit in it.
  const [target, setTarget] = useState<'unit' | 'group' | 'type'>('unit');
  const [rowErrors, setRowErrors] = useState<Record<number, string[]>>({});
  const [showWarning, setShowWarning] = useState(false);
  const [parameterIds, setParameterIds] = useState<number[]>(() => {
    if (record) return Array.from(new Set((record.lines ?? []).map((line: any) => line.parameter.id as number)));
    try {
      return JSON.parse(localStorage.getItem(storageKey(farm.id)) ?? '[]');
    } catch {
      return [];
    }
  });

  const { data: parameterList, isLoading: loadingParameters } = useQuery<{ data: BioMeasurementParameter[] }>({
    queryKey: ['bioMeasurementParameterOptions'],
    queryFn: () => measurementParameterServices.getList({ status: 'active', limit: 500 }),
  });
  const { data: unitList, isLoading: loadingUnits } = useQuery<{ data: BioProductionUnit[] }>({
    queryKey: ['bioFarmUnits', farm.id],
    queryFn: () => productionUnitServices.getList({ farm_id: farm.id, status: 'active', limit: 2000 }),
  });

  const { data: groupList, isLoading: loadingGroups } = useUnitGroups(farm.id, 'active');

  const parameters = useMemo(() => (parameterList?.data ?? []).filter((parameter) => parameterIds.includes(parameter.id)), [parameterList, parameterIds]);
  const applies = (parameter: BioMeasurementParameter, unit: BioProductionUnit) => !parameter.unit_types?.length || parameter.unit_types.includes(unit.type);
  const unitOf = (id: number | '') => unitList?.data.find((unit) => unit.id === id);
  const measurable = (unit: BioProductionUnit) => parameters.some((parameter) => applies(parameter, unit));
  const taken = (parameter: BioMeasurementParameter, values: Record<number, string>) => filled(values[parameter.id]);

  // The unit being entered: the parameters that apply to it, what has been typed, and whether it can be added.
  // The groups chosen, with the groups beneath them.
  const groupIds = useMemo(() => {
    const ids = new Set<number>(draft.groupIds);
    let grew = true;
    while (grew) {
      grew = false;
      (groupList?.data ?? []).forEach((group) => {
        if (group.parent_id && ids.has(group.parent_id) && !ids.has(group.id)) {
          ids.add(group.id);
          grew = true;
        }
      });
    }

    return ids;
  }, [draft.groupIds, groupList]);
  // The units the readings are for: those picked, or those in the groups picked.
  // A whole group or kind of unit only reaches the units that hold a batch now; a unit picked by name is always taken.
  const inUse = (unit: BioProductionUnit) => (unit.open_batches ?? []).length > 0;
  const chosenUnits = target === 'group'
    ? (unitList?.data ?? []).filter((unit) => !!unit.unit_group_id && groupIds.has(unit.unit_group_id) && inUse(unit))
    : target === 'type'
      ? (unitList?.data ?? []).filter((unit) => draft.types.includes(unit.type) && inUse(unit))
      : draft.unitIds.map((id) => unitOf(id)).filter((unit): unit is BioProductionUnit => !!unit);
  const draftParameters = parameters.filter((parameter) => chosenUnits.some((unit) => applies(parameter, unit)));
  const draftEntered = draftParameters.filter((parameter) => taken(parameter, draft.values));
  const draftInvalid = draftEntered.some((parameter) => Number.isNaN(Number(draft.values[parameter.id])));
  // Units the readings will go to: those that take at least one parameter typed, and are not already on the list.
  const targets = chosenUnits.filter((unit) => !lines.some((line) => line.unitId === unit.id) && draftEntered.some((parameter) => applies(parameter, unit)));
  const draftComplete = draftEntered.length > 0 && !draftInvalid && targets.length > 0;
  const draftDirty = draft.unitIds.length > 0 || draft.groupIds.length > 0 || draft.types.length > 0 || Object.values(draft.values).some(filled);

  const clean = (unit: BioProductionUnit, values: Record<number, string>) =>
    Object.fromEntries(parameters.filter((parameter) => applies(parameter, unit) && taken(parameter, values)).map((parameter) => [parameter.id, values[parameter.id]]));

  const addLine = (): Line[] | null => {
    if (!draftComplete) return null;
    const next = [...lines, ...targets.map((unit) => ({ unitId: unit.id, values: clean(unit, draft.values) }))];
    setLines(next);
    setDraft(emptyDraft);
    setTimeout(() => unitRef.current?.focus(), 0);

    return next;
  };
  const editLine = (index: number) => {
    setTarget('unit');
    setDraft({ unitIds: [lines[index].unitId], groupIds: [], types: [], values: lines[index].values });
    setLines(lines.filter((_, i) => i !== index));
  };
  const removeLine = (index: number) => setLines(lines.filter((_, i) => i !== index));

  const save = useMutation({
    mutationFn: (toSave: Line[]) => {
      const payload = {
        farm_id: farm.id,
        measured_at: measuredAt.format('YYYY-MM-DD HH:mm:ss'),
        reason: reason.trim() || undefined,
        entries: toSave.map((line) => ({
          unit_id: line.unitId,
          readings: Object.entries(line.values).map(([parameterId, value]) => ({ parameter_id: Number(parameterId), value: Number(value) })),
        })),
      };

      return record ? roundServices.updateMeasurement(record.id, payload) : roundServices.saveMeasurement(payload);
    },
    onSuccess: (data) => {
      enqueueSnackbar(data.message, { variant: 'success' });
      setOpenDialog(false);
      try {
        localStorage.setItem(storageKey(farm.id), JSON.stringify(parameterIds));
      } catch {
        /* remembering the choice is a convenience only */
      }
      ['bioDailyRecords-measurement', 'bioDailyRecord', 'bioUnitEnvironment', 'bioBatchSummary'].forEach((name) => queryClient.invalidateQueries({ queryKey: [name] }));
    },
    onError: (error: any) => {
      const refused: { unit_id: number; message: string }[] | undefined = error?.response?.data?.row_errors;
      if (refused) {
        setRowErrors(refused.reduce((all, row) => ({ ...all, [row.unit_id]: [...(all[row.unit_id] ?? []), row.message] }), {} as Record<number, string[]>));
        enqueueSnackbar(text.messages.nothingSaved, { variant: 'error' });

        return;
      }
      enqueueSnackbar(getErrorMessage(error), { variant: 'error' });
    },
  });

  const attemptSave = () => {
    setRowErrors({});
    if (draftDirty) {
      setShowWarning(true);

      return;
    }
    save.mutate(lines);
  };

  const readingsCount = lines.reduce((sum, line) => sum + Object.keys(line.values).length, 0);
  const canSave = lines.length + (draftComplete ? 1 : 0) > 0 && parameters.length > 0 && !save.isPending;
  const pressEnter = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      addLine();
    }
  };

  const unitOptions = useMemo(
    () =>
      (unitList?.data ?? [])
        .filter(measurable)
        .map((unit) => {
          const added = lines.some((line) => line.unitId === unit.id);

          return { value: unit.id, label: unit.name, disabled: added, hint: added ? text.messages.added : types[unit.type] };
        }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [unitList, parameters, lines, text, types]
  );

  // The kinds of unit the farm has, each with how many of its units could be measured.
  const typeOptions = useMemo(
    () => Object.keys(types)
      .map((key) => ({ value: key, count: (unitList?.data ?? []).filter((unit) => unit.type === key && (unit.open_batches ?? []).length > 0).length }))
      .filter((entry) => entry.count > 0)
      .map((entry) => ({ value: entry.value, label: types[entry.value as keyof typeof types], hint: text.messages.unitsOfType.replace('{count}', String(entry.count)) })),
    [unitList, types, text]
  );

  // One column for each parameter measured; a unit shows only the readings it was given.
  const share = Math.min(2.5, Math.max(1, (12 - 2.5 - 1.5) / Math.max(1, parameters.length)));
  const columns: LineColumn<Line>[] = [
    { label: text.labels.productionUnit, xs: 12, md: 2.5, render: (line, index) => <><Typography component='span' color='text.secondary'>{index + 1}. </Typography><b>{unitOf(line.unitId)?.name}</b></> },
    ...parameters.map((parameter) => ({
      label: `${parameter.name}${parameter.unit_label ? ` (${parameter.unit_label})` : ''}`,
      xs: 6,
      md: share,
      right: true,
      render: (line: Line) => {
        if (!filled(line.values[parameter.id])) return <Box component='span' sx={{ opacity: 0.4 }}>—</Box>;
        const status = statusOf(parameter, Number(line.values[parameter.id]));

        return <Box component='span' sx={{ fontWeight: 600, color: status === 'critical' ? 'error.main' : status === 'watch' ? 'warning.main' : undefined }}>{line.values[parameter.id]}</Box>;
      },
    })),
  ];

  return (
    <>
      <DialogTitle textAlign='center' sx={{ pb: 0 }}>
        {record ? text.edit.measurement.replace('{recordNo}', record.recordNo) : text.new.measurement}
        <Typography variant='body2' color='text.secondary'>{farm.name}</Typography>
      </DialogTitle>
      <DialogContent sx={{ pt: '10px !important' }}>
        <SectionLabel>{text.sections.details}</SectionLabel>
        <Grid container spacing={1.5}>
          <Grid size={{ xs: 12, md: 4 }}>
            <DateTimePicker
              label={text.labels.measuredAt}
              value={measuredAt}
              maxDateTime={dayjs()}
              minDateTime={authOrganization?.organization?.recording_start_date ? dayjs(authOrganization.organization.recording_start_date) : undefined}
              ampm={false}
              onChange={(value) => value?.isValid() && setMeasuredAt(value)}
              slotProps={{ textField: { size: 'small', fullWidth: true } }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 8 }}>
            <Autocomplete
              multiple
              size='small'
              loading={loadingParameters}
              options={parameterList?.data ?? []}
              getOptionLabel={(parameter) => `${parameter.name}${parameter.unit_label ? ` (${parameter.unit_label})` : ''}`}
              value={parameters}
              onChange={(_, value) => setParameterIds(value.map((parameter) => parameter.id))}
              renderInput={(params) => <TextField {...params} label={text.labels.parameters} />}
            />
          </Grid>
          <Grid size={12}>
            <TextField size='small' fullWidth label={text.labels.costNote} value={reason} onChange={(event) => setReason(event.target.value)} />
          </Grid>
        </Grid>

        {(loadingParameters || loadingUnits) && <LinearProgress sx={{ mt: 2 }} />}
        {parameters.length === 0 && !loadingParameters && <Alert severity='info' sx={{ mt: 2 }}>{text.messages.chooseParameters}</Alert>}

        {parameters.length > 0 && (
          <>
            <SectionLabel>{text.sections.lines.measurement}</SectionLabel>
            <Paper variant='outlined' sx={{ p: 1.5, bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04) }}>
              <Grid container spacing={1} alignItems='flex-start'>
                <Grid size={12}>
                  <ToggleButtonGroup exclusive fullWidth size='small' sx={{ maxWidth: { sm: 540 } }} value={target} onChange={(_, value) => value && (setTarget(value), setDraft(emptyDraft))}>
                    <ToggleButton value='unit'>{text.labels.applyToUnit}</ToggleButton>
                    <ToggleButton value='group'>{text.labels.applyToGroup}</ToggleButton>
                    <ToggleButton value='type'>{text.labels.applyToType}</ToggleButton>
                  </ToggleButtonGroup>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  {target === 'unit' ? (
                    <Autocomplete
                      multiple
                      size='small'
                      disableCloseOnSelect
                      loading={loadingUnits}
                      options={unitOptions.filter((option) => !option.disabled)}
                      getOptionLabel={(option) => option.label}
                      isOptionEqualToValue={(option, value) => option.value === value.value}
                      value={unitOptions.filter((option) => draft.unitIds.includes(option.value as number))}
                      onChange={(_, value) => setDraft({ unitIds: value.map((option) => option.value as number), groupIds: [], types: [], values: {} })}
                      renderInput={(params) => <TextField {...params} inputRef={unitRef} label={text.labels.productionUnit} />}
                    />
                  ) : target === 'type' ? (
                    <Autocomplete
                      multiple
                      size='small'
                      disableCloseOnSelect
                      loading={loadingUnits}
                      options={typeOptions}
                      getOptionLabel={(option) => option.label}
                      isOptionEqualToValue={(option, value) => option.value === value.value}
                      value={typeOptions.filter((option) => draft.types.includes(option.value))}
                      onChange={(_, value) => setDraft({ unitIds: [], groupIds: [], types: value.map((option) => option.value), values: {} })}
                      renderOption={(props, option) => {
                        const { key, ...rest } = props as React.HTMLAttributes<HTMLLIElement> & { key: string };

                        return <li key={key} {...rest}><div><div>{option.label}</div><Typography variant='caption' color='text.secondary'>{option.hint}</Typography></div></li>;
                      }}
                      renderInput={(params) => <TextField {...params} inputRef={unitRef} label={text.labels.unitType} />}
                    />
                  ) : (
                    <Autocomplete
                      multiple
                      size='small'
                      disableCloseOnSelect
                      loading={loadingGroups}
                      options={unitGroupOptions(groupList?.data ?? [])}
                      getOptionLabel={(option) => option.label}
                      isOptionEqualToValue={(option, value) => option.value === value.value}
                      value={unitGroupOptions(groupList?.data ?? []).filter((option) => draft.groupIds.includes(option.value as number))}
                      onChange={(_, value) => setDraft({ unitIds: [], groupIds: value.map((option) => option.value as number), types: [], values: {} })}
                      renderInput={(params) => <TextField {...params} inputRef={unitRef} label={text.labels.unitGroup} />}
                    />
                  )}
                </Grid>
                {draftParameters.map((parameter) => {
                  const raw = draft.values[parameter.id] ?? '';
                  const number = Number(raw);
                  const invalid = filled(raw) && Number.isNaN(number);
                  const status = filled(raw) && !invalid ? statusOf(parameter, number) : 'ok';
                  const limits = status === 'critical' ? rangeText(parameter.critical_min, parameter.critical_max) : rangeText(parameter.watch_min, parameter.watch_max);

                  return (
                    <Grid key={parameter.id} size={{ xs: 6, md: 2 }}>
                      <TextField
                        size='small'
                        fullWidth
                        label={`${parameter.name}${parameter.unit_label ? ` (${parameter.unit_label})` : ''}`}
                        value={raw}
                        color={status === 'critical' ? 'error' : status === 'watch' ? 'warning' : undefined}
                        focused={status !== 'ok' || undefined}
                        error={invalid}
                        helperText={invalid ? mp.validation.numberInvalid : status === 'critical' ? mp.messages.critical.replace('{range}', limits) : status === 'watch' ? mp.messages.watch.replace('{range}', limits) : undefined}
                        onKeyDown={pressEnter}
                        onChange={(event) => setDraft({ ...draft, values: { ...draft.values, [parameter.id]: cleanNumber(event.target.value) } })}
                        slotProps={{ htmlInput: { inputMode: 'decimal' } }}
                      />
                    </Grid>
                  );
                })}
                <Grid size={{ xs: 12, md: 'auto' }} sx={{ pt: { md: 0.25 } }}>
                  <Tooltip title={text.messages.add}>
                    <span>
                      <IconButton color='primary' disabled={!draftComplete} onClick={addLine} sx={{ border: 1, borderColor: draftComplete ? 'primary.main' : 'divider' }}>
                        <CheckOutlined />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Grid>
              </Grid>
              {chosenUnits.length > 0 && <Typography variant='caption' color='text.secondary' display='block' mt={0.5}>{text.messages.measureOnlyWhatYouTook}</Typography>}
              {(target === 'group' ? draft.groupIds.length > 0 : target === 'type' ? draft.types.length > 0 : draft.unitIds.length > 1) && (
                <Typography variant='caption' color={targets.length || draftEntered.length === 0 ? 'text.secondary' : 'warning.main'} display='block' mt={0.5}>
                  {(chosenUnits.length === 0 ? text.messages.groupEmpty : text.messages.groupWillReceive).replace('{count}', String(targets.length)).replace('{total}', String(chosenUnits.length))}
                </Typography>
              )}
            </Paper>

            {lines.length > 0 && (
              <Box mt={2}>
                <LineTable<Line>
                  columns={columns}
                  rows={lines}
                  rowKey={(line) => line.unitId}
                  rowSx={(line) => (rowErrors[line.unitId] ? { bgcolor: (theme: any) => alpha(theme.palette.error.main, 0.1) } : { '&:hover': { bgcolor: 'action.hover' } })}
                  actions={(_, index) => (
                    <>
                      <Tooltip title={text.messages.edit}>
                        <IconButton size='small' onClick={() => editLine(index)}><EditOutlined fontSize='small' /></IconButton>
                      </Tooltip>
                      <Tooltip title={text.messages.remove}>
                        <IconButton size='small' color='error' onClick={() => removeLine(index)}><DeleteOutlined fontSize='small' /></IconButton>
                      </Tooltip>
                    </>
                  )}
                  rowFooter={(line) =>
                    rowErrors[line.unitId] ? (
                      <Grid size={12}>
                        {rowErrors[line.unitId].map((message) => (
                          <Typography key={message} variant='body2' color='error' pb={0.5}>{unitOf(line.unitId)?.name}: {message}</Typography>
                        ))}
                      </Grid>
                    ) : null
                  }
                />
                <Typography variant='h5' mb={0} mt={1.5} textAlign='right'>
                  {text.messages.readingsSummary.replace('{readings}', String(readingsCount)).replace('{units}', String(lines.length))}
                </Typography>
              </Box>
            )}
          </>
        )}
        {Object.keys(rowErrors).length > 0 && <Alert severity='error' sx={{ mt: 2 }}>{text.messages.nothingSaved}</Alert>}
      </DialogContent>
      <DialogActions>
        <Button size='small' onClick={() => setOpenDialog(false)}>{common.cancel}</Button>
        <LoadingButton variant='contained' size='small' loading={save.isPending} disabled={!canSave} onClick={attemptSave}>
          {common.submit}
        </LoadingButton>
      </DialogActions>

      <Dialog open={showWarning} onClose={() => setShowWarning(false)}>
        <DialogTitle>{text.messages.unsaved.title}</DialogTitle>
        <DialogContent>
          <DialogContentText>{text.messages.unsaved.message}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            size='small'
            disabled={!draftComplete}
            onClick={() => {
              setShowWarning(false);
              const next = addLine();
              if (next) save.mutate(next);
            }}
          >
            {text.messages.unsaved.addAndSave}
          </Button>
          <Button
            size='small'
            color='secondary'
            disabled={lines.length === 0}
            onClick={() => {
              setShowWarning(false);
              setDraft(emptyDraft);
              save.mutate(lines);
            }}
          >
            {text.messages.unsaved.saveWithout}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

/** A saved record is loaded with its readings before it is edited. */
const MeasurementForm = ({ setOpenDialog, item = null }: BioFormProps<RoundRecord>) => {
  const { data: record } = useQuery<RoundRecord>({
    queryKey: ['bioDailyRecord', item?.id, 'edit'],
    queryFn: () => roundServices.get(item!.id),
    enabled: !!item?.id,
    gcTime: 0,
  });

  if (item?.id && !record) return <LinearProgress />;

  return <MeasurementFormBody setOpenDialog={setOpenDialog} record={record ?? null} />;
};

export default MeasurementForm;
