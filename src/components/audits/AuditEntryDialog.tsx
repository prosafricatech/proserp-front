'use client';

import {
  Box,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import React from 'react';
import AuditEntryViewer from './AuditEntryViewer';

interface AuditEntryDialogProps {
  open: boolean;
  onClose: () => void;
  isLoading?: boolean;
  data?: any;
  title?: string;
}

function AuditEntryDialog({ open, onClose, isLoading, data, title = 'Audit Entry' }: AuditEntryDialogProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{ sx: { p: 0, maxHeight: { xs: '100%', sm: '90vh' } } }}
    >
      <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">{title}</Typography>
          <IconButton size="small" onClick={onClose} aria-label="Close">
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>
      </DialogTitle>
      <DialogContent sx={{ pt: 3, overflowY: 'auto' }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={30} />
          </Box>
        ) : (
          <AuditEntryViewer data={data} />
        )}
      </DialogContent>
    </Dialog>
  );
}

export default AuditEntryDialog;
