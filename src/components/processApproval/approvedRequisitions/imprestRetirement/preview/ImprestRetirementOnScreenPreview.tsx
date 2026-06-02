import React from 'react';
import {
  Box,
  Chip,
  Link,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useTheme,
} from '@mui/material';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';

type RetirementPreviewProps = {
  retirement: any;
};

function ImprestRetirementOnScreenPreview({ retirement }: RetirementPreviewProps) {
  const theme = useTheme();

  const currencyCode =
    retirement?.currency?.code ||
    retirement?.currency_code ||
    retirement?.imprest_approval?.requisition?.currency?.code ||
    'TZS';

  const items = Array.isArray(retirement?.items) ? retirement.items : [];
  const attachments = Array.isArray(retirement?.attachments) ? retirement.attachments : [];
  const imprestLedgerName = retirement?.ledger?.name || '-';

  const totalRetired = items.reduce(
    (sum: number, item: any) => sum + (Number.isFinite(Number(item?.amount)) ? Number(item.amount) : 0),
    0
  );

  return (
    <Box sx={{ p: 1.5 }}>
      <Box sx={{ mb: 2.5, borderBottom: `2px solid ${theme.palette.divider}`, pb: 1.5 }}>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Imprest Retirement Preview
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {retirement?.retirementNo || '-'}
        </Typography>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 2, mb: 2.5 }}>
        <Box>
          <Typography variant="caption" color="text.secondary">Status</Typography>
          <Box mt={0.5}>
            <Chip size="small" label={retirement?.status_label || retirement?.status || '-'} color="primary" />
          </Box>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary">Retirement Date</Typography>
          <Typography variant="body2">{readableDate(retirement?.retirement_date)}</Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary">Reference Requisition</Typography>
          <Typography variant="body2">{retirement?.imprest_approval?.requisition?.requisitionNo || '-'}</Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary">Imprest Ledger</Typography>
          <Typography variant="body2">{retirement?.ledger?.name || '-'}</Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary">Approved Amount</Typography>
          <Typography variant="body2" fontWeight={600}>
            {Number(retirement?.imprest_approval?.amount || 0).toLocaleString('en-US', {
              style: 'currency',
              currency: currencyCode,
            })}
          </Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary">Total Retired</Typography>
          <Typography variant="body2" fontWeight={600}>
            {Number(totalRetired || 0).toLocaleString('en-US', {
              style: 'currency',
              currency: currencyCode,
            })}
          </Typography>
        </Box>
      </Box>

      {retirement?.remarks && (
        <Box sx={{ mb: 2.5 }}>
          <Typography variant="caption" color="text.secondary">Remarks</Typography>
          <Typography variant="body2">{retirement.remarks}</Typography>
        </Box>
      )}

      <TableContainer component={Paper} variant="outlined" sx={{ mb: 2.5 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 50 }}>S/N</TableCell>
              <TableCell>Paid Through (Item Ledger)</TableCell>
              <TableCell>Description</TableCell>
              <TableCell align="right">Amount ({currencyCode})</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.length > 0 ? (
              items.map((item: any, index: number) => (
                <TableRow key={item?.id || index}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{`${imprestLedgerName} (${item?.ledger?.name || '-'})`}</TableCell>
                  <TableCell>{item?.description || '-'}</TableCell>
                  <TableCell align="right">
                    {Number(item?.amount || 0).toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} align="center">No retirement items</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Box>
        <Typography variant="subtitle2" gutterBottom>
          Supporting Documents
        </Typography>
        {attachments.length > 0 ? (
          attachments.map((attachment: any) => (
            <Box key={attachment?.id} sx={{ mb: 0.5 }}>
              <Link
                href={attachment?.full_path || '#'}
                target="_blank"
                rel="noopener noreferrer"
                underline="hover"
              >
                {attachment?.name || attachment?.path || `Attachment #${attachment?.id}`}
              </Link>
            </Box>
          ))
        ) : (
          <Typography variant="body2" color="text.secondary">No attachments</Typography>
        )}
      </Box>
    </Box>
  );
}

export default React.memo(ImprestRetirementOnScreenPreview);
