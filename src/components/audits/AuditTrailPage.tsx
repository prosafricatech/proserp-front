'use client';

import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import UnauthorizedAccess from '@/shared/Information/UnauthorizedAccess';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import {
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
  Divider,
  Avatar,
  useTheme,
} from '@mui/material';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import EventOutlinedIcon from '@mui/icons-material/EventOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowRightAltIcon from '@mui/icons-material/ArrowRightAlt';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import DeviceUnknownIcon from '@mui/icons-material/DeviceUnknown';
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import auditServices from './audit-services';

type AuditRow = Record<string, any>;

type FilterOptions = {
  resources?: Array<string | { label?: string; value?: string }>;
  actions?: Array<string | { label?: string; value?: string }>;
  actors?: Array<{ id?: number | string; name?: string }>;
};

// ==================== HELPERS ====================
const getRows = (payload: any): AuditRow[] => {
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.rows)) return payload.rows;
  if (Array.isArray(payload)) return payload;
  return [];
};

const getTotal = (payload: any, rowsCount: number): number => {
  return (
    payload?.total ?? payload?.meta?.total ?? payload?.count ?? rowsCount ?? 0
  );
};

const formatDateTime = (value?: string) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

const formatDate = (value?: string) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const safeText = (value: any) => {
  if (value === null || value === undefined || value === '') return '-';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

const mapOption = (option: any) => {
  if (typeof option === 'string') {
    return { label: option, value: option };
  }
  return {
    label: option?.label || option?.name || option?.value || '-',
    value: option?.value || option?.id || option?.label || option?.name || '',
  };
};

// ==================== COMPONENT: AuditEntryViewer ====================
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

  // Determine event type for styling
  const eventType = data.event || '';
  const isCreated = eventType === 'created';
  const isUpdated = eventType === 'updated';
  const isDeleted = eventType === 'deleted';

  // Format currency
  const formatCurrency = (value: any) => {
    if (typeof value !== 'number') return value;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'Tzs',
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
      {/* Status Banner */}
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

      {/* Header: Event & Request ID */}
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

      {/* Record Info */}
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

      {/* User Info */}
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
          </Paper>
        </Box>
      )}

      {/* Timestamp */}
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

      {/* Changes */}
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
              const isUpdatedField = !isCreated && !isDeleted && change.old !== null && change.new !== null;

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
                      // Create: Show only new value
                      <Typography variant="body2" color="success.main" fontWeight="medium">
                        {formatValue(newDisplay, change.field)}
                      </Typography>
                    )}

                    {isDeleted && (
                      // Delete: Show only old value
                      <Typography variant="body2" color="error.main" fontWeight="medium">
                        {formatValue(oldDisplay, change.field)}
                      </Typography>
                    )}

                    {isUpdated && change.old !== null && change.new !== null && (
                      // Update: Show old → new
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
                      // Created in update context
                      <Typography variant="body2" color="success.main">
                        {formatValue(newDisplay, change.field)}
                      </Typography>
                    )}

                    {isUpdated && change.old !== null && change.new === null && (
                      // Deleted in update context
                      <Typography variant="body2" color="error.main">
                        {formatValue(oldDisplay, change.field)}
                      </Typography>
                    )}

                    {/* Type indicator for relationship fields */}
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

      {/* Context */}
      {data.context && Object.keys(data.context).length > 0 && (
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
            <InfoOutlinedIcon fontSize="inherit" />
            Context
          </Typography>
          <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
            <Stack spacing={0.5}>
              {Object.entries(data.context).map(([key, value]) => {
                // Skip internal fields that are shown elsewhere
                if (key === 'failed' || key === 'response_status') return null;
                return (
                  <Box key={key} sx={{ display: 'flex', gap: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ minWidth: 120 }}>
                      {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
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

// ==================== MAIN PAGE COMPONENT ====================
function AuditTrailPage() {
  const { checkOrganizationPermission } = useJumboAuth();
  const canRead = checkOrganizationPermission(PERMISSIONS.AUDIT_READ);

  const [tab, setTab] = React.useState<'organization' | 'auth'>('organization');
  const [page, setPage] = React.useState(0);
  const [limit, setLimit] = React.useState(20);

  const [filters, setFilters] = React.useState({
    keyword: '',
    from: '',
    to: '',
    resource: '',
    action: '',
    actor_id: '',
    request_id: '',
  });

  const [selectedAuditId, setSelectedAuditId] = React.useState<string | null>(null);
  const [selectedRequestId, setSelectedRequestId] = React.useState<string | null>(null);
  const [selectedHistory, setSelectedHistory] = React.useState<{
    resource: string;
    id: string;
  } | null>(null);

  React.useEffect(() => {
    setPage(0);
  }, [tab]);

  const listParams = React.useMemo(
    () => ({
      page: page + 1,
      limit,
      ...filters,
    }),
    [page, limit, filters]
  );

  const { data: filterOptionsData } = useQuery({
    queryKey: ['audits-filter-options'],
    queryFn: auditServices.getFilterOptions,
    enabled: canRead,
  });

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['audits-list', tab, listParams],
    queryFn: () =>
      tab === 'auth'
        ? auditServices.getAuthTrail(listParams)
        : auditServices.getList(listParams),
    enabled: canRead,
  });

  const auditRows = React.useMemo(() => getRows(data), [data]);
  const totalRows = React.useMemo(() => getTotal(data, auditRows.length), [data, auditRows.length]);

  const { data: auditOneData, isLoading: isLoadingAuditOne } = useQuery({
    queryKey: ['audits-one', selectedAuditId],
    queryFn: () => auditServices.getOne(String(selectedAuditId)),
    enabled: !!selectedAuditId && canRead,
  });

  const { data: requestTrailData, isLoading: isLoadingRequestTrail } = useQuery({
    queryKey: ['audits-request-trail', selectedRequestId],
    queryFn: () => auditServices.getRequestTrail(String(selectedRequestId)),
    enabled: !!selectedRequestId && canRead,
  });

  const { data: historyData, isLoading: isLoadingHistory } = useQuery({
    queryKey: [
      'audits-history',
      selectedHistory?.resource,
      selectedHistory?.id,
    ],
    queryFn: () =>
      auditServices.getHistory(
        String(selectedHistory?.resource),
        String(selectedHistory?.id)
      ),
    enabled: !!selectedHistory?.resource && !!selectedHistory?.id && canRead,
  });

  const filterOptions = (filterOptionsData || {}) as FilterOptions;

  const actions = React.useMemo(
    () => (filterOptions.actions || []).map(mapOption).filter((x) => !!x.value),
    [filterOptions.actions]
  );

  const resources = React.useMemo(
    () => (filterOptions.resources || []).map(mapOption).filter((x) => !!x.value),
    [filterOptions.resources]
  );

  const actors = React.useMemo(
    () => (filterOptions.actors || []).map(mapOption).filter((x) => !!x.value),
    [filterOptions.actors]
  );

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(0);
  };

  const clearFilters = () => {
    setFilters({
      keyword: '',
      from: '',
      to: '',
      resource: '',
      action: '',
      actor_id: '',
      request_id: '',
    });
    setPage(0);
  };

  if (!canRead) {
    return <UnauthorizedAccess />;
  }

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent='space-between'
        alignItems={{ xs: 'flex-start', md: 'center' }}
        mb={2}
        gap={2}
      >
        <Typography variant='h4'>Audit Trail</Typography>
        {isFetching && <CircularProgress size={20} />}
      </Stack>

      <Card sx={{ p: 2, mb: 2 }}>
        <Tabs
          value={tab}
          onChange={(_, value) => setTab(value)}
          sx={{ mb: 2 }}
        >
          <Tab value='organization' label='Organization Activity' />
          <Tab value='auth' label='Auth Trail' />
        </Tabs>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              fullWidth
              size='small'
              label='Keyword'
              value={filters.keyword}
              onChange={(event) =>
                handleFilterChange('keyword', event.target.value)
              }
            />
          </Grid>
          <Grid size={{ xs: 6, md: 2 }}>
            <TextField
              fullWidth
              size='small'
              type='date'
              label='From'
              InputLabelProps={{ shrink: true }}
              value={filters.from}
              onChange={(event) => handleFilterChange('from', event.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 6, md: 2 }}>
            <TextField
              fullWidth
              size='small'
              type='date'
              label='To'
              InputLabelProps={{ shrink: true }}
              value={filters.to}
              onChange={(event) => handleFilterChange('to', event.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 2 }}>
            <FormControl fullWidth size='small'>
              <InputLabel>Action</InputLabel>
              <Select
                label='Action'
                value={filters.action}
                onChange={(event) =>
                  handleFilterChange('action', String(event.target.value))
                }
              >
                <MenuItem value=''>All</MenuItem>
                {actions.map((option) => (
                  <MenuItem key={String(option.value)} value={String(option.value)}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 2 }}>
            <FormControl fullWidth size='small'>
              <InputLabel>Resource</InputLabel>
              <Select
                label='Resource'
                value={filters.resource}
                onChange={(event) =>
                  handleFilterChange('resource', String(event.target.value))
                }
              >
                <MenuItem value=''>All</MenuItem>
                {resources.map((option) => (
                  <MenuItem key={String(option.value)} value={String(option.value)}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 1 }}>
            <Button fullWidth variant='outlined' onClick={clearFilters}>
              Clear
            </Button>
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <FormControl fullWidth size='small'>
              <InputLabel>Actor</InputLabel>
              <Select
                label='Actor'
                value={filters.actor_id}
                onChange={(event) =>
                  handleFilterChange('actor_id', String(event.target.value))
                }
              >
                <MenuItem value=''>All</MenuItem>
                {actors.map((option) => (
                  <MenuItem key={String(option.value)} value={String(option.value)}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              fullWidth
              size='small'
              label='Request ID'
              value={filters.request_id}
              onChange={(event) =>
                handleFilterChange('request_id', event.target.value)
              }
            />
          </Grid>
        </Grid>
      </Card>

      <Card>
        <TableContainer component={Paper}>
          <Table size='small'>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>User</TableCell>
                <TableCell>Action</TableCell>
                <TableCell align='right'>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {!isLoading && auditRows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align='center'>
                    No audit records found.
                  </TableCell>
                </TableRow>
              )}

              {isLoading && (
                <TableRow>
                  <TableCell colSpan={7} align='center'>
                    <CircularProgress size={22} />
                  </TableCell>
                </TableRow>
              )}

              {auditRows.map((row) => {
                const requestId = row.request_id || row.requestId;
                const resource = row.resource || row.record?.resource;
                const resourceId =
                  row.resource_id || row.record?.resource_id || row.record_id;
                const actor =
                  row.user?.name ||
                  row.actor?.name ||
                  row.causer?.name ||
                  row.user_name ||
                  '-';

                return (
                  <TableRow key={String(row.id)} hover>
                    <TableCell>
                      {formatDateTime(row.created_at || row.createdAt || row.date)}
                    </TableCell>
                    <TableCell>{safeText(actor)}</TableCell>
                    <TableCell>
                      <Chip
                        size='small'
                        label={safeText(row.action || row.event || '-')}
                        color='primary'
                        variant='outlined'
                      />
                    </TableCell>
                    <TableCell align='right'>
                      <Tooltip title='View entry'>
                        <IconButton
                          size='small'
                          onClick={() => setSelectedAuditId(String(row.id))}
                        >
                          <VisibilityOutlinedIcon fontSize='inherit' />
                        </IconButton>
                      </Tooltip>

                      {requestId && (
                        <Tooltip title='View request trail'>
                          <IconButton
                            size='small'
                            onClick={() => setSelectedRequestId(String(requestId))}
                          >
                            <AccountTreeOutlinedIcon fontSize='inherit' />
                          </IconButton>
                        </Tooltip>
                      )}

                      {resource && resourceId && (
                        <Tooltip title='View resource history'>
                          <IconButton
                            size='small'
                            onClick={() =>
                              setSelectedHistory({
                                resource: String(resource),
                                id: String(resourceId),
                              })
                            }
                          >
                            <HistoryOutlinedIcon fontSize='inherit' />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component='div'
          page={page}
          count={totalRows}
          onPageChange={(_, nextPage) => setPage(nextPage)}
          rowsPerPage={limit}
          onRowsPerPageChange={(event) => {
            setLimit(parseInt(event.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[10, 20, 50, 100]}
        />
      </Card>

      {/* ==================== DIALOG: View Entry ==================== */}
      <Dialog
        open={!!selectedAuditId}
        onClose={() => setSelectedAuditId(null)}
        maxWidth='md'
        fullWidth
        PaperProps={{ sx: { p: 0, maxHeight: '90vh' } }}
      >
        <DialogTitle sx={{ 
          borderBottom: 1, 
          borderColor: 'divider',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Typography variant="h4" textAlign={'center'}>Audit Entry Details</Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 3, overflowY: 'auto' }}>
          {isLoadingAuditOne ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={30} />
            </Box>
          ) : (
            <AuditEntryViewer data={auditOneData} />
          )}
        </DialogContent>
      </Dialog>

      {/* ==================== DIALOG: Request Trail ==================== */}
      <Dialog
        open={!!selectedRequestId}
        onClose={() => setSelectedRequestId(null)}
        maxWidth='md'
        fullWidth
        PaperProps={{ sx: { p: 0, maxHeight: '90vh' } }}
      >
        <DialogTitle sx={{ 
          borderBottom: 1, 
          borderColor: 'divider',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Typography variant="h6">Request Trail</Typography>
          <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
            {selectedRequestId}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 3, overflowY: 'auto' }}>
          {isLoadingRequestTrail ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={30} />
            </Box>
          ) : requestTrailData?.data?.length > 0 ? (
            <Stack spacing={2}>
              {requestTrailData.data.map((entry: any, index: number) => (
                <Paper key={index} variant="outlined" sx={{ p: 2 }}>
                  <AuditEntryViewer data={entry} />
                </Paper>
              ))}
            </Stack>
          ) : (
            <Typography align="center" color="text.secondary" sx={{ py: 4 }}>
              No entries found for this request ID.
            </Typography>
          )}
        </DialogContent>
      </Dialog>

      {/* ==================== DIALOG: Resource History ==================== */}
      <Dialog
        open={!!selectedHistory}
        onClose={() => setSelectedHistory(null)}
        maxWidth='md'
        fullWidth
        PaperProps={{ sx: { p: 0, maxHeight: '90vh' } }}
      >
        <DialogTitle sx={{ 
          borderBottom: 1, 
          borderColor: 'divider',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Typography variant="h6">
            Resource History: {selectedHistory?.resource} #{selectedHistory?.id}
          </Typography>
          <Chip 
            label={`${selectedHistory?.resource}`} 
            size="small" 
            color="primary"
            variant="outlined" 
          />
        </DialogTitle>
        <DialogContent sx={{ pt: 3, overflowY: 'auto' }}>
          {isLoadingHistory ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={30} />
            </Box>
          ) : historyData?.data?.length > 0 ? (
            <Stack spacing={2}>
              {historyData.data.map((entry: any, index: number) => (
                <Paper key={index} variant="outlined" sx={{ p: 2 }}>
                  <AuditEntryViewer data={entry} />
                </Paper>
              ))}
            </Stack>
          ) : (
            <Typography align="center" color="text.secondary" sx={{ py: 4 }}>
              No history found for this resource.
            </Typography>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}

export default AuditTrailPage;