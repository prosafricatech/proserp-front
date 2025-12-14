import React, { useState, useMemo, useContext } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  TextField,
  Switch,
  Typography,
} from '@mui/material';
import { useFormContext } from 'react-hook-form';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import { StationFormContext } from '../SalesShifts';
import { FuelPump } from '../../Stations/StationType';
import { Station } from '../SalesShiftTypes';

interface DippingField {
  tank_id: number;
  product_id: number;
  reading: string | number;
}

interface DippingFormValues {
  isOpenSwitchON?: boolean;
  isCloseSwitchON?: boolean;
  dipping_before?: DippingField[];
  dipping_after?: DippingField[];
  // ... your other form fields
}

const Dipping: React.FC = () => {
  const { activeStation } = useContext(StationFormContext) as any;
  
  // Safely extract data from context
  const fuel_pumps = activeStation?.fuel_pumps ?? [];
  const tanks = activeStation?.tanks ?? [];

  const {
    setValue,
    watch,
    formState: { errors },
  } = useFormContext<DippingFormValues>();

  const [openSwitch, setOpenSwitch] = useState(!!watch('isOpenSwitchON'));
  const [closingSwitch, setClosingSwitch] = useState(!!watch('isCloseSwitchON'));

  const tankDippingInfo = useMemo(() => {
  const map = new Map<
    number,
    { tank_id: number; tank_name: string; product_id: number }
  >();

  // Explicitly type the pump and tank
  fuel_pumps.forEach((pump: FuelPump) => {
    if (pump.tank_id == null) return;

    const tank = tanks.find((t: Station['tanks'][number]) => t.id === pump.tank_id);
    if (tank && pump.product_id != null) {
      map.set(pump.tank_id, {
        tank_id: pump.tank_id,
        tank_name: tank.name,
        product_id: pump.product_id,
      });
    }
  });

  return Array.from(map.values());
}, [fuel_pumps, tanks]);

  const renderDippingFields = (type: 'before' | 'after') => {
    const fieldPrefix = `dipping_${type}` as const;

    return tankDippingInfo.map((tank, index) => (
      <Grid size ={{xs:12, md:4, lg:3}} key={tank.tank_id}>
        <Card variant="outlined">
          <CardContent>
            <TextField
              fullWidth
              size="small"
              label={tank.tank_name}
              value={watch(`${fieldPrefix}.${index}.reading`) ?? ''}
              error={!!errors?.[fieldPrefix]?.[index]?.reading}
              helperText={
                (errors?.[fieldPrefix]?.[index]?.reading?.message as string) ?? ''
              }
              InputProps={{
                inputComponent: CommaSeparatedField as any,
              }}
              onChange={(e) => {
                const value = e.target.value;
                const sanitized = value ? sanitizedNumber(value) : '';

                setValue(`${fieldPrefix}.${index}`, {
                  tank_id: tank.tank_id,
                  product_id: tank.product_id,
                  reading: sanitized || null,
                });
              }}
            />
          </CardContent>
        </Card>
      </Grid>
    ));
  };

  return (
    <Grid container spacing={2} mt={2}>
      {/* Closing Dipping */}
      <Grid size={12}>
        <Box display="flex" alignItems="center">
          <Switch
            checked={closingSwitch}
            size="small"
            onChange={(e) => {
              const checked = e.target.checked;
              setClosingSwitch(checked);
              setValue('isCloseSwitchON', checked);
              if (!checked) setValue('dipping_after', undefined);
            }}
          />
          <Typography variant="body1" ml={1}>
            Closing Dipping
          </Typography>
        </Box>
      </Grid>

      {closingSwitch && renderDippingFields('after')}

      {/* Opening Dipping */}
      <Grid size={12}>
        <Box display="flex" alignItems="center">
          <Switch
            checked={openSwitch}
            size="small"
            onChange={(e) => {
              const checked = e.target.checked;
              setOpenSwitch(checked);
              setValue('isOpenSwitchON', checked);
              if (!checked) setValue('dipping_before', undefined);
            }}
          />
          <Typography variant="body1" ml={1}>
            Opening Dipping
          </Typography>
        </Box>
      </Grid>

      {openSwitch && renderDippingFields('before')}
    </Grid>
  );
};

export default Dipping;