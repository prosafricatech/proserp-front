'use client';

import React, { useState, useMemo } from 'react';
import {
  Divider,
  Grid,
  IconButton,
  Tooltip,
  Typography,
} from '@mui/material';
import { DisabledByDefault, EditOutlined } from '@mui/icons-material';
import CertifiedTasksItemForm from './CertifiedTasksItemForm';

/* ---------- Types ---------- */

interface MeasurementUnit {
  symbol?: string;
}

interface Task {
  id?: number | string;
  name?: string;
  rate?: number;
  measurement_unit?: MeasurementUnit;
}

export interface CertifiedTaskItem {
  id?: number | string;
  task?: Task;
  task_name?: string;
  certified_quantity?: number | string;
  remarks?: string;
  rate?: number;
  unit_symbol?: string;
  measurement_unit?: MeasurementUnit;
}

interface SubContract {
  id?: number | string;
}

interface Certificate {
  project_subcontract_id?: number | string;
}

interface CertifiedTasksItemRowProps {
  setClearFormKey: React.Dispatch<React.SetStateAction<number>>;
  submitMainForm: () => void;
  submitItemForm: boolean;
  setSubmitItemForm: React.Dispatch<React.SetStateAction<boolean>>;
  setIsDirty: React.Dispatch<React.SetStateAction<boolean>>;
  taskItem: CertifiedTaskItem;
  index: number;
  tasksItems: CertifiedTaskItem[];
  CertificateDate: string;
  setTasksItems: React.Dispatch<React.SetStateAction<CertifiedTaskItem[]>>;
  subContract?: SubContract;
  certificate?: Certificate;
  vat_percentage?: number;
}

/* ---------- Component ---------- */

const CertifiedTasksItemRow: React.FC<CertifiedTasksItemRowProps> = ({
  setClearFormKey,
  submitMainForm,
  submitItemForm,
  setSubmitItemForm,
  setIsDirty,
  taskItem,
  index,
  tasksItems,
  CertificateDate,
  setTasksItems,
  subContract,
  certificate,
  vat_percentage = 0,
}) => {
  const [showForm, setShowForm] = useState(false);

  /* ---------- Derived values ---------- */

  const taskName =
    taskItem.task?.name || taskItem.task_name || '-';

  const quantityValue = Number(taskItem.certified_quantity) || 0;

  const unitSymbol =
    taskItem.unit_symbol ||
    taskItem.task?.measurement_unit?.symbol ||
    taskItem.measurement_unit?.symbol ||
    '';

  const quantityDisplay = `${quantityValue} ${unitSymbol}`.trim();

  const rate =
    Number(taskItem.rate ?? taskItem.task?.rate) || 0;

  const vatFactor = vat_percentage > 0 ? vat_percentage / 100 : 0;

  const vatAmount = useMemo(
    () => quantityValue * rate * vatFactor,
    [quantityValue, rate, vatFactor]
  );

  const lineTotal = useMemo(
    () => quantityValue * rate * (1 + vatFactor),
    [quantityValue, rate, vatFactor]
  );

  const handleRemoveItem = () => {
    setTasksItems((prev) => {
      const updated = [...prev];
      updated.splice(index, 1);
      return updated;
    });
  };

  return (
    <>
      <Divider />

      {!showForm ? (
        <Grid
          container
          alignItems="center"
          sx={{
            py: 1,
            '&:hover': { bgcolor: 'action.hover' },
          }}
        >
          {/* Index */}
          <Grid size={{ xs: 1, md: 0.5 }}>
            <Typography variant="body2">
              {index + 1}.
            </Typography>
          </Grid>

          {/* Task & Remarks */}
          <Grid size={{ xs: 11, md: 4 }}>
            <Tooltip title="Project Task" arrow>
              <Typography variant="body2" noWrap>
                {taskName}
              </Typography>
            </Tooltip>

            {!!taskItem.remarks && (
              <Typography
                variant="caption"
                color="text.secondary"
                noWrap
              >
                {taskItem.remarks}
              </Typography>
            )}
          </Grid>

          {/* Quantity */}
          <Grid
            size={{ xs: 6, md: vatFactor ? 3 : 3.5 }}
            sx={{ pl: { xs: 3, md: 0 } }}
          >
            <Tooltip title="Quantity" arrow>
              <Typography variant="body2">
                {quantityDisplay || '0'}
              </Typography>
            </Tooltip>
          </Grid>

          {/* VAT */}
          {!!vatFactor && (
            <Grid
              size={{ xs: 6, md: 1.5 }}
              textAlign="end"
            >
              <Tooltip title="VAT" arrow>
                <Typography>
                  {vatAmount.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Typography>
              </Tooltip>
            </Grid>
          )}

          {/* Line Total */}
          <Grid
            size={{ xs: 6, md: vatFactor ? 2 : 3 }}
            textAlign={{ xs: vatFactor ? 'start' : 'end', md: 'end' }}
          >
            <Tooltip title="Line Total" arrow>
              <Typography>
                {lineTotal.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Typography>
            </Tooltip>
          </Grid>

          {/* Actions */}
          <Grid
            size={{ xs: vatFactor ? 6 : 12, md: 1 }}
            textAlign="end"
          >
            <Tooltip title="Edit Task">
              <IconButton
                size="small"
                onClick={() => setShowForm(true)}
              >
                <EditOutlined fontSize="small" />
              </IconButton>
            </Tooltip>

            <Tooltip title="Remove Task">
              <IconButton
                size="small"
                onClick={handleRemoveItem}
              >
                <DisabledByDefault
                  fontSize="small"
                  color="error"
                />
              </IconButton>
            </Tooltip>
          </Grid>
        </Grid>
      ) : (
        <CertifiedTasksItemForm
          setClearFormKey={setClearFormKey}
          submitMainForm={submitMainForm}
          submitItemForm={submitItemForm}
          setSubmitItemForm={setSubmitItemForm}
          setIsDirty={setIsDirty}
          taskItem={taskItem as any}
          setShowForm={setShowForm}
          index={index}
          tasksItems={tasksItems as any}
          setTasksItems={setTasksItems as any}
          subContract={subContract}
          certificate={certificate}
          CertificateDate={CertificateDate}
        />
      )}
    </>
  );
};

export default CertifiedTasksItemRow;
