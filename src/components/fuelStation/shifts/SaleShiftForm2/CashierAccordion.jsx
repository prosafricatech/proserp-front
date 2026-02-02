"use client";

import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tabs,
  Tab,
  Typography,
} from '@mui/material';
import { useState, useEffect } from 'react';
import PumpReadings from './tabs/PumpReadings';
import FuelVouchersTab from './tabs/fuelVouchers/FuelVouchersTab';
import CashReconciliation from './tabs/CashReconciliation';
import AdjustmentsTab from './tabs/adjustments/AdjustmentsTab';
import RemoveIcon from '@mui/icons-material/Remove';
import AddIcon from '@mui/icons-material/Add'

export default function CashierAccordion({
  cashier,
  index,
  control,
  watch,
  setValue,
  setCheckShiftBalanced,
  getCashierLedgers,
  getAvailablePumpsForCashier,
  lastClosingReadings,
  handleCashierPumpSelection,
  onFuelVouchersChange
}) {
  const [tab, setTab] = useState(0);
  const [expanded, setExpanded] = useState(false);
  
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
    if (onFuelVouchersChange) {
      onFuelVouchersChange(newVouchers);
    } else {
      setValue(`cashiers.${index}.fuel_vouchers`, newVouchers, {
        shouldValidate: true,
        shouldDirty: true
      });
    }
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
    <Accordion 
      expanded={expanded}
      square
      sx={{ 
        borderRadius: 2, 
        borderTop: 2,
        borderColor: 'divider',
        mb: 0.5,
        '&:hover': {
          bgcolor: 'action.hover',
        },
      }}
      onChange={()=> setExpanded((prevExpanded) => !prevExpanded)}
    >
      <AccordionSummary 
        expandIcon={expanded ? <RemoveIcon /> : <AddIcon />}
        sx={{
          px: 3,
          flexDirection: 'row-reverse',
          '.MuiAccordionSummary-content': {
            alignItems: 'center',
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            '&.Mui-expanded': {
              margin: '12px 0',
            }},
          '.MuiAccordionSummary-expandIconWrapper': {
            borderRadius: 1,
            border: 1,
            color: 'text.secondary',  
            transform: 'none',
            mr: 1,
            '&.Mui-expanded': {
              transform: 'none',
              color: 'primary.main',
              borderColor: 'primary.main',
            },
            '& svg': {
              fontSize: '1.25rem',
            },
          },
        }}
      >
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
          <Typography fontWeight="bold">
            {cashier.name}
          </Typography>
        </div>
      </AccordionSummary>

      <AccordionDetails
        sx={{ 
          backgroundColor:'background.paper',
          marginBottom: 3
        }}
      >
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

        <div style={{ display: tab === 0 ? 'block' : 'none' }}>
          <PumpReadings
            name={`cashiers.${index}.pump_readings`}
            control={control}
            cashierIndex={index}
            selectedPumps={formSelectedPumps}
            localPumpReadings={localPumpReadings}
            lastClosingReadings={lastClosingReadings}
            handleCashierPumpSelection={handleCashierPumpSelection}
            getAvailablePumpsForCashier={getAvailablePumpsForCashier}
            setLocalPumpReadings={updatePumpReadings}
          />
        </div>
        <div style={{ display: tab === 1 ? 'block' : 'none' }}>
          <FuelVouchersTab
            cashierIndex={index}
            localFuelVouchers={localFuelVouchers}
            setLocalFuelVouchers={updateFuelVouchers}
            setValue={setValue}
            onFuelVouchersChange={onFuelVouchersChange}
          />
        </div>
        <div style={{ display: tab === 2 ? 'block' : 'none' }}>
          <AdjustmentsTab
            cashierIndex={index}
            localAdjustments={localAdjustments}
            setLocalAdjustments={updateAdjustments}
            setValue={setValue}
          />
        </div>
        <div style={{ display: tab === 3 ? 'block' : 'none' }}>
          <CashReconciliation
            cashierIndex={index}
            setCheckShiftBalanced={setCheckShiftBalanced}
            localFuelVouchers={localFuelVouchers}
            localAdjustments={localAdjustments}
            localPumpReadings={localPumpReadings}
            getCashierLedgers={getCashierLedgers}
            watch={watch}
            setValue={setValue}
          />
        </div>
      </AccordionDetails>
    </Accordion>
  );
}