'use client';

import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import UnauthorizedAccess from '@/shared/Information/UnauthorizedAccess';
import { PROS_CONTROL_PERMISSIONS } from '@/utilities/constants/prosControlPermissions';
import {
  Autocomplete,
  Box,
  Button,
  Card,
  CircularProgress,
  Grid,
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
import prosAuditServices from './pros-audit-services';
import AuditActionGroupList from './AuditActionGroupList';
import AuditEntryDialog from './AuditEntryDialog';
import { getRows, getTotal } from './audit-helpers';

type Organization = { id: number | string; name: string; deleted_at?: string | null };

function PlatformAuditTrailPage() {
  const { checkPermission } = useJumboAuth();
  const canReadPlatform = checkPermission(PROS_CONTROL_PERMISSIONS.AUDIT_READ);
  const canReadOrganizations = checkPermission(PROS_CONTROL_PERMISSIONS.AUDIT_READ_ORGANIZATIONS);

  const [tab, setTab] = React.useState<'platform' | 'organization'>(
    canReadPlatform ? 'platform' : 'organization'
  );

  const [page, setPage] = React.useState(0);
  const [limit, setLimit] = React.useState(20);

  const [filters, setFilters] = React.useState({
    keyword: '',
    from: null as Dayjs | null,
    to: null as Dayjs | null,
  });

  const [organization, setOrganization] = React.useState<Organization | null>(null);

  // Platform (core-schema) dialog: fetched by id since /pros-audits/{id} is a real endpoint.
  const [platformSelectedEntryId, setPlatformSelectedEntryId] = React.useState<string | null>(null);

  // Organization-trail dialog: no per-id endpoint exists, so the row already in memory is shown directly.
  const [orgSelectedEntry, setOrgSelectedEntry] = React.useState<any | null>(null);

  React.useEffect(() => {
    setPage(0);
  }, [tab, organization]);

  const listParams = React.useMemo(() => {
    const params: any = {
      page: page + 1,
      limit,
      keyword: filters.keyword || undefined,
    };
    if (filters.from) params.from = filters.from.toISOString();
    if (filters.to) params.to = filters.to.endOf('day').toISOString();
    return params;
  }, [page, limit, filters]);

  const { data: organizationsData } = useQuery({
    queryKey: ['pros-audits-organizations'],
    queryFn: prosAuditServices.getOrganizations,
    enabled: canReadOrganizations && tab === 'organization',
  });

  const organizations: Organization[] = Array.isArray(organizationsData) ? organizationsData : [];

  const { data: platformData, isLoading: isLoadingPlatform, isFetching: isFetchingPlatform } = useQuery({
    queryKey: ['pros-audits-list', listParams],
    queryFn: () => prosAuditServices.getList(listParams),
    enabled: canReadPlatform && tab === 'platform',
  });

  const {
    data: orgTrailData,
    isLoading: isLoadingOrgTrail,
    isFetching: isFetchingOrgTrail,
  } = useQuery({
    queryKey: ['pros-audits-org-trail', organization?.id, listParams],
    queryFn: () => prosAuditServices.getOrganizationTrail(organization!.id, listParams),
    enabled: canReadOrganizations && tab === 'organization' && !!organization?.id,
  });

  const platformRows = React.useMemo(() => getRows(platformData), [platformData]);
  const platformTotal = React.useMemo(() => getTotal(platformData, platformRows.length), [platformData, platformRows.length]);

  const orgRows = React.useMemo(() => getRows(orgTrailData), [orgTrailData]);
  const orgTotal = React.useMemo(() => getTotal(orgTrailData, orgRows.length), [orgTrailData, orgRows.length]);

  const { data: platformSelectedEntryData, isLoading: isLoadingPlatformSelectedEntry } = useQuery({
    queryKey: ['pros-audits-one', platformSelectedEntryId],
    queryFn: () => prosAuditServices.getOne(String(platformSelectedEntryId)),
    enabled: !!platformSelectedEntryId && canReadPlatform,
  });

  const clearFilters = () => {
    setFilters({ keyword: '', from: null, to: null });
    setPage(0);
  };

  if (!canReadPlatform && !canReadOrganizations) {
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
          <Typography variant='h4'>Platform Audit Trail</Typography>
          {(isFetchingPlatform || isFetchingOrgTrail) && <CircularProgress size={20} />}
        </Stack>

        <Card sx={{ p: 2, mb: 2 }}>
          <Tabs value={tab} onChange={(_, value) => setTab(value)} sx={{ mb: 2 }}>
            {canReadPlatform && <Tab value='platform' label='Platform Trail' />}
            {canReadOrganizations && <Tab value='organization' label='Organization Trail' />}
          </Tabs>

          <Grid container spacing={2}>
            {tab === 'organization' && (
              <Grid size={{ xs: 12, md: 3 }}>
                <Autocomplete
                  size='small'
                  options={organizations}
                  getOptionLabel={(option) => option.name}
                  isOptionEqualToValue={(option, value) => String(option.id) === String(value?.id)}
                  value={organization}
                  onChange={(_, newValue) => setOrganization(newValue)}
                  renderInput={(params) => <TextField {...params} label="Organization" placeholder="Select organization..." />}
                />
              </Grid>
            )}

            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                size='small'
                label='Keyword'
                value={filters.keyword}
                onChange={(event) => {
                  setFilters((prev) => ({ ...prev, keyword: event.target.value }));
                  setPage(0);
                }}
              />
            </Grid>

            <Grid size={{ xs: 6, md: 2 }}>
              <DateTimePicker
                label="From"
                value={filters.from}
                onChange={(newValue) => {
                  setFilters((prev) => ({ ...prev, from: newValue }));
                  setPage(0);
                }}
                slotProps={{ textField: { fullWidth: true, size: 'small' } }}
              />
            </Grid>

            <Grid size={{ xs: 6, md: 2 }}>
              <DateTimePicker
                label="To"
                value={filters.to}
                onChange={(newValue) => {
                  setFilters((prev) => ({ ...prev, to: newValue }));
                  setPage(0);
                }}
                slotProps={{ textField: { fullWidth: true, size: 'small' } }}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 1 }}>
              <Button fullWidth variant='outlined' onClick={clearFilters}>
                Clear
              </Button>
            </Grid>
          </Grid>
        </Card>

        {tab === 'platform' && canReadPlatform && (
          <>
            <AuditActionGroupList
              rows={platformRows}
              isLoading={isLoadingPlatform}
              total={platformTotal}
              page={page}
              limit={limit}
              onPageChange={setPage}
              onLimitChange={(next) => {
                setLimit(next);
                setPage(0);
              }}
              onViewEntry={setPlatformSelectedEntryId}
              emptyMessage="No platform audit records found."
            />

            <AuditEntryDialog
              open={!!platformSelectedEntryId}
              onClose={() => setPlatformSelectedEntryId(null)}
              isLoading={isLoadingPlatformSelectedEntry}
              data={platformSelectedEntryData}
              title="Audit Entry"
            />
          </>
        )}

        {tab === 'organization' && canReadOrganizations && (
          <>
            {!organization ? (
              <Card sx={{ p: 4, textAlign: 'center' }}>
                <Typography color="text.secondary">
                  Select an organization above to view its audit trail.
                </Typography>
              </Card>
            ) : (
              <AuditActionGroupList
                rows={orgRows}
                isLoading={isLoadingOrgTrail}
                total={orgTotal}
                page={page}
                limit={limit}
                onPageChange={setPage}
                onLimitChange={(next) => {
                  setLimit(next);
                  setPage(0);
                }}
                onViewEntry={(id) => setOrgSelectedEntry(orgRows.find((row) => String(row.id) === id) || null)}
                emptyMessage="No audit records found for this organization."
              />
            )}

            <AuditEntryDialog
              open={!!orgSelectedEntry}
              onClose={() => setOrgSelectedEntry(null)}
              data={orgSelectedEntry}
              title={`Audit Entry — ${organization?.name || ''}`}
            />
          </>
        )}
      </Box>
    </LocalizationProvider>
  );
}

export default PlatformAuditTrailPage;
