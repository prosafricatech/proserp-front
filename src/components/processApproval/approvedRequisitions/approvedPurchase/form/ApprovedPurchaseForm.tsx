import { LoadingButton } from '@mui/lab';
import { Alert, Button, DialogActions, DialogContent, DialogTitle, Grid, Tab, Tabs, TextField, Typography } from '@mui/material';
import dayjs from 'dayjs';
import React, { useEffect, useState, useMemo } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import * as yup from "yup";
import { yupResolver } from '@hookform/resolvers/yup';
import { useSnackbar } from 'notistack';
import ApprovedPurchaseItemForm from './ApprovedPurchaseItemForm';
import ApprovedPurchaseTopInformation from './ApprovedPurchaseTopInformation';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import stakeholderServices from '@/components/masters/stakeholders/stakeholder-services';
import purchaseServices from '@/components/procurement/purchases/purchase-services';
import PurchaseOrderSummary from '@/components/procurement/purchases/purchaseOrderForm/PurchaseOrderSummary';
import PurchaseOrderPaymentAndReceive from '@/components/procurement/purchases/purchaseOrderForm/PurchaseOrderPaymentAndReceive';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { PurchaseApprovalRequisition } from '../../ApprovalRequisitionType';
import { Vendor } from '@/components/processApproval/RequisitionType';
import { Product } from '@/components/productAndServices/products/ProductType';
import { MeasurementUnit } from '@/components/masters/measurementUnits/MeasurementUnitType';
import { CostCenter } from '@/components/masters/costCenters/CostCenterType';
import { Stakeholder } from '@/components/masters/stakeholders/StakeholderType';

interface Order {
  id?: number;
  order_date?: string;
  currency_id?: number;
  exchange_rate?: number;
  reference?: string;
  stakeholder?: Stakeholder;
  store?: { id: number };
  date_required?: string;
  instant_pay?: boolean;
  instant_receive?: boolean;
  credit_ledger?: { id: number };
  cost_centers?: CostCenter[];
  purchase_order_items?: Array<{
    requisition_approval_product_item_id: number;
    quantity: number;
    rate: number;
    measurement_unit: MeasurementUnit;
    vat_percentage: number;
    product: Product;
    vendors?: Vendor;
  }>;
  additional_costs?: any[];
}

interface AdditionalCostItem {
  id?: number;
  requisition_additional_cost_id?: number;
  credit_ledger_name?: string;
  name?: string;
  ledger?: { id?: number; name?: string };
  reference?: string;
  currency_name?: string;
  currency?: { id?: number; name?: string; code?: string };
  currency_id?: number;
  exchange_rate?: number;
  amount?: number;
  approved_amount?: number;
}

interface OrderItem {
  requisition_approval_product_item_id?: number;
  product?: Product;
  product_id?: number;
  quantity: number;
  rate: number;
  entered_rate?: number;
  measurement_unit: MeasurementUnit;
  vat_percentage: number;
  unordered_quantity: number;
}

interface FormValues {
  id?: number | null;
  requisition_approval_id?: number;
  order_date: string;
  currency_id: number;
  exchange_rate: number;
  vat_registered: boolean;
  reference: string;
  stakeholder_id: number | null;
  store_id: number | null;
  date_required?: string;
  instant_pay: boolean;
  instant_receive: boolean;
  credit_ledger_id: number | null;
  cost_centers: any[];
  items: Array<{
    requisition_approval_product_item_id: number;
    product_id: number;
    quantity: number;
    rate: number;
    entered_rate?: number;
    measurement_unit_id: number;
    vat_percentage: number;
  }>;
  additional_costs?: Array<{
    requisition_additional_cost_id?: number;
    credit_ledger_name?: string;
    ledger_id?: number;
    currency_id?: number;
    exchange_rate?: number;
    reference?: string;
    amount?: number;
  }>;
  stakeholder_ledger_id?: number | null;
}

interface ApprovedPurchaseFormProps {
  toggleOpen: (open: boolean) => void;
  approvedDetails?: any;
  approvedRequisition?: PurchaseApprovalRequisition;
  order?: Order;
  prevApprovedDetails?: any;
}

