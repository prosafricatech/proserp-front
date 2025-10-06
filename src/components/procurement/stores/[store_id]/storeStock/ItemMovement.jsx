import { LoadingButton } from '@mui/lab'
import { Button, DialogActions, DialogContent, DialogTitle, Grid, IconButton, LinearProgress, Stack, Tab, Tabs, Tooltip, Typography, useMediaQuery } from '@mui/material'
import { DateTimePicker } from '@mui/x-date-pickers'
import dayjs from 'dayjs'
import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import * as yup  from "yup";
import {yupResolver} from '@hookform/resolvers/yup'
import { useStoreProfile } from '../StoreProfileProvider'
import { Document, Page, Text, View } from '@react-pdf/renderer'
import StoreSelector from '../../StoreSelector'
import ItemMovementOnScreen from './ItemMovementOnScreen'
import { HighlightOff } from '@mui/icons-material'
import { readableDate } from '@/app/helpers/input-sanitization-helpers'
import pdfStyles from '@/components/pdf/pdf-styles'
import PdfLogo from '@/components/pdf/PdfLogo'
import useProsERPStyles from '@/app/helpers/style-helpers'
import { useJumboAuth } from '@/app/providers/JumboAuthProvider'
import { useProductsSelect } from '@/components/productAndServices/products/ProductsSelectProvider'
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks'
import { Div, Span } from '@jumbo/shared'
import ProductSelect from '@/components/productAndServices/products/ProductSelect'
import CostCenterSelector from '@/components/masters/costCenters/CostCenterSelector'
import PDFContent from '@/components/pdf/PDFContent'
import productServices from '@/components/productAndServices/products/productServices'
import { useSnackbar } from 'notistack'

const ReportDocument = ({movementsData,authObject,store}) => {
    const {authOrganization,authUser: { user}} = authObject;
    const {from, to, cost_centers, product} = movementsData.filters;
    const mainColor = authOrganization.organization.settings?.main_color || "#2113AD";
    const lightColor = authOrganization.organization.settings?.light_color || "#bec5da";
    const contrastText = authOrganization.organization.settings?.contrast_text || "#FFFFFF";
    const reportPeriod = `${readableDate(from, true)} - ${readableDate(to, true)}`

    let cumulativeBalance = 0;
    const {movements} = movementsData;
    
    return movementsData ?
    (
        <Document 
            creator={`ProsERP | ${user.name}`}
            title={`${product.name} movement ${reportPeriod}`}
            producer='ProsERP'
        >
            <Page size="A4" style={pdfStyles.page}>
                <View style={pdfStyles.table}>
                    <View style={{ ...pdfStyles.tableRow, marginBottom: 20 }}>
                        <View style={{ flex: 1, maxWidth: 120}}>
                            <PdfLogo organization={authOrganization.organization}/>
                        </View>
                        <View style={{ flex: 1, textAlign: 'right' }}>
                            <Text style={{...pdfStyles.majorInfo, color: mainColor }}>{`Inventory Item Movement`}</Text>
                            <Text style={{ ...pdfStyles.minInfo }}>{`${product.name}`}</Text>
                            <Text style={{ ...pdfStyles.midInfo }}>{`${store.name}`}</Text>
                            <Text style={{ ...pdfStyles.minInfo }}>{`${reportPeriod}`}</Text>
                        </View>
                    </View>
                </View>
                <View style={{ ...pdfStyles.tableRow, marginTop: 10, marginBottom: 10}}>
                    {
                        cost_centers.length > 0 &&
                        <View style={{ flex: 2, padding: 2}}>
                            <Text style={{...pdfStyles.minInfo, color: mainColor }}>Cost Centers</Text>
                            <Text style={{...pdfStyles.minInfo }}>{cost_centers.map((cost_center) => cost_center.name).join(', ')}</Text>
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
                        <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1.5 }}>Date</Text>
                        <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 2 }}>Description</Text>
                        <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 2 }}>Reference</Text>
                        <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1 }}>In</Text>
                        <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1 }}>Out</Text>
                        <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1.5 }}>Balance</Text>
                    </View>
                    {movements.map((movement, index) => {
                        const balance = movement.quantity_in - movement.quantity_out;
                        cumulativeBalance += balance;
                        return (
                        <View key={index} style={pdfStyles.tableRow}>
                            <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 1.5 }}>{readableDate(movement.movement_date)}</Text>
                            <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 2 }}>{movement.description}</Text>
                            <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 2 }}>{movement.reference}</Text>
                            <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 1, textAlign: 'right' }}>{(movement.quantity_in !== 0 && index > 0) && movement.quantity_in.toLocaleString('en-US',{maximumFractionDigits:5})}</Text>
                            <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 1, textAlign: 'right' }}>{(movement.quantity_out !== 0 && index > 0) && movement.quantity_out.toLocaleString('en-US',{maximumFractionDigits:5})}</Text>
                            <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 1.5, textAlign: 'right' }}>{cumulativeBalance.toLocaleString('en-US',{maximumFractionDigits:5})}</Text>
                        </View>
                        );
                    })}
                </View>
            </Page>
    </Document>
    ) : ''
}

