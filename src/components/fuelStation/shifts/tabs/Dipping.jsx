import React, { useState } from 'react';
import { Box, Card, CardContent, Grid, TextField, Switch, Typography } from '@mui/material';
import { useFormContext } from 'react-hook-form';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';

function Dipping() {
    const { setValue, watch, errors, fuel_pumps, tanks } = useFormContext();
    const [openSwitch, setOpenSwitch] = useState(!!watch('isOpenSwitchON'));
    const [closingSwitch, setClosingSwitch] = useState(!!watch('isCloseSwitchON'));
    
    const renderFields = (type) => (
        Object.values(fuel_pumps.reduce((acc, item) => {
            if (!acc[item.tank_id]) {
                acc[item.tank_id] = {
                    name: tanks.find(t => t.id === item.tank_id).name,
                    id: item.tank_id,
                };
            }
            return acc;
        }, {})).map((tankInfo, tankIndex) => (
             <Grid size={{xs: 12, md: 4, lg: 3}} key={tankIndex}>
                <Card variant="outlined">
                    <CardContent>
                        <Grid container columnSpacing={1} marginTop={1}>
                            <TextField
                                fullWidth
                                label={`${tankInfo.name}`}
                                size="small"
                                defaultValue={watch(`dipping_${type}.${tankIndex}.reading`)}
                                error={!!errors[`dipping_${type}`]?.[tankIndex]?.reading}
                                helperText={errors[`dipping_${type}`]?.[tankIndex]?.reading?.message}
                                InputProps={{
                                    inputComponent: CommaSeparatedField,
                                }}
                                onChange={(e) => {
                                    const newValue = e.target.value;
                                    if(!newValue){
                                        setValue(`dipping_${type}.${tankIndex}`,null);
                                    } else {
                                        const product_id = fuel_pumps.find(pump => pump.tank_id === tankInfo.id)?.product_id;
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
        ))
    );

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
                            setValue('dipping_after',null);
                        }}
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
                        onChange={(e) => {
                            const checked = e.target.checked;
                            setOpenSwitch(checked);
                            setValue('isOpenSwitchON', checked);
                            setValue('dipping_before',null);
                        }}
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

export default Dipping;
