import { Alert, Grid, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { ApprovalRequisition } from './ApprovalRequisitionType';

interface ApprovedLeaveRequestListItemProps {
  approvedRequisition: ApprovalRequisition;
}

function ApprovedLeaveRequestListItem({ approvedRequisition }: ApprovedLeaveRequestListItemProps) {
  const leaveItems = approvedRequisition.requisition?.leave_items || approvedRequisition.leave_items || [];

  if (!leaveItems.length) {
    return <Alert variant="outlined" severity="info">No leave records present.</Alert>;
  }

  const totalDays = leaveItems.reduce((sum, item) => sum + Number(item.days_requested || 0), 0);

  return (
    <Grid container spacing={1}>
      <Grid size={{ xs: 12 }}>
        <Typography variant="subtitle1">Leave Records</Typography>
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
                <TableCell align="right">Days</TableCell>
                <TableCell>Reason</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {leaveItems.map((item, index) => (
                <TableRow key={item.id || `${index}-${item.start_date}`}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>
                    {[item.employee?.employee_number, item.employee?.first_name, item.employee?.last_name]
                      .filter(Boolean)
                      .join(' ')}
                  </TableCell>
                  <TableCell>{item.leave_type?.name || '-'}</TableCell>
                  <TableCell>{readableDate(item.start_date)}</TableCell>
                  <TableCell>{readableDate(item.end_date)}</TableCell>
                  <TableCell align="right">{Number(item.days_requested || 0).toLocaleString()}</TableCell>
                  <TableCell>{item.reason || '-'}</TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={5}>
                  <Typography fontWeight={700}>Total days approved</Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography fontWeight={700}>{totalDays.toLocaleString()}</Typography>
                </TableCell>
                <TableCell />
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Grid>
    </Grid>
  );
}

export default ApprovedLeaveRequestListItem;
