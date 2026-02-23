import React from 'react';
import {
  Dialog,
  Typography,
  Box,
  Grid,
  Skeleton,
  Divider,
  Paper,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import requisitionsServices from '@/components/processApproval/requisitionsServices';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { Currency } from '@/components/masters/Currencies/CurrencyType';
import { MeasurementUnit } from '@/components/masters/measurementUnits/MeasurementUnitType';

interface ProductBudgetCheckDetailsProps {
  requisition: any;
  productId: number;
  costCenterId: number;
  productName: string;
  measurementUnit: MeasurementUnit;
  currency: Currency;
  open: boolean;
  onClose: () => void;
}

const fetchProductBudgetCheck = async (productId: number, costCenterId: number) => {
  return requisitionsServices.productBudgetCheck({
    product_id: productId,
    cost_center_id: costCenterId,
  });
};

const StatItem = ({ label, value, unit, currency }: { label: string; value?: number; unit?: string;currency?: Currency }) => (
  <Box>
    <Typography variant="caption" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="h6">
      {currency ? ` ${currency.code}` : ''} {''}
      {value?.toLocaleString?.() ?? '0'}
      {unit ? ` ${unit}` : ''}
    </Typography>
  </Box>
);

/* ---------------- Section wrapper ---------------- */
const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <Paper variant="outlined" sx={{ p: 2 }}>
    <Typography
      variant="subtitle1"
      mb={1}
      color="text.primary"
    >
      {title}
    </Typography>
    <Divider sx={{ mb: 2 }} />
    <Grid container spacing={2}>
      {children}
    </Grid>
  </Paper>
);

const ProductBudgetCheckDetails: React.FC<ProductBudgetCheckDetailsProps> = ({
  measurementUnit,
  currency,
  productId,
  costCenterId,
  productName,
  open,
  onClose,
}) => {
  const { data, isFetching } = useQuery({
    queryKey: ['productBudgetCheck', { productId, costCenterId }],
    queryFn: () => fetchProductBudgetCheck(productId, costCenterId),
    enabled: open && !!productId && !!costCenterId,
  });

  const unit = measurementUnit?.symbol;

  return (
    <Dialog open={open} maxWidth="md" fullWidth onClose={onClose}>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box mb={3}>
          <Typography variant="h3" textAlign={'center'} fontWeight={700}>
            Budget Check
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign={'center'}>
            {productName}
          </Typography>
        </Box>

        {isFetching ? (
          <Skeleton variant="rectangular" width="100%" height={240} />
        ) : data ? (
          <Grid container spacing={3}>
            {/* Budget */}
            <Grid size={12}>
              <Section title="Budget Allocation">
                <Grid size={{ xs: 6, md: 6 }}>
                  <StatItem
                    label="Budgeted Quantity"
                    value={data.budgeted_quantity}
                    unit={unit}
                  />
                </Grid>
                <Grid size={{ xs: 6, md: 6 }}>
                  <StatItem
                    label="Budgeted Amount"
                    value={data.budgeted_amount}
                    currency={currency}
                  />
                </Grid>
              </Section>
            </Grid>

            {/* Requests & Approval */}
            <Grid size={12}>
              <Section title="Request & Approval">
                <Grid size={{xs: 6, md: 3}}>
                  <StatItem
                    label="Requested Quantity"
                    value={data.requested_quantity}
                    unit={unit}
                  />
                </Grid>
                <Grid size={{xs: 6, md: 3}}>
                  <StatItem
                    label="Requested Amount"
                    value={data.requested_amount}
                    currency={currency}
                  />
                </Grid>
                <Grid size={{xs: 6, md: 3}}>
                  <StatItem
                    label="Approved Quantity"
                    value={data.approved_quantity}
                    unit={unit}
                  />
                </Grid>
                <Grid size={{xs: 6, md: 3}}>
                  <StatItem
                    label="Approved Amount"
                    value={data.approved_amount}
                    currency={currency}
                  />
                </Grid>
              </Section>
            </Grid>

            {/* Execution */}
            <Grid size={12}>
              <Section title="Procurement & Receiving">
                <Grid size={{ xs: 6, md: 6 }}>
                  <StatItem
                    label="Ordered Quantity"
                    value={data.ordered_quantity}
                    unit={unit}
                  />
                </Grid>
                <Grid size={{ xs: 6, md: 6 }}>
                  <StatItem
                    label="Received Quantity"
                    value={data.received_quantity}
                    unit={unit}
                  />
                </Grid>
              </Section>
            </Grid>

            {/* Consumption */}
            <Grid size={12}>
              <Section title="Consumption">
                <Grid size={{ xs: 6, md: 6 }}>
                  <StatItem
                    label="Consumed Quantity"
                    value={data.consumed_quantity}
                    unit={unit}
                  />
                </Grid>
                <Grid size={{ xs: 6, md: 6 }}>
                  <StatItem
                    label="Consumed Amount"
                    value={data.consumed_amount}
                    currency={currency}
                  />
                </Grid>
              </Section>
            </Grid>

            {/* Store Availability */}
            <Grid size={12}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography
                  variant="subtitle1"
                  fontWeight={700}
                  mb={2}
                >
                  Store Availability
                </Typography>

                {data.store_availability?.length ? (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Store</TableCell>
                          <TableCell align="right">
                            Available Quantity{unit ? ` (${unit})` : ''}
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {data.store_availability.map((store: any) => (
                          <TableRow
                            key={store.id}
                            sx={{
                              cursor: 'pointer',
                              transition: 'background 0.2s',
                              '&:hover': {
                                backgroundColor: 'action.hover',
                              },
                            }}
                          >
                            <TableCell>{store.name}</TableCell>
                            <TableCell align="right">{store.available_quantity}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Typography color="text.secondary">
                    No store availability data.
                  </Typography>
                )}
              </Paper>
            </Grid>
          </Grid>
        ) : (
          <Typography color="text.secondary">
            No budget data available.
          </Typography>
        )}
      </Box>
    </Dialog>
  );
};

export default ProductBudgetCheckDetails;