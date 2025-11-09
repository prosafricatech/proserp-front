'use client';

import { DisabledByDefault, EditOutlined } from '@mui/icons-material'
import { Divider, Grid, IconButton, Tooltip, Typography } from '@mui/material'
import React, { useState } from 'react'
import { useFormContext } from 'react-hook-form';
import FuelVouchers from './FuelVouchers';
import { useProductsSelect } from '@/components/productAndServices/products/ProductsSelectProvider';

// Type definitions
interface Stakeholder {
  id: number;
  name: string;
  [key: string]: any;
}

interface Product {
  id: number;
  name: string;
  [key: string]: any;
}

interface Ledger {
  id: number;
  name: string;
  [key: string]: any;
}

interface ProductPrice {
  product_id: number;
  price: number;
  [key: string]: any;
}

interface FuelVoucherData {
  id?: number;
  product_id: number;
  quantity: number;
  amount?: number;
  reference?: string | null;
  narration?: string | null;
  stakeholder?: Stakeholder | null;
  expense_ledger?: Ledger | null;
  [key: string]: any;
}

interface FuelVouchersItemRowProps {
  fuelVoucher: FuelVoucherData;
  index: number;
  productPrices: ProductPrice[];
}

interface FormContextType {
  fuelVouchers: FuelVoucherData[];
  setFuelVouchers: (vouchers: FuelVoucherData[] | ((prev: FuelVoucherData[]) => FuelVoucherData[])) => void;
  [key: string]: any;
}

function FuelVouchersItemRow({ fuelVoucher, index, productPrices }: FuelVouchersItemRowProps) {
    const { productOptions } = useProductsSelect();
    const { fuelVouchers = [], setFuelVouchers } = useFormContext() as unknown as FormContextType;

    const product = productOptions.find((product: Product) => product.id === fuelVoucher.product_id);
    const client = fuelVoucher.stakeholder;
    const expense_ledger = fuelVoucher.expense_ledger;
    const product_price = productPrices?.find((price: ProductPrice) => price?.product_id === product?.id)?.price || 0;
    const [showForm, setShowForm] = useState<boolean>(false);

    const handleRemove = () => {
        setFuelVouchers((prev: FuelVoucherData[]) => {
            const newItems = [...prev];
            newItems.splice(index, 1);
            return newItems;
        });
    };

    return (
         <React.Fragment>
            <Divider/>
            {!showForm ? (
                    <Grid container 
                        sx={{
                            cursor: 'pointer',
                            '&:hover': {
                                bgcolor: 'action.hover',
                            }
                        }}
                    >
                        <Grid size={{xs:1, md:0.5}}>
                            <Typography>{(index + 1).toString()}.</Typography>
                        </Grid>
                        <Grid 
                            size={{
                                xs: 5,
                                md: expense_ledger ? 4.5 : 4,
                                lg: expense_ledger ? 2 : 3
                            }}
                            >
                            <Tooltip title="Client">
                                <Typography>{client ? client.name : 'Internal use'}</Typography>
                            </Tooltip>
                        </Grid>
                        {expense_ledger && (
                            <Grid size={{xs:6, md:2.5, lg:1.5}}>
                                <Tooltip title="Expense Ledger">
                                    <Typography>{expense_ledger.name}</Typography>
                                </Tooltip>
                            </Grid>
                        )}
                        <Grid 
                            size={{
                                xs: 6,
                                md: expense_ledger ? 3.5 : 5,
                                lg: expense_ledger ? 2 : 2.5
                            }}
                            >
                            <Tooltip title="Product">
                                <Typography>{product?.name || 'N/A'}</Typography>
                            </Tooltip>
                        </Grid>
                        <Grid size={{xs:6, md:1, lg:1}}>
                            <Tooltip title="Quantity">
                                <Typography>{fuelVoucher.quantity.toLocaleString()}</Typography>
                            </Tooltip>
                        </Grid>
                        <Grid  
                            size={{
                                xs: 6,
                                md: expense_ledger ? 3 : 1,
                                lg: 1
                            }}
                            >
                            <Tooltip title="Amount">
                                <Typography>{(product_price * fuelVoucher.quantity).toLocaleString()}</Typography>
                            </Tooltip>
                        </Grid>
                       <Grid size={{xs:6, md:5, lg:1.5}}>
                            <Tooltip title="Reference">
                                <Typography>{fuelVoucher.reference || '-'}</Typography>
                            </Tooltip>
                        </Grid>
                        <Grid size={{xs:6, md:4, lg:1.5}}>
                            <Tooltip title="Narration">
                                <Typography>{fuelVoucher.narration || '-'}</Typography>
                            </Tooltip>
                        </Grid>
                         <Grid size={{xs:6, md:4, lg:1.5}}  textAlign={'end'}>
                            <Tooltip title='Edit Fuel Voucher'>
                                <IconButton size='small' onClick={() => {setShowForm(true)}}>
                                    <EditOutlined fontSize='small'/>
                                </IconButton>
                            </Tooltip>
                            <Tooltip title='Remove Fuel Voucher'>
                                <IconButton size='small' onClick={handleRemove}>
                                    <DisabledByDefault fontSize='small' color='error'/>
                                </IconButton>
                            </Tooltip>
                        </Grid>
                    </Grid>
                ) : (
                    <FuelVouchers 
                        productPrices={productPrices} 
                        fuelVoucher={fuelVoucher} 
                        setShowForm={setShowForm} 
                        index={index}
                    />
                )
            }
        </React.Fragment>
  )
}

export default FuelVouchersItemRow;