import { DisabledByDefault, EditOutlined } from '@mui/icons-material'
import { Divider, Grid, IconButton, Tooltip, Typography } from '@mui/material'
import React, { useState } from 'react'
import FuelVouchers from './FuelVouchers';
import { useProductsSelect } from '@/components/productAndServices/products/ProductsSelectProvider';

function FuelVouchersItemRow({ fuelVoucher, index, productPrices, fuelVouchers=[], setFuelVouchers, cashierPumpProducts}) {
    const { productOptions } = useProductsSelect();

    const product = productOptions.find(product => product.id === fuelVoucher.product_id);
    const client = fuelVoucher.stakeholder;
    const expense_ledger = fuelVoucher.expense_ledger && fuelVoucher.expense_ledger;
    const product_price = productPrices?.find(price => price?.product_id === product.id)?.price || 0
    const [showForm, setShowForm] = useState(false);

  return (
         <React.Fragment>
            <Divider/>
            { !showForm ? (
                    <Grid container 
                        sx={{
                            cursor: 'pointer',
                            '&:hover': {
                                bgcolor: 'action.hover',
                            }
                        }}
                    >
                       <Grid size={{xs: 1, md: 0.5}}>
                            {index+1}.
                        </Grid>
                        <Grid size={{xs:5, md:!!expense_ledger ? 4.5 : 4, lg:!!expense_ledger ? 2 : 3}}>
                            <Tooltip title="Client">
                                <Typography>{client ? client.name : 'Internal use'}</Typography>
                            </Tooltip>
                        </Grid>
                        {!!expense_ledger &&
                            <Grid size={{xs: 6, md: 2.5, lg: 1.5}}>
                                <Tooltip title="Expense Ledger">
                                    <Typography>{expense_ledger.name}</Typography>
                                </Tooltip>
                            </Grid>
                        }
                        <Grid size={{xs:6, md:!!expense_ledger ? 3.5 : 5, lg:!!expense_ledger ? 2 : 2.5}}>
                            <Tooltip title="Product">
                                <Typography>{product.name}</Typography>
                            </Tooltip>
                        </Grid>
                        <Grid size={{xs: 6, md: 1, lg: 1}}>
                            <Tooltip title="Quantity">
                                <Typography>{fuelVoucher.quantity.toLocaleString()}</Typography>
                            </Tooltip>
                        </Grid>
                        <Grid size={{xs:6, md:!!expense_ledger ? 3 : 1, lg:1}}>
                            <Tooltip title="Amount">
                                <Typography>{(product_price * fuelVoucher.quantity).toLocaleString()}</Typography>
                            </Tooltip>
                        </Grid>
                        <Grid size={{xs: 6, md: 5, lg: 1.5}}>
                            <Tooltip title="Reference">
                                <Typography>{fuelVoucher.reference}</Typography>
                            </Tooltip>
                        </Grid>
                        <Grid size={{xs: 6, md: 4, lg: 1.5}}>
                            <Tooltip title="Narration">
                                <Typography>{fuelVoucher.narration}</Typography>
                            </Tooltip>
                        </Grid>
                         <Grid size={{xs: 12, md: 12, lg: 1}} textAlign={'end'}>
                            <Tooltip title='Edit Fuel Voucher'>
                                <IconButton size='small' onClick={() => {setShowForm(true)}}>
                                    <EditOutlined fontSize='small'/>
                                </IconButton>
                            </Tooltip>
                            <Tooltip title='Remove Fuel Voucher'>
                                <IconButton size='small' 
                                    onClick={() => setFuelVouchers(fuelVouchers => {
                                        const newItems = [...fuelVouchers];
                                        newItems.splice(index,1);
                                        return newItems;
                                    })}
                                >
                                    <DisabledByDefault fontSize='small' color='error'/>
                                </IconButton>
                            </Tooltip>
                        </Grid>
                    </Grid>
                ) : (
                    <FuelVouchers cashierPumpProducts={cashierPumpProducts} productPrices={productPrices} fuelVoucher={fuelVoucher} setShowForm={setShowForm} index={index} fuelVouchers={fuelVouchers} setFuelVouchers={setFuelVouchers}/>
                )
            }
        </React.Fragment>
  )
}

export default FuelVouchersItemRow