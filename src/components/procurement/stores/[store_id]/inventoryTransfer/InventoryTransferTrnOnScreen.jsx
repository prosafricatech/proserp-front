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
  TableContainer
} from '@mui/material';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';

function InventoryTransferTrnOnScreen({ trn, organization }) {
    const theme = useTheme();
    const mainColor = organization.settings?.main_color || "#2113AD";
    const headerColor = theme.type === 'dark' ? '#29f096' : (organization.settings?.main_color || "#2113AD");
    const contrastText = organization.settings?.contrast_text || "#FFFFFF";
    
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
                            sx={{ color: headerColor, fontWeight: 'bold' }} 
                            gutterBottom
                        >
                            TRANSFER RECEIPT NOTE
                        </Typography>
                        <Typography 
                            variant="h6" 
                            fontWeight="bold"
                            gutterBottom
                        >
                            {trn.trnNo}
                        </Typography>
                    </Box>
                </Grid>
            </Grid>

            {/* TRN Information */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{xs: 12, sm: 6, md: 4}}>
                    <Box>
                        <Typography variant="subtitle2" sx={{ color: headerColor, fontWeight: 'bold' }} gutterBottom>
                            Transfer No
                        </Typography>
                        <Typography variant="body1">{trn.transfer.transferNo}</Typography>
                    </Box>
                </Grid>
                <Grid size={{xs: 12, sm: 6, md: 4}}>
                    <Box>
                        <Typography variant="subtitle2" sx={{ color: headerColor, fontWeight: 'bold' }} gutterBottom>
                            Date Received
                        </Typography>
                        <Typography variant="body1">{readableDate(trn.date_received)}</Typography>
                    </Box>
                </Grid>
                <Grid size={{xs: 12, sm: 6, md: 4}}>
                    <Box>
                        <Typography variant="subtitle2" sx={{ color: headerColor, fontWeight: 'bold' }} gutterBottom>
                            Received By
                        </Typography>
                        <Typography variant="body1">{trn.creator.name}</Typography>
                    </Box>
                </Grid>
            </Grid>

            {/* Items Section */}
            <Box sx={{ mb: 3 }}>
                <Typography 
                    variant="h6" 
                    sx={{ 
                        color: headerColor, 
                        textAlign: 'center', 
                        fontWeight: 'bold',
                        mb: 2
                    }}
                >
                    RECEIVED ITEMS
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
                                <TableCell sx={{ backgroundColor: mainColor, color: contrastText, fontWeight: 'bold', fontSize: '0.875rem' }}>
                                    #
                                </TableCell>
                                <TableCell sx={{ backgroundColor: mainColor, color: contrastText, fontWeight: 'bold', fontSize: '0.875rem' }}>
                                    Product
                                </TableCell>
                                <TableCell sx={{ backgroundColor: mainColor, color: contrastText, fontWeight: 'bold', fontSize: '0.875rem' }} align="right">
                                    Quantity
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {trn.items.map((item, index) => (
                                <TableRow 
                                    key={index} 
                                    sx={{ 
                                        backgroundColor: theme.palette.background.paper,
                                        '&:nth-of-type(even)': {
                                            backgroundColor: theme.palette.action.hover,
                                        }
                                    }}
                                >
                                    <TableCell sx={{ fontWeight: 'medium' }}>{index + 1}</TableCell>
                                    <TableCell sx={{ fontWeight: 'medium' }}>{item.product.name}</TableCell>
                                    <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: 'medium' }}>
                                        {`${item.quantity} ${item.measurement_unit?.symbol}`}
                                    </TableCell>
                                </TableRow>
                            ))}
                            
                            {/* Empty State */}
                            {trn.items.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={3} sx={{ textAlign: 'center', py: 4 }}>
                                        <Typography variant="body1" color="text.secondary">
                                            No items received
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>

            {/* Remarks Section */}
            {trn.remarks && (
                <Box sx={{ mt: 3 }}>
                    <Typography 
                        variant="h6" 
                        sx={{ 
                            color: headerColor, 
                            fontWeight: 'bold',
                            mb: 2
                        }}
                    >
                        REMARKS
                    </Typography>
                    <Box 
                        sx={{ 
                            p: 2, 
                            lineHeight: 1.5
                        }}
                    >
                        <Typography variant="body1">
                            {trn.remarks}
                        </Typography>
                    </Box>
                </Box>
            )}
        </>
    );
}

export default InventoryTransferTrnOnScreen;