function ItemMovement({productStock = null, toggleOpen, isFromDashboard}) {
    const classes = useProsERPStyles();
    const [today] = useState(dayjs());
    const authObject = useJumboAuth();
    const {authOrganization} = authObject;
    const {activeStore} = useStoreProfile();
    const {productOptions} = useProductsSelect();
    const [selectedTab, setSelectedTab] = useState(0);
    const { enqueueSnackbar } = useSnackbar();
    const [isDownloadingTemplate, setIsDownloadingTemplate] = React.useState(false);
    const [uploadFieldsKey, setUploadFieldsKey] = useState(0)

    //Screen handling constants
    const {theme} = useJumboTheme();
    const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

    const validationSchema = yup.object({
        isFromDashboard: yup.boolean(),
        product_id: yup.number()
            .required("Product is required")
            .positive('Product is required')
            .typeError('Product is required'),
        store_id: yup.number()
            .nullable()
            .when('isFromDashboard', (isFromDashboard, schema) =>
                isFromDashboard
                    ? schema.required('Store is required').typeError('Store is required')
                    : schema
            ),
    });

    const { setValue, handleSubmit, watch, formState: { errors } } = useForm({
        resolver: yupResolver(validationSchema),
        defaultValues: {
            isFromDashboard: isFromDashboard || false,
            from: today.startOf('day').toISOString(),
            to: today.endOf('day').toISOString(),
            product_id: productStock?.id || null,
            store_id: isFromDashboard ? null : activeStore?.id,
            cost_center_ids: authOrganization?.costCenters.map(cc => cc.id)
        }
    });

    const [isFetching, setisFetching] = useState(false);
    const [movements, setMovements] = useState([]);
    const [productName, setProductName] = useState(productStock ? productStock?.name : '')

    const getMovements = async(filters) => {
        setisFetching(true)
        const movements = await productServices.getProductMovements(filters);
        setMovements(movements);
        setisFetching(false);
    }

    const downloadExcelTemplate = async () => {
        try {
            setIsDownloadingTemplate(true);
            setUploadFieldsKey((prevKey) => prevKey + 1);

            const filters = {
                from: watch('from'),
                to: watch('to'),
                store_id: watch('store_id'),
                cost_center_ids: watch('cost_center_ids'),
                product_id: watch('product_id'),
            };

            const responseData = await productServices.ItemMovementDownloadExcel(filters);

            const blob = new Blob([responseData], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            });

            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = 'Item Movement.xlsx';
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

    document.title = 'Item Movement Report';
  return (
    <React.Fragment>
        <DialogTitle textAlign={'center'}>
            <Span className={classes.hiddenOnPrint}>
                <form autoComplete='off' key={uploadFieldsKey} onSubmit={handleSubmit(getMovements)} >
                    <Grid container columnSpacing={1} paddingTop={2} rowSpacing={1} alignItems={'center'} justifyContent={'center'}>
                        <Grid size={12} container>
                            <Grid size={belowLargeScreen ? 11 : 12}>
                                <Typography variant="h3">{`${productName} Movement`}</Typography>
                            </Grid>
                            {belowLargeScreen && (
                                <Grid size={1}>
                                    <Tooltip title="Close">
                                        <IconButton 
                                            size='small' 
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
                            <Grid size={{xs: 12, md: 6}}>
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
                        <Grid size={{xs: 12, md: 6}}>
                            <Div sx={{mt: 1, mb: 1}}>
                                <ProductSelect
                                    label="Product"
                                    defaultValue={productStock && productStock}
                                    frontError={errors?.product_id}
                                    excludeIds={productOptions.filter(product => product.type !== 'Inventory').map(product => product.id)}
                                    onChange={(newValue) => {
                                        if(newValue){
                                            setProductName(newValue.name);
                                            setValue('product_id', newValue.id,{
                                                shouldDirty: true,
                                                shouldValidate: true
                                            });
                                        } else {
                                            setProductName('')
                                            setValue('product_id',null,{
                                                shouldDirty: true,
                                                shouldValidate: true
                                            });
                                        }
                                    }}
                                />
                            </Div>
                        </Grid>
                        <Grid size={{xs: 12, md: isFromDashboard ? 6 : 3}}>
                            <Div sx={{mt: 1, mb: 1}}>
                                <DateTimePicker
                                    label="From (MM/DD/YYYY)"
                                    value={dayjs(watch('from'))}
                                    minDate={dayjs(authOrganization?.organization.recording_start_date)}
                                    maxDate={dayjs(watch('to'))}
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
                        <Grid size={{xs: 12, md: isFromDashboard ? 6 : 3}}>
                            <Div sx={{mt: 1, mb: 1}}>
                                <DateTimePicker
                                    label="To (MM/DD/YYYY)"
                                    value={dayjs(watch('to'))}
                                    minDate={dayjs(watch('from'))}
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
                        <Grid size={{xs: 12, md: 12}}>
                            <Div sx={{mt: 1, mb: 1}}>
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
                        <Grid size={{xs: 12, md: 12}} textAlign={'right'}>
                            <Stack direction="row" spacing={0.5} justifyContent="flex-end" alignItems="center">
                                <>                                
                                    <LoadingButton
                                        size="small"
                                        onClick={downloadExcelTemplate}
                                        loading={isDownloadingTemplate}
                                        disabled={(isFromDashboard && !watch('store_id')) || !watch('product_id')}
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
                    {
                        belowLargeScreen && selectedTab === 0 ? 
                        <ItemMovementOnScreen
                            movementsData={movements}
                            authObject={authObject}
                            store={isFromDashboard ? watch('store') : activeStore}
                        />
                        :
                        <PDFContent
                            document={<ReportDocument movementsData={movements} authObject={authObject} store={isFromDashboard ? watch('store') : activeStore} />}
                            fileName={`${productName} Movement Report ${readableDate(movements?.filters?.from)}-${readableDate(movements?.filters?.to)}`}
                        />
                    }
                </React.Fragment>
              )}
          </DialogContent>
            <DialogActions>
                <Button sx={{ mt:1 }} size='small' variant='outlined' onClick={() => toggleOpen(false)}>
                    Close
                </Button>
            </DialogActions>
    </React.Fragment>
  )
}

export default ItemMovement