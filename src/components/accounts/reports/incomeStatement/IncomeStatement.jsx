import React, { useEffect, useState } from 'react';
import { Document, Page, Text, View} from '@react-pdf/renderer';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import dayjs from 'dayjs';
import { DateTimePicker } from '@mui/x-date-pickers';
import {
  DialogTitle,
  DialogContent,
  Grid,
  LinearProgress,
  Typography,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Stack,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';

import financialReportsServices from '../financial-reports-services';
import CostCenterSelector from '../../../masters/costCenters/CostCenterSelector';
import pdfStyles from '../../../pdf/pdf-styles';
import { useForm } from 'react-hook-form';
import PdfLogo from '../../../pdf/PdfLogo';
import PDFContent from '../../../pdf/PDFContent';
import IncomeStatementOnScreen from './IncomeStatementOnScreen';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import useProsERPStyles from '@/app/helpers/style-helpers';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { Div, Span } from '@jumbo/shared';
import { useSnackbar } from 'notistack';

const ReportDocumet = ({reportData,authOrganization,user}) => {
  const mainColor = authOrganization.organization.settings?.main_color || "#2113AD";
  const totalRevenue = reportData ? reportData.incomes.reduce((total, income) => total + income.amount, 0) : 0;
  const costOfRevenue = reportData ? reportData.directExpenses.reduce((total, expense) => total + expense.amount, 0) : 0;
  const operationalExpenseTotal = reportData ? reportData.indirectExpenses.reduce((total, expense) => total + expense.amount, 0) : 0;
  const reportPeriod = `${readableDate(reportData.filters.from,true)} - ${readableDate(reportData.filters.to,true)}`;
  const costCenters = reportData.filters.cost_centers;
  const organization = authOrganization.organization;
  
  return reportData ?
  (
    <Document 
      creator={` ${user.name} | Powered By ProsERP` }
      producer='ProsERP'
      title={`Income Statement ${reportPeriod}`}
    >
      <Page size="A4" style={pdfStyles.page}>
        <View style={pdfStyles.table}>
          <View style={{ ...pdfStyles.tableRow, marginBottom: 20 }}>
              <View style={{ flex: 1, maxWidth: (organization?.logo_path ? 130 : 250)}}>
                  <PdfLogo organization={organization}/>
              </View>
              <View style={{ flex: 1, textAlign: 'right' }}>
                  <Text style={{...pdfStyles.majorInfo, color: mainColor }}>{`Income Statement`}</Text>
                  <Text style={{ ...pdfStyles.minInfo }}>{reportPeriod}</Text>
              </View>
          </View>
        </View>
        <View style={{ ...pdfStyles.tableRow, marginTop: 10, marginBottom: 10}}>
            {
                costCenters.length !== 0 &&
                <View style={{ flex: 2, padding: 2}}>
                    <Text style={{...pdfStyles.minInfo, color: mainColor }}>Cost Centers</Text>
                    <Text style={{...pdfStyles.minInfo }}>{costCenters.map((cost_centers) => cost_centers.name).join(', ')}</Text>
                </View>
            }
            <View style={{ flex: 1, padding: 2}}>
                <Text style={{...pdfStyles.minInfo, color: mainColor }}>Printed By</Text>
                <Text style={{...pdfStyles.minInfo }}>{user.name}</Text>
            </View>
            <View style={{ flex: 1, padding: 2}}>
                <Text style={{...pdfStyles.minInfo, color: mainColor }}>Printed On</Text>
                <Text style={{...pdfStyles.minInfo }}>{readableDate(undefined,true)}</Text>
            </View>
        </View>
        <View style={pdfStyles.table}>
            <View style={pdfStyles.tableRow}>
              <View style={{...pdfStyles.tableHeader, flex : 1}}>
                  <Text style={pdfStyles.tableCellText}>Revenue</Text>
              </View>
            </View>
            {
              reportData.incomes.map((income, index) => (
                income.amount !== 0 &&
                <View  key={index} style={pdfStyles.tableRow}>
                  <View style={{...pdfStyles.tableCell, flex : 2}}>
                      <Text style={{ ...pdfStyles.tableCellText,marginLeft: 10 }}>{income.ledger_name}</Text>
                  </View>
                  <View style={{...pdfStyles.tableCell, flex:1,textAlign : 'right' }}>
                    <Text style={pdfStyles.tableCellText}>{income.amount.toLocaleString('en-US',{maximumFractionDigits:2,minimumFractionDigits:2})}</Text>
                  </View>
                </View>
              ))
            }
            <View style={pdfStyles.tableRow}> 
              <View style={{...pdfStyles.tableHeader, marginLeft: 5, backgroundColor: pdfStyles.shadedBG, flex : 2}}>
                  <Text style={pdfStyles.tableCellText}>Total Revenue</Text>
              </View>
              <View style={{...pdfStyles.tableHeader, backgroundColor: pdfStyles.shadedBG, flex:1,textAlign : 'right' }}>
                <Text style={pdfStyles.tableCellText}>{totalRevenue.toLocaleString('en-US',{maximumFractionDigits:2,minimumFractionDigits:2})}</Text>
              </View>
            </View>


            <View style={{ ...pdfStyles.tableRow,marginLeft: 10 }}>
              <View style={{...pdfStyles.tableHeader, flex : 1}}>
                  <Text style={pdfStyles.tableCellText}>Cost of Revenue</Text>
              </View>
            </View>
            {
              reportData.directExpenses.map((expense, index) => (
                expense.amount !== 0 &&
                <View  key={index} style={pdfStyles.tableRow}>
                  <View style={{...pdfStyles.tableCell, flex : 2}}>
                      <Text style={{ ...pdfStyles.tableCellText,marginLeft: 15 }}>{expense.ledger_name}</Text>
                  </View>
                  <View style={{...pdfStyles.tableCell, flex:1,textAlign : 'right' }}>
                    <Text style={pdfStyles.tableCellText}>{expense.amount.toLocaleString('en-US',{maximumFractionDigits:2,minimumFractionDigits:2})}</Text>
                  </View>
                </View>
              ))
            }
            <View style={pdfStyles.tableRow}> 
              <View style={{...pdfStyles.tableHeader, marginLeft: 5, backgroundColor: pdfStyles.shadedBG, flex : 2}}>
                  <Text style={pdfStyles.tableCellText}>Total Cost Of Revenue</Text>
              </View>
              <View style={{...pdfStyles.tableHeader, backgroundColor: pdfStyles.shadedBG, flex:1,textAlign : 'right' }}>
                <Text style={pdfStyles.tableCellText}>{costOfRevenue.toLocaleString('en-US',{maximumFractionDigits:2,minimumFractionDigits:2})}</Text>
              </View>
            </View>
            <View style={pdfStyles.tableRow}>
              <View style={{...pdfStyles.tableCell, marginLeft: 5, flex : 2}}>
                  <Text style={pdfStyles.tableCellText}>Gross Profit</Text>
              </View>
              <View style={{...pdfStyles.tableCell, flex:1,textAlign : 'right' }}>
                <Text style={pdfStyles.tableCellText}>{(totalRevenue - costOfRevenue).toLocaleString('en-US',{maximumFractionDigits:2,minimumFractionDigits:2})}</Text>
              </View>
            </View>
            <View style={{ ...pdfStyles.tableRow, marginTop: 15 }}>
              <View style={{...pdfStyles.tableHeader, flex : 1}}>
                  <Text style={pdfStyles.tableCellText}>Operating Expenses</Text>
              </View>
            </View>
            {
              reportData.indirectExpenses.map((expense, index) => (
                expense.amount !== 0 &&
                <View key={index} style={pdfStyles.tableRow}>
                  <View style={{...pdfStyles.tableCell, flex : 2}}>
                      <Text style={{ ...pdfStyles.tableCellText,marginLeft: 10 }}>{expense.ledger_name}</Text>
                  </View>
                  <View style={{...pdfStyles.tableCell, flex:1,textAlign : 'right' }}>
                    <Text style={pdfStyles.tableCellText}>{expense.amount.toLocaleString('en-US',{maximumFractionDigits:2,minimumFractionDigits:2})}</Text>
                  </View>
                </View>                        
              ))
            }
            <View style={pdfStyles.tableRow}>
              <View style={{...pdfStyles.tableCell,marginLeft: 10, backgroundColor: pdfStyles.shadedBG, flex : 2}}>
                  <Text style={pdfStyles.tableCellText}>Total Operating Expenses</Text>
              </View>
              <View style={{...pdfStyles.tableCell, backgroundColor: pdfStyles.shadedBG, flex:1,textAlign : 'right' }}>
                <Text style={pdfStyles.tableCellText}>{operationalExpenseTotal.toLocaleString('en-US',{maximumFractionDigits:2,minimumFractionDigits:2})}</Text>
              </View>
            </View>
            <View style={{ ...pdfStyles.tableRow,marginTop: 15 }}>
              <View style={{...pdfStyles.tableHeader, flex : 2}}>
                  <Text style={pdfStyles.tableCellText}>Net Income</Text>
              </View>
              <View style={{...pdfStyles.tableHeader, flex:1,textAlign : 'right' }}>
                <Text style={pdfStyles.tableCellText}>{(totalRevenue - costOfRevenue - operationalExpenseTotal).toLocaleString('en-US',{maximumFractionDigits:2,minimumFractionDigits:2})}</Text>
              </View>
            </View>
        </View>
      </Page>
    </Document>
  ) : ''
}

function IncomeStatement({from, to, cost_center_ids}) {
  document.title = 'Income Statement';
  const css = useProsERPStyles();
  const [today] = useState(dayjs());
  const { authOrganization, authUser: {user} } = useJumboAuth();
  const [displayAs, setDisplayAs] = useState('on screen');
  const [reportData, setReportData] = useState(null);
  const { enqueueSnackbar } = useSnackbar();
  const [isDownloadingTemplate, setIsDownloadingTemplate] = React.useState(false);
  const [uploadFieldsKey, setUploadFieldsKey] = useState(0)

  const validationSchema = yup.object({
    from: yup.string().required('Start Date is required').typeError('Start Date is required'),
  });

  const { setValue, watch, handleSubmit} = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      from: dayjs(from).startOf('day').toISOString(),
      to: dayjs(to).toISOString(),
      cost_center_ids: Array.isArray(cost_center_ids) ? cost_center_ids.map(id => id) : 'all'
    },
  });
  
  const [isFetching, setisFetching] = useState(false);

  const downloadExcelTemplate = async () => {
    try {
      setIsDownloadingTemplate(true);
      setUploadFieldsKey((prevKey) => prevKey + 1);
      
      // Get all current filter parameters
      const filters = {
        from: watch('from'),
        to: watch('to'),
        cost_center_ids: watch('cost_center_ids')
      };

      // Pass all filters to the service
      const responseData = await financialReportsServices.downloadExcelTemplate(filters);
      
      const blob = new Blob([responseData], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const dateRange = `${readableDate(filters.from)}-${readableDate(filters.to)}`;
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `Income Statement ${dateRange}.xlsx`;
      link.click();
      setIsDownloadingTemplate(false);
    } catch (error) {
      enqueueSnackbar('Error downloading Excel template', { variant: 'error' });
      setIsDownloadingTemplate(false);
    }
  };

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
        cost_center_ids : Array.isArray(cost_center_ids) ? cost_center_ids.map(id => id) : 'all'
      });
    }
  }, [from, to, cost_center_ids]);

  const downloadFileName = `Income Statement ${readableDate(reportData?.filters?.from)}-${readableDate(reportData?.filters?.to)}`;

  return (
    <>
      <DialogTitle textAlign={'center'}>
        <Grid container>
          <Grid size={{xs: 12}}>
            <Typography variant="h3">Income Statement</Typography>
          </Grid>
        </Grid>
        <Span className={css.hiddenOnPrint}>
          <form autoComplete="off" key={uploadFieldsKey} onSubmit={handleSubmit(retrieveReport)}>
            <Grid
              container
              columnSpacing={1}
              rowSpacing={1}
              alignItems="center"
              justifyContent="center"
            >
              <Grid size={{xs: 12, md: 10, lg: 5}}>
                <CostCenterSelector
                  label="Cost and Profit Centers"
                  multiple={true}
                  allowSameType={true}
                  onChange={(cost_centers) => {
                    setValue('cost_center_ids', cost_centers.map((cost_center) => cost_center.id));
                  }}
                />
              </Grid>
              <Grid size={{xs: 12, md: 4, lg: 3.5}}>
                <Div sx={{ mt: 1, mb: 1 }}>
                  <DateTimePicker
                    label="From (MM/DD/YYYY)"
                    minDate={dayjs(authOrganization?.organization.recording_start_date)}
                    defaultValue={from ? dayjs(from) : today.startOf('day')}
                    slotProps={{
                      textField: {
                        size: 'small',
                        fullWidth: true,
                      },
                    }}
                    onChange={(newValue) => {
                      setValue('from', newValue ? newValue.toISOString() : null, {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                    }}
                  />
                </Div>
              </Grid>
              <Grid size={{xs: 12, md: 4, lg: 3.5}}>
                <Div sx={{ mt: 1, mb: 1 }}>
                  <DateTimePicker
                    label="To (MM/DD/YYYY)"
                    defaultValue={to ? dayjs(to) : dayjs().endOf('day')}
                    minDate={dayjs(authOrganization?.organization.recording_start_date)}
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
              <Grid size={{xs: 12, md: 2, lg: 12}} textAlign="right">
                <Stack direction="row" spacing={0.5} justifyContent="flex-end" alignItems="center">
                  <>                                
                    <LoadingButton
                      size="small"
                      onClick={downloadExcelTemplate}
                      loading={isDownloadingTemplate}
                      disabled
                      variant="contained"
                      color="success"
                    >
                      Excel
                    </LoadingButton>
                    <LoadingButton loading={isFetching} type='submit' size='small' variant='contained'>
                      Filter
                    </LoadingButton>
                  </>
                </Stack>
              </Grid>
              <Grid size={12}>
                <FormControl>
                  <FormLabel id="display_as_radiobuttons">Display As</FormLabel>
                  <RadioGroup
                    row
                    aria-labelledby="display_as_radiobuttons"
                    name="row-radio-buttons-group"
                    value={displayAs}
                    onChange={(e) => setDisplayAs(e.target.value)}
                  >
                    <FormControlLabel value="on screen" control={<Radio />} label="On Screen" />
                    <FormControlLabel value="pdf" control={<Radio />} label="PDF" />
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
          ) : (
            reportData && (
              (displayAs === 'pdf') ? (
                <PDFContent
                  document={<ReportDocumet reportData={reportData} authOrganization={authOrganization} user={user}/>}
                  fileName={downloadFileName}
                />
              ) : (displayAs === 'on screen') ? (
                <IncomeStatementOnScreen reportData={reportData}/>
              ) : ''
            )
          )}
        </DialogContent>
    </>
  );
}

export default IncomeStatement;
