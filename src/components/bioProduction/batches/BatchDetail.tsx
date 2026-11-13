'use client'

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowBackOutlined, DeleteOutlined, EditOutlined } from '@mui/icons-material';
import { Alert, Box, Button, Card, Dialog, IconButton, LinearProgress, Stack, Tab, Tabs, Tooltip, Typography, useMediaQuery } from '@mui/material';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import LedgerSelectProvider from '@/components/accounts/ledgers/forms/LedgerSelectProvider';
import ProductsSelectProvider from '@/components/productAndServices/products/ProductsSelectProvider';
import { getErrorMessage } from '@/utilities/helpers/errorHandler';
import { batchServices } from '../bio-production-services';
import RoundView from '../rounds/RoundView';
import BatchStatusChip from './BatchStatusChip';
import BatchSummary from './BatchSummary';
import { ExpensesTable, InputsTable, MortalityTable, MovementsTable, OutcomesTable, ProduceTable, StagesTable, WeightsTable } from './BatchTables';
import { Batch, BatchStage, BatchExpense, BatchHarvest, BatchInput, BatchMortality, BatchProduce } from './batchTypes';
import { usePagedBatchList } from './usePagedBatchList';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import BioGate from '../BioGate';
import { useBioAccess } from '../useBioAccess';
import { useBioMoney } from '../useBioMoney';
import { stamp } from '../dateTime';
import AdvanceDialog from './dialogs/AdvanceDialog';
import CloseDialog from './dialogs/CloseDialog';
import EditDialog from './dialogs/EditDialog';
import StageDateDialog from './dialogs/StageDateDialog';
import ExpenseDialog from './dialogs/ExpenseDialog';
import HarvestDialog from './dialogs/HarvestDialog';
import MergeDialog from './dialogs/MergeDialog';
import OpeningStockDialog from './dialogs/OpeningStockDialog';
import ProduceDialog from './dialogs/ProduceDialog';
import EditInputRecordDialog from './dialogs/EditInputRecordDialog';
import InputDialog from './dialogs/InputDialog';
import MortalityDialog from './dialogs/MortalityDialog';
import TransferDialog from './dialogs/TransferDialog';
import WeightDialog from './dialogs/WeightDialog';
import WriteOffDialog from './dialogs/WriteOffDialog';

type DialogName = 'mortality' | 'weight' | 'input' | 'expense' | 'transfer' | 'advance' | 'undoStage' | 'merge' | 'openingStock' | 'writeOff' | 'harvest' | 'produce' | 'close' | 'edit';
type TabName = 'summary' | 'stages' | 'inputs' | 'costs' | 'mortality' | 'weights' | 'movements' | 'outcomes' | 'produce';

