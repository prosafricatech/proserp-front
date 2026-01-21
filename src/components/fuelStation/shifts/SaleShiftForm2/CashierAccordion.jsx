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
import { useState } from 'react';
import AdjustmentsTab from './tabs/fuelVouchers/AdjustmentsTab';
import PumpReadings from './tabs/PumpReadings';
import FuelVouchersTab from './tabs/fuelVouchers/FuelVouchersTab';
import CashReconciliation from './tabs/CashReconciliation';

export default function CashierAccordion({
  cashier,
  index,
  control,
  watch,
  setValue,
}) {
  const [tab, setTab] = useState(0);
  const [localFuelVouchers, setLocalFuelVouchers] = useState([]);
  const [localAdjustments, setLocalAdjustments] = useState([]);
  const [localPumpReadings, setLocalPumpReadings] = useState([]);

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
                selectedPumps={watch(`cashiers.${index}.selected_pumps`) || []}
                localPumpReadings={localPumpReadings}
                setLocalPumpReadings={setLocalPumpReadings}
            />
        )}

        {tab === 1 && (
          <FuelVouchersTab
            cashierIndex={index}
            localFuelVouchers={localFuelVouchers}
            setLocalFuelVouchers={setLocalFuelVouchers}
            setValue={setValue}
          />
        )}

        {tab === 2 && (
          <AdjustmentsTab
            cashierIndex={index}
            localAdjustments={localAdjustments}
            setLocalAdjustments={setLocalAdjustments}
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