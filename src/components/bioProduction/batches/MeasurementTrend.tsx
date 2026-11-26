'use client'

import React, { useEffect, useMemo, useState } from 'react';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { Box, LinearProgress, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { CartesianGrid, Line, LineChart, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import BioSelect from '../BioSelect';
import { batchServices } from '../bio-production-services';

type Trend = {
  parameter: { id: number; name: string; unit_label: string | null; decimals: number; watch_min: number | null; watch_max: number | null; critical_min: number | null; critical_max: number | null };
  points: { measured_at: string; value: number; unit_id: number; unit: string | null; status: 'ok' | 'watch' | 'critical' }[];
  stages: { name: string; start_date: string }[];
};

const num = (value: number, digits = 2) => Number(value).toLocaleString(undefined, { maximumFractionDigits: digits });

/**
 * One reading of the units a batch lived in, over time. Pick a parameter (water oxygen, pH, temperature, ...) from those
 * measured during the batch and it is drawn as a line, each reading marked amber or red when outside its watch or critical
 * limits, with the limits shaded behind it and the start of each stage marked.
 */
const MeasurementTrend = ({ batchId, parameters }: { batchId: number; parameters: { parameter_id: number; name: string; unit_label: string | null }[] }) => {
  const t = useDictionary().bioProduction.batches.summary.measurementTrend;
  const { theme } = useJumboTheme();
  const [chosen, setChosen] = useState<string | number>(parameters[0]?.parameter_id ?? '');
  useEffect(() => {
    if (!parameters.some((parameter) => parameter.parameter_id === chosen)) setChosen(parameters[0]?.parameter_id ?? '');
  }, [parameters, chosen]);

  const { data, isFetching, isError } = useQuery<Trend>({
    queryKey: ['bioBatchMeasurementTrend', batchId, chosen],
    queryFn: () => batchServices.measurementTrend(batchId, Number(chosen)),
    enabled: !!chosen,
    placeholderData: (previous) => previous,
  });

  const colour = { ok: theme.palette.success.main, watch: theme.palette.warning.main, critical: theme.palette.error.main };
  const series = useMemo(() => (data?.points ?? []).map((point) => ({ ...point, time: dayjs(point.measured_at).valueOf() })), [data]);
  const limits = data?.parameter;
  const values = series.map((point) => point.value);
  // The axis spans the readings and any limit, so the shaded bands are always in view.
  const lows = [...values, limits?.critical_min, limits?.watch_min].filter((value): value is number => value != null);
  const highs = [...values, limits?.critical_max, limits?.watch_max].filter((value): value is number => value != null);
  const low = lows.length ? Math.min(...lows) : 0;
  const high = highs.length ? Math.max(...highs) : 1;
  const pad = (high - low || 1) * 0.08;
  const label = (value: number | null) => (value == null || !limits ? '' : `${num(value, limits.decimals)}${limits.unit_label ? ` ${limits.unit_label}` : ''}`);

  return (
    <Box p={2}>
      <Box maxWidth={360} mb={1.5}>
        <BioSelect
          label={t.parameter}
          options={parameters.map((parameter) => ({ value: parameter.parameter_id, label: `${parameter.name}${parameter.unit_label ? ` (${parameter.unit_label})` : ''}` }))}
          value={chosen}
          onChange={setChosen}
          required
        />
      </Box>
      {isFetching && !data && <LinearProgress />}
      {isError && <Typography color='text.secondary'>{t.failed}</Typography>}
      {data && series.length === 0 && <Typography color='text.secondary'>{t.none}</Typography>}
      {data && series.length > 0 && limits && (
        <>
          <Box sx={{ height: { xs: 260, md: 300 } }}>
            <ResponsiveContainer width='100%' height='100%'>
              <LineChart data={series} margin={{ top: 8, right: 12, bottom: 0, left: -6 }}>
                <CartesianGrid strokeDasharray='3 3' stroke={theme.palette.divider} vertical={false} />
                {/* Watch range (amber) and critical range (red) as bands behind the line. */}
                {limits.watch_max != null && <ReferenceArea y1={limits.watch_max} y2={limits.critical_max ?? high + pad} fill={theme.palette.warning.main} fillOpacity={0.12} ifOverflow='extendDomain' />}
                {limits.watch_min != null && <ReferenceArea y1={limits.critical_min ?? low - pad} y2={limits.watch_min} fill={theme.palette.warning.main} fillOpacity={0.12} ifOverflow='extendDomain' />}
                {limits.critical_max != null && <ReferenceArea y1={limits.critical_max} y2={high + pad} fill={theme.palette.error.main} fillOpacity={0.12} ifOverflow='extendDomain' />}
                {limits.critical_min != null && <ReferenceArea y1={low - pad} y2={limits.critical_min} fill={theme.palette.error.main} fillOpacity={0.12} ifOverflow='extendDomain' />}
                {data.stages.slice(1).map((stage) => (
                  <ReferenceLine key={stage.name + stage.start_date} x={dayjs(stage.start_date).valueOf()} stroke={theme.palette.text.disabled} strokeDasharray='4 4' label={{ value: stage.name, position: 'insideTopLeft', fontSize: 10, fill: theme.palette.text.secondary }} />
                ))}
                <XAxis dataKey='time' type='number' scale='time' domain={['dataMin', 'dataMax']} tickFormatter={(time) => dayjs(Number(time)).format('D MMM')} tick={{ fontSize: 11 }} minTickGap={24} />
                <YAxis domain={[low - pad, high + pad]} tick={{ fontSize: 11 }} tickFormatter={(value) => num(Number(value), limits.decimals)} allowDataOverflow />
                <Tooltip
                  labelFormatter={(time) => dayjs(Number(time)).format('D MMM YYYY, HH:mm')}
                  formatter={(value, _name, item) => [`${label(Number(value))}${item?.payload?.unit ? ` · ${item.payload.unit}` : ''}`, limits.name]}
                />
                <Line
                  type='monotone'
                  dataKey='value'
                  stroke={theme.palette.primary.main}
                  strokeWidth={2}
                  isAnimationActive={false}
                  dot={(props: any) => <circle key={`${props.cx}-${props.cy}`} cx={props.cx} cy={props.cy} r={4} fill={colour[props.payload.status as keyof typeof colour]} stroke={theme.palette.background.paper} strokeWidth={1} />}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>
          <Typography variant='caption' color='text.secondary' display='block' mt={0.5}>
            {t.legend}
            {limits.watch_min != null || limits.watch_max != null ? ` ${t.watch.replace('{range}', [label(limits.watch_min), label(limits.watch_max)].filter(Boolean).join(' – '))}` : ''}
            {limits.critical_min != null || limits.critical_max != null ? ` ${t.critical.replace('{range}', [label(limits.critical_min), label(limits.critical_max)].filter(Boolean).join(' – '))}` : ''}
          </Typography>
        </>
      )}
    </Box>
  );
};

export default MeasurementTrend;
