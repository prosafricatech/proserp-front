'use client'

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowDownwardOutlined, ArrowUpwardOutlined, RefreshOutlined } from '@mui/icons-material';
import JumboCardQuick from '@jumbo/components/JumboCardQuick/JumboCardQuick';
import { DateTimePicker } from '@mui/x-date-pickers';
import { Autocomplete, Badge, Box, Button, Card, CardContent, Chip, Dialog, Divider, Grid, IconButton, LinearProgress, Stack, Tab, Tabs, TextField, Tooltip, Typography, useMediaQuery } from '@mui/material';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { useQuery } from '@tanstack/react-query';
import dayjs, { Dayjs } from 'dayjs';
import { useParams } from 'next/navigation';
import { getErrorMessage } from '@/utilities/helpers/errorHandler';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { dashboardServices, farmServices } from '../bio-production-services';
import { useBioMoney } from '../useBioMoney';
import InfoHint from '../InfoHint';
import { stamp } from '../dateTime';
import UnitEnvironment from '../productionUnits/UnitEnvironment';
import RoundView from '../rounds/RoundView';
import { BioFarm, BioProductionUnit } from '../types';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import BioGate from '../BioGate';
import { useBioAccess } from '../useBioAccess';
import TrendCard from './TrendCard';
import FeedProjection from '../FeedProjection';
import { AlertSeverity, ConditionAlert, Dashboard } from './dashboardTypes';

const num = (value: number, digits = 0) => value.toLocaleString(undefined, { maximumFractionDigits: digits });
const severityColor = (severity: AlertSeverity): 'error' | 'warning' | 'success' => (severity === 'critical' ? 'error' : severity === 'watch' ? 'warning' : 'success');

/** A figure shrinks as it gets longer, so a large amount (a billion and more) stays on one line on a phone. */
const figureSize = (value: React.ReactNode) => {
  const length = typeof value === 'string' || typeof value === 'number' ? String(value).length : 0;
  if (length > 16) return { xs: '0.78rem', sm: '1.05rem' };
  if (length > 12) return { xs: '0.88rem', sm: '1.2rem' };

  return { xs: '1rem', sm: '1.4rem' };
};

const KpiCard = ({ label, value, hint, progress, change, info, comparison }: { comparison?: string; info?: string; label: string; value: React.ReactNode; hint?: React.ReactNode; progress?: number; change?: { delta: number; goodWhenDown: boolean; text: string } }) => {
  const size = figureSize(value);

  return (
  <Card variant='outlined' sx={{ height: '100%' }}>
    <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
      <Stack direction='row' alignItems='center' spacing={0.25}>
        <Typography variant='body2' color='text.secondary'>{label}</Typography>
        {info && <InfoHint text={info} />}
      </Stack>
      <Typography variant='h4' mb={0} sx={{ fontSize: size, lineHeight: 1.3, overflowWrap: 'break-word' }}>{value}</Typography>
      {progress != null && <LinearProgress variant='determinate' value={Math.min(100, progress)} sx={{ my: 0.5, height: 6, borderRadius: 3 }} />}
      {change && change.delta !== 0 && (
        <Tooltip title={comparison ?? ''} disableHoverListener={!comparison} disableFocusListener={!comparison} disableTouchListener={!comparison} placement='bottom-start' arrow>
          <Stack direction='row' alignItems='center' spacing={0.25} color={(change.delta > 0) === change.goodWhenDown ? 'error.main' : 'success.main'} sx={{ cursor: comparison ? 'help' : undefined }}>
            {change.delta > 0 ? <ArrowUpwardOutlined sx={{ fontSize: 14 }} /> : <ArrowDownwardOutlined sx={{ fontSize: 14 }} />}
            <Typography variant='caption'>{change.text}</Typography>
          </Stack>
        </Tooltip>
      )}
      {hint && <Typography variant='caption' color='text.secondary' display='block'>{hint}</Typography>}
    </CardContent>
  </Card>
  );
};

const Panel = ({ title, action, children }: { title: React.ReactNode; action?: React.ReactNode; children: React.ReactNode }) => (
  <Card variant='outlined' sx={{ height: '100%' }}>
    <CardContent>
      <Stack direction='row' justifyContent='space-between' alignItems='center' mb={1} spacing={1}>
        <Typography variant='h5' mb={0}>{title}</Typography>
        {action}
      </Stack>
      {children}
    </CardContent>
  </Card>
);

