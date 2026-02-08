'use client'
import { yupResolver } from "@hookform/resolvers/yup";
import { DialogContent, DialogTitle, FormControl, Grid, InputLabel, LinearProgress, MenuItem, Select, Stack, Tab, Tabs, Typography, useMediaQuery } from "@mui/material";
import dayjs from "dayjs";
import { useState } from "react";
import * as yup from "yup";
import { useForm } from "react-hook-form";
import CostCenterSelector from "../../../masters/costCenters/CostCenterSelector";
import { LoadingButton } from "@mui/lab";
import financialReportsServices from "../financial-reports-services";
import PDFContent from "../../../pdf/PDFContent";
import { Document, Page, Text, View } from "@react-pdf/renderer";
import pdfStyles from "../../../pdf/pdf-styles";
import PdfLogo from "../../../pdf/PdfLogo";
import DebtorCreditorOnScreen from "./DebtorCreditorOnScreen";
import { readableDate } from "@/app/helpers/input-sanitization-helpers";
import useProsERPStyles from "@/app/helpers/style-helpers";
import { useJumboAuth } from "@/app/providers/JumboAuthProvider";
import { useJumboTheme } from "@jumbo/components/JumboTheme/hooks";
import { DateTimePicker } from "@mui/x-date-pickers";
import { Div, Span } from "@jumbo/shared";
import { useSnackbar } from "notistack";

const ReportDocumet = ({reportData,authOrganization,user}) => {
    const mainColor = authOrganization.organization.settings?.main_color || "#2113AD";
    const lightColor = authOrganization.organization.settings?.light_color || "#bec5da";
    const contrastText = authOrganization.organization.settings?.contrast_text || "#FFFFFF";
    const reportPeriod = `As at: ${readableDate(reportData.filters.as_at,true)}`;
    
    return reportData ?
    (
      <Document 
        creator={` ${user.name} | Powered By ProsERP` }
        producer='ProsERP'
        title={reportData.debtors? `Debtors Report` : `Creditors Report`}
      >
        <Page size="A4" style={pdfStyles.page}>
          <View style={pdfStyles.table}>
            <View style={{ ...pdfStyles.tableRow, marginBottom: 20 }}>
                <View style={{ flex: 1, maxWidth: 120}}>
                    <PdfLogo organization={authOrganization.organization}/>
                </View>
                <View style={{ flex: 1, textAlign: 'right' }}>
                    <Text style={{...pdfStyles.majorInfo, color: mainColor }}>{reportData.debtors? `Debtors Report` : `Creditors Report`}</Text>
                    <Text style={{ ...pdfStyles.minInfo }}>{reportPeriod}</Text>
                </View>
            </View>
          </View>
          <View style={{ ...pdfStyles.tableRow, marginTop: 10, marginBottom: 10}}>
            {
              reportData.filters.cost_centers.length > 0 &&
              <View style={{ flex: 2, padding: 2}}>
                  <Text style={{...pdfStyles.minInfo, color: mainColor }}>Cost Centers</Text>
                  <Text style={{...pdfStyles.minInfo }}>{reportData.filters.cost_centers.map((cost_centers) => cost_centers.name).join(', ')}</Text>
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
          <View style={{ ...pdfStyles.table, minHeight: 230 }}>
            <View style={pdfStyles.tableRow}>
              <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 0.5 }}>S/N</Text>
              <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 7 }}>Name</Text>
              <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1.5 }}>Amount</Text>
            </View>
            {
              Object.values(reportData.debtors || reportData.creditors).map((data, index) => (
                <View key={index} style={pdfStyles.tableRow}>
                  <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 0.5,textAlign: 'right' }}>{index + 1}</Text>
                  <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 7 }}>{data.name}</Text>
                  <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 1.5, textAlign: 'right' }}>{(data.amount).toLocaleString('en-US',{maximumFractionDigits:2,minimumFractionDigits:2})}</Text>
                </View>
              ))
            }
            <View style={pdfStyles.tableRow}>
              <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 7.7 ,paddingLeft: 10}}>Total</Text>
              <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1.5, textAlign : 'right', fontSize :'9px' }}>{(Object.values(reportData.debtors || reportData.creditors).reduce((total,item) => { return total + item.amount},0)).toLocaleString('en-US',{maximumFractionDigits:2,minimumFractionDigits:2})}</Text>
            </View>
          </View>
        </Page>
      </Document>
    ) : ''
  }

