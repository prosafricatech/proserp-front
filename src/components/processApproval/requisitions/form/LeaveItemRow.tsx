import { DeleteOutline } from '@mui/icons-material';
import { EditOutlined } from '@mui/icons-material';
import { Divider, Grid, IconButton, Tooltip, Typography } from '@mui/material';
import React, { useState } from 'react';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import LeaveItemForm from './LeaveItemForm';

export type LeaveItemFormValue = {
  id?: number;
  employee_id?: number;
  leave_type_id?: number;
  start_date?: string;
  end_date?: string;
  days_requested?: number;
  reason?: string;
  employee?: {
    id?: number;
    employee_number?: string;
    first_name?: string;
    last_name?: string;
  };
  leave_type?: {
    id?: number;
    name?: string;
  };
};

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

interface LeaveItemRowProps {
  row: LeaveItemFormValue;
  index: number;
  leaveItems: LeaveItemFormValue[];
  setLeaveItems: (items: React.SetStateAction<LeaveItemFormValue[]>) => void;
  employeeOptions: EmployeeOption[];
  leaveTypeOptions: LeaveTypeOption[];
  readOnly?: boolean;
}

function LeaveItemRow({
  row,
  index,
  setLeaveItems,
  employeeOptions,
  leaveTypeOptions,
  readOnly = false,
}: LeaveItemRowProps) {
  const [showForm, setShowForm] = useState(false);
  const employee = row.employee || employeeOptions.find((employeeOption) => employeeOption.id === row.employee_id);
  const leaveType = row.leave_type || leaveTypeOptions.find((leaveTypeOption) => leaveTypeOption.id === row.leave_type_id);
  const employeeName = [employee?.first_name, employee?.last_name].filter(Boolean).join(' ').trim() || employee?.employee_number;
  const employeeSecondary = employee?.employee_number ? `(${employee.employee_number})` : '';
  const leaveTypeName = leaveType?.name;

  const handleRemove = () => {
    setLeaveItems((items) => {
      const next = [...items];
      next.splice(index, 1);
      return next;
    });
  };

  return (
    <Grid
      container
      spacing={1}
      alignItems="center"
      sx={{
        borderColor: 'divider',
        borderRadius: 1,
        mb: 1,
      }}
    >
      {!showForm ? (
        <>
        <Divider sx={{ width: '100%' }} />
          <Grid size={{ xs: 1, md: 0.7 }}>
            <Tooltip title="S/N">
              <Typography noWrap>{index + 1}.</Typography>
            </Tooltip>
          </Grid>
          <Grid size={{ xs: 11, md: 2.6 }}>
            <Tooltip title="Employee">
              <Typography noWrap>{`${employeeName} ${employeeSecondary}`.trim()}</Typography>
            </Tooltip>
          </Grid>
          <Grid size={{ xs: 6, md: 1.8 }}>
            <Tooltip title="Leave Type">
              <Typography noWrap>{leaveTypeName}</Typography>
            </Tooltip>
          </Grid>
          <Grid size={{ xs: 6, md: 1.7 }}>
            <Tooltip title="Start Date">
              <Typography>{readableDate(row.start_date, false)}</Typography>
            </Tooltip>
          </Grid>
          <Grid size={{ xs: 6, md: 1.7 }}>
            <Tooltip title="End Date">
              <Typography>{readableDate(row.end_date, false)}</Typography>
            </Tooltip>
          </Grid>
          <Grid size={{ xs: 6, md: 0.5 }}>
            <Tooltip title="Days Requested">
              <Typography>{Number(row.days_requested || 0).toLocaleString()}</Typography>
            </Tooltip>
          </Grid>
          <Grid size={{ xs: 6, md: 2 }}>
            <Tooltip title="Reason">
              <Typography noWrap>{row.reason}</Typography>
            </Tooltip>
          </Grid>
          <Grid size={{ xs: 6, md: 1 }} textAlign="right">
            {!readOnly && (
              <>
                <Tooltip title="Edit">
                  <IconButton size="small" onClick={() => setShowForm(true)}>
                    <EditOutlined fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Remove">
                  <IconButton size="small" color="error" onClick={handleRemove}>
                    <DeleteOutline fontSize="small" />
                  </IconButton>
                </Tooltip>
              </>
            )}
          </Grid>
        </>
      ) : (
        <Grid size={{ xs: 12 }}>
          <LeaveItemForm
            employeeOptions={employeeOptions}
            leaveTypeOptions={leaveTypeOptions}
            setLeaveItems={setLeaveItems}
            leaveItem={row}
            index={index}
            setShowForm={setShowForm}
            disabled={readOnly}
          />
        </Grid>
      )}
    </Grid>
  );
}

export default LeaveItemRow;
