import { AddOutlined, CheckOutlined, DisabledByDefault } from '@mui/icons-material';
import { Autocomplete, Button, Grid, TextField } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import React, { useState } from 'react';
import { LeaveItemFormValue } from './LeaveItemRow';

type EmployeeOption = {
  id: number;
  employee_number?: string;
  first_name?: string;
  last_name?: string;
};

type LeaveTypeOption = {
  id: number;
  name?: string;
};

interface LeaveItemFormProps {
  employeeOptions: EmployeeOption[];
  leaveTypeOptions: LeaveTypeOption[];
  setLeaveItems: (items: React.SetStateAction<LeaveItemFormValue[]>) => void;
  setIsDirty: (value: React.SetStateAction<boolean>) => void;
  leaveItem?: LeaveItemFormValue | null;
  index?: number;
  setShowForm?: (value: React.SetStateAction<boolean>) => void;
  disabled?: boolean;
}

type LeaveItemFormErrors = {
  employee_id?: string;
  leave_type_id?: string;
  start_date?: string;
  end_date?: string;
};

const employeeLabel = (employee?: EmployeeOption) => {
  if (!employee) return '';
  const fullName = [employee.first_name, employee.last_name].filter(Boolean).join(' ').trim();
  return employee.employee_number ? `${fullName} (${employee.employee_number})` : fullName;
};

const createEmptyLeaveItem = (): LeaveItemFormValue => ({
  employee_id: undefined,
  leave_type_id: undefined,
  start_date: '',
  end_date: '',
  days_requested: 0,
  reason: '',
});

const normalizeDateInput = (value?: string) => {
  if (!value) return '';
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format('YYYY-MM-DD') : value;
};

const toNumber = (value?: number | string) => Number(value ?? 0);

function businessDaysBetween(startDate?: string, endDate?: string) {
  if (!startDate || !endDate) return 0;
  let current = dayjs(startDate).startOf('day');
  const end = dayjs(endDate).startOf('day');
  if (!current.isValid() || !end.isValid() || end.isBefore(current)) return 0;

  let days = 0;
  while (current.isSame(end) || current.isBefore(end)) {
    const day = current.day();
    if (day !== 0 && day !== 6) days += 1;
    current = current.add(1, 'day');
  }
  return days;
}

const asYmd = (value: dayjs.Dayjs | null) => (value ? value.format('YYYY-MM-DD') : undefined);

