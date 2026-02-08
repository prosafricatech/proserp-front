import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Grid, IconButton, TextField, Tooltip, Tabs, Tab, Box, LinearProgress, Autocomplete, Chip } from '@mui/material';
import React, { useContext, useEffect, useState } from 'react';
import { LoadingButton } from '@mui/lab';
import * as yup from "yup";
import { yupResolver } from '@hookform/resolvers/yup';
import { FormProvider, useForm } from 'react-hook-form';
import { useSnackbar } from 'notistack';
import dayjs from 'dayjs';
import { DateTimePicker } from '@mui/x-date-pickers';
import { HighlightOff, KeyboardArrowLeftOutlined, KeyboardArrowRightOutlined } from '@mui/icons-material';
import ByProductsItemForm from './ByProductsItemForm';
import ByProductsItemRow from './ByProductsItemRow';
import productionBatchesServices from '../productionBatchesServices';
import { ProductionBatchesContext } from '../ProductionBatchesList';
import OtherExpensesItemRow from './otherExpenses/OtherExpensesItemRow';
import PBSummary from './PBSummary';
import OtherExpenses from './otherExpenses/OtherExpenses';
import billOfMaterialsServices from '../../boms/billOfMaterialsServices';
import OutputsItemForm2 from './OutputsItemForm2';
import InventoryInputsItemForm2 from './InventoryInputsItemForm2';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Div } from '@jumbo/shared';

