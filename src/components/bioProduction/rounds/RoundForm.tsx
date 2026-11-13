'use client'

import { fromGrams, normalizeUnit, toGrams, withUnit } from '../weightUnit';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CheckOutlined, DeleteOutlined, EditOutlined } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  LinearProgress,
  Paper,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { DateTimePicker } from '@mui/x-date-pickers';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useSnackbar } from 'notistack';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { MODULES } from '@/utilities/constants/modules';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import LedgerSelect from '@/components/accounts/ledgers/forms/LedgerSelect';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import StoreSelector from '@/components/procurement/stores/StoreSelector';
import ProductSelect from '@/components/productAndServices/products/ProductSelect';
import { useProductsSelect } from '@/components/productAndServices/products/ProductsSelectProvider';
import { getErrorMessage } from '@/utilities/helpers/errorHandler';
import BioSelect from '../BioSelect';
import BioMultiSelect from '../BioMultiSelect';
import InfoHint from '../InfoHint';
import { useBioFarm } from '../FarmFirstPage';
import { categoryIds } from '../useFarmCategories';
import { productionUnitServices, roundServices } from '../bio-production-services';
import { BioFormProps, BioProductionUnit } from '../types';
import { nowStamp } from '../dateTime';
import { BIO_WIP_LEDGER_ID } from '../batches/batchConstants';
import { unitGroupOptions, useUnitGroups } from '../useUnitGroups';
import { BatchRoundMode, RoundBatchRow, RoundDraftLine, RoundRecord } from './roundTypes';
import LineTable, { LineColumn } from './LineTable';
import { useAvailableStock } from './useAvailableStock';

const filled = (value?: string) => value !== undefined && value.trim() !== '';
const positive = (value?: string) => filled(value) && Number(value) > 0;
const whole = (value?: string) => positive(value) && Number.isInteger(Number(value));
const money = (value: number) => value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const figure = (value: number) => value.toLocaleString(undefined, { maximumFractionDigits: 4 });
const EPSILON = 1e-9;

/** The money and quantity boxes show thousands separators (the platform's number field); the value kept is the plain number. */
const unformatted = (value: string) => value.replace(/,/g, '');
const formattedInput = { inputComponent: CommaSeparatedField };

type Values = Pick<RoundDraftLine, 'quantity' | 'cause' | 'sample_size' | 'average_weight_g' | 'rate' | 'product_quantity'>;

interface Draft extends Values {
  batchId: number | '';
}

const emptyDraft: Draft = { batchId: '', quantity: '', cause: '', sample_size: '', average_weight_g: '', rate: '', product_quantity: '' };

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <Typography variant='overline' color='text.secondary' display='block' sx={{ letterSpacing: 1, lineHeight: 1.5, mt: 2.5, mb: 1 }}>
    {children}
  </Typography>
);

/**
 * Records one activity for several production units, entered the way a payment is: the details of the
 * record, then a line for each unit (pick it, type the value, add it), the added lines listed with a
 * total, and Save. For feeding, the stock the store holds for the farm is shown and every quantity is
 * held to it. The server still records each line against its batch with the same rules as the batch
 * page, or refuses the whole record and says which lines to fix.
 */