function LeaveItemForm({
  employeeOptions,
  leaveTypeOptions,
  setLeaveItems,
  setIsDirty,
  leaveItem = null,
  index = -1,
  setShowForm,
  disabled = false,
}: LeaveItemFormProps) {
  const [form, setForm] = useState<LeaveItemFormValue>(
    leaveItem
      ? {
          ...leaveItem,
          employee_id: leaveItem.employee_id ?? leaveItem.employee?.id,
          leave_type_id: leaveItem.leave_type_id ?? leaveItem.leave_type?.id,
          start_date: normalizeDateInput(leaveItem.start_date),
          end_date: normalizeDateInput(leaveItem.end_date),
          days_requested: toNumber(leaveItem.days_requested),
          reason: leaveItem.reason || '',
        }
      : createEmptyLeaveItem()
  );
  const [errors, setErrors] = useState<LeaveItemFormErrors>({});

  const updateDates = (startDate?: string, endDate?: string) => {
    const start = startDate ?? form.start_date;
    const end = endDate ?? form.end_date;
    const autoDays = businessDaysBetween(start, end);

    setForm((prev) => ({
      ...prev,
      start_date: start,
      end_date: end,
      days_requested: autoDays || prev.days_requested || 0,
    }));
  };

  const validate = () => {
    const nextErrors: LeaveItemFormErrors = {};
    const start = form.start_date ? dayjs(form.start_date) : null;
    const end = form.end_date ? dayjs(form.end_date) : null;

    if (!form.employee_id) nextErrors.employee_id = 'Employee is required';
    if (!form.leave_type_id) nextErrors.leave_type_id = 'Leave Type is required';
    if (!start || !start.isValid()) nextErrors.start_date = 'Start Date is required';
    if (!end || !end.isValid()) nextErrors.end_date = 'End Date is required';
    if (start && end && end.isBefore(start, 'day')) {
      nextErrors.end_date = 'End Date must be on or after Start Date';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;

    const selectedEmployee = employeeOptions.find((employee) => employee.id === form.employee_id);
    const selectedLeaveType = leaveTypeOptions.find((leaveType) => leaveType.id === form.leave_type_id);
    const payload: LeaveItemFormValue = {
      ...form,
      employee: selectedEmployee
        ? {
            id: selectedEmployee.id,
            employee_number: selectedEmployee.employee_number,
            first_name: selectedEmployee.first_name,
            last_name: selectedEmployee.last_name,
          }
        : undefined,
      leave_type: selectedLeaveType
        ? {
            id: selectedLeaveType.id,
            name: selectedLeaveType.name,
          }
        : undefined,
    };

    if (index > -1) {
      setLeaveItems((items) => {
        const next = [...items];
        next[index] = payload;
        return next;
      });
      setShowForm?.(false);
    } else {
      setLeaveItems((items) => [...items, payload]);
      setForm(createEmptyLeaveItem());
    }

    setIsDirty(true);
    setErrors({});
  };

  return (
    <Grid container spacing={1} mt={0.5}>
      <Grid size={{ xs: 12, md: 2.5 }}>
        <Autocomplete
          options={employeeOptions}
          value={employeeOptions.find((employee) => employee.id === form.employee_id) || null}
          getOptionLabel={(option) => employeeLabel(option)}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          onChange={(_, value) => {
            setForm((prev) => ({ ...prev, employee_id: value?.id }));
            setIsDirty(true);
            if (errors.employee_id) setErrors((prev) => ({ ...prev, employee_id: undefined }));
          }}
          disabled={disabled}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Employee"
              fullWidth
              size="small"
              error={!!errors.employee_id}
              helperText={errors.employee_id}
            />
          )}
        />
      </Grid>

      <Grid size={{ xs: 12, md: 2.5 }}>
        <Autocomplete
          options={leaveTypeOptions}
          value={leaveTypeOptions.find((leaveType) => leaveType.id === form.leave_type_id) || null}
          getOptionLabel={(option) => option.name || ''}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          onChange={(_, value) => {
            setForm((prev) => ({ ...prev, leave_type_id: value?.id }));
            setIsDirty(true);
            if (errors.leave_type_id) setErrors((prev) => ({ ...prev, leave_type_id: undefined }));
          }}
          disabled={disabled}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Leave Type"
              fullWidth
              size="small"
              error={!!errors.leave_type_id}
              helperText={errors.leave_type_id}
            />
          )}
        />
      </Grid>

      <Grid size={{ xs: 12, md: 2 }}>
        <DatePicker
          label="Start Date"
          value={form.start_date ? dayjs(form.start_date) : null}
          onChange={(value) => {
            updateDates(asYmd(value), undefined);
            setIsDirty(true);
            if (errors.start_date) setErrors((prev) => ({ ...prev, start_date: undefined }));
          }}
          disabled={disabled}
          slotProps={{
            textField: {
              size: 'small',
              fullWidth: true,
              error: !!errors.start_date,
              helperText: errors.start_date,
            },
          }}
        />
      </Grid>

      <Grid size={{ xs: 12, md: 2 }}>
        <DatePicker
          label="End Date"
          value={form.end_date ? dayjs(form.end_date) : null}
          minDate={form.start_date ? dayjs(form.start_date) : undefined}
          onChange={(value) => {
            updateDates(undefined, asYmd(value));
            setIsDirty(true);
            if (errors.end_date) setErrors((prev) => ({ ...prev, end_date: undefined }));
          }}
          disabled={disabled}
          slotProps={{
            textField: {
              size: 'small',
              fullWidth: true,
              error: !!errors.end_date,
              helperText: errors.end_date,
            },
          }}
        />
      </Grid>

      <Grid size={{ xs: 12, md: 1 }}>
        <TextField
          label="Days"
          type="number"
          fullWidth
          size="small"
          value={form.days_requested ?? ''}
          onChange={(event) => {
            setForm((prev) => ({ ...prev, days_requested: Number(event.target.value || 0) }));
            setIsDirty(true);
          }}
          disabled={disabled}
          inputProps={{ min: 0, step: 0.5 }}
        />
      </Grid>

      <Grid size={{ xs: 12, md: 2 }}>
        <TextField
          label="Reason"
          fullWidth
          size="small"
          value={form.reason || ''}
          onChange={(event) => {
            setForm((prev) => ({ ...prev, reason: event.target.value }));
            setIsDirty(true);
          }}
          disabled={disabled}
        />
      </Grid>

      <Grid size={{ xs: 12 }} textAlign="right">
        <Button
          size="small"
          variant="outlined"
          onClick={handleSave}
          disabled={disabled}
        >
          {index > -1 ? 'Save' : 'Add'}
        </Button>
        {index > -1 && (
          <Button
            size="small"
            color="error"
            variant="text"
            onClick={() => setShowForm?.(false)}
            sx={{ ml: 1 }}
          >
            Cancel
          </Button>
        )}
      </Grid>
    </Grid>
  );
}

export default LeaveItemForm;
