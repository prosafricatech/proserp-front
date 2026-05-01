'use client';
import { yupResolver } from '@hookform/resolvers/yup';
import { LoadingButton } from '@mui/lab';
import {
  Alert,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormLabel,
  Grid,
  IconButton,
  LinearProgress,
  MenuItem,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import * as yup from 'yup';

import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import useProsERPStyles from '@/app/helpers/style-helpers';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { Div, Span } from '@jumbo/shared';
import { HighlightOff } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import CostCenterSelector from '../../../masters/costCenters/CostCenterSelector';
import PDFContent from '../../../pdf/PDFContent';
import financialReportsServices from '../financial-reports-services';
import IncomeStatementOnScreen from './IncomeStatementOnScreen';
import IncomeStatementPDF from './IncomeStatementPDF';

function IncomeStatement({
  from,
  to,
  cost_center_ids,
  aggregate_by,
  setOpenIncomeStatementDialog,
}) {
  document.title = 'Income Statement';
  const css = useProsERPStyles();
  const [today] = useState(dayjs());
  const {
    authOrganization,
    authUser: { user },
  } = useJumboAuth();
  const [displayAs, setDisplayAs] = useState('on screen');
  const [reportData, setReportData] = useState(null);
  const [isExporting, setIsExporting] = useState(false);

  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const validationSchema = yup.object({
    from: yup
      .string()
      .required('Start Date is required')
      .typeError('Start Date is required'),
  });

  const { setValue, watch, handleSubmit, getValues } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      from: dayjs(from).startOf('day').toISOString(),
      to: dayjs(to).toISOString(),
      cost_center_ids: Array.isArray(cost_center_ids)
        ? cost_center_ids.map((id) => id)
        : 'all',
      aggregate_by: aggregate_by || null,
    },
  });

  const [isFetching, setisFetching] = useState(false);

  const retrieveReport = async (filters) => {
    setisFetching(true);
    const report = await financialReportsServices.incomeStatement(filters);

    setReportData(report);
    setisFetching(false);
  };

  // Check if all required parameters are present so to Fetch the report immediately
  useEffect(() => {
    if (from && to && cost_center_ids) {
      retrieveReport({
        from: from,
        to: to,
        cost_center_ids: Array.isArray(cost_center_ids)
          ? cost_center_ids.map((id) => id)
          : 'all',
        aggregate_by: aggregate_by ?? null,
      });
    }
  }, [from, to, cost_center_ids, aggregate_by]);

  const downloadFileName = `Income Statement ${readableDate(reportData?.filters?.from)}-${readableDate(reportData?.filters?.to)}`;

  const handlExcelExport = async () => {
    setIsExporting(true);
    const data = getValues();
    const report = await financialReportsServices.incomeStatement(data);
    if (
      !report ||
      (report.direct_expenses.length < 1 &&
        report.incomes.length < 1 &&
        report.indirect_expenses.length < 1)
    ) {
      setIsExporting(false);
      return;
    }

    setReportData(report);

    const exportedData = {
      reportData: report,
      authOrganization: authOrganization,
      user: user,
    };

    try {
      const blob =
        await financialReportsServices.exportIncomeStatementToExcel(
          exportedData
        );
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${downloadFileName}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error('an error occurred: ', e);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <DialogTitle textAlign={'center'}>
        <Grid container>
          <Grid size={{ xs: 12 }}>
            <Typography variant='h3'>Income Statement</Typography>
          </Grid>
          {belowLargeScreen && (
            <Tooltip title='Close'>
              <IconButton
                size='small'
                sx={{ position: 'absolute', top: 10, right: 10 }}
                onClick={() => setOpenIncomeStatementDialog(false)}
              >
                <HighlightOff color='primary' />
              </IconButton>
            </Tooltip>
          )}
        </Grid>
        <Span className={css.hiddenOnPrint}>
          <form autoComplete='off' onSubmit={handleSubmit(retrieveReport)}>
            <Grid
              container
              columnSpacing={1}
              rowSpacing={1}
              alignItems='center'
              justifyContent='center'
            >
              <Grid size={{ xs: 12, md: 5, lg: 5 }}>
                <CostCenterSelector
                  label='Cost and Profit Centers'
                  multiple={true}
                  allowSameType={true}
                  onChange={(cost_centers) => {
                    setValue(
                      'cost_center_ids',
                      cost_centers.map((cost_center) => cost_center.id)
                    );
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3.5, lg: 3.5 }}>
                <Div sx={{ mt: 1, mb: 1 }}>
                  <DateTimePicker
                    label='From (MM/DD/YYYY)'
                    minDate={dayjs(
                      authOrganization?.organization.recording_start_date
                    )}
                    defaultValue={from ? dayjs(from) : today.startOf('day')}
                    slotProps={{
                      textField: {
                        size: 'small',
                        fullWidth: true,
                      },
                    }}
                    onChange={(newValue) => {
                      setValue(
                        'from',
                        newValue ? newValue.toISOString() : null,
                        {
                          shouldValidate: true,
                          shouldDirty: true,
                        }
                      );
                    }}
                  />
                </Div>
              </Grid>
              <Grid size={{ xs: 12, md: 3.5, lg: 3.5 }}>
                <Div sx={{ mt: 1, mb: 1 }}>
                  <DateTimePicker
                    label='To (MM/DD/YYYY)'
                    defaultValue={to ? dayjs(to) : dayjs().endOf('day')}
                    minDate={dayjs(
                      authOrganization?.organization.recording_start_date
                    )}
                    slotProps={{
                      textField: {
                        size: 'small',
                        fullWidth: true,
                      },
                    }}
                    onChange={(newValue) => {
                      setValue('to', newValue ? newValue.toISOString() : null, {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                    }}
                  />
                </Div>
              </Grid>
              <Grid size={{ xs: 6, md: 3.5, lg: 3.5 }}>
                <Div sx={{ mt: 1, mb: 1, display: 'flex' }}>
                  <TextField
                    select
                    label='Aggregate By'
                    size='small'
                    fullWidth
                    value={watch('aggregate_by') ?? ''}
                    sx={{ width: { xs: '100%', md: 180 }, maxWidth: 180, position: 'relative' }}
                    InputProps={{
                      endAdornment:
                        watch('aggregate_by') ? (
                          <Tooltip title="Clear aggregate option">
                            <IconButton
                              size="small"
                              aria-label="clear aggregate by"
                              onClick={() => {
                                setValue('aggregate_by', '', {
                                  shouldValidate: true,
                                  shouldDirty: true,
                                });
                                const fromDate = watch('from');
                                const toDate = watch('to');
                                const selectedCostCenters = watch('cost_center_ids');
                                if (fromDate && toDate) {
                                  retrieveReport({
                                    from: fromDate,
                                    to: toDate,
                                    cost_center_ids: selectedCostCenters,
                                    aggregate_by: null,
                                  });
                                }
                              }}
                              edge="end"
                              sx={{
                                opacity: 0.5,
                                transition: 'opacity 0.2s',
                                ml: 0.5,
                                p: 0.5,
                                '&:hover': { opacity: 1, bgcolor: 'transparent' },
                                position: 'absolute',
                                right: 25,
                                top: '50%',
                                transform: 'translateY(-50%)',
                              }}
                            >
                              <HighlightOff fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        ) : null,
                    }}
                    onChange={(e) => {
                      const selectedAggregate = e.target.value;
                      const fromDate = watch('from');
                      const toDate = watch('to');
                      const selectedCostCenters = watch('cost_center_ids');

                      setValue('aggregate_by', selectedAggregate, {
                        shouldValidate: true,
                        shouldDirty: true,
                      });

                      if (fromDate && toDate) {
                        retrieveReport({
                          from: fromDate,
                          to: toDate,
                          cost_center_ids: selectedCostCenters,
                          aggregate_by:
                            selectedAggregate === '' ? null : selectedAggregate,
                        });
                      }
                    }}
                  >
                    <MenuItem value='day'>Day</MenuItem>
                    <MenuItem value='week'>Week</MenuItem>
                    <MenuItem value='month'>Month</MenuItem>
                    <MenuItem value='year'>Year</MenuItem>
                  </TextField>
                </Div>
              </Grid>
              <Grid size={{ xs: 6, md: 8.5, lg: 8.5 }} textAlign='right'>
                <Stack
                  direction='row'
                  spacing={0.5}
                  justifyContent='flex-end'
                  alignItems='center'
                >
                  <>
                    <LoadingButton
                      size='small'
                      onClick={() => handlExcelExport()}
                      loading={isExporting}
                      disabled={isExporting || isFetching}
                      variant='contained'
                      color='success'
                    >
                      Excel
                    </LoadingButton>
                    <LoadingButton
                      loading={isFetching}
                      disabled={isExporting}
                      type='submit'
                      size='small'
                      variant='contained'
                    >
                      Filter
                    </LoadingButton>
                  </>
                </Stack>
              </Grid>
              <Grid size={12}>
                <FormControl>
                  <FormLabel id='display_as_radiobuttons'>Display As</FormLabel>
                  <RadioGroup
                    row
                    aria-labelledby='display_as_radiobuttons'
                    name='row-radio-buttons-group'
                    value={displayAs}
                    onChange={(e) => setDisplayAs(e.target.value)}
                  >
                    <FormControlLabel
                      value='on screen'
                      control={<Radio />}
                      label='On Screen'
                    />
                    <FormControlLabel
                      value='pdf'
                      control={<Radio />}
                      label='PDF'
                    />
                  </RadioGroup>
                </FormControl>
              </Grid>
            </Grid>
          </form>
        </Span>
      </DialogTitle>
      <DialogContent>
        {isFetching ? (
          <LinearProgress />
        ) : reportData?.direct_expenses.length > 0 ||
          reportData?.incomes.length > 0 ||
          reportData?.indirect_expenses.length > 0 ? (
          displayAs === 'pdf' ? (
            <PDFContent
              document={
                <IncomeStatementPDF
                  reportData={reportData}
                  authOrganization={authOrganization}
                  user={user}
                />
              }
              fileName={downloadFileName}
            />
          ) : displayAs === 'on screen' ? (
            <IncomeStatementOnScreen reportData={reportData} />
          ) : (
            ''
          )
        ) : (
          <Alert variant='outlined' severity='info'>
            No data found for the selected filters
          </Alert>
        )}
      </DialogContent>
    </>
  );
}

export default IncomeStatement;
