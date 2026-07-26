'use client';

import {
  Avatar,
  Box,
  Chip,
  Divider,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowRightAltIcon from '@mui/icons-material/ArrowRightAlt';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import DeviceUnknownIcon from '@mui/icons-material/DeviceUnknown';
import EventOutlinedIcon from '@mui/icons-material/EventOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import React from 'react';
import { formatDate, formatDateTime } from './audit-helpers';

interface AuditEntryViewerProps {
  data: any;
}

function AuditEntryViewer({ data }: AuditEntryViewerProps) {
  if (!data) return null;

  const isFailed = data.context?.failed === true;
  const record = data.record || {};
  const user = data.user || {};
  const changes = data.changes || [];
  const hasChanges = changes.length > 0;

  const eventType = data.event || '';
  const isCreated = eventType === 'created';
  const isUpdated = eventType === 'updated';
  const isDeleted = eventType === 'deleted';

  const formatCurrency = (value: any) => {
    if (typeof value !== 'number') return value;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatValue = (value: any, field?: string) => {
    if (value === null || value === undefined) return '—';
    if (field?.toLowerCase().includes('amount') || field?.toLowerCase().includes('price')) {
      if (typeof value === 'number') return formatCurrency(value);
    }
    if (field?.toLowerCase().includes('date') && typeof value === 'string' && value.includes('-')) {
      return formatDate(value);
    }
    return String(value);
  };

  return (
    <Stack spacing={3} sx={{ py: 1 }}>
      {isFailed && (
        <Box
          sx={{
            bgcolor: 'error.light',
            color: 'error.contrastText',
            p: 2,
            borderRadius: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <InfoOutlinedIcon />
          <Typography variant="body2" fontWeight="bold">
            ⚠️ This action was attempted but failed. Changes may not have been saved.
          </Typography>
        </Box>
      )}

      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: 1,
        }}
      >
        <Chip
          label={data.event_label || data.event || 'Unknown Event'}
          color={isFailed ? 'error' : isCreated ? 'success' : isDeleted ? 'error' : 'primary'}
          sx={{ fontWeight: 'bold', fontSize: '1rem', py: 2 }}
        />
        <Chip
          variant="outlined"
          size="small"
          label={`Request: ${data.request_id || 'N/A'}`}
          sx={{ fontFamily: 'monospace' }}
        />
      </Box>

      <Divider />

      {record && record.id && (
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
            <DescriptionOutlinedIcon fontSize="inherit" />
            Record
          </Typography>
          <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Box>
                <Typography variant="caption" color="text.secondary">Type</Typography>
                <Typography variant="body2" fontWeight="medium">
                  {record.label || record.resource || '—'}
                </Typography>
              </Box>
              <Box flex={1}>
                <Typography variant="caption" color="text.secondary">Name</Typography>
                <Typography variant="body2" fontWeight="medium">
                  {record.name || '—'}
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Box>
      )}

      {user && (
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
            <PersonOutlineIcon fontSize="inherit" />
            User
          </Typography>
          <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
              <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                {user.name?.charAt(0) || '?'}
              </Avatar>
              <Box flex={1}>
                <Typography variant="body2" fontWeight="medium">
                  {user.name || 'System'}
                </Typography>
                {user.email && (
                  <Typography variant="caption" color="text.secondary">
                    {user.email}
                  </Typography>
                )}
              </Box>
              {data.ip_address && (
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <DeviceUnknownIcon fontSize="inherit" />
                    IP
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                    {data.ip_address}
                  </Typography>
                </Box>
              )}
            </Stack>

            {data.user_agent && (
              <Tooltip title={data.user_agent}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    display: 'block',
                    mt: 1.5,
                    pt: 1,
                    borderTop: 1,
                    borderColor: 'divider',
                    fontFamily: 'monospace',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {data.user_agent}
                </Typography>
              </Tooltip>
            )}
          </Paper>
        </Box>
      )}

      <Box>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
          <EventOutlinedIcon fontSize="inherit" />
          Timestamp
        </Typography>
        <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
          <Typography variant="body2">
            {formatDateTime(data.created_at)}
          </Typography>
        </Paper>
      </Box>

      {hasChanges && (
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
            <ArrowForwardIcon fontSize="inherit" />
            Changes ({changes.length})
          </Typography>

          <Stack spacing={1}>
            {changes.map((change: any, index: number) => {
              const hasOldLabel = change.old_label !== undefined && change.old_label !== null;
              const hasNewLabel = change.new_label !== undefined && change.new_label !== null;

              const oldDisplay = hasOldLabel ? change.old_label : change.old;
              const newDisplay = hasNewLabel ? change.new_label : change.new;

              const isCreatedField = isCreated && change.old === null && change.new !== null;
              const isDeletedField = isDeleted && change.old !== null && change.new === null;

              return (
                <Paper
                  key={index}
                  variant="outlined"
                  sx={{
                    p: 2,
                    bgcolor: isCreatedField ? 'success.50' : isDeletedField ? 'error.50' : 'background.default',
                    borderColor: isCreatedField ? 'success.light' : isDeletedField ? 'error.light' : 'divider',
                  }}
                >
                  <Stack direction="row" alignItems="center" flexWrap="wrap" spacing={1}>
                    <Typography variant="body2" fontWeight="bold" sx={{ minWidth: 120 }}>
                      {change.label || change.field || '—'}
                    </Typography>

                    {isCreated && (
                      <Typography variant="body2" color="success.main" fontWeight="medium">
                        {formatValue(newDisplay, change.field)}
                      </Typography>
                    )}

                    {isDeleted && (
                      <Typography variant="body2" color="error.main" fontWeight="medium">
                        {formatValue(oldDisplay, change.field)}
                      </Typography>
                    )}

                    {isUpdated && change.old !== null && change.new !== null && (
                      <>
                        <Typography variant="body2" color="text.secondary">
                          {formatValue(oldDisplay, change.field)}
                        </Typography>
                        <ArrowRightAltIcon color="primary" fontSize="small" />
                        <Typography variant="body2" color="primary.main" fontWeight="medium">
                          {formatValue(newDisplay, change.field)}
                        </Typography>
                      </>
                    )}

                    {isUpdated && change.old === null && change.new !== null && (
                      <Typography variant="body2" color="success.main">
                        {formatValue(newDisplay, change.field)}
                      </Typography>
                    )}

                    {isUpdated && change.old !== null && change.new === null && (
                      <Typography variant="body2" color="error.main">
                        {formatValue(oldDisplay, change.field)}
                      </Typography>
                    )}

                    {(hasOldLabel || hasNewLabel) && (
                      <Chip
                        size="small"
                        label="Relation"
                        variant="outlined"
                        sx={{ ml: 'auto', height: 20, fontSize: '0.65rem' }}
                      />
                    )}
                  </Stack>
                </Paper>
              );
            })}
          </Stack>
        </Box>
      )}

      {data.context && Object.keys(data.context).length > 0 && (
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
            <InfoOutlinedIcon fontSize="inherit" />
            Context
          </Typography>
          <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
            <Stack spacing={0.5}>
              {Object.entries(data.context).map(([key, value]) => {
                if (key === 'failed' || key === 'response_status') return null;
                return (
                  <Box key={key} sx={{ display: 'flex', gap: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ minWidth: 120 }}>
                      {key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                    </Typography>
                    <Typography variant="body2">
                      {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                    </Typography>
                  </Box>
                );
              })}
            </Stack>
          </Paper>
        </Box>
      )}
    </Stack>
  );
}

export default AuditEntryViewer;