const ApprovedPurchaseForm: React.FC<ApprovedPurchaseFormProps> = ({
  toggleOpen,
  approvedDetails,
  approvedRequisition,
  order,
  prevApprovedDetails
}) => {
  const { authOrganization } = useJumboAuth();
  const [totalAmount, setTotalAmount] = useState(0);
  const [vatableAmount, setVatableAmount] = useState(0);
  const [order_date] = useState(order?.order_date ? dayjs(order.order_date) : dayjs());
  const [checked, setChecked] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const [displayStoreSelector, setDisplayStoreSelector] = useState(false);
  const [stakeholderQuickAddDisplay, setStakeholderQuickAddDisplay] = useState(false);
  const [addedStakeholder, setAddedStakeholder] = useState<any>(null);
  const [activeTab, setActiveTab] = useState(0);

  const approvedAdditionalCostsSource = approvedDetails?.additional_costs || prevApprovedDetails?.additional_costs || [];

  const [additionalCosts, setAdditionalCosts] = useState<AdditionalCostItem[]>(() => {
    if (order?.additional_costs?.length) {
      return order.additional_costs.map((cost: any) => {
        const approvedCost = approvedAdditionalCostsSource.find((item: any) =>
          Number(item?.id || item?.requisition_additional_cost_id) === Number(cost?.id || cost?.requisition_additional_cost_id)
        );

        return {
          ...cost,
          requisition_additional_cost_id: cost?.requisition_additional_cost_id || cost?.id,
          approved_amount: Number(approvedCost?.amount),
          amount: Number(cost?.amount ?? 0),
          exchange_rate: Number(cost?.exchange_rate ?? 1),
          currency_id: cost?.currency_id || cost?.currency?.id,
          currency_name: cost?.currency_name || cost?.currency?.name,
        };
      });
    }

    return (approvedAdditionalCostsSource || []).map((cost: any) => {
      const approvedAmount = Number(cost?.approved_amount ?? cost?.unordered_amount ?? cost?.amount ?? 0);
      return {
        ...cost,
        requisition_additional_cost_id: cost?.requisition_additional_cost_id || cost?.id,
        approved_amount: approvedAmount,
        amount: approvedAmount,
        exchange_rate: Number(cost?.exchange_rate ?? 1),
        currency_id: cost?.currency_id || cost?.currency?.id,
        currency_name: cost?.currency_name || cost?.currency?.name,
      };
    });
  });

  const [items, setItems] = useState(() => {
    if (order?.purchase_order_items) {
      return order.purchase_order_items.map((orderItem) => {
        const prevItem = prevApprovedDetails?.items?.find(
          (prevItem: any) => prevItem.id === orderItem.requisition_approval_product_item_id
        );

        return {
          ...orderItem,
          quantity: sanitizedNumber(orderItem.quantity),
          unordered_quantity: prevItem ? (orderItem.quantity + prevItem.unordered_quantity) : 0,
          requisition_approval_product_item_id: orderItem.requisition_approval_product_item_id,
        };
      });
    } else if (approvedDetails?.items) {
      return approvedDetails.items
        .filter((item: any) => item.unordered_quantity > 0)
        .map((item: any) => ({
          ...item,
          quantity: item.unordered_quantity,
          vat_percentage: item.vat_percentage,
          requisition_approval_product_item_id: item.id,
        }));
    }
    return [];
  });

  const validationSchema = yup.object({
    order_date: yup.string().required('Order date is required'),
    currency_id: yup.number().positive('Currency is required').required('Currency is required').typeError('Currency is required'),
    cost_centers: yup.array().min(1, 'At least one cost center must be selected').required('Cost Center is required').typeError('At least one cost center must be selected'),
    exchange_rate: yup.number().positive('Exchange rate is required').required('Exchange rate is required').typeError('Exchange rate is required'),
    stakeholder_id: yup.number().positive().nullable(),
    instant_pay: yup.boolean(),
    instant_receive: yup.boolean(),
    credit_ledger_id: yup.number().nullable().when('instant_pay', {
      is: true,
      then: (schema) => schema.positive('Credit Account(From) is required').required('Credit Account(From) is required'),
      otherwise: (schema) => schema.nullable()
    }),
    store_id: yup.number().when(['instant_receive', 'displayStoreSelector'], {
      is: (instant_receive: boolean) => instant_receive && displayStoreSelector,
      then: (schema) => schema.positive('Receiving store is required').required('Receiving store is required'),
      otherwise: (schema) => schema.nullable()
    }),
    stakeholder_ledger_id: yup.number().nullable().when(['instant_pay', 'stakeholder_id', 'instant_receive'], {
      is: (instant_pay: boolean, stakeholder_id: number, instant_receive: boolean) => instant_pay && !!stakeholder_id && !instant_receive,
      then: (schema) => schema.positive(`Selected supplier doesn't have any account`).required(`Selected supplier doesn't have any account`),
      otherwise: (schema) => schema.nullable()
    }),
  });

  // Defensive: ensure instant_pay and instant_receive are always boolean
  const getBool = (val: any, fallback: boolean) => {
    if (typeof val === 'boolean') return val;
    if (val === undefined || val === null) return fallback;
    if (typeof val === 'object') return fallback;
    if (typeof val === 'string') return val === 'true';
    return !!val;
  };

  const formMethods = useForm<FormValues>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      id: order?.id || null,
      requisition_approval_id: approvedDetails?.id,
      order_date: order_date.toISOString(),
      currency_id: approvedDetails?.currency?.id || order?.currency_id || 1,
      exchange_rate: approvedDetails?.currency?.exchangeRate || order?.exchange_rate || 1,
      vat_registered: !!authOrganization?.organization.settings?.vat_registered,
      reference: order?.reference || '',
      stakeholder_id: order?.stakeholder?.id || null,
      store_id: (order?.instant_receive && order?.store) ? order.store.id : null,
      date_required: order?.date_required,
      instant_pay: getBool(order?.instant_pay, true),
      instant_receive: getBool(order?.instant_receive, false),
      credit_ledger_id: (order?.instant_pay && order?.credit_ledger) ? order.credit_ledger.id : null,
      cost_centers: approvedRequisition ? [approvedRequisition.requisition.cost_center] : order?.cost_centers || [],
      items: items,
      additional_costs: additionalCosts.map((cost: AdditionalCostItem) => ({
        requisition_additional_cost_id: cost.requisition_additional_cost_id || cost.id,
        credit_ledger_name: cost.credit_ledger_name || cost.name,
        ledger_id: (cost as any).ledger_id || (cost as any).ledger?.id || null,
        currency_id: cost.currency_id || cost.currency?.id,
        exchange_rate: Number(cost.exchange_rate || 1),
        reference: cost.reference,
        amount: Number(cost.amount || 0),
      })),
    }
  });

  const { setValue, handleSubmit, watch, formState: { errors } } = formMethods;

  const orderTotalAmount = () => {
    let total = 0;
    let vatableAmount = 0;

    const calculateTotals = () => {
      setValue(`items`, []);
      items
        .filter((item: OrderItem) => item.unordered_quantity > 0)
        .forEach((item: OrderItem, index: number) => {
          total += item.rate * item.quantity;
          setValue(`items.${index}.requisition_approval_product_item_id`, Number(item.requisition_approval_product_item_id));
          setValue(`items.${index}.product_id`, item.product?.id ?? item.product_id as number);
          setValue(`items.${index}.quantity`, sanitizedNumber(item.quantity));
          setValue(`items.${index}.measurement_unit_id`, item.measurement_unit.id);
          setValue(`items.${index}.rate`, item?.entered_rate ?? item.rate);
          setValue(`items.${index}.vat_percentage`, item.vat_percentage);
        });
      setTotalAmount(total);
    };

    const calculateVAT = () => {
      items
        .filter((item: OrderItem) => item.unordered_quantity > 0)
        .forEach((item: OrderItem) => {
          vatableAmount += item.quantity * item.rate * ((item.vat_percentage ?? 0) * 0.01);
        });
      setVatableAmount(vatableAmount);
    };

    calculateTotals();
    calculateVAT();
  };

  React.useEffect(() => {
    orderTotalAmount();
  },[items]);

  useEffect(() => {
    setValue(
      'additional_costs',
      additionalCosts.map((cost) => ({
        requisition_additional_cost_id: cost.requisition_additional_cost_id || cost.id,
        credit_ledger_name: cost.credit_ledger_name || cost.name,
        ledger_id: (cost as any).ledger_id || null,
        currency_id: cost.currency_id || cost.currency?.id,
        exchange_rate: Number(cost.exchange_rate || 1),
        reference: cost.reference,
        amount: Number(cost.amount || 0),
      }))
    );
  }, [additionalCosts, setValue]);
  
  const stakeholder_id = watch('stakeholder_id');
  const { data: stakeholderPayableLedgers } = useQuery({
    queryKey: ['stakeholderPayableLedgers', { stakeholderId: stakeholder_id }],
    queryFn: async () => {
      if (!stakeholder_id) return [];
      const ledgers = await stakeholderServices.getLedgers({ stakeholder_id, type: 'all' });
      if (ledgers.length > 0) {
        setValue('stakeholder_ledger_id', ledgers[0].id);
      } else {
        setValue('stakeholder_ledger_id', null);
      }
      return ledgers;
    },
    enabled: !!stakeholder_id
  });

  const addPurchaseOrder = useMutation({
    mutationFn: purchaseServices.add,
    onSuccess: (data) => {
      toggleOpen(false);
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['approvedRequisitions'] });
      queryClient.invalidateQueries({ queryKey: ['approvedPurchaseOrders'] });
    },
    onError: (error: any) => {
      error?.response?.data?.message && enqueueSnackbar(error.response.data.message, { variant: 'error' });
    }
  });

  const updatePurchaseOrder = useMutation({
    mutationFn: purchaseServices.update,
    onSuccess: (data) => {
      toggleOpen(false);
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['approvedRequisitions'] });
      queryClient.invalidateQueries({ queryKey: ['approvedPurchaseOrders'] });
    },
    onError: (error: any) => {
      error?.response?.data?.message && enqueueSnackbar(error.response.data.message, { variant: 'error' });
    }
  });

  const handleItemChange = (index: number, key: string, value: any) => {
    if (key === 'delete' && value === true) {
      setItems(items.filter((_: string, itemIndex: number) => itemIndex !== index));
    } else {
      const updatedItems = [...items];
      updatedItems[index][key] = value;
      setItems(updatedItems);
    }
  };

  useEffect(() => {
    const currentItems = (approvedDetails?.items || order?.purchase_order_items || [])
      .map((item: any) => {
        if (order) {
          const prevItem = prevApprovedDetails?.items?.find(
            (prevItem: any) => prevItem.id === item.requisition_approval_product_item_id
          );

          return {
            ...item,
            vendors: prevItem?.vendors,
            quantity: sanitizedNumber(item.quantity),
            unordered_quantity: prevItem ? (item.quantity + prevItem.unordered_quantity) : 0,
            requisition_approval_product_item_id: item.requisition_approval_product_item_id,
          };
        } else {
          return {
            ...item,
            quantity: sanitizedNumber(item.unordered_quantity),
            unordered_quantity: item.unordered_quantity,
            requisition_approval_product_item_id: item.id,
          };
        }
      });

    const filteredItems = stakeholder_id
      ? currentItems?.filter((item: any) =>
          item.vendors?.some((vendor: any) => vendor.id === stakeholder_id) || item.vendors?.length === 0
        )
      : currentItems;

    setItems(filteredItems || []);
  }, [stakeholder_id]);

  const saveMutation = useMemo(() => {
    return order ? updatePurchaseOrder.mutate : addPurchaseOrder.mutate;
  }, [order, updatePurchaseOrder, addPurchaseOrder]);

  const handleAdditionalCostAmountChange = (index: number, value: number) => {
    setAdditionalCosts((prev) => {
      const next = [...prev];
      if (next[index]) {
        next[index] = {
          ...next[index],
          amount: value,
        };
      }
      return next;
    });
  };

  const validateAdditionalCosts = () => {
    return !additionalCosts.some((cost) => {
      const costAmount = Number(cost.approved_amount ?? 0);
      const enteredAmount = Number(cost.amount ?? 0);
      return enteredAmount > costAmount;
    });
  };

  const onSubmit = (data: FormValues) => {
    if (!validateAdditionalCosts()) {
      enqueueSnackbar('Please ensure each value does not exceed its cost amount.', {
        variant: 'error',
      });
      setActiveTab(1);
      return;
    }

    saveMutation(data);
  };

  return (
    <FormProvider {...formMethods}>
      <DialogTitle>
        <Grid container columnSpacing={2}>
          <Grid textAlign={'center'} size={12} mb={3}>
            {order ? `Edit Order` : `New Approved Purchase Order`}
          </Grid>
          <Grid size={{xs: 12, md: 8, lg: 9}} mb={2}>
            <form autoComplete='off'>
              <ApprovedPurchaseTopInformation
                setAddedStakeholder={setAddedStakeholder}
                addedStakeholder={addedStakeholder}
                setStakeholderQuickAddDisplay={setStakeholderQuickAddDisplay}
                stakeholderQuickAddDisplay={stakeholderQuickAddDisplay}
                order={order}
                approvedRequisition={approvedRequisition}
                order_date={order_date}
                approvedDetails={approvedDetails}
              />
            </form>
          </Grid>
          <Grid size={{xs: 12, md: 4, lg: 3}}>
            <PurchaseOrderSummary isApprovedPurchase={true} totalAmount={totalAmount} vatableAmount={vatableAmount} checked={checked} setChecked={setChecked}/>
          </Grid>

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
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          variant='scrollable'
          scrollButtons='auto'
          allowScrollButtonsMobile
          sx={{ mb: 1 }}
        >
          <Tab label='Products' />
          <Tab label='Additional Costs' />
        </Tabs>

        {activeTab === 0 && (
          <>
        {errors?.items?.message && items.length < 1 && <Alert severity='error'>{errors.items.message}</Alert>}
        <ApprovedPurchaseItemForm 
          approvedDetails={approvedDetails} 
          items={items} 
          prevApprovedDetails={prevApprovedDetails}
          handleItemChange={handleItemChange}
        />
          </>
        )}

        {activeTab === 1 && additionalCosts.length > 0 && (
          <Grid container spacing={1} sx={{ mt: 1 }}>
            {additionalCosts.map((cost, index) => (
              <React.Fragment key={cost.id || cost.requisition_additional_cost_id || index}>
                <Grid size={{ xs: 12, md: 1 }}>
                  <Typography variant='body2' sx={{ mt: 1.5 }}>
                    {`${index + 1}.`}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12, md: 7 }}>
                  <Typography variant='body2' sx={{ mt: 1.5 }}>
                    {`${cost.credit_ledger_name || cost.ledger?.name || cost.name}`}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  {(() => {
                    const costAmount = Number(cost.approved_amount ?? 0);
                    const enteredAmount = Number(cost.amount ?? 0);
                    const isAmountInvalid = enteredAmount > costAmount;

                    return (
                      <TextField
                        label='Amount'
                        size='small'
                        value={Number(cost.amount || 0).toLocaleString('en-US')}
                        error={isAmountInvalid}
                        helperText={
                          isAmountInvalid
                            ? `Value should not exceed cost amount (${costAmount.toLocaleString('en-US')}).`
                            : ''
                        }
                        InputProps={{
                          inputComponent: CommaSeparatedField,
                        }}
                        onChange={(e) =>
                          handleAdditionalCostAmountChange(index, sanitizedNumber(e.target.value) || 0)
                        }
                      />
                    );
                  })()}
                </Grid>
              </React.Fragment>
            ))}
          </Grid>
        )}

        {activeTab === 1 && additionalCosts.length === 0 && (
          <Alert severity='info'>No additional costs found on this approved requisition.</Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button size='small' onClick={() => toggleOpen(false)}>
          Cancel
        </Button>
        {items?.length > 0 &&
          <LoadingButton
            variant='contained'
            size='small'
            onClick={handleSubmit(onSubmit)}
            loading={addPurchaseOrder.isPending || updatePurchaseOrder.isPending}
          >
            Submit
          </LoadingButton>
        }
      </DialogActions>
    </FormProvider>
  );
};

export default React.memo(ApprovedPurchaseForm);