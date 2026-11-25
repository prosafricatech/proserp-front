'use client'

import WeightCheckHint from './dialogs/WeightCheckHint';
import { fromGrams, withUnit } from '../weightUnit';
import React from 'react';
import { DeleteOutlined, EditOutlined } from '@mui/icons-material';
import { Box, IconButton, Link, Stack, TablePagination, Tooltip, Typography } from '@mui/material';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import BioSelect from '../BioSelect';
import { animalText } from '../animalText';
import { stamp } from '../dateTime';
import { useBioAccess } from '../useBioAccess';
import ResponsiveTable from './ResponsiveTable';
import { Batch, BatchStage, BatchExpense, BatchHarvest, BatchInput, BatchMortality, BatchProduce } from './batchTypes';

export const money = (value: number | string | null | undefined) =>
  value == null ? '—' : Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const num = (value: number | string | null | undefined, digits = 2) =>
  value == null ? '—' : Number(value).toLocaleString(undefined, { maximumFractionDigits: digits });

const day = (value: string | null | undefined) => stamp(value);

/** Columns that are shown only to those who may see money. */
const ifFinance = <T,>(finance: boolean, ...columns: T[]): T[] => (finance ? columns : []);

interface Column<T> {
  label: string;
  render: (row: T) => React.ReactNode;
  align?: 'right';
  primary?: boolean;
  headline?: boolean;
}

/** A batch tab's list: a table on a wide screen, cards on a phone. */
function SimpleTable<T extends { id: number | string }>({ columns, rows }: { columns: Column<T>[]; rows: T[] }) {
  const empty = useDictionary().bioProduction.batches.tables.empty;

  return <ResponsiveTable columns={columns} rows={rows} rowKey={(row) => row.id} empty={empty} />;
}

const RemoveButton = ({ onClick, label }: { onClick: () => void; label: string }) => (
  <Tooltip title={label}>
    <IconButton size='small' color='error' onClick={onClick}>
      <DeleteOutlined fontSize='small' />
    </IconButton>
  </Tooltip>
);

const EditButton = ({ onClick, label }: { onClick: () => void; label: string }) => (
  <Tooltip title={label}>
    <IconButton size='small' onClick={onClick}>
      <EditOutlined fontSize='small' />
    </IconButton>
  </Tooltip>
);

