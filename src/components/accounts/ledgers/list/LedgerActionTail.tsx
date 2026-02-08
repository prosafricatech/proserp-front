'use client'

import React, { useState } from 'react';
import { Dialog, IconButton, SpeedDial, SpeedDialAction, SpeedDialIcon,Tooltip, useMediaQuery } from '@mui/material';
import { AddOutlined, MergeOutlined } from '@mui/icons-material';
import LedgerForm from '../forms/LedgerForm';
import LedgersMergeForm from './LedgersMergeForm';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';

const LedgerActionTail = () => {
  const [newLedgerFormOpen, setNewLedgerFormOpen] = useState(false);
  const [ledgerMergeFormOpen, setLedgerMergeFormOpen] = useState(false);
  const [speedDialOpen, setSpeedDialOpen] = useState(false);

  //Screen handling constants
  const {theme} = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const speedDialActions = [
    { icon: <AddOutlined />, name: 'Create Ledger', onClick: () => setNewLedgerFormOpen(true) },
    { icon: <MergeOutlined />, name: 'Ledgers Merge', onClick: () => setLedgerMergeFormOpen(true) },
  ];

  return (
    <>
      {belowLargeScreen ? (
        <SpeedDial
          ariaLabel="Ledgers Actions"
          FabProps={{ size: 'small' }}
          sx={{ position:'absolute', height: 55}}
          icon={<SpeedDialIcon/>}
          open={speedDialOpen}
          onClick={() => setSpeedDialOpen(!speedDialOpen)}
          direction="down"
        >
          {speedDialActions.map((action) => (
            <SpeedDialAction
              key={action.name}
              icon={action.icon}
              tooltipTitle={action.name}
              tooltipOpen
              onClick={() => {
                action.onClick();
                setSpeedDialOpen(false);
              }}
            />
          ))}
        </SpeedDial>
      ) : (
        <>
          <Tooltip title={'Create Ledger'}>
            <IconButton size='small' onClick={() => setNewLedgerFormOpen(true) }>
              <AddOutlined />
            </IconButton>
          </Tooltip>
          <Tooltip title={'Ledgers Merge'}>
            <IconButton size='small' onClick={() => setLedgerMergeFormOpen(true)}>
              <MergeOutlined />
            </IconButton>
          </Tooltip>
        </>
      )}
      <Dialog
        open={newLedgerFormOpen || ledgerMergeFormOpen}
        scroll={'paper'}
        fullWidth
        fullScreen={belowLargeScreen}
        maxWidth={ledgerMergeFormOpen ? 'md' : 'sm'}
      >
        {newLedgerFormOpen && <LedgerForm toggleOpen={setNewLedgerFormOpen} />}
        {ledgerMergeFormOpen && <LedgersMergeForm toggleOpen={setLedgerMergeFormOpen} />}
      </Dialog>
    </>
  );
};

export default LedgerActionTail;