/** One thing that needs attention: a coloured edge for how serious, what it is, the detail, and where to go. */
const AlertRow = ({ severity, title, detail, action }: { severity: AlertSeverity; title: React.ReactNode; detail: React.ReactNode; action: React.ReactNode }) => (
  <Box sx={{ borderLeft: 4, borderColor: `${severityColor(severity)}.main`, pl: 1.5, py: 0.75, my: 1 }}>
    <Stack direction='row' justifyContent='space-between' alignItems='flex-start' spacing={1}>
      <Box sx={{ minWidth: 0 }}>
        <Typography fontWeight={600} sx={{ overflowWrap: 'anywhere' }}>{title}</Typography>
        <Typography variant='body2' color='text.secondary' sx={{ overflowWrap: 'anywhere' }}>{detail}</Typography>
      </Box>
      <Box sx={{ flexShrink: 0 }}>{action}</Box>
    </Stack>
  </Box>
);

type TabKey = 'conditions' | 'mortality' | 'feeding' | 'stages';
const VISIBLE = 6;

const PRESETS = ['today', 'last7', 'last30', 'thisMonth', 'thisYear'] as const;
const presetRange = (preset: (typeof PRESETS)[number]) => {
  const now = dayjs();
  switch (preset) {
    case 'today': return { from: now.startOf('day'), to: now };
    case 'last7': return { from: now.subtract(6, 'day').startOf('day'), to: now };
    case 'thisMonth': return { from: now.startOf('month'), to: now };
    case 'thisYear': return { from: now.startOf('year'), to: now };
    default: return { from: now.subtract(29, 'day').startOf('day'), to: now };
  }
};

