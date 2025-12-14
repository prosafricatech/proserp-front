'use client'
import { AddOutlined } from '@mui/icons-material'
import { Dialog, IconButton, Tooltip, useMediaQuery } from '@mui/material'
import React, { useState } from 'react'
import StakeholderDialogForm from './StakeholderDialogForm';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

function StakeholderActionTail() {
    const [openDialog, setOpenDialog] = useState(false);
    const dictionary = useDictionary();

    //Screen handling constants
    const {theme} = useJumboTheme();
    const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  return (
    <React.Fragment>
        <Tooltip title={dictionary.stakeholders.list.labels.newCreateLabel}>
            <IconButton onClick={() => setOpenDialog(true)}>
                <AddOutlined/>
            </IconButton>
        </Tooltip>
        <Dialog scroll={'paper'} fullWidth fullScreen={belowLargeScreen} maxWidth='md' open={openDialog}>
            <StakeholderDialogForm toggleOpen={setOpenDialog} />
        </Dialog>
    </React.Fragment>
  )
}

export default StakeholderActionTail