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

  const toNumber = (value: unknown) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const quantity = toNumber(material?.quantity);
  const budgetedQuantity = toNumber(material?.budgeted_quantity);
  const balance = budgetedQuantity - quantity;

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

        <TableCell align='right'>
          <Typography>
            {formatNumber(quantity)}{' '}
            {material?.measurement_unit?.symbol}
          </Typography>
        </TableCell>

        {isAggregated && (
          <>
            <TableCell align='right'>
              <Typography>
                {formatNumber(budgetedQuantity)}{' '}
                {material?.measurement_unit?.symbol}
              </Typography>
            </TableCell>
            <TableCell align='right'>
              <Typography color={balance < 0 ? 'error' : 'text.primary'}>
                {formatNumber(balance)} {material?.measurement_unit?.symbol}
              </Typography>
            </TableCell>
          </>
        )}
      </TableRow>
    </>
  );
};

export default TaskViewListItem;
