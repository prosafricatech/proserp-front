import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { AddOutlined } from '@mui/icons-material';
import { ButtonGroup, Dialog, IconButton, Tooltip, useMediaQuery } from '@mui/material';
import React, { useState } from 'react'
import LoanRequstForm from './LoanRequstForm';

const MyHrLoansActionTail = () => {
    const {theme} = useJumboTheme()
    const belowMediumScreen = useMediaQuery(theme.breakpoints.down('md'));
    const [openDialog, setOpenDialog] = useState(false)

  return (
      <>
        <Dialog
          open={openDialog}
          fullWidth
          maxWidth='md'
          fullScreen={belowMediumScreen}
          onClose={() => setOpenDialog(false)}
        >
            <LoanRequstForm setOpenDialog={setOpenDialog} />
        </Dialog>
       <ButtonGroup
        variant='outlined'
        size='small'
        disableElevation
        sx={{ '& .MuiButton-root': { px: 1 } }}
      >
        <Tooltip title='Add Loan Request'>
          <IconButton onClick={() => setOpenDialog(true)}>
            <AddOutlined />
          </IconButton>
        </Tooltip>
      </ButtonGroup>
      </>
    );
}

export default MyHrLoansActionTail