interface PagedFooterProps {
  page: number;
  limit: number;
  total: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

const PagedFooter = ({ page, limit, total, onPageChange, onLimitChange }: PagedFooterProps) => (
  <TablePagination
    component='div'
    page={page}
    count={total}
    rowsPerPage={limit}
    rowsPerPageOptions={[10, 25, 50]}
    onPageChange={(_, nextPage) => onPageChange(nextPage)}
    onRowsPerPageChange={(event) => onLimitChange(parseInt(event.target.value, 10))}
  />
);

/** A headline figure above a paged table. */
const TotalBar = ({ label, value, children }: { label?: string; value?: React.ReactNode; children?: React.ReactNode }) => (
  <Stack direction='row' alignItems='center' justifyContent='space-between' flexWrap='wrap' useFlexGap spacing={2} p={1.5}>
    <Box sx={{ minWidth: { md: 240 } }}>{children}</Box>
    {label && (
      <Typography>
        {label}: <b>{value}</b>
      </Typography>
    )}
  </Stack>
);

/** The batch's stages; with `onEditStage`, each one can have its start date corrected. */
export const StagesTable = ({ batch, onEditStage }: { batch: Batch; onEditStage?: (stage: BatchStage) => void }) => {
  const text = useDictionary().bioProduction;
  const t = text.batches.tables;
  const { finance } = useBioAccess();
  const weightUnit = batch.species_template?.weight_unit;

  return (
    <SimpleTable
      rows={batch.stages ?? []}
      columns={[
        { label: t.stage, render: (s) => s.name },
        { label: t.period, render: (s) => `${day(s.start_date)} → ${s.end_date ? day(s.end_date) : '…'}` },
        { label: t.opening, align: 'right', render: (s) => num(s.opening_quantity, 0) },
        { label: t.closing, align: 'right', render: (s) => (s.closing_quantity == null ? '—' : num(s.closing_quantity, 0)) },
        { label: withUnit(t.openingWeight, weightUnit), align: 'right', render: (s) => (s.opening_avg_weight_g == null ? '—' : num(fromGrams(Number(s.opening_avg_weight_g), weightUnit), 4)) },
        { label: withUnit(t.closingWeight, weightUnit), align: 'right', render: (s) => (s.closing_avg_weight_g == null ? '—' : num(fromGrams(Number(s.closing_avg_weight_g), weightUnit), 4)) },
        { label: t.mortality, align: 'right', render: (s) => num(s.mortality_quantity, 0) },
        { label: t.mortalityPct, align: 'right', render: (s) => (s.mortality_pct == null ? '—' : `${num(s.mortality_pct)}%`) },
        { label: t.allowance, align: 'right', render: (s) => (s.normal_mortality_pct == null ? '—' : `${num(s.normal_mortality_pct)}%`) },
        {
          label: t.abnormal,
          align: 'right',
          render: (s) => (s.abnormal_mortality_quantity ? <Box color='error.main'>{num(s.abnormal_mortality_quantity, 0)}</Box> : '—'),
        },
        ...ifFinance(finance, { label: t.cost, align: 'right' as const, render: (s: any) => money(batch.costs?.by_stage?.[s.id] ?? 0) }),
        ...(onEditStage ? [{ label: '', align: 'right' as const, render: (s: any) => <EditButton label={text.batches.dialogs.stageDate.edit} onClick={() => onEditStage(s)} /> }] : []),
      ]}
    />
  );
};

interface InputsTableProps {
  inputs: BatchInput[];
  canEdit: boolean;
  onRemove: (input: BatchInput) => void;
  /** Corrects the input: through its daily record when it has one, otherwise in place. Offered only when nothing else shares it. */
  onEdit?: (input: BatchInput) => void;
  onOpenRecord: (recordId: number) => void;
  type: string | number;
  onTypeChange: (type: string | number) => void;
  page: number;
  limit: number;
  total: number;
  totalCost: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

/** The batch's feed and medication, a page at a time, filterable by type. */
export const InputsTable = ({ inputs, onRemove, onEdit, onOpenRecord, canEdit, type, onTypeChange, page, limit, total, totalCost, onPageChange, onLimitChange }: InputsTableProps) => {
  const text = useDictionary().bioProduction.batches;
  const common = useDictionary().bioProduction.common;
  const t = text.tables;
  const { finance } = useBioAccess();

  return (
    <>
      <TotalBar label={finance ? t.totalCost : undefined} value={finance ? money(totalCost) : undefined}>
        <BioSelect
          label={t.type}
          options={(['feed', 'medication', 'other'] as const).map((value) => ({ value, label: text.inputTypes[value] }))}
          value={type}
          onChange={onTypeChange}
        />
      </TotalBar>
      <SimpleTable
        rows={inputs}
        columns={[
          { label: t.date, render: (i) => day(i.event_date) },
          { label: t.type, render: (i) => text.inputTypes[i.type] + (i.reason ? ` — ${i.reason}` : '') },
          { label: t.stage, render: (i) => i.stage?.name },
          {
            label: t.product,
            render: (i) =>
              i.items.map((item, index) => (
                <div key={index}>
                  {item.product?.name ?? item.product?.item_name} · {num(item.quantity, 5)} {item.measurement_unit?.symbol} {finance ? ` @ ${money(item.rate)}` : ''}
                </div>
              )),
          },
          { label: t.store, render: (i) => i.store?.name },
          ...ifFinance(finance, { label: t.cost, align: 'right' as const, render: (i: any) => money(i.cost) }),
          { label: t.record, render: (i) => <RecordLink recordNo={i.recordNo} recordId={i.daily_record_id} onOpen={onOpenRecord} /> },
          // An input on a record shared with other lines is deleted from Daily Records; one of its own record, or older with none, is removed here.
          { label: '', align: 'right', render: (i) => (canEdit && (i.record_lines ?? 1) <= 1 ? (
            <>
              {onEdit && <EditButton label={common.edit} onClick={() => onEdit(i)} />}
              <RemoveButton label={text.dialogs.confirmDeleteInput} onClick={() => onRemove(i)} />
            </>
          ) : null) },
        ]}
      />
      <PagedFooter page={page} limit={limit} total={total} onPageChange={onPageChange} onLimitChange={onLimitChange} />
    </>
  );
};

interface ExpensesTableProps {
  rows: BatchExpense[];
  canEdit: boolean;
  onRemove: (id: number) => void;
  page: number;
  limit: number;
  total: number;
  totalAmount: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

/** Costs capitalised into the batch, a page at a time. */
export const ExpensesTable = ({ rows, onRemove, canEdit, page, limit, total, totalAmount, onPageChange, onLimitChange }: ExpensesTableProps) => {
  const text = useDictionary().bioProduction.batches;
  const t = text.tables;
  const { finance } = useBioAccess();

  return (
    <>
      {finance && <TotalBar label={t.totalCost} value={money(totalAmount)} />}
      <SimpleTable
        rows={rows}
        columns={[
          { label: t.date, render: (e) => day(e.expense_date) },
          { label: t.ledger, render: (e) => e.ledger?.name },
          { label: t.quantity, align: 'right', render: (e) => num(e.quantity, 5) },
          ...ifFinance(finance, { label: t.rate, align: 'right' as const, render: (e: any) => money(e.rate) }, { label: t.amount, align: 'right' as const, render: (e: any) => money(e.amount) }),
          { label: t.remarks, render: (e) => e.remarks },
          { label: '', align: 'right', render: (e) => (canEdit ? <RemoveButton label={text.dialogs.confirmDeleteExpense} onClick={() => onRemove(e.id)} /> : null) },
        ]}
      />
      <PagedFooter page={page} limit={limit} total={total} onPageChange={onPageChange} onLimitChange={onLimitChange} />
    </>
  );
};

/** The number of the daily record an entry was made on, opening it; blank for an entry that has none. */
const RecordLink = ({ recordNo, recordId, onOpen }: { recordNo?: string | null; recordId?: number | null; onOpen: (recordId: number) => void }) =>
  recordId ? <Link component='button' type='button' underline='hover' onClick={() => onOpen(recordId)}>{recordNo ?? `#${recordId}`}</Link> : <>—</>;

interface MortalityTableProps {
  batch: Batch;
  rows: BatchMortality[];
  page: number;
  limit: number;
  total: number;
  totalQuantity: number;
  onOpenRecord: (recordId: number) => void;
  /** Set when the person may change losses: they may record and the batch is open. */
  onEdit?: (row: BatchMortality) => void;
  onDelete?: (row: BatchMortality) => void;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

/** Every loss recorded against the batch, a page at a time, each with the daily record it was made on. A loss on a record shared with other lines is changed from Daily Records. */
export const MortalityTable = ({ batch, rows, page, limit, total, totalQuantity, onOpenRecord, onEdit, onDelete, onPageChange, onLimitChange }: MortalityTableProps) => {
  const t = useDictionary().bioProduction.batches.tables;
  const common = useDictionary().bioProduction.common;
  const animals = batch.species_template?.count_label;
  const stageNames = Object.fromEntries((batch.stages ?? []).map((stage) => [stage.id, stage.name]));

  return (
    <>
      <TotalBar label={animalText(t.totalLost, animals)} value={num(totalQuantity, 0)} />
      <SimpleTable
        rows={rows}
        columns={[
          { label: t.date, render: (m) => day(m.event_date) },
          { label: t.stage, render: (m) => stageNames[m.batch_stage_id] },
          { label: animalText(t.fish, animals), align: 'right', render: (m) => num(m.quantity, 0) },
          { label: t.cause, render: (m) => m.cause },
          { label: t.remarks, render: (m) => m.remarks },
          { label: t.record, render: (m) => <RecordLink recordNo={m.daily_record?.recordNo} recordId={m.daily_record_id} onOpen={onOpenRecord} /> },
          ...(onEdit && onDelete ? [{
            label: '',
            align: 'right' as const,
            render: (m: BatchMortality) =>
              m.daily_record && m.daily_record.lines_count <= 1 ? (
                <>
                  <EditButton label={common.edit} onClick={() => onEdit(m)} />
                  <RemoveButton label={common.delete} onClick={() => onDelete(m)} />
                </>
              ) : null,
          }] : []),
        ]}
      />
      <PagedFooter page={page} limit={limit} total={total} onPageChange={onPageChange} onLimitChange={onLimitChange} />
    </>
  );
};

export const WeightsTable = ({ batch }: { batch: Batch }) => {
  const t = useDictionary().bioProduction.batches.tables;
  const unit = batch.species_template?.weight_unit;

  return (
    <SimpleTable
      rows={[...(batch.weight_samplings ?? [])].sort((a, b) => String(b.sample_date).localeCompare(String(a.sample_date)) || b.id - a.id)}
      columns={[
        { label: t.date, render: (w) => day(w.sample_date) },
        { label: t.sample, align: 'right', render: (w) => num(w.sample_size, 0) },
        { label: withUnit(t.avgWeight, unit), align: 'right', render: (w) => num(fromGrams(Number(w.average_weight_g), unit), 4) },
        { label: t.remarks, render: (w) => w.remarks },
        // What each weighing did to the feed projection and whether it is worth a second look, for a batch still open.
        ...(batch.status === 'on progress'
          ? [{ label: '', align: 'right' as const, render: (w: NonNullable<Batch['weight_samplings']>[number]) => (
              <WeightCheckHint lazy batchId={batch.id} animalsLabel={batch.species_template?.count_label} weightUnit={unit} weight={Number(w.average_weight_g)} date={String(w.sample_date)} sampleSize={w.sample_size} sampleId={w.id} />
            ) }]
          : []),
      ]}
    />
  );
};

export const MovementsTable = ({ batch }: { batch: Batch }) => {
  const t = useDictionary().bioProduction.batches.tables;

  return (
    <SimpleTable
      rows={[...(batch.unit_transfers ?? [])].sort((a, b) => String(b.transfer_date).localeCompare(String(a.transfer_date)) || b.id - a.id)}
      columns={[
        { label: t.date, render: (m) => day(m.transfer_date) },
        { label: t.from, render: (m) => m.from_unit?.name },
        { label: t.to, render: (m) => m.to_unit?.name },
        { label: t.remarks, render: (m) => m.remarks },
      ]}
    />
  );
};

interface OutcomesTableProps {
  batch: Batch;
  onEditHarvest: (harvest: BatchHarvest) => void;
  onDeleteHarvest: (harvest: BatchHarvest) => void;
  /** False hides the correct and remove buttons, for someone who may only look. */
  canChange?: boolean;
}

/** Write-offs and harvests. Only the latest harvest can be corrected or taken back. */
export const OutcomesTable = ({ batch, onEditHarvest, onDeleteHarvest, canChange = true }: OutcomesTableProps) => {
  const text = useDictionary().bioProduction;
  const t = text.batches.tables;
  const { finance } = useBioAccess();
  const latest = [...(batch.harvests ?? [])].sort((a, b) => String(a.harvest_date).localeCompare(String(b.harvest_date)) || a.id - b.id).at(-1);
  const animals = batch.species_template?.count_label;
  const rows = [
    ...(batch.mortality_writeoffs ?? []).map((w) => ({
      id: `w${w.id}`,
      date: w.writeoff_date,
      kind: w.kind === 'abnormal' ? t.abnormalKind : t.residualKind,
      fish: w.quantity,
      amount: w.amount,
      perUnit: w.kind === 'abnormal' ? Number(w.cost_per_fish) : null,
      harvest: null as BatchHarvest | null,
    })),
    ...(batch.harvests ?? []).map((h) => ({
      id: `h${h.id}`,
      date: h.harvest_date,
      kind: t.stock,
      fish: h.quantity,
      amount: h.cost_amount,
      perUnit: h.cost_per_unit,
      harvest: h.id === latest?.id ? h : null,
    })),
  ].sort((a, b) => String(b.date).localeCompare(String(a.date)));

  return (
    <SimpleTable
      rows={rows}
      columns={[
        { label: t.date, render: (r) => day(r.date) },
        { label: t.kind, render: (r) => r.kind },
        { label: animalText(t.fish, animals), align: 'right', render: (r) => num(r.fish, 0) },
        ...ifFinance(finance, { label: t.amount, align: 'right' as const, headline: true, render: (r: any) => money(r.amount) }, { label: t.costPerUnit, align: 'right' as const, render: (r: any) => (r.perUnit == null ? '—' : money(r.perUnit)) }),
        {
          label: '',
          align: 'right',
          render: (r) =>
            r.harvest && canChange ? (
              <>
                <EditButton label={text.common.edit} onClick={() => onEditHarvest(r.harvest!)} />
                <RemoveButton label={text.common.delete} onClick={() => onDeleteHarvest(r.harvest!)} />
              </>
            ) : null,
        },
      ]}
    />
  );
};

interface ProduceTableProps {
  rows: BatchProduce[];
  page: number;
  limit: number;
  total: number;
  totalCost: number;
  /** The collection that may be corrected or taken back: the latest one, while the batch is open. */
  latestId?: number;
  onEdit: (row: BatchProduce) => void;
  onDelete: (row: BatchProduce) => void;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

/** Produce collected from the animals (eggs from laying hens), newest first, a page at a time. */
export const ProduceTable = ({ rows, page, limit, total, totalCost, latestId, onEdit, onDelete, onPageChange, onLimitChange }: ProduceTableProps) => {
  const text = useDictionary().bioProduction;
  const t = text.batches.tables;
  const { finance } = useBioAccess();

  return (
    <>
      {finance && <TotalBar label={t.totalCost} value={money(totalCost)} />}
      <SimpleTable
        rows={rows}
        columns={[
          { label: t.date, render: (r) => day(r.collection_date) },
          { label: t.product, render: (r) => r.product?.name ?? r.product?.item_name },
          { label: t.quantity, align: 'right', render: (r) => num(r.product_quantity, 5) },
          ...ifFinance(finance,
            { label: t.runningCost, align: 'right' as const, render: (r: any) => money(r.running_cost_amount) },
            { label: t.depreciation, align: 'right' as const, render: (r: any) => money(r.depreciation_amount) },
            { label: t.cost, align: 'right' as const, headline: true, render: (r: any) => money(r.cost_amount) },
            { label: t.costPerUnit, align: 'right' as const, render: (r: any) => (r.cost_per_unit == null ? '—' : money(r.cost_per_unit)) },
          ),
          { label: t.remarks, render: (r) => r.remarks },
          {
            label: '',
            align: 'right',
            render: (r) =>
              r.id === latestId ? (
                <>
                  <EditButton label={text.common.edit} onClick={() => onEdit(r)} />
                  <RemoveButton label={text.common.delete} onClick={() => onDelete(r)} />
                </>
              ) : null,
          },
        ]}
      />
      <PagedFooter page={page} limit={limit} total={total} onPageChange={onPageChange} onLimitChange={onLimitChange} />
    </>
  );
};
