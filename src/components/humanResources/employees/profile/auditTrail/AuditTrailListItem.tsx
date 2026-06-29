'use client';

import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { Person } from '@mui/icons-material';
import { Chip, TableCell, TableRow, Tooltip, Typography } from '@mui/material';
import { Movement } from './AuditTrailType';

interface AuditTrailListItemProps {
  movement: Movement;
  showType?: boolean;
}

const AuditTrailListItem = ({ movement, showType = false }: AuditTrailListItemProps) => {
  const isCostCenter = movement.from_cost_center_id || movement.to_cost_center_id;
  const isDepartment = movement.from_department_id || movement.to_department_id;

  const fromName = isCostCenter 
    ? movement.from_cost_center?.name 
    : movement.from_department?.name;
  const toName = isCostCenter 
    ? movement.to_cost_center?.name 
    : movement.to_department?.name;

  const movementType = isCostCenter ? 'Cost Center' : 'Department';

  const creatorName = movement.creator 
    ? `${movement.creator.first_name || ''} ${movement.creator.last_name || ''}`.trim() 
    : '-';

  return (
    <TableRow
      hover
      sx={{
        '&:hover': { bgcolor: 'action.hover' },
        '& td, & th': {
          border: '1px solid',
          borderColor: 'divider',
          py: 1.5,
          px: 2,
        },
      }}
    >
      {/* Date */}
      <TableCell>
        <Typography variant="body2">
          {movement.moved_date ? readableDate(movement.moved_date) : '-'}
        </Typography>
      </TableCell>

      {/* From */}
      <TableCell>
        <Typography variant="body2">
          {fromName || '-'}
        </Typography>
        {showType && (
          <Chip 
            label={movementType} 
            size="small" 
            color={isCostCenter ? 'primary' : 'info'}
            variant="outlined"
            sx={{ mt: 0.5 }}
          />
        )}
      </TableCell>

      {/* To */}
      <TableCell>
        <Typography variant="body2">
          {toName || '-'}
        </Typography>
      </TableCell>

      {/* Reason */}
      <TableCell>
        {movement.reason ? (
          <Tooltip title={movement.reason}>
            <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 200 }}>
              {movement.reason}
            </Typography>
          </Tooltip>
        ) : (
          <Typography variant="body2" color="text.disabled">-</Typography>
        )}
      </TableCell>

      {/* Changed By */}
      <TableCell>
        {movement.creator ? (
          <Tooltip title={`Changed by: ${creatorName}`}>
            <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Person fontSize="small" color="action" />
              {creatorName}
            </Typography>
          </Tooltip>
        ) : (
          <Typography variant="body2" color="text.disabled">-</Typography>
        )}
      </TableCell>
    </TableRow>
  );
};

export default AuditTrailListItem;