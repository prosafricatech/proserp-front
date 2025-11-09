'use client';

import { DisabledByDefault, EditOutlined } from '@mui/icons-material'
import { Divider, Grid, IconButton, Tooltip, Typography } from '@mui/material'
import React, { useState } from 'react'
import { useFormContext } from 'react-hook-form';
import Adjustments from './Adjustments';

// Type definitions
interface Product {
  id: number;
  name: string;
  [key: string]: any;
}

interface Tank {
  id: number;
  name: string;
  [key: string]: any;
}

interface AdjustmentData {
  id?: number;
  product_id: number;
  tank_id: number;
  quantity: number;
  operator: string;
  description: string;
  operator_name?: string;
  [key: string]: any;
}

interface AdjustmentsRowProps {
  adjustment: AdjustmentData;
  index: number;
}

interface FormContextType {
  adjustments: AdjustmentData[];
  setAdjustments: (adjustments: AdjustmentData[] | ((prev: AdjustmentData[]) => AdjustmentData[])) => void;
  products: Product[];
  tanks: Tank[];
  [key: string]: any;
}

function AdjustmentsRow({ adjustment, index }: AdjustmentsRowProps) {
    const [showForm, setShowForm] = useState<boolean>(false);
    const formContext = useFormContext() as unknown as FormContextType;
    const { adjustments = [], setAdjustments, products = [], tanks = [] } = formContext;
    
    const product = products.find((product: Product) => product.id === adjustment.product_id);
    const tank = tanks.find((tank: Tank) => tank.id === adjustment.tank_id);

    const handleRemove = () => {
        setAdjustments((prevAdjustments: AdjustmentData[]) => {
            const newItems = [...prevAdjustments];
            newItems.splice(index, 1);
            return newItems;
        });
    };

    const getOperatorDisplayText = (operator: string): string => {
        return operator === '-' ? 'Subtract (-)' : 'Add (+)';
    };

    return (
        <React.Fragment>
            <Divider />
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
                    <Grid size={{xs:5.5, md:2.5, lg:2.5}}>
                        <Tooltip title="Product">
                            <Typography>{product?.name || 'N/A'}</Typography>
                        </Tooltip>
                    </Grid>
                    <Grid size={{xs:5.5, md:2.5}}>
                        <Tooltip title="Tank">
                            <Typography>{tank?.name || 'N/A'}</Typography>
                        </Tooltip>
                    </Grid>
                    <Grid size={{xs:6, md:1.5}}>
                        <Tooltip title="Operator">
                            <Typography>{getOperatorDisplayText(adjustment.operator)}</Typography>
                        </Tooltip>
                    </Grid>
                    <Grid size={{xs:6, md:2}}>
                        <Tooltip title="Quantity">
                            <Typography>{adjustment.quantity.toLocaleString()}</Typography>
                        </Tooltip>
                    </Grid>
                    <Grid size={{xs:6, md:2, lg:2}}>
                        <Tooltip title="Description">
                            <Typography>{adjustment.description || '-'}</Typography>
                        </Tooltip>
                    </Grid>
                     <Grid size={{xs:6, md:1, lg:1}} textAlign={'end'}>
                        <Tooltip title='Edit Adjustment'>
                            <IconButton size='small' onClick={() => { setShowForm(true) }}>
                                <EditOutlined fontSize='small' />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title='Remove Adjustment'>
                            <IconButton size='small' onClick={handleRemove}>
                                <DisabledByDefault fontSize='small' color='error' />
                            </IconButton>
                        </Tooltip>
                    </Grid>
                </Grid>
            ) : (
                <Adjustments 
                    adjustment={adjustment} 
                    setShowForm={setShowForm} 
                    index={index}
                />
            )}
        </React.Fragment>
    );
}

export default AdjustmentsRow;