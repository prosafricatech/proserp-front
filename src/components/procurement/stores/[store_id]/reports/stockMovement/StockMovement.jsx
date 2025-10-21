import { Button, DialogActions, DialogContent, DialogTitle, Grid, IconButton, LinearProgress, Stack, Tab, Tabs, Tooltip, Typography, useMediaQuery} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import * as yup from 'yup';
import React, { useState } from 'react'
import { useStoreProfile } from '../../StoreProfileProvider';
import { useForm } from 'react-hook-form';
import { LoadingButton } from '@mui/lab';
import storeServices from '../../../store-services';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import { yupResolver } from '@hookform/resolvers/yup';
import StoreSelector from '../../../StoreSelector';
import StockMovementOnScreen from './StockMovementOnScreen';
import { HighlightOff } from '@mui/icons-material';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import pdfStyles from '@/components/pdf/pdf-styles';
import PdfLogo from '@/components/pdf/PdfLogo';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import useProsERPStyles from '@/app/helpers/style-helpers';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { Div, Span } from '@jumbo/shared';
import CostCenterSelector from '@/components/masters/costCenters/CostCenterSelector';
import PDFContent from '@/components/pdf/PDFContent';
import { useSnackbar } from 'notistack';

const ReportDocument = ({movementsData,authOrganization,user,checkOrganizationPermission,store,reportTitle}) => {
    const mainColor = authOrganization.organization.settings?.main_color || "#2113AD";
    const lightColor = authOrganization.organization.settings?.light_color || "#bec5da";
    const contrastText = authOrganization.organization.settings?.contrast_text || "#FFFFFF";
    const costCenters = movementsData.filters.cost_centers;
    
    return movementsData ?
    (
        <Document 
            creator={`${user.name} | Powered by ProsERP`}
            producer='ProsERP'
            title={`${store.name} ${reportTitle} ${readableDate(movementsData.filters.from,true)} to ${readableDate(movementsData.filters.to,true)}`}
        >
            <Page size="A3" orientation={'portrait'} style={pdfStyles.page}>
                <View style={pdfStyles.table}>
                    <View style={{ ...pdfStyles.tableRow, marginBottom: 20 }}>
                        <View style={{ flex: 1, maxWidth: 120}}>
                            <PdfLogo organization={authOrganization.organization}/>
                        </View>
                        <View style={{ flex: 1, textAlign: 'right' }}>
                            <Text style={{...pdfStyles.majorInfo, color: mainColor }}>{reportTitle}</Text>
                            <Text style={{ ...pdfStyles.midInfo }}>{`${store.name}`}</Text>
                            <Text style={{ ...pdfStyles.minInfo }}>{`${readableDate(movementsData.filters.from,true)} - ${readableDate(movementsData.filters.to,true)}`}</Text>
                        </View>
                    </View>
                </View>
                <View style={{ ...pdfStyles.tableRow, marginTop: 10, marginBottom: 10}}>
                    {
                        costCenters.length > 0 &&
                        <View style={{ flex: 2, padding: 2}}>
                            <Text style={{...pdfStyles.minInfo, color: mainColor }}>Cost Centers</Text>
                            <Text style={{...pdfStyles.minInfo }}>{costCenters.map((cost_centers) => cost_centers.name).join(', ')}</Text>
                        </View>
                    }
                    {
                        checkOrganizationPermission(PERMISSIONS.ACCOUNTS_REPORTS) &&
                        <View style={{ flex: 2, padding: 2}}>
                            <Text style={{...pdfStyles.minInfo, color: mainColor }}>Estimated Closing Value</Text>
                            <Text style={{...pdfStyles.minInfo }}>{movementsData.movements.reduce((total, movement) => total + movement.latest_rate*(
                                parseFloat(movement.opening_balance)+parseFloat(movement.quantity_received)-parseFloat(movement.quantity_sold)-parseFloat(movement.quantity_consumed)-parseFloat(movement.quantity_transferred_out)+parseFloat(movement.quantity_transferred_in)+parseFloat(movement.stock_gain)-parseFloat(movement.stock_loss)
                            ), 0).toLocaleString({maximumFractionDigits:4})}</Text>
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
                        <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 0.5 }}>S/N</Text>
                        <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 4 }}>Product</Text>
                        <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 0.5 }}>Unit</Text>
                        <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1.25 }}>Opening Balance</Text>
                        <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1.5 }}>Purchase Received</Text>
                        <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1.25 }}>Transfer In</Text>
                        <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1.25 }}>Transfer Out</Text>
                        <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1 }}>Stock Gain</Text>
                        <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1 }}>Stock Loss</Text>
                        <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1.25 }}>Consumed</Text>
                        <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1 }}>Sold</Text>
                        <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1.25 }}>Closing Balance</Text>
                        {
                            checkOrganizationPermission(PERMISSIONS.ACCOUNTS_REPORTS) &&
                            <React.Fragment>
                                <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1.5 }}>Latest Rate</Text>
                                <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1.5 }}>Estimated Closing Value</Text>
                            </React.Fragment>
                        }
                    </View>
                    {
                        movementsData.movements.map((movement,index) => {
                            const closing_balance = Math.round((parseFloat(movement.opening_balance)+parseFloat(movement.quantity_received)-parseFloat(movement.quantity_sold)-parseFloat(movement.quantity_consumed)-parseFloat(movement.quantity_transferred_out)+parseFloat(movement.quantity_transferred_in)+parseFloat(movement.stock_gain)-parseFloat(movement.stock_loss))*10000)/10000;
                        return (
                                <View key={index} style={pdfStyles.tableRow}>
                                    <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 0.5 }}>{index+1}</Text>
                                    <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 4 }}>{movement.name}</Text>
                                    <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 0.5 }}>{movement.unit_symbol}</Text>
                                    <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 1.25, textAlign: 'right' }}>{movement.opening_balance}</Text>
                                    <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 1.5, textAlign: 'right' }}>{movement.quantity_received}</Text>
                                    <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 1.25, textAlign: 'right' }}>{movement.quantity_transferred_in}</Text>
                                    <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 1.25, textAlign: 'right' }}>{movement.quantity_transferred_out}</Text>
                                    <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 1, textAlign: 'right' }}>{movement.stock_gain}</Text>
                                    <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 1, textAlign: 'right' }}>{movement.stock_loss}</Text>
                                    <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 1.25, textAlign: 'right' }}>{movement.quantity_consumed}</Text>
                                    <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 1, textAlign: 'right' }}>{movement.quantity_sold}</Text>
                                    <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 1.25, textAlign: 'right' }}>{closing_balance}</Text>
                                    {
                                        checkOrganizationPermission(PERMISSIONS.ACCOUNTS_REPORTS) &&
                                        <React.Fragment>
                                            <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 1.5, textAlign: 'right' }}>{movement.latest_rate.toLocaleString('en-US',{ minimumFractionsDigits: 2,maximumFractionDigits:2})}</Text>
                                            <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 1.5, textAlign: 'right' }}>{(movement.latest_rate*closing_balance).toLocaleString('en-US',{ minimumFractionsDigits: 2,maximumFractionDigits:2})}</Text>
                                        </React.Fragment>
                                    }
                                </View>
                            );
                        })}
                    </View>
                </Page>
    </Document>
    ) : ''
}

