import React from 'react';
import {
  Grid,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  useTheme,
  Box,
  TableContainer,
  Divider
} from '@mui/material';

function BillOfMaterialOnScreen({ billOfMaterial, organization }) {
  const theme = useTheme();
  
  const mainColor = organization.settings?.main_color || "#2113AD";
  const headerColor = theme.type === 'dark' ? '#29f096' : (organization.settings?.main_color || "#2113AD");
  const contrastText = organization.settings?.contrast_text || "#FFFFFF";

  // Format quantity values
  const formatQuantity = (value) => {
    return value?.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 4
    }) || '0';
  };

  return (
    <>
      {/* Header Section */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={12}>
          <Box 
            sx={{ 
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              width: '100%'
            }}
          >
            <Typography 
              variant="h4" 
              sx={{ color: headerColor }} 
              gutterBottom
            >
              BILL OF MATERIAL
            </Typography>
            <Typography 
              variant="h6" 
              fontWeight="bold"
              gutterBottom
            >
              {billOfMaterial?.bomNo}
            </Typography>
          </Box>
        </Grid>
      </Grid>

      {/* Output Product Information */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{xs: 12, sm: 6, md: 4}}>
          <Box>
            <Typography variant="subtitle2" sx={{ color: headerColor }} gutterBottom>
              Output Product
            </Typography>
            <Typography variant="body1">
              {billOfMaterial.product.name}
            </Typography>
          </Box>
        </Grid>
        <Grid size={{xs: 12, sm: 6, md: 4}}>
          <Box>
            <Typography variant="subtitle2" sx={{ color: headerColor }} gutterBottom>
              Output Quantity
            </Typography>
            <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
              {`${formatQuantity(billOfMaterial.quantity)} ${billOfMaterial.measurement_unit.symbol}`}
            </Typography>
          </Box>
        </Grid>
        <Grid size={{xs: 12, sm: 6, md: 4}}>
          <Box>
            <Typography variant="subtitle2" sx={{ color: headerColor }} gutterBottom>
              Total Input Items
            </Typography>
            <Typography variant="body1">
              {billOfMaterial.items?.length || 0}
            </Typography>
          </Box>
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      {/* Input Products Section */}
      <Box sx={{ mb: 3 }}>
        <Typography 
          variant="h5" 
          sx={{ 
            color: headerColor, 
            textAlign: 'center', 
            mb: 2
          }}
        >
          INPUT MATERIALS
        </Typography>
        
        <TableContainer 
          component={Paper}
          sx={{
            boxShadow: theme.shadows[2],
            '& .MuiTableRow-root:hover': {
              backgroundColor: theme.palette.action.hover,
            }
          }}
        >
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ backgroundColor: mainColor, color: contrastText, fontSize: '0.875rem', width: '8%' }}>
                  S/N
                </TableCell>
                <TableCell sx={{ backgroundColor: mainColor, color: contrastText, fontSize: '0.875rem' }}>
                  Input Product
                </TableCell>
                <TableCell sx={{ backgroundColor: mainColor, color: contrastText, fontSize: '0.875rem' }} align="right">
                  Quantity Required
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {billOfMaterial.items?.map((item, index) => (
                <React.Fragment key={item.id}>
                  {/* Main Input Item */}
                  <TableRow 
                    sx={{ 
                      backgroundColor: theme.palette.background.paper,
                      '&:nth-of-type(even)': {
                        backgroundColor: theme.palette.action.hover,
                      }
                    }}
                  >
                    <TableCell sx={{  verticalAlign: 'top' }}>{index + 1}</TableCell>
                    <TableCell sx={{ verticalAlign: 'top' }}>
                      {item.product.name}
                    </TableCell>
                    <TableCell align="right" sx={{ fontFamily: 'monospace', verticalAlign: 'top' }}>
                      {`${formatQuantity(item.quantity)} ${item.measurement_unit.symbol}`}
                    </TableCell>
                  </TableRow>

                  {/* Alternatives Section */}
                  {item.alternatives?.length > 0 && (
                    <>
                      {/* Alternatives Header */}
                      <TableRow sx={{ backgroundColor: theme.palette.background.default }}>
                        <TableCell colSpan={3} sx={{ py: 1, borderBottom: 'none' }}>
                          <Typography 
                            variant="subtitle2" 
                            sx={{ 
                              color: headerColor, 
                              pl: 2
                            }}
                          >
                            Alternative Options
                          </Typography>
                        </TableCell>
                      </TableRow>

                      {/* Alternative Items */}
                      {item.alternatives.map((alt, altIndex) => (
                        <TableRow
                          key={alt.id || altIndex}
                          sx={{ 
                            backgroundColor: theme.palette.background.paper,
                            '&:nth-of-type(even)': {
                              backgroundColor: theme.palette.action.hover,
                            }
                          }}
                        >
                          <TableCell sx={{ pl: 4, fontStyle: 'italic', verticalAlign: 'top' }}>
                            {String.fromCharCode(97 + altIndex)}. {/* a, b, c, etc. */}
                          </TableCell>
                          <TableCell sx={{ fontStyle: 'italic', verticalAlign: 'top' }}>
                            {alt.product.name}
                          </TableCell>
                          <TableCell align="right" sx={{ fontFamily: 'monospace', fontStyle: 'italic', verticalAlign: 'top' }}>
                            {`${formatQuantity(alt.quantity)} ${item.measurement_unit.symbol}`}
                          </TableCell>
                        </TableRow>
                      ))}

                      {/* Spacer after alternatives */}
                      <TableRow>
                        <TableCell colSpan={3} sx={{ py: 1, borderBottom: 'none' }} />
                      </TableRow>
                    </>
                  )}
                </React.Fragment>
              ))}
              
              {/* Empty State */}
              {(!billOfMaterial.items || billOfMaterial.items.length === 0) && (
                <TableRow>
                  <TableCell colSpan={3} sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      No input materials defined
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Summary Information */}
      <Grid container spacing={2} sx={{ mt: 3 }}>
        <Grid size={{xs: 12, sm: 6, md: 4}}>
          <Box>
            <Typography variant="subtitle2" sx={{ color: headerColor }} gutterBottom>
              Total Alternative Options
            </Typography>
            <Typography variant="body1">
              {billOfMaterial.items?.reduce((total, item) => total + (item.alternatives?.length || 0), 0) || 0}
            </Typography>
          </Box>
        </Grid>
        <Grid size={{xs: 12, sm: 6, md: 4}}>
          <Box>
            <Typography variant="subtitle2" sx={{ color: headerColor }} gutterBottom>
              Created By
            </Typography>
            <Typography variant="body1">{billOfMaterial.creator.name}</Typography>
          </Box>
        </Grid>
      </Grid>

      {/* Description Section */}
      {billOfMaterial.description && (
        <Box sx={{ mt: 3, p: 2, backgroundColor: theme.palette.background.default, borderRadius: 1 }}>
          <Typography variant="subtitle2" sx={{ color: headerColor }} gutterBottom>
            Description
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
            {billOfMaterial.description}
          </Typography>
        </Box>
      )}
    </>
  );
}

export default BillOfMaterialOnScreen;