'use client'

import { fromGrams, normalizeUnit } from '../weightUnit';
import WeightCheckHint from '../batches/dialogs/WeightCheckHint';
import React, { useState } from 'react';
import { HighlightOff } from '@mui/icons-material';
import { Box, Chip, DialogContent, DialogTitle, Grid, IconButton, LinearProgress, Stack, Tooltip, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { stamp } from '../dateTime';
import { useBioAccess } from '../useBioAccess';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { FileExportGrid } from '@/components/sharedComponents/FileExportGrid';
import PDFContent from '@/components/pdf/PDFContent';
import { roundServices } from '../bio-production-services';
import { statusColor } from '../measurementParameters/rangeText';
import LineTable, { LineColumn } from './LineTable';
import { RoundLine as RoundLineData, RoundRecord } from './roundTypes';
import { downloadRecordExcel } from './roundExport';
import RoundPdfDocument from './RoundPdfDocument';

const money = (value: number | string | null | undefined) =>
  value == null ? '—' : Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const num = (value: number | string | null | undefined, digits = 2) =>
  value == null ? '—' : Number(value).toLocaleString(undefined, { maximumFractionDigits: digits });

/** A saved record, read-only: its header and each line, laid out as the dialog it was entered in. */
const RoundView = ({ recordId, onClose }: { recordId: number; onClose: () => void }) => {
  const dictionary = useDictionary();
  const text = dictionary.bioProduction.rounds;
  const { data: record, isLoading } = useQuery<RoundRecord>({
    queryKey: ['bioDailyRecord', recordId],
    queryFn: () => roundServices.get(recordId),
  });

  const { authOrganization, authUser } = useJumboAuth();
  const { finance } = useBioAccess();
  const [showPdf, setShowPdf] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);

  if (isLoading || !record) return <LinearProgress />;

  const fact = (label: string, value?: React.ReactNode) =>
    value ? (
      <Grid size={{ xs: 6, md: 3 }}>
        <Typography variant='body2' color='text.secondary'>{label}</Typography>
        <Typography>{value}</Typography>
      </Grid>
    ) : null;

  const lines = record.lines ?? [];
  const kind = record.kind;
  const lead: LineColumn<RoundLineData>[] = [
    { label: text.labels.productionUnit, xs: 12, md: 3, render: (line) => line.unit?.name },
    { label: text.labels.batch, xs: 6, md: 2, render: (line) => line.batchNo },
    { label: text.labels.stage, xs: 6, md: 2, muted: true, render: (line) => line.stage?.name },
  ];
  const tail: Record<string, LineColumn<RoundLineData>[]> = {
    feeding: [
      { label: text.labels.quantity, xs: 6, md: 2.5, right: true, render: (line) => `${num(line.quantity, 5)} ${record.measurement_unit?.symbol ?? ''}` },
      ...(finance ? [{ label: text.labels.cost, xs: 6, md: 2.5, right: true, render: (line: RoundLineData) => money(line.cost) }] : []),
    ],
    harvest: [
      { label: text.labels.harvested, xs: 6, md: 2.5, right: true, render: (line) => num(line.quantity, 0) },
      { label: text.labels.received, xs: 6, md: 2.5, right: true, render: (line) => num(line.product_quantity, 5) },
    ],
    produce: [
      { label: text.labels.collected, xs: 6, md: 2.5, right: true, render: (line) => num(line.quantity, 5) },
      ...(finance ? [{ label: text.labels.cost, xs: 6, md: 2.5, right: true, render: (line: RoundLineData) => money(line.cost) }] : []),
    ],
    cost: [
      { label: text.labels.quantity, xs: 6, md: 2.5, right: true, render: (line) => (finance ? `${num(line.quantity, 5)} × ${money(line.rate)}` : num(line.quantity, 5)) },
      ...(finance ? [{ label: text.labels.amount, xs: 6, md: 2.5, right: true, render: (line: RoundLineData) => money(line.amount) }] : []),
    ],
    mortality: [
      { label: text.labels.died, xs: 6, md: 1.5, right: true, render: (line) => num(line.quantity, 0) },
      { label: text.labels.cause, xs: 12, md: 3.5, render: (line) => line.cause },
    ],
    weighing: [
      { label: text.labels.sampleSize, xs: 6, md: 2.5, right: true, render: (line) => num(line.sample_size, 0) },
      { label: text.labels.averageWeight, xs: 6, md: 2.5, right: true, render: (line) => (
        <>
          {`${num(fromGrams(Number(line.average_weight_g), line.weight_unit), 4)} ${normalizeUnit(line.weight_unit)}`}
          {line.batch_open && line.sample_id && (
            <WeightCheckHint lazy batchId={line.batch_id} animalsLabel={line.count_label} weightUnit={line.weight_unit} weight={Number(line.average_weight_g)} date={String(line.sample_date)} sampleSize={line.sample_size} sampleId={line.sample_id} warnings={line.warnings} />
          )}
        </>
      ) },
    ],
  };
  const measurementColumns: LineColumn<RoundLineData>[] = [
    { label: text.labels.productionUnit, xs: 12, md: 4, render: (line) => line.unit?.name },
    { label: text.labels.parameter, xs: 6, md: 3, render: (line) => line.parameter?.name },
    { label: text.labels.value, xs: 6, md: 3, right: true, render: (line) => `${num(line.value, line.parameter?.decimals ?? 2)} ${line.parameter?.unit_label ?? ''}` },
    { label: text.labels.reading, xs: 12, md: 2, render: (line) => <Chip size='small' variant='outlined' color={statusColor(line.status ?? 'ok')} label={dictionary.bioProduction.measurementParameters.status[line.status ?? 'ok']} /> },
  ];
  const viewColumns = kind === 'measurement' ? measurementColumns : [...lead, ...tail[kind]];

  const readingUnits = new Set((record.lines ?? []).map((line) => line.unit?.id)).size;
  const total = record.kind === 'measurement'
    ? text.messages.readingsSummary.replace('{readings}', String(record.lines_count)).replace('{units}', String(readingUnits))
    : (record.kind === 'weighing' || (record.kind === 'cost' && !finance) ? text.messages.total : text.messages.totalQuantity)
    .replace('{count}', String(record.lines_count))
    .replace('{quantity}', `${record.kind === 'cost' ? money(record.total_quantity) : num(record.total_quantity, 5)}${record.measurement_unit?.symbol ? ` ${record.measurement_unit.symbol}` : ''}`);
  const inputTypes = dictionary.bioProduction.batches.inputTypes;

  return (
    <>
      <DialogTitle textAlign='center'>{text.messages.viewTitle.replace('{recordNo}', record.recordNo)}</DialogTitle>
      <DialogContent sx={{ pt: '10px !important' }}>
        <Stack direction='row' justifyContent='flex-end' alignItems='center' spacing={1} mb={2}>
          <FileExportGrid
            exportExcel
            exportPdf
            exportingExcel={exportingExcel}
            handlExcelExport={async () => {
              setExportingExcel(true);
              try {
                await downloadRecordExcel(record, text, inputTypes);
              } finally {
                setExportingExcel(false);
              }
            }}
            handlePdf={() => setShowPdf((open) => !open)}
          />
          <Tooltip title={dictionary.tooltips.close}>
            <IconButton size='small' onClick={onClose}>
              <HighlightOff color='primary' />
            </IconButton>
          </Tooltip>
        </Stack>
        {showPdf ? (
          <PDFContent
            fileName={record.recordNo.replace('/', '-')}
            document={<RoundPdfDocument record={record} text={text} inputTypes={inputTypes} authOrganization={authOrganization} user={authUser?.user} total={total} />}
          />
        ) : (
        <>
        <Grid container spacing={2} mb={2}>
          {fact(text.labels.farm, record.farm?.name)}
          {fact(text.labels.dateTime, stamp(record.record_date))}
          {fact(text.labels.type, record.input_type ? dictionary.bioProduction.batches.inputTypes[record.input_type] : undefined)}
          {fact(text.labels.reason, record.reason)}
          {fact(text.labels.store, record.store?.name)}
          {fact(text.labels.product, record.product?.name)}
          {fact(text.labels.unit, record.measurement_unit?.symbol ?? record.measurement_unit?.name)}
          {fact(text.labels.causeAll, record.cause)}
          {fact(text.labels.ledger, record.ledger?.name)}
          {finance && fact(text.labels.rate, record.rate != null ? money(record.rate) : undefined)}
          {fact(text.labels.payment, record.payment?.voucherNo)}
          {fact(text.labels.creator, record.creator?.name)}
        </Grid>

        <LineTable<RoundLineData> columns={viewColumns} rows={lines} rowKey={(_, index) => index} py={0.75} />
        <Stack direction='row' justifyContent='flex-end' mt={1.5}>
          <Box>
            <Typography variant='h5' mb={0}>
              {total}
            </Typography>
          </Box>
        </Stack>
        </>
        )}
      </DialogContent>
    </>
  );
};

export default RoundView;
