import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { Currency } from '@/components/masters/Currencies/CurrencyType';
import { MeasurementUnit } from '@/components/masters/measurementUnits/MeasurementUnitType';
import {
  Approval,
  Requisition,
  RequisitionItem,
} from '@/components/processApproval/RequisitionType';
import StoreSelector from '@/components/procurement/stores/StoreSelector';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { Div } from '@jumbo/shared';
import { AccountBalanceWalletOutlined, Restore, StorageOutlined } from '@mui/icons-material';
import CallSplitOutlinedIcon from '@mui/icons-material/CallSplitOutlined';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import ProductBudgetCheckDetails from './ProductBudgetCheckDetails';
import Vendors from './Vendors';

interface ApprovalRequisitionProductItemProps {
  approval?: Approval;
  requisition: Requisition;
  errors: any;
  handleItemChange: any;
  requisitionProductItem: RequisitionItem[];
  setRequisitionProductItem: (items: RequisitionItem[]) => void;
  isMaterialMode?: boolean;
}

interface ItemState {
  isVatfieldChange: boolean;
  priceInclusiveVAT: number;
  priceKey: number;
  vatKey: number;
}

interface StockBalance {
  store_id: number;
  store_name: string;
  balance: number;
  product_id?: number;
}

function ApprovalRequisitionProductItem({
  approval,
  requisition,
  errors,
  handleItemChange,
  requisitionProductItem,
  setRequisitionProductItem,
  isMaterialMode = false,
}: ApprovalRequisitionProductItemProps) {
  const { authOrganization, checkOrganizationPermission } = useJumboAuth();
  const canSeeBudget = checkOrganizationPermission([
    PERMISSIONS.BUDGETS_CREATE,
    PERMISSIONS.BUDGETS_EDIT,
    PERMISSIONS.BUDGETS_READ,
    PERMISSIONS.BUDGETS_DELETE,
  ]);
  const [initialItems, setInitialItems] = useState<RequisitionItem[]>([]);
  const [vatFieldStates, setVatFieldStates] = useState<
    Record<number, ItemState>
  >({});
  const [priceInclusiveVATs, setPriceInclusiveVATs] = useState<
    Record<number, ItemState>
  >({});
  const [fieldKeys, setFieldKeys] = useState<Record<number, ItemState>>({});
  const [openProductBudgetDialog, setOpenProductBudgetDialog] = useState(false);
  const [openStockDialog, setOpenStockDialog] = useState(false);
  const [selectedStockBalances, setSelectedStockBalances] = useState<StockBalance[]>([]);
  const [selectedProductName, setSelectedProductName] = useState<string>('');
  const [quantityErrors, setQuantityErrors] = useState<Record<number, string>>({});
  const [productDialogData, setProductDialogData] = useState<{
    productId: number;
    costCenterId: number;
    productName: string;
    measurementUnit: MeasurementUnit;
    currency: Currency;
  } | null>(null);
  const sourceItemsCount = (
    approval?.items ||
    ('items' in requisition ? requisition.items : []) ||
    []
  ).length;

  useEffect(() => {
    setInitialItems([...requisitionProductItem]);
  }, []);

  useEffect(() => {
    const initialStates: Record<number, ItemState> = {};
    requisitionProductItem.forEach((_, index) => {
      initialStates[index] = {
        isVatfieldChange: false,
        priceInclusiveVAT: 0,
        priceKey: 0,
        vatKey: 0,
      };
    });
    setVatFieldStates(initialStates);
    setPriceInclusiveVATs(initialStates);
    setFieldKeys(initialStates);
  }, [requisitionProductItem]);

  const updateItemState = (index: number, updates: Partial<ItemState>) => {
    setVatFieldStates((prev) => ({
      ...prev,
      [index]: { ...prev[index], ...updates },
    }));
    setPriceInclusiveVATs((prev) => ({
      ...prev,
      [index]: { ...prev[index], ...updates },
    }));
    setFieldKeys((prev) => ({
      ...prev,
      [index]: { ...prev[index], ...updates },
    }));
  };

  const handleDeleteItem = (index: number) => {
    const updatedItems = [...requisitionProductItem];
    updatedItems.splice(index, 1);
    setRequisitionProductItem(updatedItems);
  };

  const handleResetItems = () => {
    setRequisitionProductItem([...initialItems]);
  };

  const handleSplitItem = (index: number) => {
    const item = requisitionProductItem[index];
    if (!item) return;

    const splitItem: RequisitionItem = {
      ...item,
      quantity: 0,
      rate: Number(item.rate || 0),
      remarks: '',
      fulfillment_type: (item as any).fulfillment_type || 'PURCHASE',
      store_id: (item as any).store_id || null,
    };

    const updatedItems = [...requisitionProductItem];
    updatedItems.splice(index + 1, 0, splitItem);
    setRequisitionProductItem(updatedItems);
  };

  const handleOpenStockDialog = (stockBalances: StockBalance[], productName: string) => {
    setSelectedStockBalances(stockBalances);
    setSelectedProductName(productName);
    setOpenStockDialog(true);
  };

  const handleCloseStockDialog = () => {
    setOpenStockDialog(false);
    setSelectedStockBalances([]);
    setSelectedProductName('');
  };

  // Updated: Validate quantity against store balance - if store not in balances, balance is 0
  const validateQuantity = (itemIndex: number, quantity: number, storeId: number | null) => {
    const item = requisitionProductItem[itemIndex];
    if (!item) return;

    const stockBalances = Array.isArray((item as any).stock_balances)
      ? (item as any).stock_balances
      : [];

    // If no store selected, clear any errors
    if (!storeId) {
      setQuantityErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[itemIndex];
        return newErrors;
      });
      return;
    }

    // Find the selected store balance - if not found, balance is 0
    const selectedStoreBalance = stockBalances.find(
      (balance: any) => balance.store_id === storeId
    );
    
    // If store not found in balances, available balance is 0
    const availableBalance = selectedStoreBalance ? Number(selectedStoreBalance.balance || 0) : 0;

    // If quantity is 0 or negative, no need to validate
    if (quantity <= 0) {
      setQuantityErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[itemIndex];
        return newErrors;
      });
      return;
    }

    if (quantity > availableBalance) {
      setQuantityErrors((prev) => ({
        ...prev,
        [itemIndex]: `Quantity ${quantity.toLocaleString()} exceeds available store balance ${availableBalance.toLocaleString()}`
      }));
    } else {
      setQuantityErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[itemIndex];
        return newErrors;
      });
    }
  };

  // Handle quantity change with validation
  const handleQuantityChange = (itemIndex: number, value: any) => {
    const sanitizedValue = sanitizedNumber(value);
    const quantity = Number.isFinite(sanitizedValue) ? sanitizedValue : 0;
    
    handleItemChange({
      index: itemIndex,
      key: 'quantity',
      value: quantity,
    });

    const item = requisitionProductItem[itemIndex];
    const storeId = (item as any).store_id || null;
    validateQuantity(itemIndex, quantity, storeId);
  };

  // Handle store change with validation
  const handleStoreChange = (itemIndex: number, store: any) => {
    const storeId = store?.id || null;
    
    handleItemChange({
      index: itemIndex,
      key: 'store_id',
      value: storeId,
    });

    const item = requisitionProductItem[itemIndex];
    const quantity = Number(item.quantity || 0);
    validateQuantity(itemIndex, quantity, storeId);
  };

  return (
    <React.Fragment>
      {requisitionProductItem.map(
        (item: RequisitionItem, itemIndex: number) => {
          if (isMaterialMode) {
            const fulfillmentType = String(
              (item as any).fulfillment_type || 'PURCHASE'
            );
            const stockBalances = Array.isArray((item as any).stock_balances)
              ? (item as any).stock_balances
              : [];

            // Determine how many stores to show inline
            const maxStoresToShow = 2;
            const displayedBalances = stockBalances.slice(0, maxStoresToShow);
            const remainingCount = stockBalances.length - maxStoresToShow;
            const hasManyStores = stockBalances.length > maxStoresToShow;

            // Check if there's a quantity error for this item
            const quantityError = quantityErrors[itemIndex];
            const storeId = (item as any).store_id || null;
            
            // Find the selected store balance - if not found, balance is 0
            const selectedStoreBalance = stockBalances.find(
              (balance: any) => balance.store_id === storeId
            );
            // If store not found in balances, available balance is 0
            const availableBalance = selectedStoreBalance ? Number(selectedStoreBalance.balance || 0) : 0;

            return (
              <Grid
                container
                key={`${item.id}-${itemIndex}`}
                spacing={1}
                pb={2}
                pr={0.5}
                sx={{
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                }}
              >
                <Grid size={{ xs: 12 }}>
                  <Divider sx={{ pb: 2 }} />
                </Grid>
                <Grid size={{ xs: 1 }}>
                  <Div sx={{ mt: 2, mb: 1.7 }}>{itemIndex + 1}.</Div>
                </Grid>
                <Grid size={{ xs: 11, md: 4 }}>
                  <Div sx={{ mt: 1, mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography>{item.product?.name}</Typography>
                      {stockBalances.length > 0 && (
                        <Tooltip title="View all store balances">
                          <IconButton
                            size="small"
                            color="default"
                            onClick={() => handleOpenStockDialog(
                              stockBalances,
                              item.product?.name || 'Product'
                            )}
                            sx={{ ml: 0.5 }}
                          >
                            <StorageOutlined fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </Div>
                </Grid>
                <Grid size={{ xs: 12, md: 2 }}>
                  <TextField
                    label='Quantity'
                    fullWidth
                    size='small'
                    defaultValue={item.quantity}
                    onChange={(e) => handleQuantityChange(itemIndex, e.target.value)}
                    error={!!quantityError || !!errors?.[itemIndex]?.quantity}
                    helperText={quantityError || errors?.[itemIndex]?.quantity?.message || ''}
                    InputProps={{
                      inputComponent: CommaSeparatedField,
                      endAdornment: (
                        <InputAdornment position='end'>
                          {item.measurement_unit?.symbol}
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 2 }}>
                  <TextField
                    select
                    label='Fulfillment'
                    size='small'
                    fullWidth
                    value={fulfillmentType}
                    error={!!errors?.[itemIndex]?.fulfillment_type}
                    helperText={
                      errors?.[itemIndex]?.fulfillment_type?.message || ''
                    }
                    onChange={(e) =>
                      handleItemChange({
                        index: itemIndex,
                        key: 'fulfillment_type',
                        value: e.target.value,
                      })
                    }
                  >
                    <MenuItem value='STOCK'>Stock</MenuItem>
                    <MenuItem value='PURCHASE'>Purchase</MenuItem>
                    <MenuItem value='IMPREST'>Imprest</MenuItem>
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  {fulfillmentType === 'STOCK' ? (
                    <StoreSelector
                      label='Store'
                      frontError={errors?.[itemIndex]?.store_id}
                      multiple={false}
                      defaultValue={(item as any).store || null}
                      onChange={(store: any) => handleStoreChange(itemIndex, store)}
                    />
                  ) : (
                    <TextField
                      label='Rate'
                      fullWidth
                      size='small'
                      value={Number(item.rate || 0).toLocaleString()}
                      error={!!errors?.[itemIndex]?.rate}
                      helperText={errors?.[itemIndex]?.rate?.message || ''}
                      InputProps={{
                        inputComponent: CommaSeparatedField,
                      }}
                      onChange={(e) =>
                        handleItemChange({
                          index: itemIndex,
                          key: 'rate',
                          value: sanitizedNumber(e.target.value),
                        })
                      }
                    />
                  )}
                </Grid>
                <Grid size={{ xs: 12, md: 9 }}>
                  <TextField
                    label='Remarks'
                    fullWidth
                    size='small'
                    defaultValue={item.remarks}
                    onChange={(e) =>
                      handleItemChange({
                        index: itemIndex,
                        key: 'remarks',
                        value: e.target.value,
                      })
                    }
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }} textAlign='end'>
                  <Tooltip title='Split this item'>
                    <IconButton
                      size='small'
                      color='primary'
                      onClick={() => handleSplitItem(itemIndex)}
                    >
                      <CallSplitOutlinedIcon fontSize='small' />
                    </IconButton>
                  </Tooltip>
                  {requisitionProductItem.length > 1 && (
                    <Tooltip title='Delete item'>
                      <IconButton
                        size='small'
                        color='error'
                        onClick={() => handleDeleteItem(itemIndex)}
                      >
                        <DeleteIcon fontSize='small' />
                      </IconButton>
                    </Tooltip>
                  )}
                </Grid>
              </Grid>
            );
          }

          // Non-material mode (purchase type)
          const vat_factor = (item.vat_percentage || 0) * 0.01;
          const rate = item.rate || 0;
          const itemState = vatFieldStates[itemIndex] || ({} as ItemState);

          return (
            <Grid
              container
              key={`${item.id}-${itemIndex}`}
              spacing={1}
              pb={2}
              pr={0.5}
              sx={{
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: 'action.hover',
                },
              }}
            >
              <Grid size={{ xs: 12 }}>
                <Divider sx={{ borderColor: 'primary.main', pb: 2 }} />
              </Grid>
              <Grid size={{ xs: 1 }}>
                <Div sx={{ mt: 2, mb: 1.7 }}>{itemIndex + 1}.</Div>
              </Grid>
              <Grid size={{ xs: 11, md: 3, lg: 3 }}>
                <Div
                  sx={{ mt: 1, mb: 1.7, display: 'flex', alignItems: 'center' }}
                >
                  <Tooltip title='Product'>
                    <Typography>{item.product?.name}</Typography>
                  </Tooltip>
                  {item.product && canSeeBudget && (
                    <Tooltip title={`${item.product.name} Budget check`}>
                      <IconButton
                        size='small'
                        sx={{ ml: 1 }}
                        onClick={() => {
                          setProductDialogData({
                            productId: item.product.id,
                            costCenterId: requisition.cost_center?.id,
                            productName: item.product.name,
                            measurementUnit: item?.measurement_unit,
                            currency: requisition.currency,
                          });
                          setOpenProductBudgetDialog(true);
                        }}
                      >
                        <AccountBalanceWalletOutlined fontSize='small' />
                      </IconButton>
                    </Tooltip>
                  )}
                </Div>
              </Grid>
              <ProductBudgetCheckDetails
                requisition={requisition}
                open={openProductBudgetDialog}
                onClose={() => setOpenProductBudgetDialog(false)}
                productId={productDialogData?.productId || 0}
                costCenterId={productDialogData?.costCenterId || 0}
                productName={productDialogData?.productName || ''}
                measurementUnit={
                  productDialogData?.measurementUnit as MeasurementUnit
                }
                currency={productDialogData?.currency as Currency}
              />
              <Grid size={{ xs: 6, md: 1.5, lg: 1.5 }}>
                <Div sx={{ mt: 1 }}>
                  <TextField
                    label='Quantity'
                    fullWidth
                    size='small'
                    defaultValue={item.quantity}
                    onChange={(e) =>
                      handleItemChange({
                        index: itemIndex,
                        key: 'quantity',
                        value: sanitizedNumber(e.target.value),
                      })
                    }
                    error={!!errors?.[itemIndex]?.quantity}
                    helperText={errors?.[itemIndex]?.quantity?.message || ''}
                    InputProps={{
                      inputComponent: CommaSeparatedField,
                      endAdornment: (
                        <InputAdornment position='end'>
                          {item.measurement_unit?.symbol}
                        </InputAdornment>
                      ),
                    }}
                  />
                </Div>
              </Grid>
              <Grid size={{ xs: 6, md: 1, lg: 1 }}>
                <Typography align='left' variant='body2'>
                  VAT
                  <Checkbox
                    size='small'
                    checked={!!item.vat_percentage}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      handleItemChange({
                        index: itemIndex,
                        key: 'vat_percentage',
                        value: checked
                          ? authOrganization?.organization?.settings
                              ?.vat_percentage || 0
                          : 0,
                      });
                    }}
                  />
                </Typography>
              </Grid>
              <Grid
                size={{ xs: 6, md: vat_factor ? 2 : 4, lg: vat_factor ? 2 : 4 }}
              >
                <Div sx={{ mt: 1 }}>
                  <TextField
                    key={`price-${fieldKeys[itemIndex]?.priceKey || 0}`}
                    size='small'
                    label='Rate'
                    fullWidth
                    error={!!errors?.[itemIndex]?.rate}
                    helperText={errors?.[itemIndex]?.rate?.message || ''}
                    value={
                      itemState.isVatfieldChange
                        ? (
                            Math.round(
                              (priceInclusiveVATs[itemIndex]
                                ?.priceInclusiveVAT || 0) * 100000
                            ) /
                            100000 /
                            (1 + vat_factor)
                          ).toLocaleString()
                        : rate.toLocaleString()
                    }
                    InputProps={{
                      inputComponent: CommaSeparatedField,
                    }}
                    onChange={(e) => {
                      updateItemState(itemIndex, {
                        isVatfieldChange: false,
                        priceInclusiveVAT: 0,
                      });
                      handleItemChange({
                        index: itemIndex,
                        key: 'rate',
                        value: sanitizedNumber(e.target.value),
                      });
                      updateItemState(itemIndex, {
                        vatKey: (fieldKeys[itemIndex]?.vatKey || 0) + 1,
                      });
                    }}
                  />
                </Div>
              </Grid>
              {!!vat_factor && (
                <Grid size={{ xs: 6, md: 2, lg: 2 }}>
                  <Div sx={{ mt: 1 }}>
                    <TextField
                      key={`vat-${fieldKeys[itemIndex]?.vatKey || 0}`}
                      label='Rate (VAT Inclusive)'
                      size='small'
                      fullWidth
                      error={!!errors?.[itemIndex]?.rate}
                      helperText={errors?.[itemIndex]?.rate?.message || ''}
                      value={
                        itemState.isVatfieldChange
                          ? (
                              Math.round(
                                (priceInclusiveVATs[itemIndex]
                                  ?.priceInclusiveVAT || 0) * 100000
                              ) / 100000
                            ).toLocaleString()
                          : (rate * (1 + vat_factor)).toLocaleString()
                      }
                      InputProps={{
                        inputComponent: CommaSeparatedField,
                      }}
                      onChange={(e) => {
                        const newValue = sanitizedNumber(e.target.value);
                        updateItemState(itemIndex, {
                          isVatfieldChange: true,
                          priceInclusiveVAT: newValue,
                        });
                        handleItemChange({
                          index: itemIndex,
                          key: 'rate',
                          value: newValue / (1 + vat_factor),
                        });
                        updateItemState(itemIndex, {
                          priceKey: (fieldKeys[itemIndex]?.priceKey || 0) + 1,
                        });
                      }}
                    />
                  </Div>
                </Grid>
              )}
              <Grid
                size={{
                  xs: vat_factor ? 12 : 6,
                  md: 1.5,
                  lg: 1.5,
                }}
              >
                <Div sx={{ mt: 1 }}>
                  <Tooltip title='Amount'>
                    <Typography>
                      {(
                        item.quantity *
                        item.rate *
                        (1 + vat_factor)
                      ).toLocaleString()}
                    </Typography>
                  </Tooltip>
                </Div>
              </Grid>
              <Grid
                size={{
                  xs: requisitionProductItem.length > 1 ? 11 : 12,
                  md: 10.5,
                  lg: 10.5,
                }}
              >
                <Div sx={{ mt: 1 }}>
                  <TextField
                    label='Remarks'
                    fullWidth
                    size='small'
                    defaultValue={item.remarks}
                    onChange={(e) =>
                      handleItemChange({
                        index: itemIndex,
                        key: 'remarks',
                        value: e.target.value,
                      })
                    }
                  />
                </Div>
              </Grid>
              {requisitionProductItem.length > 1 && (
                <Grid
                  textAlign={'end'}
                  size={{
                    xs: 1,
                    md: 1.5,
                    lg: 1.5,
                  }}
                >
                  <Div sx={{ mt: 1.5, mb: 0.5 }}>
                    <Tooltip title='Delete item'>
                      <IconButton
                        size='small'
                        color='error'
                        onClick={() => handleDeleteItem(itemIndex)}
                      >
                        <DeleteIcon fontSize='small' />
                      </IconButton>
                    </Tooltip>
                  </Div>
                </Grid>
              )}
              <Grid size={{ xs: 12 }}>
                <Tabs
                  value={0}
                  textColor='primary'
                  indicatorColor='primary'
                  sx={{ mt: 2 }}
                >
                  <Tab label='VENDORS' />
                </Tabs>
                <Vendors
                  key={item.id}
                  index={itemIndex}
                  setRequisition_product_items={setRequisitionProductItem}
                  product_item={item}
                />
              </Grid>
            </Grid>
          );
        }
      )}

      {sourceItemsCount > 1 &&
        requisitionProductItem.length < initialItems.length && (
          <Box
            sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, mb: 2 }}
          >
            <Tooltip title='Restore all deleted items' arrow placement='top'>
              <Button
                variant='outlined'
                color='secondary'
                size='small'
                startIcon={<Restore />}
                onClick={handleResetItems}
              >
                Reset
              </Button>
            </Tooltip>
          </Box>
        )}

      {/* Stock Balances Dialog */}
      <Dialog
        open={openStockDialog}
        onClose={handleCloseStockDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6">
            Store Balances - {selectedProductName}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{fontWeight: 'bold' }}>
                    Store Name
                  </TableCell>
                  <TableCell sx={{fontWeight: 'bold' }} align="right">
                    Balance
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {selectedStockBalances.length > 0 ? (
                  selectedStockBalances.map((balance, index) => (
                    <TableRow
                      key={balance.store_id || index}
                      sx={{
                        '&:nth-of-type(even)': {
                          backgroundColor: 'action.hover',
                        },
                      }}
                    >
                      <TableCell>{balance.store_name}</TableCell>
                      <TableCell align="right">
                        {Number(balance.balance || 0).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={2} align="center">
                      <Typography variant="body2" color="text.secondary">
                        No store balances available
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 2 }}>
          <Button variant="contained" onClick={handleCloseStockDialog}>
            Close
          </Button>
        </Box>
      </Dialog>
    </React.Fragment>
  );
}

export default ApprovalRequisitionProductItem;