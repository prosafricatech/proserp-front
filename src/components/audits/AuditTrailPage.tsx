'use client';

import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import UnauthorizedAccess from '@/shared/Information/UnauthorizedAccess';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import {
  Autocomplete,
  Box,
  Button,
  Card,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Chip,
  Grid,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { Dayjs } from 'dayjs';
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import auditServices from './audit-services';
import AuditActionGroupList from './AuditActionGroupList';
import AuditEntryDialog from './AuditEntryDialog';
import AuditEntryViewer from './AuditEntryViewer';
import { getRows, getTotal, mapOption } from './audit-helpers';

type FilterOptions = {
  resources?: Array<string | { label?: string; value?: string }>;
  events?: Array<string | { label?: string; value?: string }>;
  users?: Array<string | { label?: string; value?: string }>;
};

function AuditTrailPage() {
  const { checkOrganizationPermission } = useJumboAuth();
  const canRead = checkOrganizationPermission(PERMISSIONS.AUDIT_READ);

  const [tab, setTab] = React.useState<'organization' | 'auth'>('organization');
  const [page, setPage] = React.useState(0);
  const [limit, setLimit] = React.useState(20);

  const [filters, setFilters] = React.useState({
    keyword: '',
    from: null as Dayjs | null,
    to: null as Dayjs | null,
    resource: null as string | null,
    action: null as string | null,
    actor_id: null as string | null,
  });

  const [selectedEntryId, setSelectedEntryId] = React.useState<string | null>(null);
  // Auth trail rows live in the core schema, not the current organization's —
  // remembered alongside the id so switching tabs doesn't retroactively
  // change which database an already-open entry is looked up in.
  const [selectedEntryScope, setSelectedEntryScope] = React.useState<'organization' | 'auth'>('organization');
  const [selectedHistory, setSelectedHistory] = React.useState<{
    resource: string;
    id: string;
  } | null>(null);

  React.useEffect(() => {
    setPage(0);
  }, [tab]);

  const listParams = React.useMemo(() => {
    const params: any = {
      page: page + 1,
      limit,
      keyword: filters.keyword || undefined,
    };

    if (filters.resource) params.resource = filters.resource;
    if (filters.action) params.event = filters.action;
    if (filters.actor_id) params.user_id = filters.actor_id;

    if (filters.from) {
      params.from = filters.from.toISOString();
    }
    if (filters.to) {
      params.to = filters.to.endOf('day').toISOString();
    }

    return params;
  }, [page, limit, filters]);

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

  const { data: selectedEntryData, isLoading: isLoadingSelectedEntry } = useQuery({
    queryKey: ['audits-one', selectedEntryId, selectedEntryScope],
    queryFn: () => auditServices.getOne(String(selectedEntryId), { core: selectedEntryScope === 'auth' }),
    enabled: !!selectedEntryId && canRead,
  });

  const { data: historyData, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['audits-history', selectedHistory?.resource, selectedHistory?.id],
    queryFn: () =>
      auditServices.getHistory(String(selectedHistory?.resource), String(selectedHistory?.id)),
    enabled: !!selectedHistory?.resource && !!selectedHistory?.id && canRead,
  });

  const filterOptions = (filterOptionsData || {}) as FilterOptions;

  const actionOptions = React.useMemo(
    () => (filterOptions.events || []).map(mapOption).filter((x) => !!x.value),
    [filterOptions.events]
  );

  const resourceOptions = React.useMemo(
    () => (filterOptions.resources || []).map(mapOption).filter((x) => !!x.value),
    [filterOptions.resources]
  );

  const handleFilterChange = (key: keyof typeof filters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(0);
  };

  const clearFilters = () => {
    setFilters({
      keyword: '',
      from: null,
      to: null,
      resource: null,
      action: null,
      actor_id: null,
    });
    setPage(0);
  };

  if (!canRead) {
    return <UnauthorizedAccess />;
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
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
                onChange={(event) => handleFilterChange('keyword', event.target.value)}
              />
            </Grid>

            <Grid size={{ xs: 6, md: 2 }}>
              <DateTimePicker
                label="From"
                value={filters.from}
                onChange={(newValue) => handleFilterChange('from', newValue)}
                slotProps={{ textField: { fullWidth: true, size: 'small' } }}
              />
            </Grid>

            <Grid size={{ xs: 6, md: 2 }}>
              <DateTimePicker
                label="To"
                value={filters.to}
                onChange={(newValue) => handleFilterChange('to', newValue)}
                slotProps={{ textField: { fullWidth: true, size: 'small' } }}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 2 }}>
              <Autocomplete
                size='small'
                options={actionOptions}
                getOptionLabel={(option) => option.label}
                isOptionEqualToValue={(option, value) => option.value === value?.value}
                value={actionOptions.find((opt) => opt.value === filters.action) || null}
                onChange={(_, newValue) => handleFilterChange('action', newValue?.value || null)}
                renderInput={(params) => <TextField {...params} label="Action" placeholder="Select action..." />}
                clearOnEscape
              />
            </Grid>

            <Grid size={{ xs: 12, md: 2 }}>
              <Autocomplete
                size='small'
                options={resourceOptions}
                getOptionLabel={(option) => option.label}
                isOptionEqualToValue={(option, value) => option.value === value?.value}
                value={resourceOptions.find((opt) => opt.value === filters.resource) || null}
                onChange={(_, newValue) => handleFilterChange('resource', newValue?.value || null)}
                renderInput={(params) => <TextField {...params} label="Resource" placeholder="Select resource..." />}
                clearOnEscape
              />
            </Grid>

            <Grid size={{ xs: 12, md: 1 }}>
              <Button fullWidth variant='outlined' onClick={clearFilters}>
                Clear
              </Button>
            </Grid>
          </Grid>
        </Card>

        <AuditActionGroupList
          rows={auditRows}
          isLoading={isLoading}
          total={totalRows}
          page={page}
          limit={limit}
          onPageChange={setPage}
          onLimitChange={(next) => {
            setLimit(next);
            setPage(0);
          }}
          onViewEntry={(id) => {
            setSelectedEntryId(id);
            setSelectedEntryScope(tab);
          }}
          onViewHistory={(resource, id) => setSelectedHistory({ resource, id })}
        />

        <AuditEntryDialog
          open={!!selectedEntryId}
          onClose={() => setSelectedEntryId(null)}
          isLoading={isLoadingSelectedEntry}
          data={selectedEntryData}
          title="Audit Entry"
        />

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
            alignItems: 'center',
          }}>
            <Typography variant="h6">
              Resource History: {selectedHistory?.resource} #{selectedHistory?.id}
            </Typography>
            <Chip label={`${selectedHistory?.resource}`} size="small" color="primary" variant="outlined" />
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
    </LocalizationProvider>
  );
}

export default AuditTrailPage;
