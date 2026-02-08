import React, { useEffect, useState } from 'react';
import { Divider, Typography, TextField, Tabs, Tab, Tooltip, InputAdornment, Checkbox, IconButton, Box, Button, Grid } from '@mui/material';
import Vendors from './Vendors';
import DeleteIcon from '@mui/icons-material/Delete';
import { Restore } from '@mui/icons-material';
import { Div } from '@jumbo/shared';
import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { Approval, Requisition, RequisitionItem } from '@/components/processApproval/RequisitionType';

interface ApprovalRequisitionProductItemProps {
    approval?: Approval;
    requisition: Requisition;
    errors: any
    handleItemChange: any
    requisitionProductItem: RequisitionItem[];
    setRequisitionProductItem: (items: RequisitionItem[]) => void;
}

interface ItemState {
    isVatfieldChange: boolean;
    priceInclusiveVAT: number;
    priceKey: number;
    vatKey: number;
}

function ApprovalRequisitionProductItem({ 
    approval, 
    requisition, 
    errors, 
    handleItemChange, 
    requisitionProductItem, 
    setRequisitionProductItem 
}: ApprovalRequisitionProductItemProps) {
    const { authOrganization } = useJumboAuth();
    const [initialItems, setInitialItems] = useState<RequisitionItem[]>([]);
    
    const [vatFieldStates, setVatFieldStates] = useState<Record<number, ItemState>>({});
    const [priceInclusiveVATs, setPriceInclusiveVATs] = useState<Record<number, ItemState>>({});
    const [fieldKeys, setFieldKeys] = useState<Record<number, ItemState>>({});

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
                vatKey: 0
            };
        });
        setVatFieldStates(initialStates);
        setPriceInclusiveVATs(initialStates);
        setFieldKeys(initialStates);
    }, [requisitionProductItem]);

    const updateItemState = (index: number, updates: Partial<ItemState>) => {
        setVatFieldStates(prev => ({...prev, [index]: {...prev[index], ...updates}}));
        setPriceInclusiveVATs(prev => ({...prev, [index]: {...prev[index], ...updates}}));
        setFieldKeys(prev => ({...prev, [index]: {...prev[index], ...updates}}));
    };

    const handleDeleteItem = (index: number) => {
        const updatedItems = [...requisitionProductItem];
        updatedItems.splice(index, 1);
        setRequisitionProductItem(updatedItems);
    };

    const handleResetItems = () => {
        setRequisitionProductItem([...initialItems]);
    };

    return (
        <React.Fragment>
            {requisitionProductItem.map((item: RequisitionItem, itemIndex: number) => {
                const vat_factor = (item.vat_percentage || 0) * 0.01;
                const rate = item.rate || 0;
                const itemState = vatFieldStates[itemIndex] || {} as ItemState;

                return (
                    <Grid 
                        container
                        key={item.id}
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
                        <Grid size={{xs: 12}}>
                            <Divider sx={{ borderColor: 'primary.main', pb: 2 }} />
                        </Grid>
                        <Grid size={{xs: 1}}>
                            <Div sx={{ mt: 2, mb: 1.7 }}>{itemIndex + 1}.</Div>
                        </Grid>
                        <Grid size={{xs: 11, md: 3, lg: 3}}>
                            <Div sx={{ mt: 2, mb: 1.7 }}>
                                <Tooltip title="Product">
                                    <Typography>{item.product?.name}</Typography>
                                </Tooltip>
                            </Div>
                        </Grid>
                        <Grid size={{xs: 6, md: 1.5, lg: 1.5}}>
                            <Div sx={{ mt: 1}}>
                                <TextField
                                    label="Quantity"
                                    fullWidth
                                    size="small"
                                    defaultValue={item.quantity}
                                    onChange={(e) => handleItemChange({ 
                                        index: itemIndex, 
                                        key: 'quantity', 
                                        value: sanitizedNumber(e.target.value) 
                                    })}
                                    error={!!errors?.[itemIndex]?.quantity}
                                    helperText={errors?.[itemIndex]?.quantity?.message || ''}
                                    InputProps={{
                                        inputComponent: CommaSeparatedField,
                                        endAdornment: <InputAdornment position="end">{item.measurement_unit?.symbol}</InputAdornment>,
                                    }}
                                />
                            </Div>
                        </Grid>
                        <Grid size={{xs: 6, md: 1, lg: 1}}>
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
                                            value: checked ? authOrganization?.organization?.settings?.vat_percentage || 0 : 0
                                        });
                                    }} 
                                />
                            </Typography>
                        </Grid>
                        <Grid size={{xs: 6, md: vat_factor ? 2 : 4, lg: vat_factor ? 2 : 4}}>
                            <Div sx={{ mt: 1}}>
                                <TextField
                                    key={`price-${fieldKeys[itemIndex]?.priceKey || 0}`}
                                    size='small'
                                    label='Rate'
                                    fullWidth
                                    error={!!errors?.[itemIndex]?.rate}
                                    helperText={errors?.[itemIndex]?.rate?.message || ''}
                                    value={itemState.isVatfieldChange 
                                        ? ((Math.round((priceInclusiveVATs[itemIndex]?.priceInclusiveVAT || 0) * 100000)/100000) / (1 + vat_factor)).toLocaleString()
                                        : rate.toLocaleString()
                                    }
                                    InputProps={{
                                        inputComponent: CommaSeparatedField,
                                    }}
                                    onChange={(e) => {
                                        updateItemState(itemIndex, {
                                            isVatfieldChange: false,
                                            priceInclusiveVAT: 0
                                        });
                                        handleItemChange({
                                            index: itemIndex, 
                                            key: 'rate', 
                                            value: sanitizedNumber(e.target.value)
                                        });
                                        updateItemState(itemIndex, {
                                            vatKey: (fieldKeys[itemIndex]?.vatKey || 0) + 1
                                        });
                                    }}
                                />     
                            </Div>
                        </Grid>
                        {!!vat_factor && (
                            <Grid size={{xs: 6, md: 2, lg: 2}}>
                                <Div sx={{ mt: 1}}>
                                    <TextField
                                        key={`vat-${fieldKeys[itemIndex]?.vatKey || 0}`}
                                        label='Rate (VAT Inclusive)'
                                        size='small'
                                        fullWidth
                                        error={!!errors?.[itemIndex]?.rate}
                                        helperText={errors?.[itemIndex]?.rate?.message || ''}
                                        value={
                                            itemState.isVatfieldChange
                                                ? (Math.round((priceInclusiveVATs[itemIndex]?.priceInclusiveVAT || 0) * 100000) / 100000).toLocaleString()
                                                : (rate * (1 + vat_factor)).toLocaleString()
                                        }
                                        InputProps={{
                                            inputComponent: CommaSeparatedField,
                                        }}
                                        onChange={(e) => {
                                            const newValue = sanitizedNumber(e.target.value);
                                            updateItemState(itemIndex, {
                                                isVatfieldChange: true,
                                                priceInclusiveVAT: newValue
                                            });
                                            handleItemChange({
                                                index: itemIndex, 
                                                key: 'rate', 
                                                value: newValue / (1 + vat_factor)
                                            });
                                            updateItemState(itemIndex, {
                                                priceKey: (fieldKeys[itemIndex]?.priceKey || 0) + 1
                                            });
                                        }}
                                    />  
                                </Div>
                            </Grid>
                        )}
                        <Grid size={{
                            xs: vat_factor ? 12 : 6,
                            md: 1.5,
                            lg: 1.5
                        }}>
                            <Div sx={{ mt: 1}}>
                                <Tooltip title="Amount">
                                    <Typography>
                                        {(item.quantity * item.rate * (1 + vat_factor)).toLocaleString()}
                                    </Typography>
                                </Tooltip>
                            </Div>
                        </Grid>
                        <Grid size={{
                            xs: requisitionProductItem.length > 1 ? 11 : 12,
                            md: 5.5,
                            lg: 5.5
                        }}>
                            <Div sx={{ mt: 1}}>
                                <TextField
                                    label="Remarks"
                                    fullWidth
                                    size="small"
                                    defaultValue={item.remarks}
                                    onChange={(e) => handleItemChange({
                                        index: itemIndex, 
                                        key: 'remarks', 
                                        value: e.target.value
                                    })}
                                />
                            </Div>
                        </Grid>
                        {requisitionProductItem.length > 1 && (
                            <Grid size={{
                                xs: 1,
                                md: 6.5,
                                lg: 6.5
                            }}>
                                <Div sx={{ mt: 1.5, mb: 0.5 }}>
                                    <Tooltip title="Delete item">
                                        <IconButton 
                                            size="small" 
                                            color="error"
                                            onClick={() => handleDeleteItem(itemIndex)}
                                        >
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                </Div>
                            </Grid>
                        )}
                        <Grid size={{xs: 12}}>
                            <Tabs value={0} textColor="primary" indicatorColor="primary" sx={{ mt: 2 }}>
                                <Tab label="VENDORS" />
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
            })}

            {(approval ? approval : requisition)?.items?.length > 1 && requisitionProductItem.length < initialItems.length && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, mb: 2 }}>
                    <Tooltip title="Restore all deleted items" arrow placement="top">
                        <Button
                            variant="outlined"
                            color="secondary"
                            size='small'
                            startIcon={<Restore />}
                            onClick={handleResetItems}
                        >
                            Reset
                        </Button>
                    </Tooltip>
                </Box>
            )}
        </React.Fragment>
    );
}

export default ApprovalRequisitionProductItem;