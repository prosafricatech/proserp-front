import React, { useState, useEffect, useContext } from 'react';
import { Box, Card, CardContent, Grid, TextField, Switch, Typography } from '@mui/material';
import { useFormContext } from 'react-hook-form';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import { StationFormContext } from '../../SalesShifts';

function Dipping({SalesShift}) {
    const { setValue, watch, errors } = useFormContext();
    const [openSwitch, setOpenSwitch] = useState(!!watch('isOpenSwitchON') || !!SalesShift?.opening_dipping);
    const [closingSwitch, setClosingSwitch] = useState(!!watch('isCloseSwitchON') || !!SalesShift?.closing_dipping);
    const {activeStation} = useContext(StationFormContext);
    const { fuel_pumps, tanks } = activeStation;
    
    useEffect(() => {
        if (SalesShift?.closing_dipping) {
            setClosingSwitch(true);
            SalesShift.closing_dipping.readings.forEach((reading, index) => {
                setValue(`dipping_after.${index}`, {
                    id: reading.id,
                    tank_id: reading.tank_id,
                    reading: reading.reading,
                    product_id: reading.product_id,
                }, { shouldValidate: true, shouldDirty: true });
            });
        }
        
        if (SalesShift?.opening_dipping) {
            setOpenSwitch(true);
            SalesShift.opening_dipping.readings.forEach((reading, index) => {
                setValue(`dipping_before.${index}`, {
                    id: reading.id,
                    tank_id: reading.tank_id,
                    reading: reading.reading,
                    product_id: reading.product_id,
                }, { shouldValidate: true, shouldDirty: true });
            });
        }
    }, [SalesShift, setValue]);

    const renderFields = (type) => {
        const fieldName = `dipping_${type}`;
        const existingReadings = watch(fieldName) || [];
        
        return Object.values(fuel_pumps.reduce((acc, item) => {
            if (!acc[item.tank_id]) {
                acc[item.tank_id] = {
                    name: tanks.find(t => t.id === item.tank_id)?.name || `Tank ${item.tank_id}`,
                    id: item.tank_id,
                };
            }
            return acc;
        }, {})).map((tankInfo, tankIndex) => {
            const existingReadingIndex = existingReadings.findIndex(r => r?.tank_id === tankInfo.id);
            const fieldIndex = existingReadingIndex !== -1 ? existingReadingIndex : tankIndex;
            
            const currentValue = watch(`${fieldName}.${fieldIndex}`);
            const readingValue = currentValue?.reading || '';
            
            return (
                <Grid size={{xs: 12, md: 4, lg: 3}} key={tankInfo.id}>
                    <Card variant="outlined">
                        <CardContent>
                            <Grid container columnSpacing={1} marginTop={1}>
                                <TextField
                                    fullWidth
                                    label={`${tankInfo.name}`}
                                    size="small"
                                    value={readingValue}
                                    // error={!!errors[fieldName]?.[fieldIndex]?.reading}
                                    // helperText={errors[fieldName]?.[fieldIndex]?.reading?.message}
                                    InputProps={{
                                        inputComponent: CommaSeparatedField,
                                    }}
                                    onChange={(e) => {
                                        const newValue = e.target.value;
                                        if (!newValue) {
                                            setValue(`${fieldName}.${fieldIndex}`, null);
                                        } else {
                                            const product_id = fuel_pumps.find(pump => pump.tank_id === tankInfo.id)?.product_id;
                                            const updatedReading = {
                                                id: watch(`${fieldName}.${fieldIndex}.id`),
                                                tank_id: tankInfo.id,
                                                reading: sanitizedNumber(newValue),
                                                product_id: product_id,
                                            };
                                            setValue(`${fieldName}.${fieldIndex}`, updatedReading, {
                                                shouldValidate: true,
                                                shouldDirty: true,
                                            });
                                        }
                                    }}
                                />
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>
            );
        });
    };

    return (
        <Grid container columnSpacing={2} rowSpacing={1} marginTop={2}>
            <Grid size={12}>
                <Box display="flex" alignItems="center">
                    <Switch
                        checked={closingSwitch}
                        size='small'
                        onChange={(e) => {
                            const checked = e.target.checked;
                            setClosingSwitch(checked);
                            setValue('isCloseSwitchON', checked);
                            if (!checked) {
                                setValue('dipping_after', []);
                            }
                        }}
                    />
                    <Typography variant="body1" style={{ marginLeft: 8 }}>
                        Closing Dipping
                    </Typography>
                </Box>
            </Grid>

            {closingSwitch && renderFields('after')}
            
            <Grid size={12} sx={{ mt: 3 }}>
                <Box display="flex" alignItems="center">
                    <Switch
                        checked={openSwitch}
                        size='small'
                        onChange={(e) => {
                            const checked = e.target.checked;
                            setOpenSwitch(checked);
                            setValue('isOpenSwitchON', checked);
                            if (!checked) {
                                setValue('dipping_before', []);
                            }
                        }}
                    />
                    <Typography variant="body1" style={{ marginLeft: 8 }}>
                        Opening Dipping
                    </Typography>
                </Box>
            </Grid>

            {openSwitch && renderFields('before')}
        </Grid>
    );
}

export default Dipping;