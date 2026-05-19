import { TableCell, TableRow, Typography } from '@mui/material';

const TaskViewListItem = ({
  material,
  isAggregated,
}: {
  material: any;
  isAggregated: boolean;
}) => {
  const formatNumber = (value: number | string) =>
    parseFloat(String(value || 0)).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const formatDate = (value?: string) => {
    if (!value) return '-';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '-';
    return parsed.toLocaleDateString('en-GB');
  };

  return (
    <>
      <TableRow
        sx={{
          '&:hover': { bgcolor: 'action.hover' },
        }}
      >
        {!isAggregated && (
          <TableCell>
            <Typography>{formatDate(material?.date)}</Typography>
          </TableCell>
        )}
        <TableCell>
          <Typography>{material?.product_name}</Typography>
        </TableCell>
        {isAggregated && (
          <TableCell>
            <Typography>
              {formatNumber(material?.budgeted_quantity)}{' '}
              {material?.measurement_unit?.symbol}
            </Typography>
          </TableCell>
        )}

        <TableCell>
          <Typography
            color={
              material?.quantity > material?.budgeted_quantity ? 'error' : ''
            }
          >
            {formatNumber(material?.quantity)}{' '}
            {material?.measurement_unit?.symbol}
          </Typography>
        </TableCell>
      </TableRow>
    </>
  );
};

export default TaskViewListItem;