const BatchDetailContent = () => {
  const bio = useDictionary().bioProduction;
  const access = useBioAccess().batches;
  const money = useBioMoney();
  const text = bio.batches;
  const { lang, id } = useParams<{ lang: string; id: string }>();
  const batchId = Number(id);
  const [dialog, setDialog] = useState<DialogName | null>(null);
  const [tab, setTab] = useState<TabName>('summary');
  const [editingStage, setEditingStage] = useState<BatchStage | null>(null);
  const [editingMortality, setEditingMortality] = useState<BatchMortality | null>(null);
  const [viewingRecord, setViewingRecord] = useState<number | null>(null);
  const [editingInputRecord, setEditingInputRecord] = useState<number | null>(null);
  const [editingInput, setEditingInput] = useState<BatchInput | null>(null);
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));
  const [editingHarvest, setEditingHarvest] = useState<BatchHarvest | null>(null);
  const [editingProduce, setEditingProduce] = useState<BatchProduce | null>(null);
  const { showDialog, hideDialog } = useJumboDialog();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: batch, isLoading, isError } = useQuery<Batch>({
    queryKey: ['bioBatch', batchId],
    queryFn: () => batchServices.get(batchId),
  });
  const [inputsType, setInputsType] = useState<string | number>('');
  const inputs = usePagedBatchList<BatchInput>(batchId, 'bioBatchInputs', batchServices.getInputs, { type: inputsType || undefined });
  const expenses = usePagedBatchList<BatchExpense>(batchId, 'bioBatchExpenses', batchServices.getExpenses);
  const mortalities = usePagedBatchList<BatchMortality>(batchId, 'bioBatchMortalities', batchServices.getMortalities);
  const produce = usePagedBatchList<BatchProduce>(batchId, 'bioBatchProduce', batchServices.getProduce);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['bioBatch', batchId] });
    queryClient.invalidateQueries({ queryKey: ['bioBatchInputs', batchId] });
    queryClient.invalidateQueries({ queryKey: ['bioBatchExpenses', batchId] });
    queryClient.invalidateQueries({ queryKey: ['bioBatchMortalities', batchId] });
    queryClient.invalidateQueries({ queryKey: ['bioBatchProduce', batchId] });
    queryClient.invalidateQueries({ queryKey: ['bioBatchSummary', batchId] });
    queryClient.invalidateQueries({ queryKey: ['bioWriteOffPreview', batchId] });
    queryClient.invalidateQueries({ queryKey: ['bioBatches'] });
  };
  const onRemoved = (data: { message: string }) => {
    refresh();
    enqueueSnackbar(data.message, { variant: 'success' });
  };
  const onRemoveError = (error: unknown) => enqueueSnackbar(getErrorMessage(error), { variant: 'error' });

  const { mutate: removeInput } = useMutation({ mutationFn: batchServices.deleteInput, onSuccess: onRemoved, onError: onRemoveError });
  const { mutate: removeMortality } = useMutation({ mutationFn: batchServices.deleteMortality, onSuccess: onRemoved, onError: onRemoveError });
  const { mutate: removeHarvest } = useMutation({ mutationFn: batchServices.deleteHarvest, onSuccess: onRemoved, onError: onRemoveError });
  const { mutate: removeProduce } = useMutation({ mutationFn: batchServices.deleteProduce, onSuccess: onRemoved, onError: onRemoveError });
  const { mutate: removeExpense } = useMutation({ mutationFn: batchServices.deleteExpense, onSuccess: onRemoved, onError: onRemoveError });

  const { mutate: undoMerge } = useMutation({ mutationFn: batchServices.undoMerge, onSuccess: onRemoved, onError: onRemoveError });
  const { mutate: undoStage } = useMutation({ mutationFn: batchServices.undoStage, onSuccess: onRemoved, onError: onRemoveError });

  const { mutate: removeBatch } = useMutation({
    mutationFn: batchServices.delete,
    onSuccess: (data: { message: string }) => {
      queryClient.invalidateQueries({ queryKey: ['bioBatches'] });
      enqueueSnackbar(data.message, { variant: 'success' });
      router.push(`/${lang}/bioProduction/batches`);
    },
    onError: onRemoveError,
  });

  const confirm = (content: string, onYes: () => void) =>
    showDialog({ title: bio.common.confirmDeleteTitle, content, onYes: () => { hideDialog(); onYes(); }, onNo: () => hideDialog(), variant: 'confirm' });

  if (isLoading) return <LinearProgress />;
  if (isError || !batch) return <Typography p={2}>{text.noBatch}</Typography>;

  const open = batch.status === 'on progress';
  const costs = batch.costs;
  const close = () => setDialog(null);
  const hasProduce = (batch.stages ?? []).some((stage) => stage.purpose === 'bearer') || produce.total > 0;

  type TabAction = { name: DialogName; label: string; variant?: 'contained' | 'outlined'; color?: 'error' | 'primary' };
  const act = (name: DialogName, label: string, variant?: TabAction['variant'], color?: TabAction['color']): TabAction => ({ name, label, variant, color });
  // Each action sits on the tab it belongs to, as on a project's profile; a closed batch has none.
  const tabActions: Partial<Record<TabName, TabAction[]>> = open
    ? {
        stages: access.manage ? [...((batch.stages ?? []).length === 1 && !(batch.merges_in ?? []).length && !(batch.harvests ?? []).length && !(batch.mortality_writeoffs ?? []).length ? [act('openingStock', text.actions.openingStock)] : []), ...((batch.stages ?? []).length > 1 ? [act('undoStage', text.actions.undoStage)] : []), act('merge', text.actions.merge), act('advance', text.actions.advance, 'contained')] : [],
        inputs: access.record ? [act('input', text.actions.input, 'contained')] : [],
        costs: access.record ? [act('expense', text.actions.expense, 'contained')] : [],
        mortality: access.record ? [act('mortality', text.actions.mortality, 'contained')] : [],
        weights: access.record ? [act('weight', text.actions.weight, 'contained')] : [],
        movements: access.manage ? [act('transfer', text.actions.transfer, 'contained')] : [],
        outcomes: [
          ...(access.writeOff ? [act('writeOff', text.actions.writeOff)] : []),
          ...(access.harvest ? [act('harvest', text.actions.harvest, 'contained')] : []),
          ...(access.manage ? [act('close', text.actions.close, 'outlined', 'error')] : []),
        ],
        produce: batch.current_stage?.purpose === 'bearer' && access.harvest ? [act('produce', text.actions.produce, 'contained')] : [],
      }
    : {};
  const toolbar = tabActions[tab] ?? [];

  return (
    <React.Fragment>
      <Stack direction='row' alignItems='center' spacing={1} mb={2} flexWrap='wrap'>
        <Tooltip title={text.backToList}>
          <IconButton component={Link} href={`/${lang}/bioProduction/batches`} size='small'><ArrowBackOutlined /></IconButton>
        </Tooltip>
        <Typography variant='h4' mb={0}>{batch.batchNo}</Typography>
        <BatchStatusChip status={batch.status} />
        <Typography color='text.secondary' sx={{ flexGrow: 1 }}>
          {batch.species_template?.name} · {batch.farm?.name} · {batch.production_unit?.name}
          {batch.farm?.cost_center?.name ? ` · ${text.labels.costCenter}: ${batch.farm.cost_center.name}` : ''}
        </Typography>
        {open && access.manage && (
          <Button size='small' variant='outlined' startIcon={<EditOutlined />} onClick={() => setDialog('edit')}>{text.actions.edit}</Button>
        )}
        {open && access.delete && (
          <Button size='small' variant='outlined' color='error' startIcon={<DeleteOutlined />} onClick={() => confirm(text.dialogs.confirmDeleteBatch, () => removeBatch(batchId))}>{text.actions.delete}</Button>
        )}
      </Stack>

      {batch.merged_into && (
        <Alert severity='info' sx={{ mb: 2 }} action={access.manage ? <Button color='inherit' size='small' onClick={() => confirm(text.dialogs.confirmUndoMerge, () => undoMerge({ id: batchId }))}>{text.actions.undoMerge}</Button> : undefined}>
          {text.merge.mergedInto.replace('{count}', batch.merged_into.quantity.toLocaleString()).replace('{date}', stamp(batch.merged_into.merge_date))}{' '}
          <Link href={`/${lang}/bioProduction/batches/${batch.merged_into.into_batch_id}`}>{batch.merged_into.into_batch?.batchNo ?? `#${batch.merged_into.into_batch_id}`}</Link>
          {batch.merged_into.cost_amount != null ? ` · ${text.merge.costCarried.replace('{amount}', money(batch.merged_into.cost_amount))}` : ''}
        </Alert>
      )}
      {(batch.merges_in ?? []).map((merge) => (
        <Alert key={merge.id} severity='info' sx={{ mb: 2 }}>
          {text.merge.mergesIn.replace('{count}', merge.quantity.toLocaleString()).replace('{date}', stamp(merge.merge_date))}{' '}
          <Link href={`/${lang}/bioProduction/batches/${merge.from_batch_id}`}>{merge.from_batch?.batchNo ?? `#${merge.from_batch_id}`}</Link>
          {merge.cost_amount != null ? ` · ${text.merge.costCarried.replace('{amount}', money(merge.cost_amount))}` : ''}
        </Alert>
      ))}

      <Card>
        <Tabs value={tab} onChange={(_, value) => setTab(value)} variant='scrollable' scrollButtons='auto'>
          {(Object.keys(text.tabs) as TabName[]).filter((name) => name !== 'produce' || hasProduce).map((name) => (
            <Tab key={name} value={name} label={text.tabs[name]} />
          ))}
        </Tabs>
        {toolbar.length > 0 && (
          <Stack direction='row' spacing={1} useFlexGap flexWrap='wrap' justifyContent='flex-end' sx={{ px: 2, pt: 1.5 }}>
            {toolbar.map((action) => (
              <Button key={action.name} size='small' variant={action.variant ?? 'outlined'} color={action.color ?? 'primary'} onClick={() => (action.name === 'undoStage' ? confirm(text.dialogs.confirmUndoStage, () => undoStage({ id: batchId })) : setDialog(action.name))}>
                {action.label}
              </Button>
            ))}
          </Stack>
        )}
        <Box>
          {tab === 'summary' && <BatchSummary batch={batch} />}
          {tab === 'stages' && <StagesTable batch={batch} onEditStage={open && access.manage ? setEditingStage : undefined} />}
          {tab === 'inputs' && (
            <InputsTable
              inputs={inputs.rows}
              canEdit={open && access.record}
              onRemove={(input) => confirm(text.dialogs.confirmDeleteInput, () => removeInput({ id: batchId, eventId: input.id }))}
              onEdit={(input) => (input.daily_record_id ? setEditingInputRecord(input.daily_record_id) : setEditingInput(input))}
              onOpenRecord={setViewingRecord}
              type={inputsType}
              onTypeChange={(type) => { setInputsType(type); inputs.setPage(0); }}
              page={inputs.page}
              limit={inputs.limit}
              total={inputs.total}
              totalCost={inputs.response?.total_cost ?? 0}
              onPageChange={inputs.setPage}
              onLimitChange={inputs.setLimit}
            />
          )}
          {tab === 'costs' && (
            <ExpensesTable
              rows={expenses.rows}
              canEdit={open && access.record}
              onRemove={(expenseId) => confirm(text.dialogs.confirmDeleteExpense, () => removeExpense({ id: batchId, expenseId }))}
              page={expenses.page}
              limit={expenses.limit}
              total={expenses.total}
              totalAmount={expenses.response?.total_amount ?? 0}
              onPageChange={expenses.setPage}
              onLimitChange={expenses.setLimit}
            />
          )}
          {tab === 'mortality' && (
            <MortalityTable
              batch={batch}
              rows={mortalities.rows}
              page={mortalities.page}
              limit={mortalities.limit}
              total={mortalities.total}
              totalQuantity={mortalities.response?.total_quantity ?? 0}
              onOpenRecord={setViewingRecord}
              onEdit={open && access.record ? setEditingMortality : undefined}
              onDelete={(row) => confirm(text.dialogs.confirmDeleteMortality, () => removeMortality({ id: batchId, eventId: row.id }))}
              onPageChange={mortalities.setPage}
              onLimitChange={mortalities.setLimit}
            />
          )}
          {tab === 'weights' && <WeightsTable batch={batch} />}
          {tab === 'movements' && <MovementsTable batch={batch} />}
          {tab === 'outcomes' && (
            <OutcomesTable
              batch={batch}
              canChange={access.harvest}
              onEditHarvest={setEditingHarvest}
              onDeleteHarvest={(harvest) => confirm(text.dialogs.confirmDeleteHarvest, () => removeHarvest({ id: batchId, harvestId: harvest.id }))}
            />
          )}
          {tab === 'produce' && (
            <ProduceTable
              rows={produce.rows}
              page={produce.page}
              limit={produce.limit}
              total={produce.total}
              totalCost={produce.response?.total_cost ?? 0}
              latestId={open && access.harvest && produce.page === 0 ? produce.rows[0]?.id : undefined}
              onEdit={setEditingProduce}
              onDelete={(row) => confirm(text.dialogs.confirmDeleteProduce, () => removeProduce({ id: batchId, collectionId: row.id }))}
              onPageChange={produce.setPage}
              onLimitChange={produce.setLimit}
            />
          )}
        </Box>
      </Card>

      {editingStage && <StageDateDialog key={editingStage.id} batch={batch} stage={editingStage} open onClose={() => setEditingStage(null)} />}
      {editingInputRecord !== null && <EditInputRecordDialog recordId={editingInputRecord} farmId={batch.farm_id} onClose={() => { setEditingInputRecord(null); refresh(); }} />}
      {editingInput && <InputDialog key={editingInput.id} batch={batch} open record={editingInput} onClose={() => setEditingInput(null)} />}
      {editingMortality && <MortalityDialog key={editingMortality.id} batch={batch} open record={editingMortality} onClose={() => setEditingMortality(null)} />}
      <Dialog open={viewingRecord !== null} fullWidth maxWidth='md' fullScreen={belowLargeScreen} onClose={() => setViewingRecord(null)}>
        {viewingRecord !== null && <RoundView recordId={viewingRecord} onClose={() => setViewingRecord(null)} />}
      </Dialog>
      {editingHarvest && (
        <HarvestDialog key={editingHarvest.id} batch={batch} open record={editingHarvest} onClose={() => setEditingHarvest(null)} />
      )}
      {editingProduce && (
        <ProduceDialog key={editingProduce.id} batch={batch} open record={editingProduce} onClose={() => setEditingProduce(null)} />
      )}

      {open && (
        <>
          <EditDialog batch={batch} open={dialog === 'edit'} onClose={close} />
          <MortalityDialog batch={batch} open={dialog === 'mortality'} onClose={close} />
          <WeightDialog batch={batch} open={dialog === 'weight'} onClose={close} />
          <InputDialog batch={batch} open={dialog === 'input'} onClose={close} />
          <ExpenseDialog batch={batch} open={dialog === 'expense'} onClose={close} />
          <TransferDialog batch={batch} open={dialog === 'transfer'} onClose={close} />
          <AdvanceDialog batch={batch} open={dialog === 'advance'} onClose={close} />
          <MergeDialog batch={batch} open={dialog === 'merge'} onClose={close} />
          <OpeningStockDialog batch={batch} open={dialog === 'openingStock'} onClose={close} />
          <WriteOffDialog batch={batch} open={dialog === 'writeOff'} onClose={close} />
          <ProduceDialog batch={batch} open={dialog === 'produce'} onClose={close} />
          <HarvestDialog batch={batch} open={dialog === 'harvest'} onClose={close} />
          <CloseDialog batch={batch} open={dialog === 'close'} onClose={close} />
        </>
      )}
    </React.Fragment>
  );
};

const BatchDetail = () => (
  <BioGate anyOf={[PERMISSIONS.BIO_BATCHES_READ]}>
    <ProductsSelectProvider>
      <LedgerSelectProvider>
        <BatchDetailContent />
      </LedgerSelectProvider>
    </ProductsSelectProvider>
  </BioGate>
);

export default BatchDetail;
