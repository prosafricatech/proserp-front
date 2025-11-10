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
import { readableDate } from '@/app/helpers/input-sanitization-helpers';

function SubContractMaterialUsedOnScreen({ SubContractMaterialUsedDetails, organization }) {
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
              SUBCONTRACT MATERIALS USED
            </Typography>
            <Typography 
              variant="h6" 
              fontWeight="bold"
              gutterBottom
            >
              {SubContractMaterialUsedDetails.proformaNo}
            </Typography>
          </Box>
        </Grid>
      </Grid>

      {/* Main Information Section */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{xs: 12, sm: 6, md: 4}}>
          <Box>
            <Typography variant="subtitle2" sx={{ color: headerColor }} gutterBottom>
              Issue No
            </Typography>
            <Typography variant="body1">{SubContractMaterialUsedDetails.issueNo}</Typography>
          </Box>
        </Grid>
        <Grid size={{xs: 12, sm: 6, md: 4}}>
          <Box>
            <Typography variant="subtitle2" sx={{ color: headerColor }} gutterBottom>
              Issue Date
            </Typography>
            <Typography variant="body1">
              {readableDate(SubContractMaterialUsedDetails.issue_date)}
            </Typography>
          </Box>
        </Grid>
        <Grid size={{xs: 12, sm: 6, md: 4}}>
          <Box>
            <Typography variant="subtitle2" sx={{ color: headerColor }} gutterBottom>
              Project
            </Typography>
            <Typography variant="body1">
              {SubContractMaterialUsedDetails.subcontract.project.name}
            </Typography>
          </Box>
        </Grid>
        <Grid size={{xs: 12, sm: 6, md: 4}}>
          <Box>
            <Typography variant="subtitle2" sx={{ color: headerColor }} gutterBottom>
              Reference
            </Typography>
            <Typography variant="body1">{SubContractMaterialUsedDetails.reference}</Typography>
          </Box>
        </Grid>
        <Grid size={{xs: 12, sm: 6, md: 4}}>
          <Box>
            <Typography variant="subtitle2" sx={{ color: headerColor }} gutterBottom>
              Subcontract No
            </Typography>
            <Typography variant="body1">{SubContractMaterialUsedDetails.subcontract.subcontractNo}</Typography>
          </Box>
        </Grid>
        <Grid size={{xs: 12, sm: 6, md: 4}}>
          <Box>
            <Typography variant="subtitle2" sx={{ color: headerColor }} gutterBottom>
              Subcontractor Name
            </Typography>
            <Typography variant="body1">
              {SubContractMaterialUsedDetails.subcontract.subcontractor.name}
            </Typography>
          </Box>
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      {/* Materials Used Section */}
      <Box sx={{ mb: 3 }}>
        <Typography 
          variant="h5" 
          sx={{ 
            color: headerColor, 
            textAlign: 'center', 
            mb: 2
          }}
        >
          MATERIALS USED
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
                <TableCell sx={{ backgroundColor: mainColor, color: contrastText, fontSize: '0.875rem' }}>
                  S/N
                </TableCell>
                <TableCell sx={{ backgroundColor: mainColor, color: contrastText, fontSize: '0.875rem' }}>
                  Material
                </TableCell>
                <TableCell sx={{ backgroundColor: mainColor, color: contrastText, fontSize: '0.875rem' }}>
                  Unit
                </TableCell>
                <TableCell sx={{ backgroundColor: mainColor, color: contrastText, fontSize: '0.875rem' }} align="right">
                  Quantity
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {SubContractMaterialUsedDetails.items.map((item, index) => (
                <TableRow 
                  key={item.id} 
                  sx={{ 
                    backgroundColor: theme.palette.background.paper,
                    '&:nth-of-type(even)': {
                      backgroundColor: theme.palette.action.hover,
                    }
                  }}
                >
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{item.product.name}</TableCell>
                  <TableCell>{item.measurement_unit.symbol}</TableCell>
                  <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                    {formatQuantity(item.quantity)}
                  </TableCell>
                </TableRow>
              ))}
              
              {/* Empty State */}
              {(!SubContractMaterialUsedDetails.items || SubContractMaterialUsedDetails.items.length === 0) && (
                <TableRow>
                  <TableCell colSpan={4} sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      No materials used recorded
                    </Typography>
                  </TableCell>
                </TableRow>
              )}

              {/* Summary Row */}
              {SubContractMaterialUsedDetails.items && SubContractMaterialUsedDetails.items.length > 0 && (
                <TableRow sx={{ backgroundColor: theme.palette.background.default }}>
                  <TableCell 
                    colSpan={3} 
                    align="center" 
                    sx={{ 
                      borderBottom: 'none'
                    }}
                  >
                    Total Materials
                  </TableCell>
                  <TableCell 
                    align="right" 
                    sx={{ 
                      fontFamily: 'monospace',
                      borderBottom: 'none',
                      color: contrastText
                    }}
                  >
                    {SubContractMaterialUsedDetails.items.length}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Additional Information */}
      <Box sx={{ mt: 3, p: 2, backgroundColor: theme.palette.background.default, borderRadius: 1 }}>
        <Grid container spacing={2}>
          <Grid size={{xs: 12, sm: 6}}>
            <Typography variant="subtitle2" sx={{ color: headerColor }} gutterBottom>
              Subcontractor Details
            </Typography>
            <Typography variant="body2">
              {SubContractMaterialUsedDetails.subcontract.subcontractor.name}
            </Typography>
            {SubContractMaterialUsedDetails.subcontract.subcontractor.contact_info && (
              <Typography variant="body2" color="text.secondary">
                {SubContractMaterialUsedDetails.subcontract.subcontractor.contact_info}
              </Typography>
            )}
          </Grid>
          <Grid size={{xs: 12, sm: 6}}>
            <Typography variant="subtitle2" sx={{ color: headerColor }} gutterBottom>
              Project Information
            </Typography>
            <Typography variant="body2">
              {SubContractMaterialUsedDetails.subcontract.project.name}
            </Typography>
            {SubContractMaterialUsedDetails.subcontract.project.description && (
              <Typography variant="body2" color="text.secondary">
                {SubContractMaterialUsedDetails.subcontract.project.description}
              </Typography>
            )}
          </Grid>
        </Grid>
      </Box>
    </>
  );
}

export default SubContractMaterialUsedOnScreen;