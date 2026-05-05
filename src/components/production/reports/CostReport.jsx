'use client';

import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import {
  ExpandMore,
  FileDownloadOutlined,
  PictureAsPdfOutlined,
} from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';

const formatCurrency = (value) =>
  Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatQuantity = (value) =>
  Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });

const formatUnitCost = (value) =>
  Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });

function SummaryCard({ label, value, accentColor, valueColor }) {
  return (
    <Card variant='outlined' sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant='body2' color='text.secondary' gutterBottom>
          {label}
        </Typography>
        <Typography
          variant='h5'
          sx={{ color: valueColor || accentColor, fontWeight: 700 }}
        >
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}

function StackedCostBar({ summary }) {
  const material = Number(summary?.total_material_cost || 0);
  const expense = Number(summary?.total_ledger_expense_cost || 0);
  const offset = Number(summary?.total_by_product_offset || 0);
  const total = material + expense + offset;

  const materialWidth = total ? (material / total) * 100 : 0;
  const expenseWidth = total ? (expense / total) * 100 : 0;
  const offsetWidth = total ? (offset / total) * 100 : 0;

  return (
    <Stack spacing={1.5}>
      <Box
        sx={{
          display: 'flex',
          overflow: 'hidden',
          height: 18,
          borderRadius: 999,
          bgcolor: 'divider',
        }}
      >
        <Box sx={{ width: `${materialWidth}%`, bgcolor: 'primary.main' }} />
        <Box sx={{ width: `${expenseWidth}%`, bgcolor: 'warning.main' }} />
        <Box sx={{ width: `${offsetWidth}%`, bgcolor: 'success.main' }} />
      </Box>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
        <Chip
          size='small'
          label={`Materials ${formatCurrency(material)}`}
          color='primary'
          variant='outlined'
        />
        <Chip
          size='small'
          label={`Expenses ${formatCurrency(expense)}`}
          color='warning'
          variant='outlined'
        />
        <Chip
          size='small'
          label={`By-Product Offset ${formatCurrency(offset)}`}
          color='success'
          variant='outlined'
        />
      </Stack>
    </Stack>
  );
}

function CostReport({
  report,
  isLoading,
  error,
  headerColor,
  comparisonOutputValue,
}) {
  if (isLoading) {
    return (
      <Box sx={{ py: 6 }}>
        <Typography align='center'>Loading cost report...</Typography>
      </Box>
    );
  }

  if (error) {
    // return <Alert severity="error">{error}</Alert>;
    return;
  }

  if (!report) {
    // return <Alert severity="info">Choose filters and generate the report.</Alert>;
    return;
  }

  if (!report?.summary?.total_batches) {
    return (
      <Alert severity='info'>No closed batches found for this period.</Alert>
    );
  }

  const difference =
    Number(comparisonOutputValue || 0) -
    Number(report.summary?.net_production_cost || 0);
  const matchesOutput = Math.abs(difference) < 0.01;

  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent='space-between'
        alignItems={{ xs: 'flex-start', md: 'center' }}
        spacing={2}
      >
        <Box>
          <Typography variant='h6' sx={{ color: headerColor, fontWeight: 700 }}>
            Production Cost Report
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            {readableDate(report?.period?.from, true)} -{' '}
            {readableDate(report?.period?.to, true)}
          </Typography>
        </Box>
        <Stack direction='row' spacing={1}>
          <Button
            size='small'
            variant='outlined'
            startIcon={<FileDownloadOutlined />}
            disabled
          >
            Export Excel
          </Button>
          <Button
            size='small'
            variant='outlined'
            startIcon={<PictureAsPdfOutlined />}
            disabled
          >
            Export PDF
          </Button>
        </Stack>
      </Stack>

      {/* <Alert severity={matchesOutput ? 'success' : 'warning'}>
        Net production cost {matchesOutput ? 'matches' : 'does not match'}{' '}
        output value.
        {!matchesOutput ? ` Difference: ${formatCurrency(difference)}.` : ''}
      </Alert> */}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 3 }}>
          <SummaryCard
            label='Total Material Cost'
            value={formatCurrency(report.summary?.total_material_cost)}
            accentColor={headerColor}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <SummaryCard
            label='Total Expense Cost'
            value={formatCurrency(report.summary?.total_ledger_expense_cost)}
            accentColor={headerColor}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <SummaryCard
            label='By-Product Offset'
            value={formatCurrency(report.summary?.total_by_product_offset)}
            accentColor={headerColor}
            valueColor='success.main'
          />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <SummaryCard
            label='Net Production Cost'
            value={formatCurrency(report.summary?.net_production_cost)}
            accentColor={headerColor}
            valueColor={headerColor}
          />
        </Grid>
      </Grid>

      <Card variant='outlined'>
        <CardContent>
          <Typography
            variant='subtitle1'
            sx={{ color: headerColor, fontWeight: 700, mb: 2 }}
          >
            Cost Breakdown
          </Typography>
          <StackedCostBar summary={report.summary} />
        </CardContent>
      </Card>

      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            sx={{ width: '100%', pr: 1 }}
            justifyContent='space-between'
          >
            <Typography fontWeight={700}>Material Consumptions</Typography>
            <Chip
              label={`${report.material_consumptions?.length || 0} products`}
              size='small'
            />
          </Stack>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={2}>
            {(report.material_consumptions || []).map((item, index) => (
              <Accordion
                key={`${item.product?.id || index}-${index}`}
                disableGutters
                variant='outlined'
              >
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Grid container spacing={2} sx={{ width: '100%', pr: 1 }}>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Typography fontWeight={600}>
                        {item.product?.name}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6, md: 2 }}>
                      <Typography>{item.measurement_unit?.symbol}</Typography>
                    </Grid>
                    <Grid size={{ xs: 6, md: 2 }}>
                      <Typography align='right'>
                        {formatQuantity(item.total_quantity)}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6, md: 2 }}>
                      <Typography align='right'>
                        {formatUnitCost(item.average_unit_cost)}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6, md: 2 }}>
                      <Typography align='right'>
                        {formatCurrency(item.total_cost)}
                      </Typography>
                    </Grid>
                  </Grid>
                </AccordionSummary>
                <AccordionDetails>
                  <TableContainer component={Paper} variant='outlined'>
                    <Table size='small'>
                      <TableHead>
                        <TableRow>
                          <TableCell>Batch #</TableCell>
                          <TableCell>Date</TableCell>
                          <TableCell align='right'>Qty</TableCell>
                          <TableCell align='right'>Unit Cost</TableCell>
                          <TableCell align='right'>Total</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(item.batches || []).map((batch) => (
                          <TableRow
                            key={`${item.product?.id}-${batch.batch_id}`}
                          >
                            <TableCell>{batch.batchNo}</TableCell>
                            <TableCell>
                              {readableDate(batch.end_date, true)}
                            </TableCell>
                            <TableCell align='right'>
                              {formatQuantity(batch.quantity)}
                            </TableCell>
                            <TableCell align='right'>
                              {formatUnitCost(batch.unit_cost)}
                            </TableCell>
                            <TableCell align='right'>
                              {formatCurrency(batch.total_cost)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </AccordionDetails>
              </Accordion>
            ))}
          </Stack>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            sx={{ width: '100%', pr: 1 }}
            justifyContent='space-between'
          >
            <Typography fontWeight={700}>Ledger Expenses</Typography>
            <Chip
              label={`${report.ledger_expenses?.length || 0} ledgers`}
              size='small'
            />
          </Stack>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={2}>
            {(report.ledger_expenses || []).map((item, index) => (
              <Accordion
                key={`${item.ledger?.id || index}-${index}`}
                disableGutters
                variant='outlined'
              >
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Grid container spacing={2} sx={{ width: '100%', pr: 1 }}>
                    <Grid size={{ xs: 12, md: 5 }}>
                      <Typography fontWeight={600}>
                        {item.ledger?.name}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6, md: 3 }}>
                      <Typography>{item.currency?.name}</Typography>
                    </Grid>
                    <Grid size={{ xs: 6, md: 4 }}>
                      <Typography align='right'>
                        {formatCurrency(item.total_amount)}
                      </Typography>
                    </Grid>
                  </Grid>
                </AccordionSummary>
                <AccordionDetails>
                  <TableContainer component={Paper} variant='outlined'>
                    <Table size='small'>
                      <TableHead>
                        <TableRow>
                          <TableCell>Batch #</TableCell>
                          <TableCell>Date</TableCell>
                          <TableCell align='right'>Qty</TableCell>
                          <TableCell align='right'>Rate</TableCell>
                          <TableCell align='right'>Exchange Rate</TableCell>
                          <TableCell align='right'>Total</TableCell>
                          <TableCell>Remarks</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(item.batches || []).map((batch) => (
                          <TableRow
                            key={`${item.ledger?.id}-${batch.batch_id}-${batch.remarks || ''}`}
                          >
                            <TableCell>{batch.batchNo}</TableCell>
                            <TableCell>
                              {readableDate(batch.end_date, true)}
                            </TableCell>
                            <TableCell align='right'>
                              {formatQuantity(batch.quantity)}
                            </TableCell>
                            <TableCell align='right'>
                              {formatCurrency(batch.rate)}
                            </TableCell>
                            <TableCell align='right'>
                              {formatUnitCost(batch.exchange_rate)}
                            </TableCell>
                            <TableCell align='right'>
                              {formatCurrency(batch.total)}
                            </TableCell>
                            <TableCell>{batch.remarks}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </AccordionDetails>
              </Accordion>
            ))}
          </Stack>
        </AccordionDetails>
      </Accordion>

      <Card variant='outlined'>
        <CardContent>
          <Typography
            variant='subtitle1'
            sx={{ color: headerColor, fontWeight: 700, mb: 2 }}
          >
            By-Products Offset
          </Typography>
          <TableContainer component={Paper} variant='outlined'>
            <Table size='small'>
              <TableHead>
                <TableRow>
                  <TableCell>Product</TableCell>
                  <TableCell>Unit</TableCell>
                  <TableCell align='right'>Total Qty</TableCell>
                  <TableCell align='right'>Cost Reduction</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(report.by_products || []).map((item, index) => (
                  <TableRow key={`${item.product?.id || index}-${index}`}>
                    <TableCell>{item.product?.name}</TableCell>
                    <TableCell>{item.measurement_unit?.symbol}</TableCell>
                    <TableCell align='right'>
                      {formatQuantity(item.total_quantity)}
                    </TableCell>
                    <TableCell align='right'>
                      {formatCurrency(item.total_market_value)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Stack>
  );
}

export default CostReport;
