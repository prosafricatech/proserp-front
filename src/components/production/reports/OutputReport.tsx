'use client';

import { FC, Fragment, JSX, ReactNode, useState } from 'react';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import PDFContent from '@/components/pdf/PDFContent';
import { OutputReportResponse } from './productionReportsServices';
import { faFileExcel } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Remove, VisibilityOutlined } from '@mui/icons-material';
import AddIcon from '@mui/icons-material/Add';
import { LoadingButton } from '@mui/lab';
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
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import ProductionOutputReportPdf from './ProductionOutputReportPdf';

const formatCurrency = (value: number | string): string =>
  Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatQuantity = (value: number | string): string =>
  Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });

const formatUnitCost = (value: number | string): string =>
  Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });

interface SummaryCardProps {
  label: string;
  value: string | number;
  accentColor: string;
}

interface OutputReportDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  document: ReactNode;
}

interface OutputReportProps {
  report: OutputReportResponse | null;
  isLoading: boolean;
  error: string;
  headerColor: string;
  contrastText: string;
  lightColor: string;
  isDark: boolean;
}

function SummaryCard({ label, value, accentColor }: SummaryCardProps): JSX.Element {
  return (
    <Card variant='outlined' sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant='body2' color='text.secondary' gutterBottom>
          {label}
        </Typography>
        <Typography variant='h5' sx={{ color: accentColor, fontWeight: 700 }}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}

function OutputReportDialog({
  open,
  setOpen,
  document,
}: OutputReportDialogProps): JSX.Element {
  return (
    <Dialog maxWidth='md' fullWidth open={open}>
      <DialogTitle>
        <Typography variant='body2'>Product Output Report</Typography>
      </DialogTitle>
      <DialogContent>{document}</DialogContent>
      <DialogActions>
        <LoadingButton
          size='small'
          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
          color='success'
          variant='contained'
        >
          <FontAwesomeIcon icon={faFileExcel} color='green' /> Excel
        </LoadingButton>
        <Button size='small' variant='outlined' onClick={() => setOpen(false)}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

const OutputReport: FC<OutputReportProps> = ({
  report,
  isLoading,
  error,
  headerColor,
  contrastText,
  lightColor,
  isDark,
}): JSX.Element => {
  const { authOrganization, authUser } = useJumboAuth();
  const user = authUser?.user;

  const [expandedBatches, setExpandedBatches] = useState<Record<string, boolean>>({});
  const [expanded, setExpanded] = useState<boolean>(false);
  const [openOutput, setOpenOutput] = useState<boolean>(false);

  const toggleBatch = (batchId: string): void => {
    setExpandedBatches((state) => ({
      ...state,
      [batchId]: !state[batchId],
    }));
  };

  if (isLoading) {
    return (
      <Box sx={{ py: 6 }}>
        <Typography align='center'>Loading output report...</Typography>
      </Box>
    );
  }

  if (error) {
    return <Alert severity='error'>{error}</Alert>;
  }

  if (!report || !report.batches?.length) {
    return <></>;
  }

  return (
    <>
      <Stack spacing={3}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent='space-between'
          alignItems={{ xs: 'flex-start', md: 'center' }}
          spacing={2}
        >
          <Box>
            <Typography variant='h6' sx={{ color: headerColor, fontWeight: 700 }}>
              Production Output Report
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              {readableDate(report.period?.from, true)} - {readableDate(report.period?.to, true)}
            </Typography>
          </Box>
          <Stack direction='row' spacing={1}>
            <Tooltip title='Preview'>
              <IconButton size='small' onClick={() => setOpenOutput(true)}>
                <VisibilityOutlined />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}>
            <SummaryCard
              label='Total Batches'
              value={report.summary?.total_batches ?? 0}
              accentColor={headerColor}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <SummaryCard
              label='Total Output Value'
              value={formatCurrency(report.summary?.total_output_value)}
              accentColor={headerColor}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <SummaryCard
              label='By-Product Value'
              value={formatCurrency(report.summary?.total_by_product_value)}
              accentColor={headerColor}
            />
          </Grid>
        </Grid>

        <Accordion
          defaultExpanded={false}
          expanded={expanded}
          onChange={() => setExpanded((prev) => !prev)}
          square
          sx={{
            borderRadius: 2,
            borderTop: 2,
            borderColor: 'divider',
            '&:hover': {
              bgcolor: 'action.hover',
            },
          }}
        >
          <AccordionSummary
            expandIcon={expanded ? <Remove /> : <AddIcon />}
            sx={{
              px: 2,
              flexDirection: 'row-reverse',
              '.MuiAccordionSummary-content': {
                alignItems: 'center',
                '&.Mui-expanded': {
                  margin: '10px 0',
                },
              },
              '.MuiAccordionSummary-expandIconWrapper': {
                borderRadius: 1,
                border: 1,
                color: 'text.secondary',
                transform: 'none',
                mr: 0.5,
                '&.Mui-expanded': {
                  transform: 'none',
                  color: 'primary.main',
                  borderColor: 'primary.main',
                },
                '& svg': {
                  fontSize: '0.9rem',
                },
              },
            }}
          >
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={2}
              sx={{ width: '100%', pr: 1, ml: 2 }}
              justifyContent='space-between'
            >
              <Typography fontWeight={700}>Product Summary</Typography>
              <Chip label={`${report.summary?.products?.length || 0} products`} size='small' />
            </Stack>
          </AccordionSummary>
          <AccordionDetails>
            <TableContainer component={Paper} variant='outlined'>
              <Table size='small'>
                <TableHead>
                  <TableRow sx={{ backgroundColor: headerColor }}>
                    <TableCell sx={{ color: contrastText, fontWeight: 700 }}>Finished Product</TableCell>
                    <TableCell sx={{ color: contrastText, fontWeight: 700 }}>Unit</TableCell>
                    <TableCell align='right' sx={{ color: contrastText, fontWeight: 700 }}>
                      Qty Produced
                    </TableCell>
                    <TableCell align='right' sx={{ color: contrastText, fontWeight: 700 }}>
                      Avg Unit Cost
                    </TableCell>
                    <TableCell align='right' sx={{ color: contrastText, fontWeight: 700 }}>
                      Total Value
                    </TableCell>
                    <TableCell align='right' sx={{ color: contrastText, fontWeight: 700 }}>
                      Batches
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(report.summary?.products || []).map((item, index) => (
                    <TableRow
                      key={`${item.product?.id || index}-${index}`}
                      sx={{
                        backgroundColor: index % 2 === 1 ? (isDark ? '#333' : lightColor) : 'inherit',
                      }}
                    >
                      <TableCell>{item.product?.name}</TableCell>
                      <TableCell>{item.measurement_unit?.symbol || item.measurement_unit?.name}</TableCell>
                      <TableCell align='right'>{formatQuantity(item.total_quantity)}</TableCell>
                      <TableCell align='right'>{formatUnitCost(item.average_unit_cost)}</TableCell>
                      <TableCell align='right'>{formatCurrency(item.total_value)}</TableCell>
                      <TableCell align='right'>{item.batch_count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </AccordionDetails>
        </Accordion>

        {report.batches.map((batch) => {
          const isExpanded = !!expandedBatches[batch.id];

          return (
            <Fragment key={batch.id}>
              <Accordion
                defaultExpanded={false}
                expanded={isExpanded}
                onChange={() => toggleBatch(batch.id)}
                square
                sx={{
                  borderRadius: 2,
                  borderTop: 2,
                  borderColor: 'divider',
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                }}
              >
                <AccordionSummary
                  expandIcon={isExpanded ? <Remove /> : <AddIcon />}
                  sx={{
                    px: 2,
                    boxShadow: 2,
                    flexDirection: 'row-reverse',
                    '.MuiAccordionSummary-content': {
                      alignItems: 'center',
                      '&.Mui-expanded': {
                        margin: '10px 0',
                      },
                    },
                    '.MuiAccordionSummary-expandIconWrapper': {
                      borderRadius: 1,
                      border: 1,
                      color: 'text.secondary',
                      transform: 'none',
                      mr: 0.5,
                      '&.Mui-expanded': {
                        transform: 'none',
                        color: 'primary.main',
                        borderColor: 'primary.main',
                      },
                      '& svg': {
                        fontSize: '0.9rem',
                      },
                    },
                  }}
                >
                  <Grid container size={12} width='100%' ml={2} alignItems='center'>
                    <Grid size={2}>{batch.batchNo}</Grid>
                    <Grid size={2}>{readableDate(batch.start_date, true)}</Grid>
                    <Grid size={2}>{readableDate(batch.end_date, true)}</Grid>
                    <Grid size={2}>
                      <Stack spacing={0.5}>
                        <Typography variant='body2'>{batch.work_center?.name}</Typography>
                        <Typography variant='caption' color='text.secondary'>
                          {batch.work_center?.cost_center?.name}
                        </Typography>
                      </Stack>
                    </Grid>
                    <Grid size={2}>{formatCurrency(batch.total_output_value)}</Grid>
                    <Grid size={2}>{formatCurrency(batch.total_by_product_value)}</Grid>
                  </Grid>
                </AccordionSummary>
                <AccordionDetails>
                  <Table sx={{ width: '100%' }}>
                    <TableBody>
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          sx={{
                            py: 0,
                            borderBottom: isExpanded ? undefined : 0,
                          }}
                        >
                          <Collapse in={isExpanded} timeout='auto' unmountOnExit>
                            <Stack spacing={3} sx={{ py: 2 }}>
                              <Box>
                                <Typography
                                  variant='subtitle1'
                                  sx={{
                                    color: headerColor,
                                    fontWeight: 700,
                                    mb: 1,
                                  }}
                                >
                                  Outputs
                                </Typography>
                                <TableContainer component={Paper} variant='outlined'>
                                  <Table size='small'>
                                    <TableHead>
                                      <TableRow>
                                        <TableCell>Product</TableCell>
                                        <TableCell>Unit</TableCell>
                                        <TableCell align='right'>Qty</TableCell>
                                        <TableCell align='right'>Unit Cost</TableCell>
                                        <TableCell align='right'>Total Value</TableCell>
                                        <TableCell align='right'>Value %</TableCell>
                                      </TableRow>
                                    </TableHead>
                                    <TableBody>
                                      {(batch.outputs || []).map((output) => (
                                        <TableRow key={output.id}>
                                          <TableCell>{output.product?.name}</TableCell>
                                          <TableCell>{output.measurement_unit?.symbol}</TableCell>
                                          <TableCell align='right'>{formatQuantity(output.quantity)}</TableCell>
                                          <TableCell align='right'>{formatUnitCost(output.unit_cost)}</TableCell>
                                          <TableCell align='right'>{formatCurrency(output.total_value)}</TableCell>
                                          <TableCell align='right'>
                                            {formatQuantity(output.value_percentage)}
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </TableContainer>
                              </Box>

                              <Box>
                                <Typography
                                  variant='subtitle1'
                                  sx={{
                                    color: headerColor,
                                    fontWeight: 700,
                                    mb: 1,
                                  }}
                                >
                                  By-Products
                                </Typography>
                                {(batch.by_products || []).length ? (
                                  <TableContainer component={Paper} variant='outlined'>
                                    <Table size='small'>
                                      <TableHead>
                                        <TableRow>
                                          <TableCell>Product</TableCell>
                                          <TableCell>Unit</TableCell>
                                          <TableCell align='right'>Qty</TableCell>
                                          <TableCell align='right'>Market Value / Unit</TableCell>
                                          <TableCell align='right'>Total Market Value</TableCell>
                                        </TableRow>
                                      </TableHead>
                                      <TableBody>
                                        {(batch.by_products || []).map((byProduct) => (
                                          <TableRow key={byProduct.id}>
                                            <TableCell>{byProduct.product?.name}</TableCell>
                                            <TableCell>{byProduct.measurement_unit?.symbol}</TableCell>
                                            <TableCell align='right'>
                                              {formatQuantity(byProduct.quantity)}
                                            </TableCell>
                                            <TableCell align='right'>
                                              {formatCurrency(byProduct.market_value_per_unit)}
                                            </TableCell>
                                            <TableCell align='right'>
                                              {formatCurrency(byProduct.total_market_value)}
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </TableContainer>
                                ) : (
                                  <Alert variant='outlined' severity='info'>
                                    No by-products recorded for this batch.
                                  </Alert>
                                )}
                              </Box>
                            </Stack>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </AccordionDetails>
              </Accordion>
            </Fragment>
          );
        })}
      </Stack>

      <OutputReportDialog
        open={openOutput}
        setOpen={setOpenOutput}
        document={
          <PDFContent
            document={
              <ProductionOutputReportPdf
                reportData={report}
                organization={authOrganization}
                user={user}
              />
            }
            fileName='productio-output-report'
          />
        }
      />
    </>
  );
};

export default OutputReport;
