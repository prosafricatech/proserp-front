'use client';

import React, { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Grid,
  IconButton,
  Paper,
  Radio,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  Divider,
  Collapse,
  useTheme,
  alpha,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  AssessmentOutlined,
  ReceiptOutlined,
  CheckCircleOutline,
  AddOutlined,
  ExpandMore,
  ExpandLess,
  TrendingDown,
  ShoppingCartOutlined,
  InfoOutlined,
} from '@mui/icons-material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { LoadingButton } from '@mui/lab';

interface Quote {
  id: number;
  stakeholder: {
    id: number;
    name: string;
  };
  quantity: number;
  rate: number;
  amount: number;
  awarded_quantity: number;
  unawarded_quantity: number;
  vat_percentage: number;
  lead_time_days: number | null;
}

interface ComparisonItem {
  id: number;
  product: {
    id: number;
    item_name: string;
    name: string;
  };
  measurement_unit: {
    id: number;
    name: string;
    symbol: string;
  };
  quantity: number;
  quotes: Quote[];
}

interface RFQComparisonProps {
  comparison: {
    items: ComparisonItem[];
  };
  isAwarding: boolean;
  onAward: (selectedQuotes: Record<number, Quote>) => void;
}

const RFQComparisonUI: React.FC<RFQComparisonProps> = ({
  comparison,
  isAwarding,
  onAward,
}) => {
  const theme = useTheme();
  const isDarkMode = theme.type === 'dark';
  
  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>({});
  const [selectedQuoteByItem, setSelectedQuoteByItem] = useState<Record<number, Quote>>({});

  const getCurrencyCode = (supplierName: string) => {
    return 'TZS';
  };

  const selectedCount = Object.keys(selectedQuoteByItem).length;
  const totalItems = comparison?.items?.length || 0;

  // Get unique suppliers from selected quotes
  const getSelectedSuppliers = () => {
    const supplierIds = new Set<number>();
    Object.values(selectedQuoteByItem).forEach((quote) => {
      supplierIds.add(quote.stakeholder.id);
    });
    return Array.from(supplierIds).map((id) => {
      const quote = Object.values(selectedQuoteByItem).find((q) => q.stakeholder.id === id);
      return {
        id,
        name: quote?.stakeholder.name || 'Unknown',
        itemCount: Object.values(selectedQuoteByItem).filter((q) => q.stakeholder.id === id).length,
      };
    });
  };

  // Check if all selected quotes are from the same supplier
  const allSameSupplier = () => {
    if (selectedCount === 0) return false;
    const uniqueSuppliers = new Set<number>();
    Object.values(selectedQuoteByItem).forEach((quote) => {
      uniqueSuppliers.add(quote.stakeholder.id);
    });
    return uniqueSuppliers.size === 1;
  };

  const handleAward = () => {
    if (selectedCount === 0) {
      return;
    }
    onAward(selectedQuoteByItem);
  };

  // Award a single item
  const handleAwardItem = (itemId: number) => {
    const selectedQuote = selectedQuoteByItem[itemId];
    if (selectedQuote) {
      onAward({ [itemId]: selectedQuote });
    }
  };

  const handleAccordionChange = (itemId: number) => {
    setExpandedItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  const getBestPrice = (quotes: Quote[]) => {
    if (!quotes || quotes.length === 0) return null;
    return quotes.reduce((min, quote) => 
      (quote.rate < min.rate) ? quote : min
    );
  };

  const getBestLeadTime = (quotes: Quote[]) => {
    if (!quotes || quotes.length === 0) return null;
    const validQuotes = quotes.filter(q => q.lead_time_days !== null);
    if (validQuotes.length === 0) return null;
    return validQuotes.reduce((min, quote) => 
      (quote.lead_time_days! < min.lead_time_days!) ? quote : min
    );
  };

  const expandAll = () => {
    const allExpanded: Record<number, boolean> = {};
    (comparison?.items || []).forEach((item) => {
      allExpanded[item.id] = true;
    });
    setExpandedItems(allExpanded);
  };

  const collapseAll = () => {
    setExpandedItems({});
  };

  const selectedSuppliers = getSelectedSuppliers();

  // Check if a quote has unawarded quantity available
  const hasUnawardedQuantity = (quote: Quote) => {
    return (quote.unawarded_quantity || 0) > 0;
  };

  // Get display quantity for a quote (use unawarded_quantity if available, otherwise quantity)
  const getDisplayQuantity = (quote: Quote) => {
    return quote.unawarded_quantity !== undefined && quote.unawarded_quantity !== null 
      ? quote.unawarded_quantity 
      : quote.quantity;
  };

  return (
    <Paper 
      sx={{ 
        p: 3, 
        bgcolor: isDarkMode ? 'background.paper' : 'background.default',
      }}
    >
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h6" fontWeight="bold" color="text.primary">
          <AssessmentOutlined fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
          Quote Comparison
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          {comparison?.items && comparison.items.length > 1 && (
            <>
              <Button size="small" onClick={expandAll} variant="text">
                Expand All
              </Button>
              <Button size="small" onClick={collapseAll} variant="text">
                Collapse All
              </Button>
            </>
          )}
          <Chip 
            label={`${selectedCount} of ${totalItems} selected`} 
            color={selectedCount > 0 ? 'primary' : 'default'}
            variant={selectedCount > 0 ? 'filled' : 'outlined'}
            sx={{ fontWeight: 500 }}
          />
        </Stack>
      </Stack>

      {/* Info Alert */}
      <Alert 
        severity="info" 
        sx={{ 
          mb: 3,
          bgcolor: isDarkMode ? alpha(theme.palette.info.main, 0.1) : undefined,
          color: isDarkMode ? theme.palette.info.light : undefined,
          '& .MuiAlert-icon': {
            color: isDarkMode ? theme.palette.info.light : undefined,
          },
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <ReceiptOutlined />
          <Typography variant="body2">
            Select the best quote per item. 
            {allSameSupplier() && selectedCount > 0 
              ? ' All items are from the same supplier - they will be combined into one purchase order.'
              : selectedCount > 0 
                ? ' Items are from different suppliers - each supplier will get a separate purchase order.'
                : ' When ready, click "Award Selected" to create purchase orders grouped by supplier.'
            }
          </Typography>
        </Stack>
      </Alert>

      {/* Items as Accordions - Removed spacing between accordions */}
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        {(comparison?.items || []).map((item, index) => {
          const bestPrice = getBestPrice(item.quotes);
          const bestLeadTime = getBestLeadTime(item.quotes);
          const selectedQuote = selectedQuoteByItem[item.id];
          const isExpanded = expandedItems[item.id] || false;
          const hasSelected = !!selectedQuote;

          return (
            <Accordion
              key={item.id}
              expanded={isExpanded}
              onChange={() => handleAccordionChange(item.id)}
              square
              sx={{
                borderRadius: 0,
                borderTop: index === 0 ? 2 : 1,
                borderBottom: 1,
                borderColor: 'divider',
                '&:hover': {
                  bgcolor: 'action.hover',
                },
                '& > .MuiAccordionDetails-root:hover': {
                  bgcolor: 'transparent',
                },
                '&:first-of-type': {
                  borderTopLeftRadius: 8,
                  borderTopRightRadius: 8,
                },
                '&:last-of-type': {
                  borderBottomLeftRadius: 8,
                  borderBottomRightRadius: 8,
                },
              }}
            >
              <AccordionSummary
                expandIcon={isExpanded ? <RemoveIcon /> : <AddIcon />}
                sx={{
                  px: 3,
                  flexDirection: 'row-reverse',
                  '.MuiAccordionSummary-content': {
                    alignItems: 'center',
                    '&.Mui-expanded': {
                      margin: '12px 0',
                    },
                  },
                  '.MuiAccordionSummary-expandIconWrapper': {
                    borderRadius: 1,
                    border: 1,
                    color: 'text.secondary',
                    transform: 'none',
                    mr: 1,
                    '&.Mui-expanded': {
                      transform: 'none',
                      color: 'primary.main',
                      borderColor: 'primary.main',
                    },
                    '& svg': {
                      fontSize: '1.25rem'
                    },
                  },
                }}
              >
                <Grid container alignItems="center" spacing={2} sx={{ width: '100%' }}>
                  {/* Left side - Product Name */}
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography variant="body2" fontWeight="medium" color="text.primary">
                        {item.product?.item_name || item.product?.name || 'Item'}
                      </Typography>
                    </Stack>
                  </Grid>

                  {/* Center - Quantity with Unit */}
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Stack 
                      direction="row" 
                      alignItems="center" 
                      spacing={1}
                      justifyContent="center"
                    >
                      <Typography variant="caption" color="text.secondary">
                        Qty:
                      </Typography>
                      <Chip 
                        label={`${item.quantity} ${item.measurement_unit?.symbol || 'units'}`} 
                        size="small" 
                        variant="outlined"
                        sx={{ height: 24, fontSize: '0.75rem', fontWeight: 'medium' }}
                      />
                    </Stack>
                  </Grid>

                  {/* Right side - Award Button for individual item */}
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Stack 
                      direction="row" 
                      alignItems="center" 
                      spacing={1}
                      justifyContent={{ xs: 'flex-start', md: 'flex-end' }}
                    >
                      {hasSelected && (
                        <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
                          {selectedQuote.stakeholder.name}
                        </Typography>
                      )}
                      <LoadingButton
                        variant={hasSelected ? "contained" : "outlined"}
                        size="small"
                        loading={isAwarding}
                        disabled={!hasSelected}
                        onClick={() => handleAwardItem(item.id)}
                        startIcon={<ShoppingCartOutlined />}
                        sx={{ 
                          minWidth: 'auto',
                          px: 2,
                          py: 0.5,
                        }}
                      >
                        {hasSelected ? 'Award' : 'Select Quote'}
                      </LoadingButton>
                    </Stack>
                  </Grid>
                </Grid>
              </AccordionSummary>

              <AccordionDetails             
                sx={{
                  backgroundColor: 'background.paper',
                  padding: 0.5
                }}
              >
                <Box sx={{ p: 2, bgcolor: isDarkMode ? alpha(theme.palette.common.white, 0.02) : 'grey.50' }}>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 7 }}>
                      <Typography variant="subtitle2" color="text.primary" gutterBottom>
                        Quote Details
                      </Typography>
                      <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                          <TableHead>
                            <TableRow sx={{ 
                              bgcolor: isDarkMode ? alpha(theme.palette.common.white, 0.04) : 'grey.50',
                            }}>
                              <TableCell>Supplier</TableCell>
                              <TableCell>Rate</TableCell>
                              <TableCell>Award Qty</TableCell>
                              <TableCell>Total</TableCell>
                              <TableCell>Lead Time</TableCell>
                              <TableCell>Select</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {item.quotes.map((quote) => {
                              const isSelected = selectedQuote?.id === quote.id;
                              const isBestPrice = bestPrice && quote.id === bestPrice.id;
                              const availableQty = getDisplayQuantity(quote);
                              const isAvailable = hasUnawardedQuantity(quote);

                              return (
                                <TableRow 
                                  key={quote.id}
                                  sx={{
                                    bgcolor: isSelected ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
                                    opacity: isAvailable ? 1 : 0.5,
                                  }}
                                >
                                  <TableCell>
                                    <Stack direction="row" alignItems="center" spacing={0.5}>
                                      <Typography variant="body2">
                                        {quote.stakeholder.name}
                                      </Typography>
                                      {isBestPrice && (
                                        <Tooltip title="Best Price">
                                          <TrendingDown 
                                            fontSize="small" 
                                            color="success" 
                                            sx={{ fontSize: 14 }} 
                                          />
                                        </Tooltip>
                                      )}
                                      {!isAvailable && (
                                        <Tooltip title="No quantity remaining to award">
                                          <InfoOutlined 
                                            fontSize="small" 
                                            color="warning" 
                                            sx={{ fontSize: 14 }} 
                                          />
                                        </Tooltip>
                                      )}
                                    </Stack>
                                  </TableCell>
                                  <TableCell align="right">
                                    <Typography 
                                      variant="body2"
                                      fontWeight={isBestPrice ? 'bold' : 'regular'}
                                      color={isBestPrice ? 'success.main' : 'text.primary'}
                                    >
                                      {getCurrencyCode(quote.stakeholder.name)} {quote.rate?.toLocaleString()}
                                    </Typography>
                                  </TableCell>
                                  <TableCell align="right">
                                    <Typography 
                                      variant="body2"
                                    >
                                      {availableQty.toLocaleString()}
                                      {quote.quantity !== availableQty && (
                                        <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.5, display: 'block' }}>
                                          (Awarded: {quote.awarded_quantity})
                                        </Typography>
                                      )}
                                    </Typography>
                                  </TableCell>
                                  <TableCell align="right">
                                    <Typography variant="body2">
                                      {getCurrencyCode(quote.stakeholder.name)} {quote.amount?.toLocaleString()}
                                    </Typography>
                                  </TableCell>
                                  <TableCell align="center">
                                    {quote.lead_time_days !== null ? (
                                      <Chip 
                                        label={`${quote.lead_time_days}d`} 
                                        size="small" 
                                        variant="outlined"
                                        color={bestLeadTime && quote.id === bestLeadTime.id ? 'info' : 'default'}
                                      />
                                    ) : (
                                      <Typography variant="caption" color="text.secondary">-</Typography>
                                    )}
                                  </TableCell>
                                  <TableCell align="center">
                                    <Radio
                                      checked={isSelected}
                                      disabled={!isAvailable}
                                      onChange={() => {
                                        if (isAvailable) {
                                          setSelectedQuoteByItem((prev) => ({
                                            ...prev,
                                            [item.id]: quote,
                                          }));
                                        }
                                      }}
                                      size="small"
                                    />
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Grid>

                    <Grid size={{ xs: 12, md: 5 }}>
                      <Typography variant="subtitle2" color="text.primary" gutterBottom>
                        Summary
                      </Typography>
                      <Paper 
                        variant="outlined" 
                        sx={{ 
                          p: 2,
                          borderColor: isDarkMode ? alpha(theme.palette.common.white, 0.08) : undefined
                        }}
                      >
                        <Stack spacing={1.5}>
                          <Stack direction="row" justifyContent="space-between">
                            <Typography variant="body2">Best Price:</Typography>
                            <Typography variant="body2" fontWeight="bold" color="success.main">
                              {bestPrice 
                                ? `${getCurrencyCode(bestPrice.stakeholder.name)} ${bestPrice.rate?.toLocaleString()}` 
                                : 'N/A'}
                            </Typography>
                          </Stack>
                          <Stack direction="row" justifyContent="space-between">
                            <Typography variant="body2">Best Lead Time:</Typography>
                            <Typography variant="body2" fontWeight="bold" color="info.main">
                              {bestLeadTime ? `${bestLeadTime.lead_time_days} days` : '-'}
                            </Typography>
                          </Stack>
                          <Divider sx={{ 
                            borderColor: isDarkMode ? alpha(theme.palette.common.white, 0.08) : undefined 
                          }} />
                          <Stack direction="row" justifyContent="space-between">
                            <Typography variant="body2">Selected Supplier:</Typography>
                            <Typography variant="body2" fontWeight="bold" color="primary.main">
                              {selectedQuote ? selectedQuote.stakeholder.name : 'None selected'}
                            </Typography>
                          </Stack>
                          {selectedQuote && (
                            <>
                              <Stack direction="row" justifyContent="space-between">
                                <Typography variant="body2">Selected Rate:</Typography>
                                <Typography variant="body2" fontWeight="bold">
                                  {getCurrencyCode(selectedQuote.stakeholder.name)} {selectedQuote.rate?.toLocaleString()}
                                </Typography>
                              </Stack>
                              <Stack direction="row" justifyContent="space-between">
                                <Typography variant="body2">Available Qty:</Typography>
                                <Typography variant="body2" fontWeight="bold" color="primary.main">
                                  {getDisplayQuantity(selectedQuote).toLocaleString()}
                                </Typography>
                              </Stack>
                              <Stack direction="row" justifyContent="space-between">
                                <Typography variant="body2">Total Amount:</Typography>
                                <Typography variant="body2" fontWeight="bold" color="primary.main">
                                  {getCurrencyCode(selectedQuote.stakeholder.name)} {selectedQuote.amount?.toLocaleString()}
                                </Typography>
                              </Stack>
                            </>
                          )}
                        </Stack>
                      </Paper>
                    </Grid>
                  </Grid>
                </Box>
              </AccordionDetails>
            </Accordion>
          );
        })}
      </Box>

      {/* Action Buttons */}
      <Stack 
        direction={{ xs: 'column', sm: 'row' }} 
        justifyContent="space-between" 
        alignItems={{ xs: 'stretch', sm: 'center' }} 
        mt={3}
        spacing={2}
        sx={{
          pt: 2,
          borderTop: 1,
          borderColor: 'divider',
        }}
      >
        <Box>
          {selectedCount > 0 && (
            <Typography variant="caption" color="text.secondary">
              Selected {selectedCount} of {totalItems} items
              {allSameSupplier() && selectedCount > 0 && ' (Single Purchase Order)'}
              {!allSameSupplier() && selectedCount > 1 && ` (${selectedSuppliers.length} Purchase Orders)`}
            </Typography>
          )}
        </Box>
        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          spacing={2}
          sx={{ width: { xs: '100%', sm: 'auto' } }}
        >
          <Button 
            variant="outlined" 
            onClick={() => setSelectedQuoteByItem({})}
            disabled={selectedCount === 0}
            size="small"
            sx={{
              width: { xs: '100%', sm: 'auto' },
            }}
          >
            Clear All
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
};

export default RFQComparisonUI;