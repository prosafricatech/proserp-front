'use client';

import React, { useState } from 'react';
import { Box, Card, CardContent, Grid, TextField, Switch, Typography } from '@mui/material';
import { useFormContext } from 'react-hook-form';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';

// Type definitions
interface Tank {
  id: number;
  name: string;
  [key: string]: any;
}

interface FuelPump {
  id: number;
  tank_id: number;
  product_id: number;
  [key: string]: any;
}

interface DippingReading {
  tank_id?: number;
  reading?: number;
  product_id?: number;
  [key: string]: any;
}

interface FormContextType {
  setValue: (name: string, value: any) => void;
  watch: (name?: string) => any;
  errors: any;
  fuel_pumps?: FuelPump[];
  tanks?: Tank[];
  [key: string]: any;
}

function DippingTab() {
    const { setValue, watch, errors, fuel_pumps, tanks } = useFormContext() as unknown as FormContextType;
    const [openSwitch, setOpenSwitch] = useState<boolean>(!!watch('isOpenSwitchON'));
    const [closingSwitch, setClosingSwitch] = useState<boolean>(!!watch('isCloseSwitchON'));
    
    const renderFields = (type: 'before' | 'after') => {
        // Add null/undefined checks
        if (!fuel_pumps || !tanks) {
            return null;
        }

        const uniqueTanks = Object.values(
            fuel_pumps.reduce((acc: Record<number, Tank>, item: FuelPump) => {
                if (!acc[item.tank_id]) {
                    const tank = tanks.find((t: Tank) => t.id === item.tank_id);
                    if (tank) {
                        acc[item.tank_id] = tank;
                    }
                }
                return acc;
            }, {})
        );

        // Check if we have any tanks to render
        if (uniqueTanks.length === 0) {
            return (
                <Grid size={12}>
                    <Typography variant="body2" color="textSecondary">
                        No tanks available
                    </Typography>
                </Grid>
            );
        }

        return uniqueTanks.map((tankInfo: Tank, tankIndex: number) => (
            <Grid size={{xs:12, md:4, lg:3}} key={tankInfo.id}>
                <Card variant="outlined">
                    <CardContent>
                        <Grid container columnSpacing={1} marginTop={1}>
                            <TextField
                                fullWidth
                                label={tankInfo.name}
                                size="small"
                                defaultValue={watch(`dipping_${type}.${tankIndex}.reading`)}
                                error={!!errors[`dipping_${type}`]?.[tankIndex]?.reading}
                                helperText={errors[`dipping_${type}`]?.[tankIndex]?.reading?.message}
                                InputProps={{
                                    inputComponent: CommaSeparatedField as any,
                                }}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                    const newValue = e.target.value;
                                    if (!newValue) {
                                        setValue(`dipping_${type}.${tankIndex}`, null);
                                    } else {
                                        const product_id = fuel_pumps.find((pump: FuelPump) => pump.tank_id === tankInfo.id)?.product_id;
                                        setValue(`dipping_${type}.${tankIndex}.tank_id`, tankInfo.id);
                                        setValue(`dipping_${type}.${tankIndex}.reading`, sanitizedNumber(newValue));
                                        setValue(`dipping_${type}.${tankIndex}.product_id`, product_id);
                                    }
                                }}
                            />
                        </Grid>
                    </CardContent>
                </Card>
            </Grid>
        ));
    };

    const handleOpenSwitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const checked = e.target.checked;
        setOpenSwitch(checked);
        setValue('isOpenSwitchON', checked);
        if (!checked) {
            setValue('dipping_before', null);
        }
    };

    const handleClosingSwitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const checked = e.target.checked;
        setClosingSwitch(checked);
        setValue('isCloseSwitchON', checked);
        if (!checked) {
            setValue('dipping_after', null);
        }
    };

    return (
        <Grid container columnSpacing={2} rowSpacing={1} marginTop={2}>
            <Grid size={12}>
                <Box display="flex" alignItems="center">
                    <Switch
                        checked={closingSwitch}
                        size='small'
                        onChange={handleClosingSwitchChange}
                    />
                    <Typography variant="body1" style={{ marginLeft: 8 }}>
                        Closing
                    </Typography>
                </Box>
            </Grid>

            {closingSwitch && renderFields('after')}

            <Grid size={12}>
                <Box display="flex" alignItems="center">
                    <Switch
                        checked={openSwitch}
                        size='small'
                        onChange={handleOpenSwitchChange}
                    />
                    <Typography variant="body1" style={{ marginLeft: 8 }}>
                        Opening
                    </Typography>
                </Box>
            </Grid>

            {openSwitch && renderFields('before')}
        </Grid>
    );
}

export default DippingTab;