const DashboardContent = () => {
  const bio = useDictionary().bioProduction;
  const t = bio.dashboard;
  const { lang } = useParams<{ lang: string }>();
  const access = useBioAccess();
  const farmAccess = access.master('farms');
  const { finance } = access;
  const money = useBioMoney();
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));
  const [tab, setTab] = useState<TabKey>('conditions');
  const [expanded, setExpanded] = useState(false);
  const [unit, setUnit] = useState<BioProductionUnit | null>(null);
  const [recordId, setRecordId] = useState<number | null>(null);
  const [from, setFrom] = useState<Dayjs>(() => presetRange('last30').from);
  const [to, setTo] = useState<Dayjs>(() => dayjs());
  const [farmIds, setFarmIds] = useState<number[]>([]);

  const { data: farmList, isSuccess: farmsLoaded } = useQuery<{ data: BioFarm[] }>({
    queryKey: ['bioActiveFarms'],
    queryFn: () => farmServices.getList({ status: 'active', limit: 500 }),
  });
  const farms = farmList?.data ?? [];
  const chosenFarms = farms.filter((farm) => farmIds.includes(farm.id));

  // Empty means every farm the user may see; the server applies that limit.
  const params = useMemo(() => ({
    farm_ids: farmIds.join(','),
    from: from.format('YYYY-MM-DD HH:mm:ss'),
    to: to.format('YYYY-MM-DD HH:mm:ss'),
  }), [farmIds, from, to]);

  // Without a farm the server has nothing to show, so it is not asked. A refusal (no access, a bad range) is shown, not retried.
  const { data, isLoading, isError, error, isFetching, refetch } = useQuery<Dashboard>({
    queryKey: ['bioDashboard', params],
    queryFn: () => dashboardServices.get(params),
    enabled: farmsLoaded && farms.length > 0,
    retry: (count, failure: any) => (failure?.response?.status ?? 500) >= 500 && count < 2,
    placeholderData: (previous) => previous,
    refetchInterval: 5 * 60 * 1000,
  });

  const filters = (
    <JumboCardQuick sx={{ mb: 1.5 }}>
      <Grid container spacing={1} alignItems='center'>
        <Grid size={{ xs: 12, md: 6, lg: 3, xl: 2 }}>
          <DateTimePicker label={t.filters.from} value={from} disableFuture maxDateTime={to} slotProps={{ textField: { size: 'small', fullWidth: true } }} onChange={(value: Dayjs | null) => value && setFrom(value)} />
        </Grid>
        <Grid size={{ xs: 12, md: 6, lg: 3, xl: 2 }}>
          <DateTimePicker label={t.filters.to} value={to} disableFuture minDateTime={from} slotProps={{ textField: { size: 'small', fullWidth: true } }} onChange={(value: Dayjs | null) => value && setTo(value)} />
        </Grid>
        <Grid size={{ xs: 12, lg: 6, xl: 4 }}>
          <Autocomplete
            multiple
            size='small'
            options={farms}
            value={chosenFarms}
            getOptionLabel={(farm) => farm.name}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            onChange={(_, value) => setFarmIds(value.map((farm) => farm.id))}
            renderInput={(inputProps) => <TextField {...inputProps} label={t.filters.farms} placeholder={farmIds.length ? '' : t.filters.allFarms} />}
          />
        </Grid>
        <Grid size={{ xs: 12, xl: 4 }}>
          <Stack direction='row' spacing={0.5} flexWrap='wrap' useFlexGap>
            {PRESETS.map((preset) => (
              <Chip key={preset} size='small' variant='outlined' clickable label={t.filters.presets[preset]} onClick={() => { const range = presetRange(preset); setFrom(range.from); setTo(range.to); }} />
            ))}
          </Stack>
        </Grid>
      </Grid>
    </JumboCardQuick>
  );

  if (farmsLoaded && farms.length === 0) {
    return (
      <Card variant='outlined'>
        <CardContent sx={{ textAlign: 'center', py: 5 }}>
          <Typography variant='h5'>{t.empty.title}</Typography>
          <Typography color='text.secondary' mb={2}>{farmAccess.create ? t.empty.text : t.empty.askAdmin}</Typography>
          {farmAccess.create && <Button variant='contained' component={Link} href={`/${lang}/bioProduction/farms`}>{t.empty.action}</Button>}
        </CardContent>
      </Card>
    );
  }

  if (isError && !data) {
    return (
      <Box>
        {filters}
        <Card variant='outlined'>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant='h5'>{t.error.title}</Typography>
            <Typography color='text.secondary' mb={2}>{getErrorMessage(error)}</Typography>
            <Button variant='outlined' onClick={() => refetch()}>{t.error.retry}</Button>
          </CardContent>
        </Card>
      </Box>
    );
  }

  if (isLoading || !data) return <Box>{filters}<LinearProgress /></Box>;

  const { summary, alerts, occupancy, activity } = data;
  const several = data.farms.length > 1;
  const withFarm = (title: string, farm?: string | null) => (several && farm ? `${farm} · ${title}` : title);
  const counts: Record<TabKey, number> = { conditions: alerts.conditions.length, mortality: alerts.mortality.length, feeding: alerts.feeding.length, stages: alerts.stages.length };
  const everything = [...alerts.conditions, ...alerts.mortality, ...alerts.feeding, ...alerts.stages];
  const critical = everything.filter((alert) => alert.severity === 'critical').length;
  const watch = everything.filter((alert) => alert.severity === 'watch').length;
  // The stretch of the same length just before the chosen one, which every "vs previous period" figure is measured against.
  const previousFrom = dayjs(data.range.from).subtract(dayjs(data.range.to).diff(dayjs(data.range.from)), 'millisecond');
  const comparison = t.kpis.comparedWith.replace('{from}', previousFrom.format('D MMM YYYY')).replace('{to}', dayjs(data.range.from).subtract(1, 'second').format('D MMM YYYY'));
  const change = (now: number, before: number, format: (value: number) => string) => ({ delta: now - before, goodWhenDown: true, text: t.kpis.vsPrevious.replace('{change}', format(Math.abs(now - before))) });
  const batchLink = (id: number) => !access.batches.read ? null : (
    <Button size='small' component={Link} href={`/${lang}/bioProduction/batches/${id}`}>{t.alerts.open}</Button>
  );
  const when = (value: string) => dayjs(value).format('D MMM, HH:mm');

  const conditionRow = (alert: ConditionAlert, index: number) =>
    alert.kind === 'reading' ? (
      <AlertRow
        key={`r-${index}`}
        severity={alert.severity}
        title={withFarm(`${alert.unit} · ${alert.parameter}: ${num(alert.value ?? 0, alert.decimals ?? 2)} ${alert.unit_label ?? ''}`, alert.farm)}
        detail={`${t.alerts.outside.replace('{level}', t.alerts.levels[alert.severity as 'watch' | 'critical'])} · ${when(alert.measured_at ?? '')}`}
        action={<Button size='small' onClick={() => setUnit({ id: alert.unit_id, name: alert.unit } as BioProductionUnit)}>{t.alerts.conditions}</Button>}
      />
    ) : (
      <AlertRow
        key={`u-${index}`}
        severity='watch'
        title={withFarm(t.alerts.unmeasured.replace('{unit}', alert.unit), alert.farm)}
        detail={alert.last_measured_at ? t.alerts.lastMeasured.replace('{days}', String(alert.days ?? 0)) : t.alerts.neverMeasured}
        action={<Button size='small' onClick={() => setUnit({ id: alert.unit_id, name: alert.unit } as BioProductionUnit)}>{t.alerts.conditions}</Button>}
      />
    );

  const rows: Record<TabKey, React.ReactNode[]> = {
    conditions: alerts.conditions.map(conditionRow),
    mortality: alerts.mortality.map((alert) => (
      <AlertRow
        key={alert.batch_id + alert.stage}
        severity={alert.severity}
        title={withFarm(`${alert.batchNo} · ${alert.unit} (${alert.stage})`, alert.farm)}
        detail={t.alerts.abnormal.replace('{abnormal}', num(alert.abnormal)).replace('{pct}', String(alert.allowed_pct)).replace('{died}', num(alert.died)).replace('{opening}', num(alert.opening))}
        action={batchLink(alert.batch_id)}
      />
    )),
    feeding: alerts.feeding.map((alert) => (
      <AlertRow
        key={alert.batch_id}
        severity={alert.severity}
        title={withFarm(`${alert.batchNo} · ${alert.unit}${alert.stage ? ` (${alert.stage})` : ''}`, alert.farm)}
        detail={(alert.never ? t.alerts.neverFed : t.alerts.noFeed).replace('{days}', String(alert.days))}
        action={batchLink(alert.batch_id)}
      />
    )),
    stages: alerts.stages.map((alert) => (
      <AlertRow
        key={alert.batch_id}
        severity={alert.severity}
        title={withFarm(`${alert.batchNo} · ${alert.unit}`, alert.farm)}
        detail={t.alerts.overStage.replace('{over}', String(alert.over_days)).replace('{expected}', String(alert.expected_days)).replace('{stage}', alert.stage)}
        action={batchLink(alert.batch_id)}
      />
    )),
  };
  const shown = expanded ? rows[tab] : rows[tab].slice(0, VISIBLE);

  return (
    <Box>
      {filters}
      <Stack direction='row' justifyContent='space-between' alignItems='center' mb={1.5} spacing={1}>
        <Stack direction='row' spacing={1} alignItems='center' flexWrap='wrap' useFlexGap>
          {critical > 0 && <Chip color='error' label={t.alerts.critical.replace('{count}', String(critical))} />}
          {watch > 0 && <Chip color='warning' variant='outlined' label={t.alerts.watch.replace('{count}', String(watch))} />}
          {critical + watch === 0 && <Chip color='success' variant='outlined' label={t.alerts.none} />}
        </Stack>
        <Stack direction='row' alignItems='center' spacing={0.5}>
          <Typography variant='caption' color='text.secondary'>{t.updated.replace('{time}', dayjs(data.generated_at).format('HH:mm'))}</Typography>
          <Tooltip title={t.refresh}>
            <span><IconButton size='small' onClick={() => refetch()} disabled={isFetching}><RefreshOutlined fontSize='small' /></IconButton></span>
          </Tooltip>
        </Stack>
      </Stack>

      <Typography variant='overline' color='text.secondary'>{t.sections.now}</Typography>
      <Grid container spacing={1.5} mb={1}>
        <Grid size={{ xs: 6, md: 3 }}><KpiCard label={t.kpis.openBatches} value={num(summary.open_batches)} hint={t.kpis.alive.replace('{count}', num(summary.animals_alive))} /></Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <KpiCard label={t.kpis.unitsInUse} value={`${summary.units_in_use} / ${summary.units_total}`} progress={summary.units_total ? (summary.units_in_use / summary.units_total) * 100 : 0} />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <KpiCard
            label={t.kpis.biomass}
            info={t.kpis.biomassInfo}
            value={summary.biomass.unknown === summary.open_batches && summary.open_batches > 0 ? '—' : `${num(summary.biomass.kg)} kg`}
            hint={t.kpis.biomassHint.replace('{weighed}', String(summary.biomass.weighed)).replace('{total}', String(summary.open_batches))}
          />
        </Grid>
        {finance && <Grid size={{ xs: 6, md: 3 }}><KpiCard label={t.kpis.wip} value={money(summary.wip_balance)} /></Grid>}
      </Grid>
      <Typography variant='overline' color='text.secondary'>{t.sections.period}</Typography>
      <Grid container spacing={1.5}>
        <Grid size={{ xs: 6, md: 3 }}>
          <KpiCard label={t.kpis.mortality} comparison={comparison} value={num(summary.mortality.current)} change={change(summary.mortality.current, summary.mortality.previous, (value) => num(value))} />
        </Grid>
        {finance && (
          <Grid size={{ xs: 6, md: 3 }}>
            <KpiCard label={t.kpis.feed} comparison={comparison} value={money(summary.feed_cost.current)} change={change(summary.feed_cost.current, summary.feed_cost.previous, (value) => money(value))} />
          </Grid>
        )}
        <Grid size={{ xs: 6, md: 3 }}>
          <KpiCard
            comparison={comparison}
            label={t.kpis.fcr}
            value={summary.fcr.current.value == null ? '—' : num(summary.fcr.current.value, 2)}
            change={summary.fcr.current.value != null && summary.fcr.previous != null ? change(summary.fcr.current.value, summary.fcr.previous, (value) => num(value, 2)) : undefined}
            hint={summary.fcr.current.value == null ? t.kpis.fcrNone : t.kpis.fcrHint.replace('{feed}', num(summary.fcr.current.feed_kg, 0)).replace('{gain}', num(summary.fcr.current.gain_kg, 0)).replace('{batches}', String(summary.fcr.current.batches))}
          />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <KpiCard
            label={t.kpis.harvest}
            value={num(summary.harvest.animals)}
            hint={summary.harvest.animals ? `${num(summary.harvest.quantity, 1)}${finance ? ` · ${money(summary.harvest.cost)}` : ''}` : t.kpis.none}
          />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <KpiCard
            label={t.kpis.produce}
            value={summary.produce.length ? summary.produce.map((row) => `${num(row.quantity, 1)}`).join(' / ') : '0'}
            hint={summary.produce.length ? summary.produce.map((row) => row.product).join(' / ') : t.kpis.none}
          />
        </Grid>
      </Grid>

      <Grid container spacing={1.5} mt={0.5}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <Panel title={t.alerts.title}>
            <Tabs value={tab} onChange={(_, value) => { setTab(value); setExpanded(false); }} variant='scrollable' scrollButtons='auto'>
              {(Object.keys(counts) as TabKey[]).map((key) => (
                <Tab key={key} value={key} label={<Badge color={key === tab ? 'primary' : 'default'} badgeContent={counts[key]} max={99} showZero sx={{ '& .MuiBadge-badge': { right: -14, top: 2 } }}>{t.alerts.tabs[key]}</Badge>} sx={{ pr: 3.5 }} />
              ))}
            </Tabs>
            <Divider />
            {rows[tab].length === 0 ? <Typography color='text.secondary' py={2}>{t.alerts.none}</Typography> : shown}
            {rows[tab].length > VISIBLE && (
              <Button size='small' onClick={() => setExpanded((open) => !open)}>
                {expanded ? t.alerts.showLess : t.alerts.showAll.replace('{count}', String(rows[tab].length))}
              </Button>
            )}
          </Panel>
        </Grid>
        <Grid size={{ xs: 12, lg: 5 }}>
          <Stack spacing={1.5} sx={{ height: '100%' }}>
            <Panel title={t.occupancy.title}>
              {occupancy.map((row) => (
                <Box key={row.type} mb={1}>
                  <Stack direction='row' justifyContent='space-between'>
                    <Typography variant='body2'>{bio.productionUnits.types[row.type as keyof typeof bio.productionUnits.types] ?? row.type}</Typography>
                    <Typography variant='body2' color='text.secondary'>{t.occupancy.ofTotal.replace('{used}', String(row.in_use)).replace('{total}', String(row.total))}</Typography>
                  </Stack>
                  <LinearProgress variant='determinate' value={row.total ? (row.in_use / row.total) * 100 : 0} sx={{ height: 6, borderRadius: 3 }} />
                </Box>
              ))}
            </Panel>
            <Panel title={t.activity.title}>
              {activity.length === 0 && <Typography color='text.secondary'>{t.activity.none}</Typography>}
              <Box sx={{ maxHeight: 360, overflowY: 'auto' }}>
              {activity.map((record) => (
                <Stack
                  key={record.id}
                  direction='row'
                  justifyContent='space-between'
                  alignItems='flex-start'
                  spacing={1}
                  onClick={() => access.records.read && setRecordId(record.id)}
                  sx={{ cursor: access.records.read ? 'pointer' : 'default', py: 0.5, px: 0.5, borderRadius: 1, '&:hover': { bgcolor: 'action.hover' } }}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Typography fontWeight={600} sx={{ overflowWrap: 'anywhere' }}>{withFarm(`${record.recordNo}`, record.farm)} · {bio.rounds.titles[record.kind as keyof typeof bio.rounds.titles]}</Typography>
                    <Typography variant='caption' color='text.secondary' display='block' sx={{ overflowWrap: 'anywhere' }}>
                      {stamp(record.record_date)}{record.creator ? ` · ${t.activity.by.replace('{name}', record.creator)}` : ''}
                    </Typography>
                  </Box>
                  <Chip size='small' variant='outlined' sx={{ flexShrink: 0 }} label={t.activity.lines.replace('{count}', String(record.lines_count))} />
                </Stack>
              ))}
              </Box>
            </Panel>
          </Stack>
        </Grid>
        <Grid size={{ xs: 12, xl: 6 }}>
          <TrendCard metric='deaths' kind='area' title={t.trends.deaths} params={params} series={[{ key: 'deaths', label: t.trends.deaths, color: theme.palette.error.main }]} />
        </Grid>
        {finance && <Grid size={{ xs: 12, xl: 6 }}>
          <TrendCard metric='feed' kind='area' title={t.trends.feed} params={params} money series={[{ key: 'feed_cost', label: t.trends.feed, color: theme.palette.primary.main }]} />
        </Grid>}
        <Grid size={{ xs: 12, xl: 6 }}>
          <TrendCard metric='readings' title={t.trends.readings} params={params} stacked series={[{ key: 'watch_readings', label: t.trends.watch, color: theme.palette.warning.main }, { key: 'critical_readings', label: t.trends.critical, color: theme.palette.error.main }]} />
        </Grid>
        <Grid size={{ xs: 12, xl: 6 }}>
          <TrendCard metric='output' title={t.trends.output} params={params} series={[{ key: 'harvest_quantity', label: t.trends.harvestSeries, color: theme.palette.success.main }, { key: 'produce_quantity', label: t.trends.produceSeries, color: theme.palette.info.main }]} />
        </Grid>
        <Grid size={12}>
          <JumboCardQuick title={bio.feedProjection.title} sx={{ minHeight: 360 }}>
            <FeedProjection horizons={[30, 90, 180, 270, 365]} scope={`farms-${JSON.stringify(params.farm_ids ?? '')}`} load={(days) => dashboardServices.feedProjection({ farm_ids: params.farm_ids, days })} showCost={!!finance} />
          </JumboCardQuick>
        </Grid>
        <Grid size={{ xs: 12, xl: 6 }}>
          <TrendCard metric='fcr' kind='line' title={t.trends.fcr} params={params} series={[{ key: 'fcr', label: t.trends.fcr, color: theme.palette.success.dark }]} />
        </Grid>
      </Grid>

      {unit && <UnitEnvironment unit={unit} open onClose={() => setUnit(null)} />}
      <Dialog open={recordId != null} fullWidth maxWidth='md' fullScreen={belowLargeScreen} onClose={() => setRecordId(null)}>
        {recordId != null && <RoundView recordId={recordId} onClose={() => setRecordId(null)} />}
      </Dialog>
    </Box>
  );
};

const BioDashboard = () => {
  const text = useDictionary().bioProduction.dashboard;

  return (
    <BioGate anyOf={[PERMISSIONS.BIO_DASHBOARD_READ]}>
      <Typography variant='h4' mb={2}>{text.title}</Typography>
      <DashboardContent />
    </BioGate>
  );
};

export default BioDashboard;
