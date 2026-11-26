'use client'

import React from 'react';
import { Box, Card, CardContent, Grid, LinearProgress, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import InfoHint from '../InfoHint';
import { stamp } from '../dateTime';
import { animalText } from '../animalText';
import { useBioAccess } from '../useBioAccess';
import { batchServices } from '../bio-production-services';
import { money } from './BatchTables';
import { useBioMoney } from '../useBioMoney';
import { fromGrams, withUnit } from '../weightUnit';
import FeedProjection from '../FeedProjection';
import FcrTrend from './FcrTrend';
import FeedTrend from './FeedTrend';
import MeasurementTrend from './MeasurementTrend';
import ResponsiveTable from './ResponsiveTable';
import { Batch, BatchSummary as Summary, FcrRow } from './batchTypes';

const num = (value: number | null | undefined, digits = 2) => (value == null ? '—' : Number(value).toLocaleString(undefined, { maximumFractionDigits: digits }));
const day = (value: string | null | undefined) => stamp(value);

const Stat = ({ label, value, color, hint }: { label: string; value: React.ReactNode; color?: string; hint?: string }) => (
  <Card variant='outlined' sx={{ height: '100%' }}>
    <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
      <Typography variant='body2' color='text.secondary'>{label}</Typography>
      <Typography variant='h4' mb={0} color={color} sx={{ fontSize: { xs: '1.05rem', sm: '1.5rem' }, overflowWrap: 'anywhere' }}>{value}</Typography>
      {hint && <Typography variant='caption' color='text.secondary'>{hint}</Typography>}
    </CardContent>
  </Card>
);

const Section = ({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) => (
  <Box mt={3}>
    <Typography variant='h5' mb={1} display='flex' alignItems='center'>{title}{hint && <InfoHint text={hint} />}</Typography>
    <Card variant='outlined'>{children}</Card>
  </Box>
);

/** The whole batch on one page: where its cost went, what went into it, and what came out. */
const BatchSummary = ({ batch }: { batch: Batch }) => {
  const bio = useDictionary().bioProduction;
  const text = bio.batches;
  const t = text.summary;
  const { finance } = useBioAccess();
  const cash = useBioMoney();
  const animals = batch.species_template?.count_label;

  const { data, isLoading } = useQuery<Summary>({
    queryKey: ['bioBatchSummary', batch.id],
    queryFn: () => batchServices.getSummary(batch.id),
  });

  if (isLoading || !data) return <LinearProgress />;

  const { costs, inputs, outputs } = data;
  const fcrNow = data.fcr.batch;
  const categories = data.categories ?? [];
  const byStage = data.by_stage ?? [];
  const total = costs?.total || 0;
  const share = (amount: number) => (total > 0 ? `${num((amount / total) * 100, 1)}%` : '—');
  const categoryName = (category: Summary['categories'][number]) => (category.group === 'input' ? t.inputCategory[category.key as 'feed' | 'medication' | 'other'] : category.group === 'merge' ? t.mergedCategory : category.name);
  const empty = text.tables.empty;
  const stageTotals = byStage.reduce((sum, stage) => ({ inputs: sum.inputs + stage.inputs, other: sum.other + stage.other, total: sum.total + stage.total }), { inputs: 0, other: 0, total: 0 });
  const inputTotals = inputs.reduce((sum, row) => sum + (row.cost ?? 0), 0);

  return (
    <Box p={2}>
      <Grid container spacing={1.5}>
        <Grid size={{ xs: 6, md: 3 }}><Stat label={text.labels.stage} value={batch.current_stage?.name ?? text.status.closed} /></Grid>
        <Grid size={{ xs: 6, md: 3 }}><Stat label={text.labels.startDate} value={day(batch.start_date)} /></Grid>
        <Grid size={{ xs: 6, md: 3 }}><Stat label={text.labels.endDate} value={batch.end_date ? day(batch.end_date) : '—'} /></Grid>
        <Grid size={{ xs: 6, md: 3 }}><Stat label={t.days} value={num(data.days, 0)} /></Grid>
        {finance && costs && (
          <>
          <Grid size={{ xs: 6, md: 3 }}><Stat label={text.costs.accrued} value={cash(costs.total)} /></Grid>
          <Grid size={{ xs: 6, md: 3 }}><Stat label={text.costs.balance} value={cash(costs.wip_balance)} hint={costs.per_unit != null ? `${cash(costs.per_unit)} ${t.each}` : undefined} /></Grid>
          <Grid size={{ xs: 6, md: 3 }}><Stat label={t.movedToStock} value={cash((costs.harvested ?? 0) + (costs.collected ?? 0))} hint={`${t.harvests} ${cash(costs.harvested)} · ${t.produce} ${cash(costs.collected)}`} /></Grid>
          <Grid size={{ xs: 6, md: 3 }}><Stat label={text.costs.writtenOff} value={cash(costs.written_off)} color={costs.written_off > 0 ? 'error.main' : undefined} /></Grid>
          </>
        )}
        <Grid size={{ xs: 6, md: 3 }}><Stat label={animalText(t.alive, animals)} value={`${num(data.animals.alive, 0)} / ${num(data.animals.initial, 0)}`} /></Grid>
        <Grid size={{ xs: 6, md: 3 }}><Stat label={t.died} value={num(data.animals.died, 0)} hint={data.animals.mortality_pct != null ? `${num(data.animals.mortality_pct)}%` : undefined} /></Grid>
        <Grid size={{ xs: 6, md: 3 }}><Stat label={t.harvestedAnimals} value={num(data.animals.harvested, 0)} /></Grid>
        <Grid size={{ xs: 6, md: 3 }}><Stat label={t.fcr.value} value={fcrNow?.fcr == null ? '—' : num(fcrNow.fcr, 2)}
          hint={fcrNow == null ? undefined : fcrNow.fcr != null ? `${num(fcrNow.feed_kg, 1)} kg ÷ ${num(fcrNow.gain_kg, 1)} kg` : fcrNow.reason ? t.fcr.noWeights : t.fcr.notEnough} /></Grid>
      </Grid>

      {finance && (
      <>
      <Section title={t.costsByCategory}>
        <ResponsiveTable<Summary['categories'][number]>
          empty={empty}
          rows={categories}
          rowKey={(category) => `${category.group}-${category.key}`}
          columns={[
            { label: t.category, render: (category) => categoryName(category) },
            { label: t.entries, align: 'right', render: (category) => category.entries ?? '—' },
            { label: t.amount, align: 'right', headline: true, render: (category) => money(category.amount) },
            { label: t.share, align: 'right', render: (category) => share(category.amount) },
          ]}
          footer={[t.total, null, money(total), total > 0 ? '100%' : '—']}
        />
      </Section>

      <Section title={t.costsByStage}>
        <ResponsiveTable<Summary['by_stage'][number]>
          empty={empty}
          rows={byStage}
          rowKey={(stage) => stage.stage_id}
          columns={[
            { label: t.stage, render: (stage) => stage.name },
            { label: t.period, render: (stage) => `${day(stage.start_date)} → ${stage.end_date ? day(stage.end_date) : '…'}` },
            { label: t.inputsCol, align: 'right', render: (stage) => money(stage.inputs) },
            { label: t.otherCol, align: 'right', render: (stage) => money(stage.other) },
            { label: t.total, align: 'right', headline: true, render: (stage) => money(stage.total) },
          ]}
          footer={[t.total, null, money(stageTotals.inputs), money(stageTotals.other), money(stageTotals.total)]}
        />
      </Section>
      </>
      )}

      <Section title={t.feedTrend.title} hint={t.feedTrend.help}>
        <FeedTrend trend={data.feed_trend} start={batch.start_date} end={batch.end_date} showCost={!!finance} />
      </Section>

      {batch.status !== 'closed' && !batch.end_date && (
        <Section title={bio.feedProjection.title} hint={bio.feedProjection.help}>
          <FeedProjection horizons={[30, 60, 90, 'cycle']} scope={`batch-${batch.id}`} load={(days) => batchServices.getFeedProjection(batch.id, { days })} weightUnit={batch.species_template?.weight_unit} animalsLabel={batch.species_template?.count_label} showCost={!!finance} />
        </Section>
      )}

      <Section title={t.fcr.title} hint={t.fcr.help}>
        <ResponsiveTable<{ key: string; name: string; row: FcrRow }>
          empty={empty}
          rows={[...(data.fcr.batch ? [{ key: 'batch', name: t.fcr.wholeBatch, row: data.fcr.batch }] : []), ...data.fcr.stages.map((stage) => ({ key: `s-${stage.stage_id}`, name: stage.stage, row: stage }))]}
          rowKey={(entry) => entry.key}
          columns={[
            { label: t.stage, primary: true, render: (entry) => entry.name },
            { label: t.fcr.feed, align: 'right', render: (entry) => (entry.row.reason ? '—' : `${num(entry.row.feed_kg, 1)} kg`) },
            { label: t.fcr.gain, align: 'right', render: (entry) => (entry.row.gain_kg == null ? '—' : `${num(entry.row.gain_kg, 1)} kg`) },
            { label: t.fcr.value, align: 'right', headline: true, render: (entry) => (entry.row.fcr == null ? <Box component='span' color='text.secondary'>{entry.row.reason ? t.fcr.noWeights : t.fcr.notEnough}</Box> : num(entry.row.fcr, 2)) },
            { label: withUnit(t.fcr.lastAbw, batch.species_template?.weight_unit), align: 'right', render: (entry) => (entry.row.last_abw_g == null ? '—' : num(fromGrams(Number(entry.row.last_abw_g), batch.species_template?.weight_unit), 2)) },
            { label: t.fcr.lastWeighed, render: (entry) => (entry.row.last_weighed_at ? day(entry.row.last_weighed_at) : '—') },
          ]}
        />
        {!!data.fcr.batch?.other_units?.length && (
          <Typography variant='caption' color='warning.main' display='block' p={1.5}>{t.fcr.otherUnits.replace('{units}', data.fcr.batch.other_units.join(', '))}</Typography>
        )}
      </Section>

      <Section title={t.fcrTrend.title} hint={t.fcrTrend.help}>
        <FcrTrend trend={data.fcr_trend} />
      </Section>

      <Section title={t.inputsByProduct}>
        <ResponsiveTable<Summary['inputs'][number]>
          empty={empty}
          rows={inputs}
          rowKey={(row) => `${row.type}-${row.product_id}-${row.unit}`}
          columns={[
            { label: t.product, primary: true, render: (row) => row.product },
            { label: t.type, render: (row) => text.inputTypes[row.type] },
            { label: t.quantity, align: 'right', render: (row) => `${num(row.quantity, 5)} ${row.unit ?? ''}` },
            ...(finance ? [{ label: t.averageRate, align: 'right' as const, render: (row: any) => (row.rate == null ? '—' : money(row.rate)) }, { label: t.cost, align: 'right' as const, headline: true, render: (row: any) => money(row.cost) }] : []),
            { label: t.timesUsed, align: 'right', render: (row) => row.applications },
            { label: t.usedBetween, render: (row) => `${day(row.first_date)} → ${day(row.last_date)}` },
          ]}
          footer={finance ? [t.total, null, null, null, money(inputTotals), null, null] : undefined}
        />
      </Section>

      {data.environment.length > 0 && (
        <Section title={t.environment}>
          <ResponsiveTable<Summary['environment'][number]>
            rows={data.environment}
            rowKey={(row) => row.parameter_id}
            columns={[
              { label: t.parameter, render: (row) => `${row.name}${row.unit_label ? ` (${row.unit_label})` : ''}` },
              { label: t.readings, align: 'right', render: (row) => row.readings },
              { label: t.average, align: 'right', headline: true, render: (row) => num(row.average, row.decimals) },
              { label: t.lowest, align: 'right', render: (row) => num(row.min, row.decimals) },
              { label: t.highest, align: 'right', render: (row) => num(row.max, row.decimals) },
              { label: t.outOfRange, align: 'right', render: (row) => (row.out_of_range > 0 ? <Box component='span' color='warning.main'>{row.out_of_range}</Box> : 0) },
            ]}
          />
          <MeasurementTrend batchId={batch.id} parameters={data.environment} />
        </Section>
      )}

      {(outputs.harvests.length > 0 || outputs.produce.length > 0) && (
        <Section title={t.outputs}>
          <ResponsiveTable<{ key: string; kind: string; product: string; animals: number | null; quantity: number; cost: number }>
            rows={[
              ...outputs.harvests.map((row) => ({ key: `h-${row.product}`, kind: t.harvests, product: row.product, animals: row.animals, quantity: row.quantity, cost: row.cost })),
              ...outputs.produce.map((row) => ({ key: `p-${row.product}`, kind: t.produce, product: row.product, animals: null, quantity: row.quantity, cost: row.cost })),
            ]}
            rowKey={(row) => row.key}
            columns={[
              { label: t.product, primary: true, render: (row) => row.product },
              { label: t.kind, render: (row) => row.kind },
              { label: animalText(t.animals, animals), align: 'right', render: (row) => (row.animals == null ? '—' : num(row.animals, 0)) },
              { label: t.quantity, align: 'right', render: (row) => num(row.quantity, 5) },
              ...(finance ? [{ label: t.cost, align: 'right' as const, headline: true, render: (row: any) => money(row.cost) }] : []),
            ]}
          />
        </Section>
      )}

      <Section title={t.deathsByStage.title} hint={t.deathsByStage.help}>
        <ResponsiveTable<Summary['deaths_by_stage'][number]>
          empty={empty}
          rows={data.deaths_by_stage ?? []}
          rowKey={(stage) => stage.stage_id}
          columns={[
            { label: t.stage, primary: true, render: (stage) => stage.name },
            { label: t.period, render: (stage) => `${day(stage.start_date)} → ${stage.end_date ? day(stage.end_date) : '…'}` },
            { label: t.deathsByStage.opening, align: 'right', render: (stage) => (stage.opening_quantity == null ? '—' : num(stage.opening_quantity, 0)) },
            { label: t.died, align: 'right', headline: true, render: (stage) => num(stage.died, 0) },
            { label: t.deathsByStage.rate, align: 'right', render: (stage) => (stage.mortality_pct == null ? '—' : `${num(stage.mortality_pct)}%`) },
          ]}
          footer={[t.total, null, null, num((data.deaths_by_stage ?? []).reduce((sum, stage) => sum + stage.died, 0), 0), null]}
        />
      </Section>
    </Box>
  );
};

export default BatchSummary;
