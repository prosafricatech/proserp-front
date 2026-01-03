'use client';

import React from 'react';
import { Card, Grid, IconButton, Tooltip } from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import {
  EventAvailableOutlined,
  FilterAltOffOutlined,
  FilterAltOutlined,
} from '@mui/icons-material';
import dayjs, { Dayjs } from 'dayjs';
import { useParams } from 'next/navigation';
import JumboRqList from '@jumbo/components/JumboReactQuery/JumboRqList/JumboRqList';
import JumboSearch from '@jumbo/components/JumboSearch/JumboSearch';
import JumboListToolbar from '@jumbo/components/JumboList/components/JumboListToolbar/JumboListToolbar';
import { useProjectProfile } from '../ProjectProfileProvider';
import projectsServices from '../../project-services';
import ProjectClaimsListItem from './ProjectClaimsListItem';
import ProjectClaimsActionTail from './ProjectClaimsActionTail';
import LedgerSelectProvider from '@/components/accounts/ledgers/forms/LedgerSelectProvider';

type FilterDateState = {
  from: string | null;
  to: string | null;
};

const ProjectClaims: React.FC = () => {
  const params = useParams<{ id: string }>();
  const { project }: any = useProjectProfile();
  const listRef = React.useRef<any>(null);

  const [openFilters, setOpenFilters] = React.useState(false);

  const [filterDate, setFilterDate] = React.useState<FilterDateState>({
    from: null,
    to: null,
  });

  const [queryOptions, setQueryOptions] = React.useState({
    queryKey: 'projectProjectClaims',
    queryParams: {
      id: params?.id,
      keyword: '',
      project_id: project?.id,
      from: null as string | null,
      to: null as string | null,
    },
    countKey: 'total',
    dataKey: 'data',
  });

  React.useEffect(() => {
    if (!params?.id) return;

    setQueryOptions((prev) => ({
      ...prev,
      queryParams: {
        ...prev.queryParams,
        id: params.id,
      },
    }));
  }, [params?.id]);

  const renderClaim = React.useCallback(
    (claim: any) => <ProjectClaimsListItem claim={claim} />,
    []
  );

  const handleSearchChange = React.useCallback((keyword: string) => {
    setQueryOptions((prev) => ({
      ...prev,
      queryParams: {
        ...prev.queryParams,
        keyword,
      },
    }));
  }, []);

  const handleDateChange = React.useCallback(
    (date: Dayjs | null, field: 'from' | 'to') => {
      setFilterDate((prev) => ({
        ...prev,
        [field]: date ? date.toISOString() : null,
      }));
    },
    []
  );

  const applyDateFilters = React.useCallback(() => {
    setQueryOptions((prev) => ({
      ...prev,
      queryParams: {
        ...prev.queryParams,
        from: filterDate.from,
        to: filterDate.to,
      },
    }));
    setOpenFilters(false);
  }, [filterDate.from, filterDate.to]);

  const resetFilters = React.useCallback(() => {
    setOpenFilters(false);
    setFilterDate({ from: null, to: null });

    setQueryOptions((prev) => ({
      ...prev,
      queryParams: {
        ...prev.queryParams,
        from: null,
        to: null,
      },
    }));
  }, []);

  return (
    <LedgerSelectProvider>
      <JumboRqList
        ref={listRef}
        wrapperComponent={Card}
        service={projectsServices.projectClaimsList}
        primaryKey="id"
        queryOptions={queryOptions}
        itemsPerPage={10}
        itemsPerPageOptions={[5, 10, 15, 20]}
        renderItem={renderClaim}
        componentElement="div"
        wrapperSx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
        }}
        toolbar={
          <JumboListToolbar
            hideItemsPerPage
            action={
              <Grid
                container
                columnSpacing={1}
                rowSpacing={1}
                justifyContent="end"
              >
                {openFilters && (
                  <Grid size={{ xs: 10, md: 6 }}>
                    <Grid
                      container
                      spacing={1}
                      alignItems="center"
                      width="100%"
                    >
                      <Grid size={{ xs: 11, md: 5 }}>
                        <DateTimePicker
                          label="From Date"
                          value={
                            filterDate.from
                              ? dayjs(filterDate.from)
                              : null
                          }
                          slotProps={{
                            textField: {
                              size: 'small',
                              fullWidth: true,
                            },
                          }}
                          onChange={(value) =>
                            handleDateChange(value, 'from')
                          }
                        />
                      </Grid>

                      <Grid size={{ xs: 11, md: 5 }}>
                        <DateTimePicker
                          label="To Date"
                          value={
                            filterDate.to ? dayjs(filterDate.to) : null
                          }
                          minDate={
                            filterDate.from
                              ? dayjs(filterDate.from)
                              : undefined
                          }
                          slotProps={{
                            textField: {
                              size: 'small',
                              fullWidth: true,
                            },
                          }}
                          onChange={(value) =>
                            handleDateChange(value, 'to')
                          }
                        />
                      </Grid>

                      <Grid size={{ xs: 1, md: 2 }} textAlign="center">
                        <Tooltip title="Apply Date Filters">
                          <IconButton
                            onClick={applyDateFilters}
                            size="small"
                          >
                            <EventAvailableOutlined />
                          </IconButton>
                        </Tooltip>
                      </Grid>
                    </Grid>
                  </Grid>
                )}

                <Grid size={{ xs: 1 }}>
                  <Tooltip
                    title={
                      !openFilters
                        ? 'Show Filters'
                        : 'Clear and Hide Filters'
                    }
                  >
                    <IconButton
                      size="small"
                      onClick={
                        !openFilters
                          ? () => setOpenFilters(true)
                          : resetFilters
                      }
                    >
                      {!openFilters ? (
                        <FilterAltOutlined />
                      ) : (
                        <FilterAltOffOutlined />
                      )}
                    </IconButton>
                  </Tooltip>
                </Grid>

                <Grid size={{ xs: 10, md: !openFilters ? 5 : 4 }}>
                  <JumboSearch
                    onChange={handleSearchChange}
                    value={queryOptions.queryParams.keyword}
                  />
                </Grid>

                <Grid size={{ xs: 1, md: 1 }}>
                  <ProjectClaimsActionTail />
                </Grid>
              </Grid>
            }
          />
        }
      />
    </LedgerSelectProvider>
  );
};

export default ProjectClaims;
