import React from 'react';
import { 
  Box, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper as TablePaper,
  useTheme 
} from '@mui/material';

const DebtorCreditorOnScreen = ({ reportData, authOrganization, user }) => {
    const theme = useTheme();
    const mainColor = authOrganization?.organization.settings?.main_color || "#2113AD";
    const headerColor = theme.type === 'dark' ? '#29f096' : (authOrganization?.organization.settings?.main_color || "#2113AD");
    const contrastText = authOrganization?.organization.settings?.contrast_text || "#FFFFFF";

    return reportData ? (
        <Box sx={{ marginTop: 3 }}>
          <TableContainer component={TablePaper}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell sx={{ backgroundColor: mainColor, color: contrastText }}>S/N</TableCell>
                        <TableCell sx={{ backgroundColor: mainColor, color: contrastText }}>Name</TableCell>
                        <TableCell sx={{ backgroundColor: mainColor, color: contrastText }} align="right">Amount</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {Object.values(reportData.debtors || reportData.creditors).map((data, index) => (
                        <TableRow 
                            key={index} 
                            sx={{ 
                                backgroundColor: index % 2 === 0 
                                    ? theme.palette.background.paper 
                                    : theme.palette.action.hover
                            }}
                        >
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>{data.name}</TableCell>
                            <TableCell align="right">
                                {data.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </TableCell>
                        </TableRow>
                    ))}
                    <TableRow>
                        <TableCell 
                            colSpan={2} 
                            align="center" 
                            sx={{ backgroundColor: headerColor, color: contrastText }}
                        >
                            Total
                        </TableCell>
                        <TableCell 
                            align="right" 
                            sx={{ backgroundColor: headerColor, color: contrastText }}
                        >
                            {(Object.values(reportData.debtors || reportData.creditors).reduce((total, item) => total + item.amount, 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
          </TableContainer>
        </Box>
    ) : null;
};

export default DebtorCreditorOnScreen;