import { Grid, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip, Typography } from '@mui/material';
import React from 'react';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';

type LeaveItem = {
  id?: number;
  employee?: {
    employee_number?: string;
    first_name?: string;
    last_name?: string;
  };
  leave_type?: {
    name?: string;
  };
  start_date: string;
  end_date: string;
  days_requested: number;
  reason?: string;
};

interface ApprovalLeaveItemsSummaryProps {
  items: LeaveItem[];
}

function ApprovalLeaveItemsSummary({ items }: ApprovalLeaveItemsSummaryProps) {

  return (
    <Grid container spacing={1}>
      <Grid size={{ xs: 12 }}>
        <Typography variant="subtitle1">Leave Items</Typography>
      </Grid>
      <Grid size={{ xs: 12 }}>
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>S/N</TableCell>
                <TableCell>Employee</TableCell>
                <TableCell>Leave Type</TableCell>
                <TableCell>Start Date</TableCell>
                <TableCell>End Date</TableCell>
                <TableCell>Days</TableCell>
                <TableCell>Reason</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(items || []).map((item, index) => (
                <TableRow key={item.id || `${index}-${item.start_date}`}>
                  <TableCell>
                    <Tooltip title="S/N">
                      <span>{index + 1}.</span>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Tooltip
                      title={
                        [
                          [item.employee?.first_name, item.employee?.last_name].filter(Boolean).join(' ').trim(),
                          item.employee?.employee_number || '',
                        ]
                          .filter(Boolean)
                          .join(' ')
                      }
                    >
                      <span>
                        <Typography variant="body2">
                          {[item.employee?.first_name, item.employee?.last_name].filter(Boolean).join(' ').trim()}
                        </Typography>
                        {item.employee?.employee_number && (
                          <Typography variant="caption" color="text.secondary">
                            {item.employee.employee_number}
                          </Typography>
                        )}
                      </span>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Tooltip title={item.leave_type?.name}>
                      <span>{item.leave_type?.name}</span>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Start Date">
                      <span>{readableDate(item.start_date, false)}</span>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Tooltip title="End Date">
                      <span>{readableDate(item.end_date, false)}</span>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Days Requested">
                      <span>{Number(item.days_requested || 0).toLocaleString()}</span>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Reason">
                      <span>{item.reason}</span>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Grid>
    </Grid>
  );
}

export default ApprovalLeaveItemsSummary;
