'use client';

import React, { useState } from 'react';
import { AddOutlined } from '@mui/icons-material';
import { Dialog, IconButton, Tooltip, useMediaQuery } from '@mui/material';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import CertificateForm from './form/CertificateForm';

interface SubContract {
  id?: number | string;
}

interface CertificatesActionTailProps {
  subContract?: SubContract;
}

const CertificatesActionTail: React.FC<CertificatesActionTailProps> = ({ subContract }) => {
  const [openDialog, setOpenDialog] = useState(false);
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  return (
    <>
      <Dialog maxWidth="lg" fullWidth fullScreen={belowLargeScreen} open={openDialog} onClose={() => setOpenDialog(false)}>
        <CertificateForm setOpenDialog={setOpenDialog} subContract={subContract} />
      </Dialog>

      <Tooltip title="Add Certificate">
        <IconButton onClick={() => setOpenDialog(true)} size="small">
          <AddOutlined fontSize="small" />
        </IconButton>
      </Tooltip>
    </>
  );
};

export default CertificatesActionTail;