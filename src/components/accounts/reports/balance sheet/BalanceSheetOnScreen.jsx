import React, { useState } from 'react';
import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { KeyboardArrowDown, KeyboardArrowRight } from '@mui/icons-material';

const BalanceSheetOnScreen = ({ reportData }) => {
  const [openRows, setOpenRows] = useState([]);

  const toggleRow = (rowId) => {
    setOpenRows((prevOpenRows) =>
      prevOpenRows.includes(rowId)
        ? prevOpenRows.filter((id) => id !== rowId)
        : [...prevOpenRows, rowId]
    );
  };

  const renderChildren = (children, level, levelName) => {
    let totalLevelAmount = 0;

    return (
      <>
        {children.map((child, index) => {
          if (!!child.amount) {
            totalLevelAmount += child.amount;

            return (
              <React.Fragment key={index}>
                <TableRow onClick={() => toggleRow(child.id)} sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' }}}>
                  <TableCell style={{ paddingLeft: level * 20 }}>
                    {child.children && child.children.length > 0 && (
                      <>
                        {openRows.includes(child.id) ? (
                          <KeyboardArrowDown/>
                        ) : (
                          <KeyboardArrowRight/>
                        )}
                      </>
                    )}
                    <span style={{ fontWeight: openRows.includes(child.id) ? 'bold' : 'normal', marginLeft: level === 0 ? 5 : level === 1 ? 10 : 15 }}>{child.name}</span>
                  </TableCell>
                  <TableCell align="right" style={{ fontWeight: openRows.includes(child.id) ? 'bold' : 'normal' }}>{child.amount?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                </TableRow>
                {openRows.includes(child.id) && child.children && child.children.length > 0 && renderChildren(child.children, level + 1, child.name)}
              </React.Fragment>
            );
          }
          return null;
        })}
        {!!totalLevelAmount && (
          <TableRow sx={{cursor: 'pointer', '&:hover': {bgcolor: 'action.hover'}}}>
            <TableCell style={{ paddingLeft: level * 20 }}>
              <span>Total {levelName}</span>
            </TableCell>
            <TableCell align="right"><span>{totalLevelAmount?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></TableCell>
          </TableRow>
        )}
      </>
    );
  };


  return (
    <TableContainer component={Paper}>
      <Table size="small" aria-label="balance-sheet">
        <TableHead>
          <TableRow>
            <TableCell>CATEGORY</TableCell>
            <TableCell align="right">AMOUNT</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {reportData.balanceSheetData?.map((component, index) => (
            <React.Fragment key={index}>
              {
                <TableRow onClick={() => toggleRow(component.id)} sx={{cursor: 'pointer', '&:hover': {bgcolor: 'action.hover'}}}>
                  <TableCell>
                    {component.children && component.children.length > 0 && (
                      <>
                        {openRows.includes(component.id) ? (
                          <KeyboardArrowDown/>
                        ) : (
                          <KeyboardArrowRight/>
                        )}
                      </>
                    )}
                    <span style={{ marginLeft: 5, fontWeight: openRows.includes(component.id) ? 'bold' : 'normal' }}>{component.name}</span>
                  </TableCell>
                  <TableCell align="right">{component.amount?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                </TableRow>
              }
              {!!component.amount && openRows.includes(component.id) && component.children && component.children.length > 0 && renderChildren(component.children, index + 1, component.name)}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </TableContainer >
  );
};

export default BalanceSheetOnScreen;
