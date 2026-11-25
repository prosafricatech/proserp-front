'use client'

import React, { useEffect, useState } from 'react';
import { InfoOutlined, WarningAmberOutlined } from '@mui/icons-material';
import { Badge, Box, IconButton, Popover, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { animalText } from '../../animalText';
import { batchServices } from '../../bio-production-services';
import { fromGrams } from '../../weightUnit';

type Snapshot = { weight_now_g: number; feed_kg: number; gain_kg: number; fcr: number | null; growth: 'actual' | 'template'; overdue: boolean };
type Flag = { code: string; severity: 'warning' | 'info'; [key: string]: any };
type Check = { available: boolean; reason?: string; stage?: string | null; target_weight_g?: number | null; expected_weight_g?: number | null; before: Snapshot; after: Snapshot; flags: Flag[]; warnings: number };

const num = (value: number | null | undefined, digits = 1) => (value == null ? '—' : Number(value).toLocaleString(undefined, { maximumFractionDigits: digits }));

/** Waits for typing to settle before the value is used to ask the server. */
const useSettled = <T,>(value: T, ms = 500) => {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setSettled(value), ms);

    return () => clearTimeout(timer);
  }, [value, ms]);

  return settled;
};

/**
 * An information icon beside the weight on the weighing form. Click it to see, for the weight typed, what the batch's
 * feed projection for the next 30 days would be with and without it, and what is worth a second look: a weight past the
 * stage's target (the stage may need moving on), far from the plan, lower than the last weighing, no weight gain, an
 * FCR outside what a species does, and whether there is yet a second weighing to measure the real growth. The icon turns
 * to a warning when something needs a look. Nothing is saved by looking.
 */