function ProductionBatchesForm2({ toggleOpen, production }) {
    const { activeWorkCenter } = useContext(ProductionBatchesContext);
    const [activeTab, setActiveTab] = useState(0);
    const {enqueueSnackbar} =  useSnackbar();
    const {authOrganization} = useJumboAuth();
    const queryClient = useQueryClient();
    const [isLoading, setIsLoading] = useState(false)
    const [fetchedBOMs, setFetchedBOMs] = useState(null);

    const [showWarning, setShowWarning] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [clearFormKey, setClearFormKey] = useState(0);
    const [submitItemForm, setSubmitItemForm] = useState(false);

    const [inventoryInputs, setInventoryInputs] = useState([]);
    const inventoryConsumptions = production ? production?.inventory_consumptions?.flatMap(consumption => 
        consumption.items?.map(item => ({
            ...item,
            consumptionNo: consumption.consumptionNo,
            consumption_date: consumption.consumption_date,
        }))
    ) : []; 
    const combinedInputsConsumptions = [...inventoryConsumptions, ...inventoryInputs];

    const [otherExpenses, setOtherExpenses] = useState(production ?  production?.ledger_expenses : []);
    const [by_products, setBy_products] = useState(production ? production?.by_products : []);
    const [outputs, setOutputs] = useState(production ? production.outputs : []);

    const validationSchema = yup.object({
        start_date: yup
            .string()
            .required('Start Date is required')
            .typeError('Start Date is required'),
        end_date: yup
            .string()
            .required('Start Date is required')
            .typeError('Start Date is required'),
        // end_date: yup
        //     .string()
        //     .when('submit_type', {
        //         is: (submit_type) => submit_type === 'close',
        //         then: yup
        //             .string()
        //             .required('Ending date is required')
        //             .typeError('Ending date is required'),
        //     }).nullable(),
        inventory_inputs: yup
            .array()
            .of(
                yup.object({
                    store_id: yup
                        .number()
                        .required('Store is required')
                        .typeError(`Store is required`),
                    quantity: yup
                        .number()
                        .required('Quantity is required')
                        .min(0, 'Quantity must be greater than or equal to 0'),
                })
            )
    });
    
    const {handleSubmit, setValue, watch, register, formState : {errors}} = useForm({
        resolver: yupResolver(validationSchema),
        defaultValues: {
            id: production?.id,
            work_center_id: activeWorkCenter?.id,
            start_date : production ? dayjs(production.start_date)?.toISOString() : dayjs().startOf('day').toISOString(),
            end_date : production?.end_date ? dayjs(production.end_date)?.toISOString() : null,
            remarks: production?.remarks,
            inventory_inputs: [],
            by_products: production ? production?.by_products : [],
            outputs: production ? production?.outputs : [],
        }
    });

    const start_date = watch(`start_date`)
    const end_date = watch(`end_date`)
    const productionDates = {
        start_date,
        end_date
    }

    const addProduction = useMutation({
        mutationFn: productionBatchesServices.addProduction,
        onSuccess: (data) => {
            toggleOpen(false);
            enqueueSnackbar(data.message, { variant: 'success' });
            queryClient.invalidateQueries({ queryKey: ['productionBatches'] });
        },
        onError: (error) => {
            const message = error?.response?.data?.message;
            if (message) {
            enqueueSnackbar(message, { variant: 'error' });
            }
        },
    });

    const updateProduction = useMutation({
        mutationFn: productionBatchesServices.updateProduction,
        onSuccess: (data) => {
            toggleOpen(false);
            enqueueSnackbar(data.message, { variant: 'success' });
            queryClient.invalidateQueries({ queryKey: ['productionBatches'] });
        },
        onError: (error) => {
            const message = error?.response?.data?.message;
            if (message) {
            enqueueSnackbar(message, { variant: 'error' });
            }
        },
    });

    const saveMutation = React.useMemo(() => {
        return production ? updateProduction : addProduction
    },[production, addProduction, updateProduction]);

    useEffect(() => {
        setValue(`inventory_inputs`, inventoryInputs);
        setValue(`by_products`, by_products);
        setValue(`outputs`, outputs,{
            shouldValidate: true,
            shouldDirty: true
        });
        setValue(`ledger_expenses`, otherExpenses);
    }, [production, inventoryInputs, by_products, outputs, otherExpenses])

    const submitType = watch(`submit_type`);

    const onSubmit = () => {
        if (isDirty) {
            setShowWarning(true);
        } else {
            if (submitType === 'close') {
                if (outputs.length > 0) {
                    handleSubmit((data) => {
                        const updatedData = {
                            ...data,
                        };
                        saveMutation.mutate(updatedData);
                    })();
                }
            } else {
                handleSubmit((data) => {
                    const updatedData = {
                        ...data,
                    };
                    saveMutation.mutate(updatedData);
                })();
            }
        }
    };
    
    const handleConfirmSubmitWithoutAdd = async () => {
        if (submitType === 'close') {
            if (outputs.length > 0) {
                handleSubmit((data) => {
                    const updatedData = {
                        ...data,
                    };
                    saveMutation.mutate(updatedData);
                })();
            }
        } else {
            handleSubmit((data) => {
                const updatedData = {
                    ...data,
                };
                saveMutation.mutate(updatedData);
            })();
        }
    
        setIsDirty(false);
        setShowWarning(false);
        setClearFormKey((prev) => prev + 1);
    };

    const { data: bomsOptions, isPending: isFetchingBOMs } = useQuery({
        queryKey: ['bomsOptions'],
        queryFn: billOfMaterialsServices.getBOMs,
    });

    const retrieveBillOfMaterialDetails = async ({id}) => {
        setIsLoading(true);

        const billOfMaterialDetails = await billOfMaterialsServices.billOfMaterialDetails(id);
        setFetchedBOMs(billOfMaterialDetails);

        setIsLoading(false);
    };

    if (isFetchingBOMs) {
        return <LinearProgress />;
    }

    return (
        <FormProvider {...{handleSubmit, setValue, watch, register, errors, submitType, productionDates, setOutputs, outputs, fetchedBOMs, setInventoryInputs, inventoryInputs }}>
            <DialogTitle>
                <Grid container spacing={2}>
                    <Grid size={12} textAlign="center" mb={2}>
                        {production ? `Edit ${production.batchNo}` : 'New Production Batch'}
                    </Grid>
                    <Grid size={12} mb={2}>
                        <form autoComplete="off">
                            <Grid container spacing={1}>
                                <Grid size={{xs: 12, md: 3}}>
                                    <Div sx={{ mt: 0.3 }}>
                                        <DateTimePicker
                                            fullWidth
                                            label="Start Date (MM/DD/YYYY)"  
                                            minDate={dayjs(authOrganization.organization.recording_start_date)}    
                                            defaultValue={dayjs(watch(`start_date`))}        
                                            slotProps={{
                                                textField: {
                                                    size: 'small',
                                                    fullWidth: true,
                                                    readOnly: true,
                                                    error: !!errors?.start_date,
                                                    helperText: errors?.start_date?.message
                                                }
                                            }}
                                            onChange={(newValue) => {
                                                setValue('start_date', newValue ? newValue.toISOString() : null,{
                                                    shouldValidate: true,
                                                    shouldDirty: true
                                                });
                                            }}
                                        />
                                    </Div>
                                </Grid>
                                <Grid size={{xs: 12, md: 3}}>
                                    <Div sx={{ mt: 0.3 }}>
                                        <DateTimePicker
                                            fullWidth
                                            label="End Date (MM/DD/YYYY)" 
                                            defaultValue={production?.end_date && dayjs(watch(`end_date`))}        
                                            minDate={dayjs(watch('start_date'))}           
                                            slotProps={{
                                                textField:{
                                                    size: 'small',
                                                    fullWidth: true,
                                                    readOnly: true,
                                                    error: !!errors?.end_date,
                                                    helperText: errors?.end_date?.message
                                                }
                                            }}
                                            onChange={(newValue) => {
                                                setValue('end_date', newValue ? newValue.toISOString() : null,{
                                                    shouldValidate: true,
                                                    shouldDirty: true
                                                });
                                            }}
                                        />
                                    </Div>
                                </Grid>
                                <Grid size={{xs: 12, md: 3}}>
                                    <Div sx={{ mt: 0.3 }}>
                                        <Autocomplete
                                            id="checkboxes-boms"
                                            options={bomsOptions}
                                            isOptionEqualToValue={(option,value) => option.id === value.id}
                                            value={watch('stores')}
                                            getOptionLabel={(option) => `${option.bomNo} (${option.product_name})`}
                                            renderInput={(params) => 
                                                <TextField 
                                                    {...params} 
                                                    label="BOM" size="small" fullWidth 
                                                    error={!!errors.stores}
                                                    helperText={errors.stores?.message}
                                                />
                                            }
                                            renderTags={(tagValue, getTagProps)=> {
                                                return tagValue.map((option, index)=>{
                                                    const {key, ...restProps} = getTagProps({index});
                                                    return <Chip {...restProps} key={option.id+"-"+key} label={`${option.bomNo} (${option.product_name})`} />
                                                })
                                            }}
                                            onChange={(e, newValue) => {
                                                if (newValue) {
                                                    retrieveBillOfMaterialDetails({ id: newValue.id });
                                                } else {
                                                    setFetchedBOMs(null);
                                                    setOutputs([])
                                                }
                                            }}
                                        />
                                    </Div>
                                </Grid>
                                <Grid size={{xs: 12, md: 3}}>
                                    <Div sx={{ mt: 0.3 }}>
                                        <TextField
                                            label="Remarks"
                                            size="small"
                                            fullWidth
                                            {...register('remarks')}
                                        />
                                    </Div>
                                </Grid>
                                <Grid size={12}>
                                    {
                                        isLoading ? <LinearProgress/> :
                                        fetchedBOMs && 
                                        <OutputsItemForm2 />
                                    }
                                </Grid>
                            </Grid>
                        </form>
                    </Grid>
                </Grid>
            </DialogTitle>

            <DialogContent>

                <Tabs
                    value={activeTab}
                    onChange={(_, newValue) => setActiveTab(newValue)}
                    variant="scrollable"
                    scrollButtons='auto'
                    allowScrollButtonsMobile
                >
                    <Tab label="INVENTORY INPUTS"/>
                    <Tab label="OTHER EXPENSES"/>
                    <Tab label="BY PRODUCTS"/>
                    <Tab label="SUMMARY"/>
                </Tabs>

                <Box hidden={activeTab !== 0} sx={{ mt: 2 }}>
                    {
                        isLoading ? <LinearProgress/> :
                        <InventoryInputsItemForm2/>
                    }
                </Box>

                <Box hidden={activeTab !== 1} sx={{ mt: 2 }}>
                    <OtherExpenses productionDates={productionDates} setClearFormKey={setClearFormKey} submitMainForm={handleSubmit((data) => saveMutation.mutate(data))} submitItemForm={submitItemForm} setIsDirty={setIsDirty} setSubmitItemForm={setSubmitItemForm} clearFormKey={clearFormKey} setOtherExpenses={setOtherExpenses} otherExpenses={otherExpenses} />
                    {otherExpenses?.map((item, index) => (
                        <OtherExpensesItemRow key={index} index={index} setClearFormKey={setClearFormKey} submitMainForm={handleSubmit((data) => saveMutation.mutate(data))} submitItemForm={submitItemForm} setIsDirty={setIsDirty} setSubmitItemForm={setSubmitItemForm} setOtherExpenses={setOtherExpenses} otherExpenses={otherExpenses} item={item} />
                    ))}
                </Box>

                <Box hidden={activeTab !== 2} sx={{ mt: 2 }}>
                    <ByProductsItemForm setClearFormKey={setClearFormKey} submitMainForm={handleSubmit((data) => saveMutation.mutate(data))} submitItemForm={submitItemForm} setIsDirty={setIsDirty} setSubmitItemForm={setSubmitItemForm} key={clearFormKey} setBy_products={setBy_products} by_products={by_products} />
                    {by_products?.map((item, index) => (
                        <ByProductsItemRow key={index} index={index} setClearFormKey={setClearFormKey} submitMainForm={handleSubmit((data) => saveMutation.mutate(data))} submitItemForm={submitItemForm} setIsDirty={setIsDirty} setSubmitItemForm={setSubmitItemForm} setBy_products={setBy_products} by_products={by_products} item={item}/>
                    ))}
                </Box>

                <Box hidden={activeTab !== 3} sx={{ mt: 2 }}>
                    <PBSummary combinedInputsConsumptions={combinedInputsConsumptions} otherExpenses={otherExpenses} by_products={by_products} outputs={outputs}/>
                </Box>

                <Dialog open={showWarning} onClose={() => setShowWarning(false)}>
                    <DialogTitle>            
                        <Grid container alignItems="center" justifyContent="space-between">
                            <Grid size={11}>
                                Unsaved Changes
                            </Grid>
                            <Grid size={1} textAlign="right">
                                <Tooltip title="Close">
                                    <IconButton
                                        size="small" 
                                        onClick={() => setShowWarning(false)}
                                    >
                                        <HighlightOff color="primary" />
                                    </IconButton>
                                </Tooltip>
                            </Grid>
                        </Grid>
                    </DialogTitle>
                    <DialogContent>
                        Last item was not added to the list
                    </DialogContent>
                    <DialogActions>
                        <Button size="small" onClick={() => {setSubmitItemForm(true); setShowWarning(false);}}>
                            Add and Submit
                        </Button>
                        <Button size="small" onClick={handleConfirmSubmitWithoutAdd} color="secondary">
                            Submit without add
                        </Button>
                    </DialogActions>
                </Dialog>
            </DialogContent>

            <DialogActions>
                <Button size="small" onClick={() => toggleOpen(false)}>Cancel</Button>
                {
                activeTab > 0 &&
                <Button size='small' variant='outlined' onClick={() => setActiveTab(activeTab => (activeTab-1))}>
                    <KeyboardArrowLeftOutlined/>
                    Previous
                </Button>
                }
                {
                activeTab < 3 &&
                <Button size='small' variant='outlined' onClick={() => setActiveTab(activeTab => activeTab+1)}>
                    Next
                    <KeyboardArrowRightOutlined/>
                </Button>
                }
                <LoadingButton
                    loading={addProduction.isPending || updateProduction.isPending}
                    size="small"
                    variant="contained"
                    onClick={() => {
                        setValue('submit_type', 'suspend');
                        handleSubmit(onSubmit)();
                    }}
                >
                    Initiate
                </LoadingButton>
                <LoadingButton
                    loading={addProduction.isPending || updateProduction.isPending}
                    variant="contained"
                    color="success"
                    size="small"
                    onClick={() => {
                        setValue('submit_type', 'close');
                        handleSubmit(onSubmit)();
                    }}
                >
                    Close
                </LoadingButton>
            </DialogActions>
        </FormProvider>
    );
}

export default ProductionBatchesForm2;
