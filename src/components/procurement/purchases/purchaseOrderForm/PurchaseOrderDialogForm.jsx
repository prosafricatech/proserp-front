import { LoadingButton } from '@mui/lab'
import { Button, DialogActions, DialogContent, DialogTitle, Divider, Grid, Alert, Dialog, Tooltip, IconButton } from '@mui/material'
import dayjs from 'dayjs'
import React, { useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import * as yup  from "yup";
import {yupResolver} from '@hookform/resolvers/yup'
import purchaseServices from '../purchase-services'
import { useSnackbar } from 'notistack'
import stakeholderServices from '../../../masters/stakeholders/stakeholder-services'
import PurchaseOrderItemForm from './PurchaseOrderItemForm'
import PurchaseOrderItemRow from './PurchaseOrderItemRow'
import PurchaseOrderSummary from './PurchaseOrderSummary'
import PurchaseOrderTopInformation from './PurchaseOrderTopInformation'
import PurchaseOrderPaymentAndReceive from './PurchaseOrderPaymentAndReceive'
import { HighlightOff } from '@mui/icons-material'
import { useJumboAuth } from '@/app/providers/JumboAuthProvider'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

function PurchaseOrderDialogForm({toggleOpen, order = null}) {
  const {authOrganization} = useJumboAuth();
  const {costCenters} = authOrganization;
  const [totalAmount, setTotalAmount] = useState(0);
  const [vatableAmount, setVatableAmount] = useState(0);
  const itemTemplate = {product_id: null, quantity: null, rate: null};
  const [order_date] = useState(order ? dayjs(order.order_date) : dayjs());
  const [displayStoreSelector, setDisplayStoreSelector] = useState(false);
  const [items, setItems] = useState(order ? order.purchase_order_items : []);
  const [checked, setChecked] = useState(false);
  const [stakeholderQuickAddDisplay, setStakeholderQuickAddDisplay] = useState(false);
  const [addedStakeholder, setAddedStakeholder] = useState(null);
  const {enqueueSnackbar} =  useSnackbar();
  const queryClient = useQueryClient();

  const [showWarning, setShowWarning] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [clearFormKey, setClearFormKey] = useState(0);
  const [submitItemForm, setSubmitItemForm] = useState(false);

  const validationSchema = yup.object({
    order_date: yup.string().required('Order date is required'),
    currency_id: yup.number().positive('Currency is required').required('Currency is required').typeError('Currency is required'),
    cost_centers: yup.array().min(1, 'At least one cost center must be selected').required('Cost Center is required').typeError('At least one cost center must be selected'),
    exchange_rate: yup.number().positive('Exchange rate is required').required('Exchange rate is required').typeError('Exchange rate is required'),
    stakeholder_id: yup.number().positive().nullable(),
    instant_pay: yup.boolean(),
    instant_receive: yup.boolean(),
    credit_ledger_id: yup.number()
      .when('instant_pay', {
        is: true,
        then: (schema) => schema.positive('Credit Account(From) is required')
          .required('Credit Account(From) is required')
          .typeError('Credit Account(From) is required'),
        otherwise: (schema) => schema.nullable()
      }),
    store_id: yup.number()
      .when(['instant_receive', 'displayStoreSelector'], {
        is: (instant_receive, displayStoreSelector) => instant_receive && displayStoreSelector,
        then: (schema) => schema.positive('Receiving store is required')
          .required('Receiving store is required')
          .typeError('Receiving store is required'),
        otherwise: (schema) => schema.nullable()
      }),
    stakeholder_ledger_id: yup.number()
      .when(['instant_pay', 'stakeholder_id', 'instant_receive'], {
        is: (instant_pay, stakeholder_id, instant_receive) => instant_pay && stakeholder_id && !instant_receive,
        then: (schema) => schema.positive(`Selected supplier doesn't have any account`)
          .required(`Selected supplier doesn't have any account`)
          .typeError(`Selected supplier doesn't have any account`),
        otherwise: (schema) => schema.nullable()
      }),
    items: yup.array().min(1, "You must add at least one item")
      .typeError('You must add at least one item')
      .of(
        yup.object().shape({
          product_id: yup.number().required("Product is required").positive('Product is required').typeError('Product is required'),
          quantity: yup.number().required("Quantity is required").positive("Quantity is required").typeError('Quantity is required'),
          rate: yup.number().required("Price is required").positive("Price is required").typeError('Price is required'),
        })
      ),
  });

  const {register,setValue, setError, handleSubmit, clearErrors, watch, formState : {errors}} = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      id: order && order.id,
      order_date: order_date.toISOString(),
      stakeholder_id: order && order.stakeholder_id,
      currency_id: order?.currency_id ? order.currency_id : 1,
      exchange_rate: order?.exchange_rate ? order.exchange_rate : 1,
      vat_registered: !!authOrganization.organization.settings?.vat_registered,
      reference: order && order.reference,
      date_required: order && order.date_required,
      instant_pay: order ? !!order.instant_pay : true,
      instant_receive: order ? !!order.instant_receive : false,
      credit_ledger_id: (order && order.instant_pay) ? order.credit_ledger.id : null,
      store_id: order && !!order.instant_receive ? order.store.id : null,
      cost_centers: order?.cost_centers ? order.cost_centers : costCenters.length === 1 && costCenters,
      items : order ? order.purchase_order_items : [itemTemplate],
      terms_of_payment: order && order.terms_of_payment,
      remarks: order && order.remarks,
    }
  });

  const getLastPriceItems = {
    stakeholder_id : watch(`stakeholder_id`) || null,
    currency_id: watch(`currency_id`),
    date: watch(`order_date`),
  }

  //Set Item values and calculate total amount
  const orderTotalAmount = () => {
    let total = 0;
    let vatableAmount = 0;

      //Total For all Items
      async function loopItems(){
        await setValue(`items`,null);
        await items.forEach((item,index) => {
          total += item.rate*item.quantity
          setValue(`items.${index}.product_id`, item?.product?.id ? item.product.id : item.product_id);
          setValue(`items.${index}.quantity`, item.quantity);
          setValue(`items.${index}.measurement_unit_id`, item.measurement_unit_id);
          setValue(`items.${index}.rate`, item.rate);
          setValue(`items.${index}.store_id`, item.store_id);
          setValue(`items.${index}.vat_percentage`, item.vat_percentage);
          setValue(`items.${index}.amount`, item.amount);
          setValue(`items.${index}.item_vat`, item.item_vat);
        });
        setTotalAmount(total);
      }

      //Total For only Items require VAT Inclusive
      async function loopItemsForVAT(){
        await setValue(`items`,null);
        await items.forEach((item) => {
          vatableAmount += (item.quantity*item.rate*item.vat_percentage*0.01)
        });
        setVatableAmount(vatableAmount);
      }
    loopItems();
    loopItemsForVAT();
  }

  React.useEffect(() => {
    orderTotalAmount();
  },[items]);

  //Load Stakeholder credit ledgers
  const stakeholder_id = watch('stakeholder_id');
  const { data: stakeholderPayableLedgers } = useQuery({
    queryKey: ['stakeholderPayableLedgers', { stakeholderId: stakeholder_id }],
    queryFn: async () => {
      if (!stakeholder_id) return [];
      return stakeholderServices.getLedgers({ stakeholder_id, type: 'all' });
    },
    enabled: !!stakeholder_id, // avoid unnecessary fetches
    onSuccess: (data) => {
      if (data.length > 0) {
        setValue('stakeholder_ledger_id', data[0].id);
      } else {
        setValue('stakeholder_ledger_id', null);
      }
    },
  });
  
  const addPurchaseOrder = useMutation({
    mutationFn: purchaseServices.add,
    onSuccess: (data) => {
      toggleOpen(false);
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
    },
    onError: (error) => {
      enqueueSnackbar(error?.response?.data?.message, { variant: 'error' });
    },
  });

  const updatePurchaseOrder = useMutation({
    mutationFn: purchaseServices.update,
    onSuccess: (data) => {
      toggleOpen(false);
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
      queryClient.invalidateQueries({ queryKey: ['purchaseOrderGrns'] });
    },
    onError: (error) => {
      enqueueSnackbar(error?.response?.data?.message, { variant: 'error' });
    },
  });

  const saveMutation = React.useMemo(() => {
    return order ? updatePurchaseOrder : addPurchaseOrder
  },[updatePurchaseOrder, addPurchaseOrder]);

  const instant_pay = watch('instant_pay');
  const instant_receive = watch('instant_receive');

  const onSubmit = handleSubmit((formData) => {
    if (items.length === 0) {
      setError(`items`, {
        type: "manual",
        message: "You must add at least one item",
      });
      return;
    }
    
    if (isDirty) {
      setShowWarning(true);
      return;
    }

    saveMutation.mutate(formData);
  });

  const handleConfirmSubmitWithoutAdd = () => {
    handleSubmit((data) => saveMutation.mutate(data))();
    setIsDirty(false);
    setShowWarning(false);
    setClearFormKey(prev => prev + 1)
  };

  return (
    <FormProvider {...{items, instant_receive, instant_pay, displayStoreSelector, setDisplayStoreSelector, addedStakeholder, order_date, costCenters, totalAmount, vatableAmount, checked, setChecked, setValue, stakeholderQuickAddDisplay, errors, order, clearErrors, watch, setStakeholderQuickAddDisplay, setAddedStakeholder, register}}>
      <DialogTitle>
        <Grid container columnSpacing={2}>
          <Grid textAlign={'center'} size={{xs: 12}} mb={5}>
            {!order ? `New Purchase Order` : `Edit Order: ${order.orderNo}` }
          </Grid>
          <Grid size={{xs: 12, md: 8, lg: 9}}>
            <form autoComplete='off'>
              <PurchaseOrderTopInformation/>
            </form>
          </Grid>
          <Grid size={{xs: 12, md: 4, lg: 3}}>
            <PurchaseOrderSummary totalAmount={totalAmount} vatableAmount={vatableAmount} checked={checked} setChecked={setChecked}/>
          </Grid>
          <Grid size={12}>
            <PurchaseOrderItemForm setClearFormKey={setClearFormKey} submitMainForm={handleSubmit((data) => saveMutation.mutate(data))} submitItemForm={submitItemForm} setSubmitItemForm={setSubmitItemForm} key={clearFormKey} setIsDirty={setIsDirty} setItems={setItems} checked={checked} getLastPriceItems={getLastPriceItems}/>
            <Divider/>
          </Grid>

          {/* Payment And Receive */}
          <PurchaseOrderPaymentAndReceive
            instant_receive={watch('instant_receive')}
            instant_pay={watch('instant_pay')}
            displayStoreSelector={displayStoreSelector}
            setDisplayStoreSelector={setDisplayStoreSelector}
            order={order}
            items={items}
            errors={errors}
          />
        </Grid>
      </DialogTitle>
      <DialogContent>
        {
          errors?.items?.message && items.length < 1 && <Alert severity='error'>{errors.items.message}</Alert>
        }
        {
          items.map((item,index) => (
            <PurchaseOrderItemRow setClearFormKey={setClearFormKey} submitMainForm={handleSubmit((data) => saveMutation.mutate(data))} submitItemForm={submitItemForm} setSubmitItemForm={setSubmitItemForm} setIsDirty={setIsDirty} key={index} index={index} setItems={setItems} items={items} item={item} checked={checked} getLastPriceItems={getLastPriceItems}/>
          ))
        }

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
        <Button size='small' onClick={() => toggleOpen(false)}>
          Cancel
        </Button>
        <LoadingButton 
          variant='contained' 
          size='small'
          onClick={onSubmit}
          loading={addPurchaseOrder.isPending || updatePurchaseOrder.isPending}>
            Submit
        </LoadingButton>
      </DialogActions>
    </FormProvider>
  )
}

export default PurchaseOrderDialogForm