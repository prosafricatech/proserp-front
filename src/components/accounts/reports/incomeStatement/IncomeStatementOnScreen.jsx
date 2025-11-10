import React, { useState } from 'react';
import { 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  IconButton,
  Tooltip,
  Box,
  Dialog,
  useMediaQuery
} from '@mui/material';
import { 
  KeyboardArrowDown, 
  KeyboardArrowRight,
  VisibilityOutlined 
} from '@mui/icons-material';
import LedgerStatementDialogContent from '../../ledgers/list/ledgerStatement/LedgerStatementDialogContent';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';

const IncomeStatementOnScreen = ({ reportData }) => {
    const [openRows, setOpenRows] = useState({
        revenue: false,
        costOfRevenue: false,
        operatingExpenses: false,
    });

    //Screen handling constants
    const {theme} = useJumboTheme();
    const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

    const toggleRow = (rowId) => {
        setOpenRows((prevOpenRows) => ({
            ...prevOpenRows,
            [rowId]: !prevOpenRows[rowId],
        }));
    };

    const hasRevenue = reportData.incomes?.length > 0;
    const hasCostOfRevenue = reportData.directExpenses?.length > 0;
    const hasOperatingExpenses = reportData.indirectExpenses?.length > 0;

    // Totals with null checks
    const totalRevenue = reportData.incomes?.reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0;
    const totalCostOfRevenue = reportData.directExpenses?.reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0;
    const totalOperatingExpenses = reportData.indirectExpenses?.reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0;

    const [ledgerDialogOpen, setLedgerDialogOpen] = useState(false);
    const [ledgerFilters, setLedgerFilters] = useState(null);

    const handleViewLedger = (ledgerId, ledger_name) => {
        setLedgerFilters({
            from: reportData.filters.from,
            to: reportData.filters.to,
            cost_center_ids: reportData.filters.cost_centers.map(cc => cc.id),
            ledger_id: ledgerId,
            ledgerName: ledger_name,
        });
        setLedgerDialogOpen(true);
    };

    return (
        <>
            <TableContainer component={Paper}>
                <Table size="small" aria-label="income-statement">
                    <TableHead>
                        <TableRow>
                            <TableCell>CATEGORY</TableCell>
                            <TableCell align="right">AMOUNT</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {/* Revenue Section */}
                        <TableRow 
                            onClick={() => toggleRow('revenue')} 
                            sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                        >
                            <TableCell style={{ fontWeight: hasRevenue && openRows.revenue ? 'bold' : 'normal' }}>
                                <IconButton size="small">
                                    {hasRevenue && openRows.revenue ? <KeyboardArrowDown /> : <KeyboardArrowRight />}
                                </IconButton>
                                Revenue
                            </TableCell>
                            <TableCell align="right" style={{ fontWeight: hasRevenue && openRows.revenue ? 'bold' : 'normal' }}>
                                {totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </TableCell>
                        </TableRow>
                        {openRows.revenue && reportData.incomes?.map((component, index) => (
                            <TableRow key={`revenue-${index}`} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                                <TableCell sx={{ pl: 4, paddingLeft: 6 }}>
                                    <Box display="flex" alignItems="center">
                                        {component.ledger_name}
                                        <Tooltip title={`View ${component.ledger_name}`}>
                                            <IconButton 
                                                size="small" 
                                                onClick={(e) => {
                                                    handleViewLedger(component.ledger_id, component.ledger_name);
                                                }}
                                            >
                                                <VisibilityOutlined fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                </TableCell>
                                <TableCell align="right">
                                    {component.amount?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </TableCell>
                            </TableRow>
                        ))}

                        {/* Cost of Revenue Section */}
                        <TableRow 
                            onClick={() => toggleRow('costOfRevenue')} 
                            sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                        >
                            <TableCell style={{ fontWeight: hasCostOfRevenue && openRows.costOfRevenue ? 'bold' : 'normal' }}>
                                <IconButton size="small">
                                    {hasCostOfRevenue && openRows.costOfRevenue ? <KeyboardArrowDown /> : <KeyboardArrowRight />}
                                </IconButton>
                                Cost of Revenue
                            </TableCell>
                            <TableCell align="right" style={{ fontWeight: hasCostOfRevenue && openRows.costOfRevenue ? 'bold' : 'normal' }}>
                                {totalCostOfRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </TableCell>
                        </TableRow>
                        {openRows.costOfRevenue && reportData.directExpenses?.map((component, index) => (
                            <TableRow key={`cost-${index}`} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                                <TableCell sx={{ pl: 4, paddingLeft: 6 }}>
                                    <Box display="flex" alignItems="center">
                                        {component.ledger_name}
                                        <Tooltip title={`View ${component.ledger_name}`}>
                                            <IconButton 
                                                size="small" 
                                                onClick={(e) => {
                                                    handleViewLedger(component.ledger_id, component.ledger_name);
                                                }}
                                            >
                                                <VisibilityOutlined fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                </TableCell>
                                <TableCell align="right">
                                    {component.amount?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </TableCell>
                            </TableRow>
                        ))}

                        {/* Gross Profit section */}
                        <TableRow sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}>
                            <TableCell>
                                Gross Profit
                            </TableCell>
                            <TableCell align="right">
                                {(totalRevenue - totalCostOfRevenue).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </TableCell>
                        </TableRow>

                        {/* Operating Expenses Section */}
                        <TableRow 
                            onClick={() => toggleRow('operatingExpenses')} 
                            sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                        >
                            <TableCell style={{ fontWeight: hasOperatingExpenses && openRows.operatingExpenses ? 'bold' : 'normal' }}>
                                <IconButton size="small">
                                    {hasOperatingExpenses && openRows.operatingExpenses ? <KeyboardArrowDown /> : <KeyboardArrowRight />}
                                </IconButton>
                                Operating Expenses
                            </TableCell>
                            <TableCell align="right" style={{ fontWeight: hasOperatingExpenses && openRows.operatingExpenses ? 'bold' : 'normal' }}>
                                {totalOperatingExpenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </TableCell>
                        </TableRow>
                        {openRows.operatingExpenses && reportData.indirectExpenses?.map((component, index) => (
                            <TableRow key={`expense-${index}`} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                                <TableCell sx={{ pl: 4, paddingLeft: 6 }}>
                                    <Box display="flex" alignItems="center">
                                        {component.ledger_name}
                                        <Tooltip title={`View ${component.ledger_name}`}>
                                            <IconButton 
                                                size="small" 
                                                onClick={(e) => {
                                                    handleViewLedger(component.ledger_id, component.ledger_name);
                                                }}
                                            >
                                                <VisibilityOutlined fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                </TableCell>
                                <TableCell align="right">
                                    {component.amount?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </TableCell>
                            </TableRow>
                        ))}

                        {/* Net Income section */}
                        <TableRow sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}>
                            <TableCell>
                                Net Income
                            </TableCell>
                            <TableCell align="right">
                                {(totalRevenue - totalCostOfRevenue - totalOperatingExpenses).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </TableContainer>

            {ledgerDialogOpen && (
                <Dialog
                    open={ledgerDialogOpen} 
                    onClose={() => setLedgerDialogOpen(false)}
                    maxWidth="md"
                    fullWidth
                    fullScreen={belowLargeScreen}
                >
                    <LedgerStatementDialogContent 
                        incomeStatementfilters={ledgerFilters}
                        setOpen={setLedgerDialogOpen}
                    />
                </Dialog>
            )}
        </>
    );
};

export default IncomeStatementOnScreen;