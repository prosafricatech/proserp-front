'use client';

import {
  Avatar,
  Box,
  Card,
  Chip,
  CircularProgress,
  IconButton,
  Stack,
  TablePagination,
  Tooltip,
  Typography,
} from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import React from 'react';
import {
  AuditRow,
  eventChipColor,
  formatDateTime,
  groupByRequest,
  initials,
  safeText,
  stringToColor,
  summarizeEntry,
} from './audit-helpers';

interface AuditActionGroupListProps {
  rows: AuditRow[];
  isLoading: boolean;
  total: number;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  onViewEntry: (id: string) => void;
  onViewHistory?: (resource: string, id: string) => void;
  emptyMessage?: string;
  rowsPerPageOptions?: number[];
}

const actorName = (row: AuditRow) =>
  row.user?.name || row.actor?.name || row.causer?.name || row.user_name || 'System';

const recordText = (row: AuditRow) => {
  const record = row.record || {};
  const label = record.label || row.resource;
  const name = record.name;
  if (label && name) return `${label} — ${name}`;
  return label || name || null;
};

const historyTarget = (row: AuditRow) => {
  const resource = row.resource || row.record?.resource;
  const resourceId = row.resource_id || row.record?.resource_id || row.record_id;
  return resource && resourceId ? { resource: String(resource), id: String(resourceId) } : null;
};

interface GroupCardProps {
  requestId: string;
  rows: AuditRow[];
  onViewEntry: (id: string) => void;
  onViewHistory?: (resource: string, id: string) => void;
}

function AuditActionGroupCard({ requestId, rows, onViewEntry, onViewHistory }: GroupCardProps) {
  const [expanded, setExpanded] = React.useState(false);
  const primary = rows[0];
  const expandable = rows.length > 1 && !requestId.startsWith('single-');

  // The backend pages by action (request_id group), never splitting one across
  // a page boundary — so every sibling row is already here, no extra fetch needed.
  const history = historyTarget(primary);
  const record = recordText(primary);

  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 2,
        overflow: 'hidden',
        '&:hover': { borderColor: 'primary.main' },
      }}
    >
      <Box
        onClick={() => expandable && setExpanded((prev) => !prev)}
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 1.5,
          px: 2,
          py: 1.25,
          cursor: expandable ? 'pointer' : 'default',
        }}
      >
        <Typography
          variant="caption"
          sx={{
            display: { xs: 'none', sm: 'block' },
            fontFamily: 'monospace',
            color: 'text.secondary',
            width: 132,
            flexShrink: 0,
          }}
        >
          {formatDateTime(primary.created_at || primary.createdAt || primary.date)}
        </Typography>

        <Avatar sx={{ bgcolor: stringToColor(actorName(primary)), width: 30, height: 30, fontSize: 12, flexShrink: 0 }}>
          {initials(actorName(primary))}
        </Avatar>

        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Stack direction="row" spacing={1} alignItems="baseline" flexWrap="wrap">
            <Typography variant="body2" fontWeight={600}>
              {safeText(actorName(primary))}
            </Typography>
            <Chip
              size="small"
              label={primary.event_label || primary.event || 'Unknown Event'}
              color={eventChipColor(primary.event)}
              variant="outlined"
              sx={{ height: 20, fontSize: '0.7rem' }}
            />
          </Stack>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              display: { xs: 'block', sm: 'none' },
              fontFamily: 'monospace',
            }}
          >
            {formatDateTime(primary.created_at || primary.createdAt || primary.date)}
          </Typography>
          {record && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                display: 'block',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {record}
            </Typography>
          )}
        </Box>

        {/* Forced onto its own full-width line at the xs breakpoint (flexBasis 100% in a
            wrapping flex row does that), instead of overflowing and getting clipped by
            the card's rounded-corner overflow:hidden. */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            flexBasis: { xs: '100%', sm: 'auto' },
            justifyContent: { xs: 'flex-end', sm: 'flex-start' },
            ml: { xs: 0, sm: 'auto' },
          }}
        >
          {rows.length > 1 && (
            <Chip
              size="small"
              label={`${rows.length} entr${rows.length === 1 ? 'y' : 'ies'}`}
              sx={{ fontFamily: 'monospace', fontSize: '0.7rem', height: 22 }}
            />
          )}

          <Tooltip title="View entry">
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); onViewEntry(String(primary.id)); }}>
              <VisibilityOutlinedIcon fontSize="inherit" />
            </IconButton>
          </Tooltip>

          {history && onViewHistory && (
            <Tooltip title="View resource history">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewHistory(history.resource, history.id);
                }}
              >
                <HistoryOutlinedIcon fontSize="inherit" />
              </IconButton>
            </Tooltip>
          )}

          {expandable && (
            <ChevronRightIcon
              fontSize="small"
              sx={{
                color: 'text.secondary',
                transition: 'transform 0.15s ease',
                transform: expanded ? 'rotate(90deg)' : 'none',
              }}
            />
          )}
        </Box>
      </Box>

      {expandable && expanded && (
        <Box sx={{ borderTop: 1, borderColor: 'divider', bgcolor: 'action.hover', px: 2, py: 1 }}>
          <Stack spacing={0.25}>
            {rows.map((entry) => (
              <Stack
                key={String(entry.id)}
                direction={{ xs: 'column', sm: 'row' }}
                spacing={{ xs: 0.25, sm: 1.5 }}
                alignItems={{ xs: 'flex-start', sm: 'center' }}
                onClick={() => onViewEntry(String(entry.id))}
                sx={{
                  py: 0.75,
                  px: 1,
                  borderRadius: 1,
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'background.paper' },
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    fontFamily: 'monospace',
                    color: 'text.secondary',
                    width: { sm: 140 },
                    flexShrink: 0,
                  }}
                >
                  {entry.record?.label || entry.resource || '—'}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    minWidth: 0,
                    width: { xs: '100%', sm: 'auto' },
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {summarizeEntry(entry)}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Box>
      )}
    </Card>
  );
}

function AuditActionGroupList({
  rows,
  isLoading,
  total,
  page,
  limit,
  onPageChange,
  onLimitChange,
  onViewEntry,
  onViewHistory,
  emptyMessage = 'No audit records found.',
  rowsPerPageOptions = [10, 20, 50, 100],
}: AuditActionGroupListProps) {
  const groups = React.useMemo(() => groupByRequest(rows), [rows]);

  return (
    <Card>
      <Box sx={{ p: 1.5 }}>
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={24} />
          </Box>
        )}

        {!isLoading && groups.length === 0 && (
          <Typography align="center" color="text.secondary" sx={{ py: 4 }}>
            {emptyMessage}
          </Typography>
        )}

        {!isLoading && groups.length > 0 && (
          <Stack spacing={1}>
            {groups.map((group) => (
              <AuditActionGroupCard
                key={group.requestId}
                requestId={group.requestId}
                rows={group.rows}
                onViewEntry={onViewEntry}
                onViewHistory={onViewHistory}
              />
            ))}
          </Stack>
        )}
      </Box>

      <TablePagination
        component="div"
        page={page}
        count={total}
        onPageChange={(_, nextPage) => onPageChange(nextPage)}
        rowsPerPage={limit}
        onRowsPerPageChange={(event) => onLimitChange(parseInt(event.target.value, 10))}
        rowsPerPageOptions={rowsPerPageOptions}
      />
    </Card>
  );
}

export default AuditActionGroupList;
