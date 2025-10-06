import React from 'react';
import { Grid, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';

function SubContractMaterialUsedOnScreen({ SubContractMaterialUsedDetails, organization }) {
    const mainColor = organization.settings?.main_color || "#2113AD";
    const lightColor = organization.settings?.light_color || "#bec5da";
    const contrastText = organization.settings?.contrast_text || "#FFFFFF";

    return (
        <div>
            <Grid container spacing={2} style={{ marginTop: 20 }}>
                <Grid size={12} style={{ textAlign: 'center' }}>
                    <Typography variant="h4" color={mainColor}>Subcontract Materials Used</Typography>
                    <Typography variant="subtitle1" fontWeight="bold">{SubContractMaterialUsedDetails.proformaNo}</Typography>
                </Grid>
                <Grid size={6}>
                    <Typography variant="body2" color={mainColor}>Issue No</Typography>
                    <Typography variant="body2">{SubContractMaterialUsedDetails.issueNo}</Typography>
                </Grid>
                <Grid size={6}>
                    <Typography variant="body2" color={mainColor}>Issue Date</Typography>
                    <Typography variant="body2">{readableDate(SubContractMaterialUsedDetails.issue_date)}</Typography>
                </Grid>
                <Grid size={6}>
                    <Typography variant="body2" color={mainColor}>Project</Typography>
                    <Typography variant="body2">{SubContractMaterialUsedDetails.subcontract.project.name}</Typography>
                </Grid>
                <Grid size={6}>
                    <Typography variant="body2" color={mainColor}>Reference</Typography>
                    <Typography variant="body2">{SubContractMaterialUsedDetails.reference}</Typography>
                </Grid>
                <Grid size={6}>
                    <Typography variant="body2" color={mainColor}>Subcontract No</Typography>
                    <Typography variant="body2">{SubContractMaterialUsedDetails.subcontract.subcontractNo}</Typography>
                </Grid>
                <Grid size={6}>
                    <Typography variant="body2" color={mainColor}>Subcontractor name</Typography>
                    <Typography variant="body2">{SubContractMaterialUsedDetails.subcontract.subcontractor.name}</Typography>
                </Grid>
            </Grid>

            {(
                <TableContainer component={Paper} style={{ marginTop: 20 }}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{backgroundColor: mainColor, color: contrastText}}>S/N</TableCell>
                                <TableCell sx={{backgroundColor: mainColor, color: contrastText}}>Material</TableCell>
                                <TableCell sx={{backgroundColor: mainColor, color: contrastText}}>Unit</TableCell>
                                <TableCell sx={{backgroundColor: mainColor, color: contrastText}} align="right">Quantity</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {SubContractMaterialUsedDetails.items.map((item, index) => (
                                <TableRow key={item.id} sx={{ backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor }}>
                                    <TableCell>{index + 1}</TableCell>
                                    <TableCell>{item.product.name}</TableCell>
                                    <TableCell>{item.measurement_unit.symbol}</TableCell>
                                    <TableCell align="right">{item.quantity}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </div>
    );
}

export default SubContractMaterialUsedOnScreen;