const RoundFormBody = ({ mode, setOpenDialog, record = null, savedProduct = null }: { mode: BatchRoundMode; setOpenDialog: (open: boolean) => void; record?: RoundRecord | null; savedProduct?: any }) => {
  const editing = !!record;
  const dictionary = useDictionary();
  const text = dictionary.bioProduction.rounds;
  const common = dictionary.bioProduction.common;
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { authOrganization, checkOrganizationPermission, organizationHasSubscribed } = useJumboAuth();
  // Paying as the record is saved is posting a payment, so it is offered only to people who may post one.
  const canPay = mode === 'cost' && organizationHasSubscribed(MODULES.ACCOUNTS_AND_FINANCE) && checkOrganizationPermission([PERMISSIONS.ACCOUNTS_TRANSACTIONS_CREATE, PERMISSIONS.PAYMENTS_CREATE]);
  const unitRef = useRef<HTMLInputElement>(null);

  // The farm is chosen once, at the top of the page.
  const { farm } = useBioFarm();
  const farmId = farm.id;

  const [date, setDate] = useState(record ? dayjs(record.record_date).format('YYYY-MM-DD HH:mm:ss') : nowStamp());
  const [type, setType] = useState<string | number>(record?.input_type ?? 'feed');
  const [reason, setReason] = useState(record?.reason ?? '');
  const [storeId, setStoreId] = useState<number | null>(record?.store?.id ?? null);
  const [product, setProduct] = useState<any>(savedProduct);
  const [measurementUnitId, setMeasurementUnitId] = useState<string | number>(record?.measurement_unit?.id ?? '');
  const [causeForAll, setCauseForAll] = useState(record?.cause ?? '');
  const [ledger, setLedger] = useState<{ id: number; name: string } | null>(record?.ledger ?? null);
  const [payNow, setPayNow] = useState(!!record?.payment);
  const [payFrom, setPayFrom] = useState<{ id: number; name: string } | null>(record?.payment?.credit_ledger ?? null);
  const [paymentReference, setPaymentReference] = useState(record?.payment?.reference ?? '');
  const usesProduct = mode === 'harvest' || mode === 'produce';
  const [rate, setRate] = useState(record?.rate != null ? String(Number(record.rate)) : '');
  // A cost line is usually for one of something, so that is what a new line starts with.
  const freshDraft = (): Draft => ({ ...emptyDraft, quantity: mode === 'cost' ? '1' : '' });
  // A cost can be spread over the open batches of a farm or group, which fills the lines below.
  const [spreadAmount, setSpreadAmount] = useState('');
  const [spreadGroup, setSpreadGroup] = useState<(string | number)[]>([]);
  const [spreadUnits, setSpreadUnits] = useState<(string | number)[]>([]);
  const [spreadBasis, setSpreadBasis] = useState<string | number>('equal');
  const [spreadDays, setSpreadDays] = useState('30');
  const { data: spreadGroups } = useUnitGroups(mode === 'cost' ? farmId : null);
  const { data: spreadUnitList, isLoading: loadingSpreadUnits } = useQuery<{ data: BioProductionUnit[] }>({
    queryKey: ['bioFarmUnits', farmId],
    queryFn: () => productionUnitServices.getList({ farm_id: farmId, status: 'active', limit: 2000 }),
    enabled: mode === 'cost' && !!farmId,
  });
  const [items, setItems] = useState<RoundDraftLine[]>([]);
  const [draft, setDraft] = useState<Draft>(freshDraft);
  const [rowErrors, setRowErrors] = useState<Record<number, string>>({});
  const [showWarning, setShowWarning] = useState(false);
  const [loadedLines, setLoadedLines] = useState(!record);


  const { data: openBatches = [], isFetching } = useQuery<RoundBatchRow[]>({
    // Produce is offered only the batches in a bearer stage; a product only the batches whose species yields it.
    queryKey: ['bioRoundBatches', farmId, mode === 'produce' ? 'produce' : 'all', usesProduct ? product?.id ?? null : null],
    queryFn: () => roundServices.getBatches(farmId, { ...(mode === 'produce' ? { kind: 'produce' } : {}), ...(usesProduct && product?.id ? { product_id: product.id } : {}) }),
    gcTime: editing ? 0 : undefined,
  });

  // The deaths this record already counted are alive again once it is re-posted, so they are available to it.
  const batches = useMemo(
    () =>
      mode === 'mortality' && record
        ? openBatches.map((row) => ({ ...row, current_quantity: row.current_quantity + Number(record.lines?.find((line) => line.batch_id === row.batch_id)?.quantity ?? 0) }))
        : openBatches,
    [openBatches, record, mode]
  );

  // Lines of the record being edited become the lines of the form once the open batches are known.
  useEffect(() => {
    if (!record || loadedLines || isFetching) return;
    setItems(
      (record.lines ?? []).map((line) => {
        const row: RoundBatchRow = batches.find((batch) => batch.batch_id === line.batch_id) ?? {
          batch_id: line.batch_id,
          batchNo: line.batchNo,
          unit: { id: line.unit?.id ?? 0, name: line.unit?.name ?? '', type: '' },
          stage: line.stage,
          current_quantity: 0,
          species: { name: '', count_label: '', weight_unit: line.weight_unit },
        };

        return {
          row,
          quantity: line.quantity != null ? String(line.quantity) : '',
          cause: line.cause && line.cause !== record.cause ? line.cause : '',
          sample_size: line.sample_size != null ? String(line.sample_size) : '',
          average_weight_g: line.average_weight_g != null ? String(fromGrams(Number(line.average_weight_g), row.species.weight_unit ?? line.weight_unit)) : '',
          rate: line.rate != null && Number(line.rate) !== Number(record.rate) ? String(Number(line.rate)) : '',
          product_quantity: line.product_quantity != null ? String(Number(line.product_quantity)) : '',
        };
      })
    );
    setLoadedLines(true);
  }, [record, loadedLines, isFetching, batches]);

  const productUnits: { id: number; name: string; symbol?: string }[] = product ? [product.primary_unit, ...(product.secondary_units ?? [])].filter(Boolean) : [];
  const unitSymbol = productUnits.find((unit) => unit.id === measurementUnitId)?.symbol ?? '';
  const headerReady = !!date && (mode !== 'feeding' || (!!type && !!storeId && !!product && !!measurementUnitId)) && (mode !== 'cost' || (!!ledger && Number(rate) > 0 && (!payNow || !!payFrom))) && (!usesProduct || (!!product && !!storeId));

  // Stock held for this farm's cost center, as the sales form reads it.
  const stock = useAvailableStock({
    productId: mode === 'feeding' ? product?.id : null,
    storeId,
    costCenterId: (farm as any).cost_center_id ?? farm.cost_center?.id,
    unitId: measurementUnitId,
    date,
  });
  const usedByLines = items.reduce((sum, line) => sum + Number(line.quantity ?? 0), 0);
  // What the saved record took from the store is given back when it is re-posted, as long as it is the same stock.
  const sameStock = !!record && record.product?.id === product?.id && record.store?.id === storeId && record.measurement_unit?.id === measurementUnitId;
  const credit = sameStock ? Number(record?.total_quantity ?? 0) : 0;
  const remaining = stock.usable == null ? null : stock.usable + credit - usedByLines;
  const stockWord = (value: number) => `${figure(value)}${unitSymbol ? ` ${unitSymbol}` : ''}`;

  /** Whether the values for a batch are complete, and if something typed is wrong, what. */
  const assess = (row: RoundBatchRow, values: Values): { complete: boolean; issue?: string } => {
    if (mode === 'weighing') {
      const touched = filled(values.sample_size) || filled(values.average_weight_g);
      if (!touched) return { complete: false };
      if (!whole(values.sample_size) || !positive(values.average_weight_g)) return { complete: false, issue: text.messages.needBoth };
      if (Number(values.sample_size) > row.current_quantity) return { complete: false, issue: text.messages.overLive };

      return { complete: true };
    }

    if (mode === 'harvest') {
      if (!filled(values.quantity) && !filled(values.product_quantity)) return { complete: false };
      if (!whole(values.quantity) || !positive(values.product_quantity)) return { complete: false, issue: text.messages.needBothHarvest };
      if (Number(values.quantity) > row.current_quantity) return { complete: false, issue: text.messages.overLive };

      return { complete: true };
    }

    if (!filled(values.quantity)) return { complete: false };
    if (!positive(values.quantity)) return { complete: false, issue: mode === 'cost' || mode === 'produce' ? text.messages.needPositive : text.messages.needWholeNumber };
    if (mode === 'cost' && filled(values.rate) && !positive(values.rate)) return { complete: false, issue: text.messages.needPositive };
    if (mode === 'mortality') {
      if (!whole(values.quantity)) return { complete: false, issue: text.messages.needWholeNumber };
      if (Number(values.quantity) > row.current_quantity) return { complete: false, issue: text.messages.overLive };
    }
    if (mode === 'feeding' && remaining != null && Number(values.quantity) > remaining + EPSILON) {
      return { complete: false, issue: stock.usable === 0 ? text.messages.noStock : text.messages.exceedsStock.replace('{remaining}', figure(Math.max(0, remaining))).replace('{unit}', unitSymbol) };
    }

    return { complete: true };
  };

  const draftRow = batches.find((row) => row.batch_id === draft.batchId);
  const draftState = draftRow ? assess(draftRow, draft) : { complete: false };
  const draftDirty = draft.batchId !== '' || (mode !== 'cost' && filled(draft.quantity)) || filled(draft.product_quantity) || filled(draft.sample_size) || filled(draft.average_weight_g);

  const { mutate: spreadCost, isPending: spreading } = useMutation({
    mutationFn: () => roundServices.spreadCost({
      farm_id: farmId, unit_group_ids: spreadGroup, unit_ids: spreadUnits, expense_date: date, amount: Number(spreadAmount), basis: spreadBasis, feed_days: spreadBasis === 'feed' ? Number(spreadDays) || 30 : null,
    }),
    onSuccess: (data: { rows: { batch_id: number; amount: number }[]; total: number }) => {
      // Every share is one line of one, at its own amount: the sheet is then saved like any cost record, and any line can be changed first.
      const lines = data.rows.flatMap((share) => {
        const row = batches.find((batch) => batch.batch_id === share.batch_id);

        return row ? [{ row, quantity: '1', rate: String(share.amount) } as RoundDraftLine] : [];
      });
      setItems(lines);
      setDraft(freshDraft());
      setRowErrors({});
      if (!rate) setRate(String(data.total));
      enqueueSnackbar(text.spread.filled.replace('{count}', String(lines.length)).replace('{total}', data.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })), { variant: 'success' });
    },
    onError: (error) => enqueueSnackbar(getErrorMessage(error), { variant: 'error' }),
  });

  const addLine = (): RoundDraftLine[] | null => {
    if (!draftRow || !draftState.complete) return null;
    const next = [...items, { row: draftRow, quantity: draft.quantity, cause: draft.cause, sample_size: draft.sample_size, average_weight_g: draft.average_weight_g, rate: draft.rate, product_quantity: draft.product_quantity }];
    setItems(next);
    setDraft(freshDraft());
    setTimeout(() => unitRef.current?.focus(), 0);

    return next;
  };

  const editLine = (index: number) => {
    const line = items[index];
    setItems(items.filter((_, i) => i !== index));
    setDraft({ batchId: line.row.batch_id, quantity: line.quantity ?? '', cause: line.cause ?? '', sample_size: line.sample_size ?? '', average_weight_g: line.average_weight_g ?? '', rate: line.rate ?? '', product_quantity: line.product_quantity ?? '' });
  };

  const removeLine = (index: number) => setItems(items.filter((_, i) => i !== index));

  const buildPayload = (lines: RoundDraftLine[]) => {
    const entries = lines.map((line) => {
      if (mode === 'weighing') {
        return { batch_id: line.row.batch_id, sample_size: Number(line.sample_size), average_weight_g: toGrams(Number(line.average_weight_g), line.row.species.weight_unit) };
      }

      if (mode === 'harvest') {
        return { batch_id: line.row.batch_id, quantity: Number(line.quantity), product_quantity: Number(line.product_quantity) };
      }

      if (mode === 'cost') {
        return { batch_id: line.row.batch_id, quantity: Number(line.quantity), ...(filled(line.rate) ? { rate: Number(line.rate) } : {}) };
      }

      return {
        batch_id: line.row.batch_id,
        quantity: Number(line.quantity),
        ...(mode === 'mortality' && filled(line.cause) ? { cause: line.cause!.trim() } : {}),
      };
    });

    if (mode === 'feeding') {
      return { farm_id: farmId, event_date: date, type, reason: type === 'medication' ? reason : undefined, store_id: storeId, product_id: product?.id, measurement_unit_id: measurementUnitId, entries };
    }
    if (mode === 'harvest' || mode === 'produce') {
      return { farm_id: farmId, [mode === 'harvest' ? 'harvest_date' : 'collection_date']: date, product_id: product?.id, store_id: storeId, reason: reason.trim() || undefined, entries };
    }
    if (mode === 'cost') {
      return { farm_id: farmId, expense_date: date, ledger_id: ledger?.id, rate: Number(rate), reason: reason.trim() || undefined, entries, ...(payNow ? { pay_now: true, pay_from_ledger_id: payFrom?.id, payment_reference: paymentReference.trim() || undefined } : {}) };
    }
    if (mode === 'mortality') {
      return { farm_id: farmId, event_date: date, cause: causeForAll.trim() || undefined, entries };
    }

    return { farm_id: farmId, sample_date: date, entries };
  };

  const save = useMutation({
    mutationFn: (lines: RoundDraftLine[]) =>
      record
        ? ({ feeding: roundServices.updateFeeding, mortality: roundServices.updateMortality, weighing: roundServices.updateWeighing, cost: roundServices.updateCost, harvest: roundServices.updateHarvest, produce: roundServices.updateProduce })[mode](record.id, buildPayload(lines))
        : ({ feeding: roundServices.saveFeeding, mortality: roundServices.saveMortality, weighing: roundServices.saveWeighing, cost: roundServices.saveCost, harvest: roundServices.saveHarvest, produce: roundServices.saveProduce })[mode](buildPayload(lines)),
    onSuccess: (data) => {
      enqueueSnackbar(data.paymentNo ? `${data.message} · ${data.paymentNo}` : data.message, { variant: 'success' });
      setOpenDialog(false);
      queryClient.invalidateQueries({ queryKey: [`bioDailyRecords-${mode}`] });
      queryClient.invalidateQueries({ queryKey: ['bioDailyRecord'] });
      queryClient.invalidateQueries({ queryKey: ['bioBatchProduce'] });
      queryClient.invalidateQueries({ queryKey: ['bioRoundBatches'] });
      queryClient.invalidateQueries({ queryKey: ['bioStock'] });
      queryClient.invalidateQueries({ queryKey: ['bioBatches'] });
      queryClient.invalidateQueries({ queryKey: ['bioBatch'] });
      queryClient.invalidateQueries({ queryKey: ['bioBatchInputs'] });
      queryClient.invalidateQueries({ queryKey: ['bioBatchMortalities'] });
    },
    onError: (error: any) => {
      const refused: { batch_id: number; message: string }[] | undefined = error?.response?.data?.row_errors;
      if (refused) {
        setRowErrors(Object.fromEntries(refused.map((line) => [line.batch_id, line.message])));
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
    save.mutate(items);
  };

  const unitOptions = useMemo(
    () =>
      batches.map((row) => {
        const used = items.some((line) => line.row.batch_id === row.batch_id);

        return {
          value: row.batch_id,
          label: `${row.unit.name} · ${row.batchNo}`,
          disabled: used,
          hint: used ? `${text.messages.added}` : `${row.stage?.name ?? ''} · ${row.current_quantity.toLocaleString()} ${text.labels.alive.toLowerCase()}`,
        };
      }),
    [batches, items, text]
  );

  const totalQuantity = usedByLines;
  const receivedTotal = items.reduce((sum, line) => sum + Number(line.product_quantity ?? 0), 0);
  const costTotal = items.reduce((sum, line) => sum + Number(line.quantity) * Number(filled(line.rate) ? line.rate : rate), 0);
  const overStock = mode === 'feeding' && remaining != null && remaining < -EPSILON;
  const canSave = headerReady && loadedLines && (canPay || !record?.payment) && items.length + (draftState.complete ? 1 : 0) > 0 && !overStock && !save.isPending;
  const unitMd = mode === 'mortality' || mode === 'harvest' ? 2.5 : 3;
  const lineColumns: LineColumn<RoundDraftLine>[] = [
    { label: text.labels.productionUnit, xs: 12, md: unitMd, render: (line, index) => <><Typography component='span' color='text.secondary'>{index + 1}. </Typography><b>{line.row.unit.name}</b></> },
    { label: text.labels.batch, xs: 6, md: 1.5, render: (line) => line.row.batchNo },
    { label: text.labels.stage, xs: 6, md: 1.5, muted: true, render: (line) => line.row.stage?.name },
    ...(mode !== 'cost' ? [{ label: text.labels.alive, xs: 6, md: mode === 'mortality' ? 1 : 1.5, right: true, muted: true, render: (line: RoundDraftLine) => line.row.current_quantity.toLocaleString() }] : []),
    ...(mode === 'harvest'
      ? [
          { label: text.labels.harvested, xs: 6, md: 2, right: true, render: (line: RoundDraftLine) => <b>{Number(line.quantity).toLocaleString()}</b> },
          { label: text.labels.received, xs: 6, md: 2, right: true, render: (line: RoundDraftLine) => <b>{figure(Number(line.product_quantity))}</b> },
        ]
      : []),
    ...(mode === 'produce' ? [{ label: text.labels.collected, xs: 6, md: 2.5, right: true, render: (line: RoundDraftLine) => <b>{figure(Number(line.quantity))}</b> }] : []),
    ...(mode === 'feeding' ? [{ label: text.labels.quantity, xs: 6, md: 2.5, right: true, render: (line: RoundDraftLine) => <b>{figure(Number(line.quantity))} {unitSymbol}</b> }] : []),
    ...(mode === 'cost'
      ? [
          { label: text.labels.quantity, xs: 4, md: 1.5, right: true, render: (line: RoundDraftLine) => figure(Number(line.quantity)) },
          { label: text.labels.rate, xs: 4, md: 1.5, right: true, muted: false, render: (line: RoundDraftLine) => <span style={{ opacity: filled(line.rate) ? 1 : 0.7 }}>{money(Number(filled(line.rate) ? line.rate : rate))}</span> },
          { label: text.labels.amount, xs: 4, md: 2, right: true, render: (line: RoundDraftLine) => <b>{money(Number(line.quantity) * Number(filled(line.rate) ? line.rate : rate))}</b> },
        ]
      : []),
    ...(mode === 'mortality'
      ? [
          { label: text.labels.died, xs: 6, md: 1, right: true, render: (line: RoundDraftLine) => <b>{Number(line.quantity).toLocaleString()}</b> },
          { label: text.labels.cause, xs: 12, md: 3.5, render: (line: RoundDraftLine) => line.cause || causeForAll },
        ]
      : []),
    ...(mode === 'weighing'
      ? [
          { label: text.labels.sampleSize, xs: 6, md: 1.5, right: true, render: (line: RoundDraftLine) => <b>{Number(line.sample_size).toLocaleString()}</b> },
          { label: text.labels.averageWeight, xs: 6, md: 1.5, right: true, render: (line: RoundDraftLine) => <b>{figure(Number(line.average_weight_g))} {normalizeUnit(line.row.species.weight_unit)}</b> },
        ]
      : []),
  ];

  const noStock = mode === 'feeding' && !!product && !!storeId && stock.usable === 0;
  const pressEnter = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      addLine();
    }
  };
  const numberInput = (step: number | string, adornment?: string) => ({
    htmlInput: { min: 0, step },
    ...(adornment ? { input: { endAdornment: <InputAdornment position='end'>{adornment}</InputAdornment> } } : {}),
  });

  return (
    <>
      <DialogTitle textAlign='center' sx={{ pb: 0 }}>
        {record ? text.edit[mode].replace('{recordNo}', record.recordNo) : text.new[mode]}
        <Typography variant='body2' color='text.secondary'>{farm.name}</Typography>
      </DialogTitle>
      <DialogContent sx={{ pt: '10px !important' }}>
        <SectionLabel>{text.sections.details}</SectionLabel>
        <Grid container spacing={1.5}>
          <Grid size={{ xs: 12, md: 3 }}>
            <DateTimePicker
              label={text.labels.dateTime}
              value={date ? dayjs(date) : null}
              minDateTime={authOrganization?.organization?.recording_start_date ? dayjs(authOrganization.organization.recording_start_date) : undefined}
              maxDateTime={dayjs()}
              ampm={false}
              onChange={(value) => setDate(value?.isValid() ? value.format('YYYY-MM-DD HH:mm:ss') : '')}
              slotProps={{ textField: { size: 'small', fullWidth: true } }}
            />
          </Grid>

          {mode === 'feeding' && (
            <>
              <Grid size={{ xs: 12, md: 3 }}>
                <BioSelect
                  required
                  label={text.labels.type}
                  options={(['feed', 'medication', 'other'] as const).map((value) => ({ value, label: dictionary.bioProduction.batches.inputTypes[value] }))}
                  value={type}
                  onChange={setType}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <StoreSelector
                  label={text.labels.store}
                  allowSubStores={true}
                  includeStores={authOrganization?.stores?.length ? authOrganization.stores : undefined}
                  defaultValue={record?.store ?? null}
                  onChange={(store: any) => setStoreId(store?.id ?? null)}
                />
              </Grid>
              {type === 'medication' && (
                <Grid size={12}>
                  <TextField size='small' fullWidth label={text.labels.reason} value={reason} onChange={(event) => setReason(event.target.value)} />
                </Grid>
              )}
              <Grid size={{ xs: 12, md: 6 }}>
                <ProductSelect
                  label={text.labels.product}
                  allowedTypes={['Inventory']}
                  allowedCategoryIds={categoryIds((farm as any).input_categories)}
                  defaultValue={savedProduct}
                  onChange={(selected: any) => {
                    setProduct(selected ?? null);
                    setMeasurementUnitId(selected?.primary_unit?.id ?? selected?.measurement_unit_id ?? '');
                  }}
                />
              </Grid>
              <Grid size={{ xs: 6, md: 3 }}>
                <BioSelect
                  required
                  label={text.labels.unit}
                  disabled={!product}
                  options={productUnits.map((unit) => ({ value: unit.id, label: unit.symbol ?? unit.name }))}
                  value={measurementUnitId}
                  onChange={setMeasurementUnitId}
                />
              </Grid>
              <Grid size={{ xs: 6, md: 3 }}>
                {stock.isFetching ? (
                  <Box sx={{ pt: 2 }}><LinearProgress /></Box>
                ) : (
                  <Tooltip title={text.labels.stockFor}>
                    <TextField
                      size='small'
                      fullWidth
                      label={text.labels.available}
                      value={stock.usable == null ? '—' : figure(stock.usable)}
                      error={noStock}
                      color={stock.usable ? 'success' : undefined}
                      focused={stock.usable != null}
                      slotProps={{ input: { readOnly: true, endAdornment: <InputAdornment position='end'>{unitSymbol}</InputAdornment> } }}
                    />
                  </Tooltip>
                )}
              </Grid>
              {noStock && (
                <Grid size={12}>
                  <Alert severity='warning' sx={{ py: 0 }}>{text.messages.noStock}</Alert>
                </Grid>
              )}
            </>
          )}

          {usesProduct && (
            <>
              <Grid size={{ xs: 12, md: 6 }}>
                <ProductSelect
                  label={text.labels.product}
                  allowedTypes={['Inventory']}
                  allowedCategoryIds={categoryIds((farm as any).output_categories)}
                  defaultValue={savedProduct}
                  onChange={(selected: any) => setProduct(selected ?? null)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <StoreSelector
                  label={text.labels.store}
                  allowSubStores={true}
                  includeStores={authOrganization?.stores?.length ? authOrganization.stores : undefined}
                  defaultValue={record?.store ?? null}
                  onChange={(store: any) => setStoreId(store?.id ?? null)}
                />
              </Grid>
              <Grid size={12}>
                <TextField size='small' fullWidth label={text.labels.costNote} value={reason} onChange={(event) => setReason(event.target.value)} />
              </Grid>
            </>
          )}

          {mode === 'cost' && (
            <>
              <Grid size={{ xs: 12, md: 5 }}>
                <LedgerSelect
                  label={text.labels.ledger}
                  allowedGroups={['Expenses']}
                  notAllowedLedgers={[BIO_WIP_LEDGER_ID]}
                  defaultValue={record?.ledger as any}
                  onChange={(selected: any) => setLedger(selected ? { id: selected.id, name: selected.name } : null)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField size='small' fullWidth label={text.labels.rate} value={rate} onChange={(event) => setRate(unformatted(event.target.value))} InputProps={formattedInput} />
              </Grid>
              <Grid size={12}>
                <TextField size='small' fullWidth label={text.labels.costNote} value={reason} onChange={(event) => setReason(event.target.value)} />
              </Grid>
              <Grid size={12}>
                <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 1.5 }}>
                  <Stack direction='row' alignItems='center' spacing={0.5} sx={{ mb: 1 }}>
                    <Typography variant='subtitle2'>{text.spread.title}</Typography>
                    <InfoHint text={text.spread.help} />
                  </Stack>
                  <Grid container spacing={1.5} alignItems='center'>
                    <Grid size={{ xs: 12, md: 3 }}>
                      <TextField size='small' fullWidth label={text.spread.amount} value={spreadAmount} onChange={(event) => setSpreadAmount(unformatted(event.target.value))} InputProps={formattedInput} />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <BioMultiSelect label={text.spread.group} options={unitGroupOptions(spreadGroups?.data)} value={spreadGroup} onChange={setSpreadGroup} />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <BioMultiSelect label={text.spread.units} options={(spreadUnitList?.data ?? []).map((unit) => ({ value: unit.id, label: unit.name, hint: unit.unit_group?.path ?? undefined }))} value={spreadUnits} onChange={setSpreadUnits} loading={loadingSpreadUnits} />
                    </Grid>
                    <Grid size={{ xs: 12, md: spreadBasis === 'feed' ? 5 : 7 }}>
                      <BioSelect label={text.spread.basis} options={(['equal', 'animals', 'biomass', 'feed'] as const).map((value) => ({ value, label: text.spread.bases[value] }))} value={spreadBasis} onChange={setSpreadBasis} />
                    </Grid>
                    {spreadBasis === 'feed' && (
                      <Grid size={{ xs: 6, md: 2 }}>
                        <TextField size='small' fullWidth label={text.spread.feedDays} value={spreadDays} onChange={(event) => setSpreadDays(unformatted(event.target.value))} InputProps={formattedInput} />
                      </Grid>
                    )}
                    <Grid size={{ xs: 12, md: 'auto' }}>
                      <LoadingButton size='small' variant='outlined' loading={spreading} disabled={!(Number(spreadAmount) > 0) || !date} onClick={() => spreadCost()}>{text.spread.button}</LoadingButton>
                    </Grid>
                  </Grid>
                </Box>
              </Grid>
              {record?.payment && (
                <Grid size={12}>
                  <Alert severity={canPay ? 'info' : 'warning'}>
                    {(canPay ? text.messages.paidEdit : text.messages.paidNoRights).replace('{voucherNo}', record.payment.voucherNo)}
                  </Alert>
                </Grid>
              )}
              {canPay && (
                <>
                  <Grid size={12}>
                    <Stack direction='row' alignItems='center' spacing={0.5}>
                      <FormControlLabel control={<Switch checked={payNow} onChange={(event) => setPayNow(event.target.checked)} />} label={text.labels.payNow} />
                      <InfoHint text={text.messages.payNowHelp} />
                    </Stack>
                  </Grid>
                  {payNow && (
                    <>
                      <Grid size={{ xs: 12, md: 7 }}>
                        <LedgerSelect
                          label={text.labels.payFrom}
                          defaultValue={record?.payment?.credit_ledger as any}
                          allowedGroups={['Current Assets', 'Current Liabilities', 'Cash and Cash Equivalents', 'Banks', 'Accounts Payable', 'Accounts Receivable']}
                          onChange={(selected: any) => setPayFrom(selected && !Array.isArray(selected) ? { id: selected.id, name: selected.name } : null)}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 5 }}>
                        <TextField size='small' fullWidth label={text.labels.paymentReference} value={paymentReference} onChange={(event) => setPaymentReference(event.target.value)} />
                      </Grid>
                    </>
                  )}
                </>
              )}
            </>
          )}

          {mode === 'mortality' && (
            <Grid size={{ xs: 12, md: 9 }}>
              <TextField size='small' fullWidth label={text.labels.causeAll} value={causeForAll} onChange={(event) => setCauseForAll(event.target.value)} />
            </Grid>
          )}
        </Grid>

        <SectionLabel>{text.sections.lines[mode]}</SectionLabel>
        <Paper variant='outlined' sx={{ p: 1.5, bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04) }}>
          <Grid container spacing={1} alignItems='flex-start'>
            <Grid size={{ xs: 12, md: mode === 'cost' ? 4 : 5 }}>
              <BioSelect
                ref={unitRef}
                label={text.labels.productionUnit}
                loading={isFetching}
                options={unitOptions}
                value={draft.batchId}
                onChange={(value) => setDraft({ ...draft, batchId: value as number | '' })}
              />
            </Grid>
            {mode === 'feeding' && (
              <Grid size={{ xs: 8, md: 4 }}>
                <TextField
                  type='number'
                  size='small'
                  fullWidth
                  label={text.labels.quantity}
                  value={draft.quantity}
                  error={!!draftState.issue}
                  helperText={draftState.issue}
                  onKeyDown={pressEnter}
                  onChange={(event) => setDraft({ ...draft, quantity: event.target.value })}
                  slotProps={numberInput('any', unitSymbol)}
                />
              </Grid>
            )}
            {mode === 'harvest' && (
              <>
                <Grid size={{ xs: 6, md: 3 }}>
                  <TextField
                    type='number'
                    size='small'
                    fullWidth
                    label={text.labels.harvested}
                    value={draft.quantity}
                    error={!!draftState.issue}
                    helperText={draftState.issue}
                    onKeyDown={pressEnter}
                    onChange={(event) => setDraft({ ...draft, quantity: event.target.value })}
                    slotProps={numberInput(1)}
                  />
                </Grid>
                <Grid size={{ xs: 6, md: 3 }}>
                  <TextField
                    size='small'
                    fullWidth
                    label={text.labels.received}
                    value={draft.product_quantity}
                    onKeyDown={pressEnter}
                    onChange={(event) => setDraft({ ...draft, product_quantity: unformatted(event.target.value) })}
                    InputProps={formattedInput}
                  />
                </Grid>
              </>
            )}
            {mode === 'produce' && (
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  size='small'
                  fullWidth
                  label={text.labels.collected}
                  value={draft.quantity}
                  error={!!draftState.issue}
                  helperText={draftState.issue}
                  onKeyDown={pressEnter}
                  onChange={(event) => setDraft({ ...draft, quantity: unformatted(event.target.value) })}
                  InputProps={formattedInput}
                />
              </Grid>
            )}
            {mode === 'cost' && (
              <>
                <Grid size={{ xs: 6, md: 3 }}>
                  <TextField
                    size='small'
                    fullWidth
                    label={text.labels.quantity}
                    value={draft.quantity}
                    error={!!draftState.issue}
                    helperText={draftState.issue}
                    onKeyDown={pressEnter}
                    onChange={(event) => setDraft({ ...draft, quantity: unformatted(event.target.value) })}
                    InputProps={formattedInput}
                  />
                </Grid>
                <Grid size={{ xs: 6, md: 3 }}>
                  <TextField
                    size='small'
                    fullWidth
                    label={text.labels.rateOverride}
                    placeholder={rate}
                    value={draft.rate}
                    onKeyDown={pressEnter}
                    onChange={(event) => setDraft({ ...draft, rate: unformatted(event.target.value) })}
                    InputProps={formattedInput}
                  />
                </Grid>
              </>
            )}
            {mode === 'mortality' && (
              <>
                <Grid size={{ xs: 4, md: 2 }}>
                  <TextField
                    type='number'
                    size='small'
                    fullWidth
                    label={text.labels.died}
                    value={draft.quantity}
                    error={!!draftState.issue}
                    helperText={draftState.issue}
                    onKeyDown={pressEnter}
                    onChange={(event) => setDraft({ ...draft, quantity: event.target.value })}
                    slotProps={numberInput(1)}
                  />
                </Grid>
                <Grid size={{ xs: 8, md: 3 }}>
                  <TextField
                    size='small'
                    fullWidth
                    label={text.labels.cause}
                    placeholder={causeForAll}
                    value={draft.cause}
                    onKeyDown={pressEnter}
                    onChange={(event) => setDraft({ ...draft, cause: event.target.value })}
                  />
                </Grid>
              </>
            )}
            {mode === 'weighing' && (
              <>
                <Grid size={{ xs: 6, md: 2 }}>
                  <TextField
                    type='number'
                    size='small'
                    fullWidth
                    label={text.labels.sampleSize}
                    value={draft.sample_size}
                    error={!!draftState.issue}
                    onKeyDown={pressEnter}
                    onChange={(event) => setDraft({ ...draft, sample_size: event.target.value })}
                    slotProps={numberInput(1)}
                  />
                </Grid>
                <Grid size={{ xs: 6, md: 3 }}>
                  <TextField
                    type='number'
                    size='small'
                    fullWidth
                    label={withUnit(text.labels.averageWeight, draftRow?.species.weight_unit)}
                    value={draft.average_weight_g}
                    error={!!draftState.issue}
                    helperText={draftState.issue}
                    onKeyDown={pressEnter}
                    onChange={(event) => setDraft({ ...draft, average_weight_g: event.target.value })}
                    slotProps={numberInput('any')}
                  />
                </Grid>
              </>
            )}
            <Grid size={{ xs: 12, md: 'auto' }} sx={{ pt: { md: 0.25 } }}>
              <Tooltip title={text.messages.add}>
                <span>
                  <IconButton color='primary' disabled={!draftState.complete} onClick={addLine} sx={{ border: 1, borderColor: draftState.complete ? 'primary.main' : 'divider' }}>
                    <CheckOutlined />
                  </IconButton>
                </span>
              </Tooltip>
            </Grid>
          </Grid>
          {draftRow && (
            <Typography variant='caption' color='text.secondary' display='block' mt={0.5}>
              {draftRow.stage?.name} · {draftRow.current_quantity.toLocaleString()} {text.labels.alive.toLowerCase()}
            </Typography>
          )}
        </Paper>

        {Object.keys(rowErrors).length > 0 && <Alert severity='error' sx={{ mt: 2 }}>{text.messages.nothingSaved}</Alert>}

        {items.length > 0 && (
          <Box mt={2}>
            <LineTable<RoundDraftLine>
              columns={lineColumns}
              rows={items}
              rowKey={(line) => line.row.batch_id}
              rowSx={(line) => (rowErrors[line.row.batch_id] ? { bgcolor: (theme: any) => alpha(theme.palette.error.main, 0.1) } : { '&:hover': { bgcolor: 'action.hover' } })}
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
                rowErrors[line.row.batch_id] ? (
                  <Grid size={12}>
                    <Typography variant='body2' color='error' pb={0.5}>{line.row.unit.name} · {line.row.batchNo}: {rowErrors[line.row.batch_id]}</Typography>
                  </Grid>
                ) : null
              }
            />
          </Box>
        )}

        {items.length > 0 && mode === 'feeding' && (
          <Paper variant='outlined' sx={{ mt: 2, p: 1.5 }}>
            <Grid container spacing={2}>
              <Grid size={4}>
                <Typography variant='caption' color='text.secondary'>{text.labels.available}</Typography>
                <Typography variant='h5' mb={0}>{stock.usable == null ? '—' : stockWord(stock.usable)}</Typography>
              </Grid>
              <Grid size={4}>
                <Typography variant='caption' color='text.secondary'>{text.labels.thisRecord} · {text.messages.total.replace('{count}', String(items.length))}</Typography>
                <Typography variant='h5' mb={0}>{stockWord(totalQuantity)}</Typography>
              </Grid>
              <Grid size={4}>
                <Typography variant='caption' color='text.secondary'>{text.labels.remaining}</Typography>
                <Typography variant='h5' mb={0} color={overStock ? 'error' : remaining === 0 ? 'warning.main' : 'success.main'}>
                  {remaining == null ? '—' : stockWord(remaining)}
                </Typography>
              </Grid>
            </Grid>
            {stock.available != null && stock.usable != null && stock.usable < stock.available - EPSILON && (
              <Typography variant='caption' color='text.secondary' display='block' mt={0.5}>{text.messages.laterMovements}</Typography>
            )}
            {overStock && <Alert severity='error' sx={{ mt: 1, py: 0 }}>{text.messages.over}</Alert>}
          </Paper>
        )}
        {items.length > 0 && mode !== 'feeding' && (
          <Stack direction='row' justifyContent='flex-end' mt={1.5}>
            <Typography variant='h5' mb={0}>
              {mode === 'weighing'
                ? text.messages.total.replace('{count}', String(items.length))
                : text.messages.totalQuantity.replace('{count}', String(items.length)).replace('{quantity}', mode === 'cost' ? money(costTotal) : figure(mode === 'harvest' ? receivedTotal : totalQuantity))}
            </Typography>
          </Stack>
        )}
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
            disabled={!draftState.complete}
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
            disabled={items.length === 0}
            onClick={() => {
              setShowWarning(false);
              setDraft(freshDraft());
              save.mutate(items);
            }}
          >
            {text.messages.unsaved.saveWithout}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

/** A saved record is loaded with its lines (and its product, as the pickers know it) before it can be edited. */
const RoundForm = ({ mode, setOpenDialog, item = null }: BioFormProps<RoundRecord> & { mode: BatchRoundMode }) => {
  const { productOptions, isLoadingProductOptions } = useProductsSelect();
  const { data: record } = useQuery<RoundRecord>({
    queryKey: ['bioDailyRecord', item?.id, 'edit'],
    queryFn: () => roundServices.get(item!.id),
    enabled: !!item?.id,
    gcTime: 0,
  });

  if (item?.id && (!record || isLoadingProductOptions)) return <LinearProgress />;

  const savedProduct = record?.product ? productOptions.find((option: any) => option.id === record.product!.id) ?? null : null;

  return <RoundFormBody mode={mode} setOpenDialog={setOpenDialog} record={record ?? null} savedProduct={savedProduct} />;
};

export default RoundForm;