const WeightCheckHint = ({ batchId, animalsLabel, weightUnit, weight, date, sampleSize, sampleId, lazy, warnings: known }: {
  batchId: number;
  animalsLabel?: string | null;
  weightUnit?: string | null;
  /** In grams. */
  weight: number | null;
  date: string;
  sampleSize?: number | null;
  /** A weighing already saved, to see what it did. */
  sampleId?: number | null;
  /** Asks the server only once the icon has been opened, for a long list of them. */
  lazy?: boolean;
  /** How many warnings the weighing is already known to carry, to mark the icon before it is opened. */
  warnings?: number;
}) => {
  const text = useDictionary().bioProduction.batches.dialogs.weight.check;
  const label = animalsLabel;
  const unit = weightUnit;
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [opened, setOpened] = useState(false);
  const grams = useSettled(weight && weight > 0 ? weight : null);
  const when = useSettled(date);
  const size = useSettled(sampleSize ?? null);

  const { data, isFetching } = useQuery<{ analysis: Check }>({
    queryKey: ['bioWeightCheck', batchId, grams, when, size, sampleId ?? null],
    queryFn: () => batchServices.weightCheck({ id: batchId, average_weight_g: grams, sample_date: when || undefined, sample_size: size || undefined, sample_id: sampleId || undefined }),
    enabled: !!grams && (!lazy || opened),
    retry: false,
    placeholderData: (previous) => previous,
  });
  const check = grams ? data?.analysis : undefined;
  const warnings = check?.available ? check.warnings : (known ?? 0);
  const g = (value: number | null | undefined) => (value == null ? '—' : `${num(fromGrams(value, unit), 3)} ${unit === 'kg' ? 'kg' : 'g'}`);

  const say = (flag: Flag) => animalText(text.flags[flag.code as keyof typeof text.flags] ?? flag.code, label)
    .replace('{stage}', check?.stage ?? '').replace('{weight}', g(flag.weight_g)).replace('{target}', g(flag.target_g)).replace('{expected}', g(flag.expected_g))
    .replace('{deviation}', num(Math.abs(flag.deviation_pct ?? 0), 0)).replace('{last}', g(flag.last_g)).replace('{date}', flag.last_date ?? '')
    .replace('{fcr}', num(flag.fcr, 2)).replace('{low}', num(flag.low, 1)).replace('{high}', num(flag.high, 1)).replace('{n}', num(flag.sample_size, 0))
    .replace('{min}', num(flag.minimum, 0)).replace('{days}', num(flag.days, 0)).replace('{from}', flag.from ?? '').replace('{window}', num(flag.window, 0))
    .replace('{before}', num(flag.before_kg, 0)).replace('{after}', num(flag.after_kg, 0));

  return (
    <>
      <IconButton size='small' color={warnings > 0 ? 'warning' : 'info'} aria-label={text.title} onClick={(event) => { setOpened(true); setAnchor(event.currentTarget); }}>
        <Badge color='warning' variant='dot' invisible={warnings === 0}>{warnings > 0 ? <WarningAmberOutlined fontSize='small' /> : <InfoOutlined fontSize='small' />}</Badge>
      </IconButton>
      <Popover open={!!anchor} anchorEl={anchor} onClose={() => setAnchor(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { maxWidth: 'min(420px, calc(100vw - 32px))', p: 2 } } }}>
        <Typography variant='subtitle2' mb={1}>{text.title}</Typography>
        {!grams && <Typography variant='body2' color='text.secondary'>{text.typeWeight}</Typography>}
        {grams && !check && <Typography variant='body2' color='text.secondary'>{isFetching ? text.checking : text.failed}</Typography>}
        {check && !check.available && <Typography variant='body2' color='text.secondary'>{text.unavailable}</Typography>}
        {check?.available && (
          <>
            <Table size='small' sx={{ mb: 1 }}>
              <TableHead>
                <TableRow><TableCell /><TableCell align='right'>{text.without}</TableCell><TableCell align='right'>{text.with}</TableCell></TableRow>
              </TableHead>
              <TableBody>
                <TableRow><TableCell>{text.weightNow}</TableCell><TableCell align='right'>{g(check.before.weight_now_g)}</TableCell><TableCell align='right'>{g(check.after.weight_now_g)}</TableCell></TableRow>
                <TableRow><TableCell>{text.feed}</TableCell><TableCell align='right'>{num(check.before.feed_kg, 0)} kg</TableCell><TableCell align='right'>{num(check.after.feed_kg, 0)} kg</TableCell></TableRow>
                <TableRow><TableCell>{text.gain}</TableCell><TableCell align='right'>{num(check.before.gain_kg, 0)} kg</TableCell><TableCell align='right'>{num(check.after.gain_kg, 0)} kg</TableCell></TableRow>
                <TableRow><TableCell>{text.fcr}</TableCell><TableCell align='right'>{num(check.before.fcr, 2)}</TableCell><TableCell align='right'>{num(check.after.fcr, 2)}</TableCell></TableRow>
                <TableRow><TableCell>{text.basis}</TableCell><TableCell align='right'>{text.growth[check.before.growth]}</TableCell><TableCell align='right'>{text.growth[check.after.growth]}</TableCell></TableRow>
              </TableBody>
            </Table>
            {check.stage && (
              <Typography variant='caption' color='text.secondary' display='block' mb={1}>
                {text.stageLine.replace('{stage}', check.stage).replace('{target}', g(check.target_weight_g)).replace('{expected}', g(check.expected_weight_g))}
              </Typography>
            )}
            <Stack spacing={1}>
              {[...check.flags].sort((a, b) => (a.severity === b.severity ? 0 : a.severity === 'warning' ? -1 : 1)).map((flag, index) => (
                <Box key={`${flag.code}-${index}`} display='flex' gap={1} alignItems='flex-start'>
                  {flag.severity === 'warning' ? <WarningAmberOutlined color='warning' sx={{ fontSize: 18, mt: '2px' }} /> : <InfoOutlined color='info' sx={{ fontSize: 18, mt: '2px' }} />}
                  <Typography variant='body2'>{say(flag)}</Typography>
                </Box>
              ))}
            </Stack>
          </>
        )}
      </Popover>
    </>
  );
};

export default WeightCheckHint;