function DebtorCreditorReport() {
    const css = useProsERPStyles();
    const { authOrganization, authUser: {user} } = useJumboAuth();
    const [reportData, setReportData] = useState(null);
    const [selectedType, setSelectedType] = useState('creditors');
    const [activeTab, setActiveTab] = useState(0);
    const [costCenterIds, setCostCenterIds] = useState(authOrganization?.costCenters.map(cost_center => cost_center.id));
    const { enqueueSnackbar } = useSnackbar();
    const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
    const [uploadFieldsKey, setUploadFieldsKey] = useState(0)

    //Screen handling constants
    const {theme} = useJumboTheme();
    const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

    const validationSchema = yup.object({
      as_at: yup.string().required('Date is required').typeError('Date is required'),
    });
  
    const { setValue, handleSubmit,reset } = useForm({
      resolver: yupResolver(validationSchema),
      defaultValues: {
        as_at: dayjs().toISOString(),
        cost_center_ids: authOrganization?.costCenters.map(cost_center => cost_center.id),
      },
    });

    const [isFetching, setisFetching] = useState(false);
    const retrieveReport = async (filters) => {
      setisFetching(true);
      
      const finalFilters = {
        ...filters,
        cost_center_ids: costCenterIds, 
      };
      
      const report = selectedType === 'debtors'
        ? await financialReportsServices.debtors(finalFilters)
        : await financialReportsServices.creditors(finalFilters);
      
      setReportData(report);
      setisFetching(false);
      reset();
    };

    const downloadExcelTemplate = async () => {
      try {
          setIsDownloadingTemplate(true);
          setUploadFieldsKey((prevKey) => prevKey + 1);
            
        // Get all current filter parameters
        const filters = {
          as_at: watch('as_at'),
          cost_center_ids: watch('cost_center_ids')
        };

        // Pass all filters to the service
        const responseData = await financialReportsServices.downloadExcelDebtorCreditor(filters);
        
        const blob = new Blob([responseData], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });

        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = `${selectedType === 'debtors' ? 'Debtors Report' : 'Creditors Report'} ${readableDate(filters.as_at, true)}.xlsx`;
        link.click();
        setIsDownloadingTemplate(false);
      } catch (error) {
        enqueueSnackbar('Error downloading Excel template', { variant: 'error' });
        setIsDownloadingTemplate(false);
      }
    };

    const handleTabChange = (event, newValue) => {
      setActiveTab(newValue);
    };

    document.title = `${selectedType.charAt(0).toUpperCase() + selectedType.slice(1)} Report`;
  
    const downloadFileName = `${reportData?.debtors ? 'Debtors Report' : 'Creditors Report'} ${readableDate(reportData?.filters?.as_at)}`;

    return (
      <>
        <DialogTitle textAlign={'center'}>
          <Grid container>
            <Grid size={12} textAlign={'center'}>
              <Typography variant="h3">{selectedType === 'debtors' ? 'Debtors Report' : 'Creditors Report'}</Typography>
            </Grid>
          </Grid>
          <Span className={css.hiddenOnPrint}>
            <form autoComplete="off" onSubmit={handleSubmit(retrieveReport)}>
              <Grid
                container
                columnSpacing={1}
                rowSpacing={1}
                key={uploadFieldsKey}
                alignItems="center"
                justifyContent="center"
              >
                <Grid size={{xs: 12, md: 6, lg: 3}}>
                  <Div sx={{ mt: 1, mb: 1 }}>
                    <DateTimePicker
                      label="As at"
                      minDate={dayjs(authOrganization?.organization.recording_start_date)}
                      defaultValue={dayjs()}
                      slotProps={{
                        textField: {
                          size: 'small',
                          fullWidth: true,
                        },
                      }}
                      onChange={(newValue) => {
                        setValue('as_at', newValue ? newValue.toISOString() : null, {
                          shouldValidate: true,
                          shouldDirty: true,
                        });
                      }}
                    />
                  </Div>
                </Grid>
                <Grid size={{xs: 12, md: 6, lg: 3}}>
                  <Div sx={{ mt: 1, mb: 1 }}>
                    <FormControl fullWidth size='small' label="Type" align={'left'}>
                      <InputLabel id="type_select">Type</InputLabel>
                      <Select
                        value={selectedType}
                        onChange={(e) =>{setSelectedType(e.target.value)}}
                        label="Type"
                      >
                        <MenuItem value="creditors">Creditors</MenuItem>
                        <MenuItem value="debtors">Debtors</MenuItem>
                      </Select>
                    </FormControl>
                  </Div>
                </Grid>
                <Grid size={{xs: 12, md: 12, lg: 6}}>
                  <CostCenterSelector
                    label="Cost Centers"
                    multiple={true}
                    allowSameType={true}
                    defaultValue={authOrganization?.costCenters}
                    onChange={(cost_centers) => {
                      const ids = cost_centers.map((cost_center) => cost_center.id);
                      setCostCenterIds(ids); // Update the state with selected cost centers
                      setValue('cost_center_ids', ids);
                    }}
                  />
                </Grid>
                <Grid size={{xs: 12, md: 12, lg: 12}} textAlign="right">
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
              </Grid>
            </form>
          </Span>
        </DialogTitle>
        <DialogContent>
          {isFetching ? (
            <LinearProgress />
          ) : (
            reportData && (reportData.debtors || reportData.creditors) && Object.values(reportData.debtors || reportData.creditors).length > 0  && (
              <>
                {belowLargeScreen && (
                  <Tabs value={activeTab} onChange={handleTabChange} variant="fullWidth">
                    <Tab label="On-Screen" />
                    <Tab label="PDF" />
                  </Tabs>
                )}
                {(belowLargeScreen && activeTab === 0) ?
                  <DebtorCreditorOnScreen
                    reportData={reportData}
                    authOrganization={authOrganization}
                  /> :
                  <PDFContent
                    document={<ReportDocumet reportData={reportData} authOrganization={authOrganization} user={user}/>}
                    fileName={downloadFileName}
                  />
                }
              </>
            )
          )}
        </DialogContent>
      </>
    );
  }
  
  export default DebtorCreditorReport;