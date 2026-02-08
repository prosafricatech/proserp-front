import React from 'react';
import { Grid, Divider, Typography, TextField, Tooltip, IconButton, Checkbox } from '@mui/material';
import { DisabledByDefault } from '@mui/icons-material';
import { Div } from '@jumbo/shared';
import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { MeasurementUnit } from '@/components/masters/measurementUnits/MeasurementUnitType';
import { Product } from '@/components/productAndServices/products/ProductType';

interface OrderItem {
  vat_percentage?: number;
  unordered_quantity: number;
  quantity: number;
  rate: number;
  product: Product;
  measurement_unit?: MeasurementUnit;
  unit_symbol?: string;
}

interface ApprovedPurchaseItemFormProps {
  handleItemChange: (index: number, key: string, value: any) => void;
  items: OrderItem[];
  approvedDetails?: boolean;
}

function ApprovedPurchaseItemForm({ handleItemChange, items, approvedDetails }: ApprovedPurchaseItemFormProps) {
    const { authOrganization } = useJumboAuth();

    const filteredItems = approvedDetails
        ? items.filter(item => item.unordered_quantity > 0)
        : items;

    return (
        <React.Fragment>
            {filteredItems.map((item, itemIndex) => {
                const vat_factor = (item.vat_percentage || 0) * 0.01;
                const unitSymbol = item?.unit_symbol || item.measurement_unit?.symbol || item.product.unit_symbol || '';

                return (
                    <Grid
                        container
                        key={`item-${itemIndex}`}
                        columnSpacing={1}
                        paddingBottom={2}
                        paddingRight={0.5}
                        sx={{
                            cursor: 'pointer',
                            '&:hover': {
                                bgcolor: 'action.hover',
                            },
                        }}
                    >
                        <Grid size={{xs: 12}}>
                            <Divider />
                        </Grid>
                        <Grid size={{xs: 0.5}}>
                            <Div sx={{ mt: 2, mb: 1.7 }}>{itemIndex + 1}.</Div>
                        </Grid>
                        <Grid size={{xs: 11.5, md: 4, lg: 3}}>
                            <Div sx={{ mt: 2, mb: 1.7 }}>
                                <Tooltip title="Product">
                                    <Typography>{item.product.name}</Typography>
                                </Tooltip>
                            </Div>
                        </Grid>
                        <Grid size={{xs: 6, md: 5, lg: 1.5}}>
                            <Div sx={{ mt: 2, mb: 1.7 }}>
                                <Tooltip title="Unordered Quantity">
                                    <span>
                                        {item.unordered_quantity.toLocaleString()} {unitSymbol}
                                    </span>
                                </Tooltip>
                            </Div>
                        </Grid>
                        <Grid size={{xs: 6, md: 2.5, lg: 1.5}}>
                            <Div sx={{ mt: 1, mb: 0.5 }}>
                                <TextField
                                    label="Quantity"
                                    fullWidth
                                    size="small"
                                    defaultValue={
                                        approvedDetails ? item.unordered_quantity : item.quantity
                                    }
                                    onChange={(e) => {
                                        const sanitizedValue = sanitizedNumber(e.target.value);
                                        handleItemChange(itemIndex, 'quantity', sanitizedValue);
                                    }}
                                    InputProps={{
                                        inputComponent: CommaSeparatedField,
                                    }}
                                    error={item.quantity > item.unordered_quantity}
                                    helperText={
                                        item.quantity > item.unordered_quantity
                                            ? 'Quantity cannot exceed unordered quantity'
                                            : ''
                                    }
                                />
                            </Div>
                        </Grid>
                        <Grid size={{xs: 12, md: 1, lg: 1}}>
                            <Typography align='left' variant='body2'>
                                VAT
                                <Checkbox
                                    size='small'
                                    checked={!!item.vat_percentage}
                                    disabled
                                    onChange={(e) => {
                                        const checked = e.target.checked;
                                        handleItemChange(
                                            itemIndex, 
                                            'vat_percentage', 
                                            checked ? authOrganization?.organization.settings.vat_percentage : 0
                                        );
                                    }} 
                                />
                            </Typography>
                        </Grid>
                        <Grid
                            size={{
                                xs: vat_factor ? 4 : 5,
                                md: vat_factor ? 3 : 5,
                                lg: vat_factor ? 1.5 : 2
                            }}
                            textAlign={{ md: 'end' }}
                        >
                            <Div sx={{ mt: 2, mb: 1.7 }}>
                                <Tooltip title="Price">
                                    <Typography>{item.rate.toLocaleString()}</Typography>
                                </Tooltip>
                            </Div>
                        </Grid>
                        {!!vat_factor && (
                            <Grid 
                                size={{xs: 4, md: 2, lg: 1}}
                                textAlign={'end'}
                            >
                                <Div sx={{ mt: 2, mb: 1.7 }}>
                                    <Tooltip title="VAT">
                                        <Typography>
                                            {(item.rate * vat_factor).toLocaleString()}
                                        </Typography>
                                    </Tooltip>
                                </Div>
                            </Grid>
                        )}
                        <Grid
                            size={{
                                xs: vat_factor ? 4 : 6,
                                md: 6,
                                lg: vat_factor ? 1.5 : 2
                            }}
                            textAlign={'end'}
                        >
                            <Div sx={{ mt: 2, mb: 1.7 }}>
                                <Tooltip title="Amount">
                                    <Typography>
                                        {(item.quantity * item.rate * (1 + vat_factor)).toLocaleString()}
                                    </Typography>
                                </Tooltip>
                            </Div>
                        </Grid>
                        {items.filter(item => item.unordered_quantity > 0).length > 1 && (
                            <Grid 
                                size={{
                                    xs: vat_factor ? 12 : 1,
                                    md: 0.5
                                }}
                                textAlign={'end'}
                            >
                                <Div sx={{ mt: 1, mb: 1.7 }}>
                                    <Tooltip title="Remove Item">
                                        <IconButton
                                            size="small"
                                            onClick={() => handleItemChange(itemIndex, 'delete', true)}
                                        >
                                            <DisabledByDefault fontSize="small" color="error" />
                                        </IconButton>
                                    </Tooltip>
                                </Div>
                            </Grid>
                        )}
                    </Grid>
                );
            })}
        </React.Fragment>
    );
}

export default React.memo(ApprovedPurchaseItemForm);