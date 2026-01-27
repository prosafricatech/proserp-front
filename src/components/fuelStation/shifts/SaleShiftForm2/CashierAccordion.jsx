"use client";

import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tabs,
  Tab,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useState, useEffect } from 'react';
import PumpReadings from './tabs/PumpReadings';
import FuelVouchersTab from './tabs/fuelVouchers/FuelVouchersTab';
import CashReconciliation from './tabs/CashReconciliation';
import AdjustmentsTab from './tabs/adjustments/AdjustmentsTab';

export default function CashierAccordion({
  cashier,
  index,
  control,
  watch,
  setValue,
}) {
  const [tab, setTab] = useState(0);
  
  const formFuelVouchers = watch(`cashiers.${index}.fuel_vouchers`) || [];
  const formAdjustments = watch(`cashiers.${index}.adjustments`) || [];
  const formPumpReadings = watch(`cashiers.${index}.pump_readings`) || [];
  const formSelectedPumps = watch(`cashiers.${index}.selected_pumps`) || [];
  
  const [localFuelVouchers, setLocalFuelVouchers] = useState(formFuelVouchers);
  const [localAdjustments, setLocalAdjustments] = useState(formAdjustments);
  const [localPumpReadings, setLocalPumpReadings] = useState(formPumpReadings);
  
  useEffect(() => {
    const currentFuelVouchers = watch(`cashiers.${index}.fuel_vouchers`) || [];
    const currentAdjustments = watch(`cashiers.${index}.adjustments`) || [];
    const currentPumpReadings = watch(`cashiers.${index}.pump_readings`) || [];
    
    setLocalFuelVouchers(currentFuelVouchers);
    setLocalAdjustments(currentAdjustments);
    setLocalPumpReadings(currentPumpReadings);
  }, [watch, index]);

  const updateFuelVouchers = (newVouchers) => {
    setLocalFuelVouchers(newVouchers);
    setValue(`cashiers.${index}.fuel_vouchers`, newVouchers, {
      shouldValidate: true,
      shouldDirty: true
    });
  };

  const updateAdjustments = (newAdjustments) => {
    setLocalAdjustments(newAdjustments);
    setValue(`cashiers.${index}.adjustments`, newAdjustments, {
      shouldValidate: true,
      shouldDirty: true
    });
  };

  const updatePumpReadings = (newReadings) => {
    setLocalPumpReadings(newReadings);
    setValue(`cashiers.${index}.pump_readings`, newReadings, {
      shouldValidate: true,
      shouldDirty: true
    });
  };

  return (
    <Accordion sx={{ mb: 2 }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography fontWeight="bold">
          {cashier.cashier_name || `Cashier ${cashier.cashier_id}`}
        </Typography>
      </AccordionSummary>

      <AccordionDetails>
        <Tabs
          value={tab}
          onChange={(e, v) => setTab(v)}
          variant="scrollable"
          sx={{ mb: 2 }}
        >
          <Tab label="Pump Readings" />
          <Tab label="Fuel Vouchers" />
          <Tab label="Adjustments" />
          <Tab label="Cash Reconciliation" />
        </Tabs>

        {tab === 0 && (
          <PumpReadings
            name={`cashiers.${index}.pump_readings`}
            control={control}
            cashierIndex={index}
            selectedPumps={formSelectedPumps}
            localPumpReadings={localPumpReadings}
            setLocalPumpReadings={updatePumpReadings}
          />
        )}

        {tab === 1 && (
          <FuelVouchersTab
            cashierIndex={index}
            localFuelVouchers={localFuelVouchers}
            setLocalFuelVouchers={updateFuelVouchers}
            setValue={setValue}
          />
        )}

        {tab === 2 && (
          <AdjustmentsTab
            cashierIndex={index}
            localAdjustments={localAdjustments}
            setLocalAdjustments={updateAdjustments}
            setValue={setValue}
          />
        )}

        {tab === 3 && (
          <CashReconciliation
            cashierIndex={index}
            localFuelVouchers={localFuelVouchers}
            localAdjustments={localAdjustments}
            localPumpReadings={localPumpReadings}
            watch={watch}
            setValue={setValue}
          />
        )}
      </AccordionDetails>
    </Accordion>
  );
}