function StockMovement({ toggleOpen, dormantStock = false, isFromDashboard }) {
    const classes = useProsERPStyles();
    const { authOrganization, authUser: { user }, checkOrganizationPermission } = useJumboAuth();
    const { activeStore } = useStoreProfile();
    const [selectedTab, setSelectedTab] = useState(0);
    const { enqueueSnackbar } = useSnackbar();
    const [isDownloadingTemplate, setIsDownloadingTemplate] = React.useState(false);
    const [uploadFieldsKey, setUploadFieldsKey] = useState(0)

    //Screen handling constants
    const {theme} = useJumboTheme();
    const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

    // Validation schema
    const validationSchema = yup.object({
        isFromDashboard: yup.boolean(),
        store_id: yup.number().nullable().when('isFromDashboard', (isFromDashboard, schema) => {
            return isFromDashboard
                ? schema.required('Store is required').typeError('Store is required')
                : schema;
        }),
    });

    const { setValue, handleSubmit, watch, formState: { errors } } = useForm({
        resolver: yupResolver(validationSchema),
        defaultValues: {
            from: dormantStock ? dayjs().subtract(3, 'months').toISOString() : dayjs().startOf('day').toISOString(),
            to: dayjs().toISOString(),
            isFromDashboard: isFromDashboard || false,
            store_id: isFromDashboard ? null : activeStore?.id,
            cost_center_ids: authOrganization.costCenters.map(cost_center => cost_center.id)
        }
    });

    const [isFetching, setisFetching] = useState(false);
    const [movements, setMovements] = useState(null);

    const getMovements = async (filters) => {
        setisFetching(true);

        const serializedFilters = {
            ...filters,
            cost_center_ids: filters.cost_center_ids?.join(','),
        };

        const data = await storeServices.getStockMovement(serializedFilters, dormantStock);
        setMovements(data);
        setisFetching(false);
    };

    const downloadExcelTemplate = async () => {
        try {
            setIsDownloadingTemplate(true);
            setUploadFieldsKey((prevKey) => prevKey + 1);
            
        // Get all current filter parameters
        const filters = {
            from: watch(`from`),
            to: watch(`to`),
            store_id: watch(`store_id`),
            cost_center_ids: watch(`cost_center_ids`)
        };

        // Pass all filters to the service
        const responseData = await storeServices.downloadExcelTemplate(filters);
        
        const blob = new Blob([responseData], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });

        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = `Stock Movement ${readableDate(filters.as_at, true)}.xlsx`;
        link.click();
        setIsDownloadingTemplate(false);
        } catch (error) {
        enqueueSnackbar('Error downloading Excel template', { variant: 'error' });
        setIsDownloadingTemplate(false);
        }
    };

    const handleTabChange = (event, newValue) => {
        setSelectedTab(newValue);
    };

    const reportTitle = dormantStock ? 'Dormant Stock' : 'Stock Movement';
    document.title = `${isFromDashboard ? 'Store' : activeStore?.name} - ${reportTitle} Report`;

    return (
        <React.Fragment>
            <DialogTitle textAlign={'center'}>
                <Span className={classes.hiddenOnPrint}>
                    <form autoComplete='off' onSubmit={handleSubmit(getMovements)} >
                        <Grid container columnSpacing={1} key={uploadFieldsKey} paddingTop={2} rowSpacing={1} alignItems={'center'} justifyContent={'center'}>
                            <Grid container size={12}>
                                <Grid size={belowLargeScreen ? 11 : 12}>
                                    <Typography variant="h3">
                                        {dormantStock ? 'Dormant Stock' : 'Stock Movement'}
                                    </Typography>
                                </Grid>
                                {belowLargeScreen && (
                                    <Grid size={1}>
                                        <Tooltip title="Close">
                                            <IconButton 
                                                size="small" 
                                                sx={{ mb: 1 }} 
                                                onClick={() => toggleOpen(false)}
                                            >
                                                <HighlightOff color="primary" />
                                            </IconButton>
                                        </Tooltip>
                                    </Grid>
                                )}
                            </Grid>
                            {isFromDashboard &&
                                <Grid size={{xs: 12, md: 6, lg: 6}}>
                                    <Div sx={{ mt: 1, mb: 1 }}>
                                        <StoreSelector
                                            allowSubStores={true}
                                            label="Store"
                                            proposedOptions={authOrganization?.stores}
                                            frontError={errors.store_id}
                                            onChange={(newValue) => {
                                                setValue(`store`, newValue);
                                                setValue(`store_id`, newValue ? newValue.id : '', {
                                                    shouldValidate: true,
                                                    shouldDirty: true,
                                                });
                                            }}
                                        />
                                    </Div>
                                </Grid>
                            }
                            <Grid size={{xs: 12, md: isFromDashboard ? 6 : 12}}>
                                <Div sx={{ mt: 1, mb: 1 }}>
                                    <CostCenterSelector
                                        label="Cost and Profit Centers"
                                        multiple={true}
                                        allowSameType={true}
                                        onChange={(cost_centers) => {
                                            setValue('cost_center_ids', cost_centers.map((cost_center) => cost_center.id));
                                        }}
                                    />
                                </Div>
                            </Grid>
                            <Grid size={{ xs: 12, md: 6}}>
                                <Div sx={{ mt: 1, mb: 1 }}>
                                    <DateTimePicker
                                        label="From (MM/DD/YYYY)"
                                        fullWidth
                                        minDate={dayjs(authOrganization.organization.recording_start_date)}
                                        maxDate={dayjs()}
                                        value={watch('from') ? dayjs(watch('from')) : null}
                                        onChange={(newValue) => {
                                            setValue('from', newValue ? newValue.toISOString() : null, {
                                            shouldValidate: true,
                                            shouldDirty: true,
                                            });
                                        }}
                                        slotProps={{
                                            textField: {
                                            size: 'small',
                                            fullWidth: true,
                                            },
                                        }}
                                    />
                                </Div>
                            </Grid>
                            <Grid size={{ xs: 12, md: 6}}>
                                <Div sx={{ mt: 1, mb: 1 }}>
                                    <DateTimePicker
                                        label="To (MM/DD/YYYY)"
                                        fullWidth
                                        minDate={dayjs(authOrganization.organization.recording_start_date)}
                                        maxDate={dayjs()}
                                        value={watch('to') ? dayjs(watch('to')) : null}
                                        onChange={(newValue) => {
                                            setValue('to', newValue ? newValue.toISOString() : null, {
                                            shouldValidate: true,
                                            shouldDirty: true,
                                            });
                                        }}
                                        slotProps={{
                                            textField: {
                                            size: 'small',
                                            fullWidth: true,
                                            },
                                        }}
                                    />
                                </Div>
                            </Grid>
                            <Grid size={{xs: 12, md: 12}} textAlign={'right'}>
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
                    {belowLargeScreen && !isFetching && movements?.movements?.length > 0 && (
                        <Tabs value={selectedTab} onChange={handleTabChange} indicatorColor="primary" textColor="primary">
                            <Tab label="On-Screen" />
                            <Tab label="PDF" />
                        </Tabs>
                    )}
                </Span>
            </DialogTitle>
            <DialogContent>
                {isFetching && <LinearProgress />}
                {!isFetching && movements?.movements?.length > 0 && (
                    <React.Fragment>
                        {belowLargeScreen && selectedTab === 0 ?
                            <StockMovementOnScreen
                                movementsData={movements}
                                authOrganization={authOrganization}
                                user={user}
                                checkOrganizationPermission={checkOrganizationPermission}
                                store={isFromDashboard ? watch('store') : activeStore}
                                reportTitle={reportTitle}
                            />
                            :
                            <PDFContent
                                document={<ReportDocument movementsData={movements} authOrganization={authOrganization} user={user} checkOrganizationPermission={checkOrganizationPermission} store={isFromDashboard ? watch('store') : activeStore} reportTitle={reportTitle} />}
                                fileName={
                                    isFromDashboard
                                        ? watch('store')?.name
                                        : `${activeStore?.name} ${dormantStock ? 'Dormant Stock' : 'Stock Movement'} ${readableDate(watch('from'))}-${readableDate(watch('to'))}`
                                }
                            />
                        }
                    </React.Fragment>
                )}
            </DialogContent>
            <DialogActions>
                <Button size='small' sx={{ mt: 1 }} variant='outlined' onClick={() => toggleOpen(false)}>
                    Close
                </Button>
            </DialogActions>
        </React.Fragment>
    )
}

export default StockMovement;
