"use client";

import React from "react";
import {
  Grid,
  TextField,
  Card,
  CardContent,
  Typography,
  Box,
  Alert,
  Divider
} from "@mui/material";
import { useFormContext } from "react-hook-form";
import { useSalesStation } from "../../Stations/StationProvider";

interface DippingTabProps {
  salesShift?: any;
}

interface TankDipping {
  tank_id: number;
  tank_name: string;
  product_name: string;
  opening_dipping: number;
  closing_dipping: number;
  capacity: number;
  current_stock: number;
}

const DippingTab: React.FC<DippingTabProps> = ({ salesShift }) => {
  const { watch, setValue } = useFormContext();
  const { activeStation } = useSalesStation();
  
  const tanks = activeStation?.tanks || [];
  const dippingReadings = watch("dipping_readings") || [];

  // Calculate dipping difference and stock percentage
  const calculateDippingInfo = (opening: number, closing: number, capacity: number) => {
    const difference = closing - opening;
    const currentStock = closing;
    const stockPercentage = capacity > 0 ? (currentStock / capacity) * 100 : 0;
    
    return { difference, currentStock, stockPercentage };
  };

  // Get stock level color
  const getStockLevelColor = (percentage: number) => {
    if (percentage >= 75) return 'success.main';
    if (percentage >= 25) return 'warning.main';
    return 'error.main';
  };

  // Get stock level text
  const getStockLevelText = (percentage: number) => {
    if (percentage >= 75) return 'High';
    if (percentage >= 25) return 'Medium';
    return 'Low';
  };

  // Update dipping reading
  const updateDippingReading = (tankId: number, field: 'opening_dipping' | 'closing_dipping', value: number) => {
    const updatedReadings = dippingReadings.map((reading: any) =>
      reading.tank_id === tankId ? { ...reading, [field]: value } : reading
    );
    
    // If reading doesn't exist, create it
    if (!updatedReadings.find((r: any) => r.tank_id === tankId)) {
      const tank = tanks.find(t => t.id === tankId);
      updatedReadings.push({
        tank_id: tankId,
        tank_name: tank?.name || '',
        product_name: tank?.product?.name || '',
        capacity: tank?.capacity || 0,
        opening_dipping: field === 'opening_dipping' ? value : 0,
        closing_dipping: field === 'closing_dipping' ? value : 0,
        current_stock: 0
      });
    }
    
    setValue("dipping_readings", updatedReadings);
  };

  // Initialize dipping readings if not exists
  React.useEffect(() => {
    if (tanks.length > 0 && dippingReadings.length === 0) {
      const initialReadings = tanks.map(tank => ({
        tank_id: tank.id,
        tank_name: tank.name || '',
        product_name: tank.product?.name || '',
        capacity: tank.capacity || 0,
        opening_dipping: 0,
        closing_dipping: 0,
        current_stock: 0
      }));
      setValue("dipping_readings", initialReadings);
    }
  }, [tanks, dippingReadings.length, setValue]);

  // Calculate totals
  const calculateTotals = () => {
    const totals = dippingReadings.reduce((acc: any, reading: any) => {
      const { difference, currentStock } = calculateDippingInfo(
        reading.opening_dipping || 0,
        reading.closing_dipping || 0,
        reading.capacity || 0
      );
      
      return {
        totalOpening: acc.totalOpening + (reading.opening_dipping || 0),
        totalClosing: acc.totalClosing + (reading.closing_dipping || 0),
        totalDifference: acc.totalDifference + difference,
        totalCurrentStock: acc.totalCurrentStock + currentStock,
        totalCapacity: acc.totalCapacity + (reading.capacity || 0)
      };
    }, { totalOpening: 0, totalClosing: 0, totalDifference: 0, totalCurrentStock: 0, totalCapacity: 0 });

    return totals;
  };

  const totals = calculateTotals();
  const overallStockPercentage = totals.totalCapacity > 0 ? 
    (totals.totalCurrentStock / totals.totalCapacity) * 100 : 0;

  return (
    <Box sx={{ width: "100%" }}>
      {/* Summary Alert */}
      <Alert 
        severity={
          overallStockPercentage >= 75 ? "success" :
          overallStockPercentage >= 25 ? "warning" : "error"
        }
        sx={{ mb: 3 }}
      >
        <Typography variant="body1" fontWeight="bold">
          Overall Stock Level: {overallStockPercentage.toFixed(1)}% - {getStockLevelText(overallStockPercentage)}
        </Typography>
        <Typography variant="body2">
          Total Capacity: {totals.totalCapacity.toLocaleString()}L | 
          Current Stock: {totals.totalCurrentStock.toLocaleString()}L | 
          Net Change: {totals.totalDifference.toLocaleString()}L
        </Typography>
      </Alert>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card sx={{ backgroundColor: 'primary.50' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="primary.main" gutterBottom>
                Total Opening
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                {totals.totalOpening.toLocaleString()}L
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, md: 3 }}>
          <Card sx={{ backgroundColor: 'secondary.50' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="secondary.main" gutterBottom>
                Total Closing
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                {totals.totalClosing.toLocaleString()}L
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, md: 3 }}>
          <Card sx={{ 
            backgroundColor: totals.totalDifference >= 0 ? 'success.50' : 'error.50' 
          }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography 
                variant="h6" 
                color={totals.totalDifference >= 0 ? 'success.main' : 'error.main'} 
                gutterBottom
              >
                Net Change
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                {totals.totalDifference >= 0 ? '+' : ''}{totals.totalDifference.toLocaleString()}L
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, md: 3 }}>
          <Card sx={{ backgroundColor: 'info.50' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="info.main" gutterBottom>
                Stock Level
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                {overallStockPercentage.toFixed(1)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tank Dipping Cards */}
      <Grid container spacing={3}>
        {tanks.map((tank) => {
          const reading = dippingReadings.find((r: any) => r.tank_id === tank.id) || {
            opening_dipping: 0,
            closing_dipping: 0,
            capacity: tank.capacity || 0
          };
          
          const { difference, currentStock, stockPercentage } = calculateDippingInfo(
            reading.opening_dipping,
            reading.closing_dipping,
            reading.capacity
          );

          return (
            <Grid key={tank.id} size={{ xs: 12, md: 6, lg: 4 }}>
              <Card 
                sx={{ 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  border: '2px solid',
                  borderColor: getStockLevelColor(stockPercentage),
                  '&:hover': {
                    boxShadow: 3,
                  }
                }}
              >
                <CardContent sx={{ flexGrow: 1, p: 3 }}>
                  {/* Tank Header */}
                  <Box sx={{ textAlign: 'center', mb: 2 }}>
                    <Typography 
                      variant="h6" 
                      sx={{ fontWeight: 'bold', color: 'primary.main' }}
                      gutterBottom
                    >
                      {tank.name}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      color="textSecondary"
                      sx={{ fontStyle: 'italic' }}
                    >
                      {tank.product?.name || 'No Product'}
                    </Typography>
                  </Box>

                  <Divider sx={{ mb: 2 }} />

                  {/* Capacity Info */}
                  <Box sx={{ mb: 3, p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
                    <Grid container spacing={1}>
                      <Grid size={{ xs: 6 }}>
                        <Typography variant="body2" fontWeight="medium">
                          Capacity:
                        </Typography>
                        <Typography variant="body1" fontWeight="bold">
                          {tank.capacity?.toLocaleString()}L
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 6 }}>
                        <Typography variant="body2" fontWeight="medium">
                          Stock Level:
                        </Typography>
                        <Typography 
                          variant="body1" 
                          fontWeight="bold"
                          color={getStockLevelColor(stockPercentage)}
                        >
                          {stockPercentage.toFixed(1)}%
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>

                  {/* Dipping Readings */}
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        fullWidth
                        label="Opening Dipping (L)"
                        type="number"
                        value={reading.opening_dipping || 0}
                        onChange={(e) => updateDippingReading(tank.id, 'opening_dipping', parseFloat(e.target.value) || 0)}
                        size="small"
                        inputProps={{ 
                          min: 0,
                          max: tank.capacity,
                          step: 0.1,
                          style: { textAlign: 'center' }
                        }}
                        helperText={`Max: ${tank.capacity?.toLocaleString()}L`}
                      />
                    </Grid>
                    
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        fullWidth
                        label="Closing Dipping (L)"
                        type="number"
                        value={reading.closing_dipping || 0}
                        onChange={(e) => updateDippingReading(tank.id, 'closing_dipping', parseFloat(e.target.value) || 0)}
                        size="small"
                        inputProps={{ 
                          min: 0,
                          max: tank.capacity,
                          step: 0.1,
                          style: { textAlign: 'center' }
                        }}
                        helperText={`Max: ${tank.capacity?.toLocaleString()}L`}
                      />
                    </Grid>
                  </Grid>

                  {/* Calculations */}
                  <Box sx={{ mt: 2, p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
                    <Grid container spacing={1}>
                      <Grid size={{ xs: 6 }}>
                        <Typography variant="body2" fontWeight="medium">
                          Net Change:
                        </Typography>
                        <Typography 
                          variant="body1" 
                          fontWeight="bold"
                          color={difference >= 0 ? 'success.main' : 'error.main'}
                        >
                          {difference >= 0 ? '+' : ''}{difference.toLocaleString()}L
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 6 }}>
                        <Typography variant="body2" fontWeight="medium">
                          Current Stock:
                        </Typography>
                        <Typography variant="body1" fontWeight="bold">
                          {currentStock.toLocaleString()}L
                        </Typography>
                      </Grid>
                    </Grid>
                    
                    {/* Stock Level Bar */}
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="caption" display="block" gutterBottom>
                        Stock Level: {getStockLevelText(stockPercentage)}
                      </Typography>
                      <Box 
                        sx={{ 
                          width: '100%', 
                          height: 8, 
                          backgroundColor: 'grey.300', 
                          borderRadius: 4,
                          overflow: 'hidden'
                        }}
                      >
                        <Box 
                          sx={{ 
                            width: `${Math.min(stockPercentage, 100)}%`, 
                            height: '100%', 
                            backgroundColor: getStockLevelColor(stockPercentage),
                            transition: 'width 0.3s ease'
                          }}
                        />
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {tanks.length === 0 && (
        <Card sx={{ textAlign: 'center', py: 6, backgroundColor: 'grey.50' }}>
          <CardContent>
            <Typography variant="h6" color="textSecondary" gutterBottom>
              No Tanks Found
            </Typography>
            <Typography variant="body2" color="textSecondary">
              This station doesn't have any tanks configured yet.
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default DippingTab;