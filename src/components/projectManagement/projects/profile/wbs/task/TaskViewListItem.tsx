import { Divider, Grid, Tooltip, Typography } from '@mui/material';

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
      <Divider />

      <Grid
        mt={1}
        mb={1}
        sx={{
          cursor: 'pointer',
          '&:hover': {
            bgcolor: 'action.hover',
          },
        }}
        paddingLeft={2}
        paddingRight={2}
        spacing={1}
        alignItems={'center'}
        container
      >
        {!isAggregated && (
          <Grid size={4}>
            <Tooltip title='Issued Date'>
              <div>
                <Typography>{formatDate(material?.date)}</Typography>
              </div>
            </Tooltip>
          </Grid>
        )}

        <Grid size={!isAggregated ? 5 : 8}>
          <Tooltip title='Product Name'>
            <div>
              <Typography noWrap={false}>{material?.product_name}</Typography>
            </div>
          </Tooltip>
        </Grid>

        <Grid size={!isAggregated ? 3 : 4}>
          <Tooltip title='Quantity'>
            <Typography>
              {formatNumber(material?.quantity)}{' '}
              {material?.measurement_unit?.symbol}
            </Typography>
          </Tooltip>
        </Grid>
      </Grid>
    </>
  );
};

export default TaskViewListItem;
