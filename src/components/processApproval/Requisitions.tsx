'use client'

import React, { createContext, useState, useCallback, useEffect, useRef } from 'react';
import { Card, IconButton, Tooltip } from '@mui/material';
import { Grid } from '@mui/material';
import JumboListToolbar from '@jumbo/components/JumboList/components/JumboListToolbar';
import JumboRqList from '@jumbo/components/JumboReactQuery/JumboRqList';
import JumboSearch from '@jumbo/components/JumboSearch';
import requisitionsServices from './requisitionsServices';
import RequisitionsActionTail from './RequisitionsActionTail';
import ProductsSelectProvider from '../productAndServices/products/ProductsSelectProvider';
import ProductsProvider from '../productAndServices/products/ProductsProvider';
import LedgerSelectProvider from '../accounts/ledgers/forms/LedgerSelectProvider';
import StakeholderSelectProvider from '../masters/stakeholders/StakeholderSelectProvider';
import RequisitionsListItem from './listItem/RequisitionsListItem';
import CurrencySelectProvider from '../masters/Currencies/CurrencySelectProvider';
import { EventAvailableOutlined, FilterAltOffOutlined, FilterAltOutlined } from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers';
import dayjs, { Dayjs } from 'dayjs';
import RequisitionsTypeSelector from './RequisitionsTypeSelector';
import CostCenterSelector from '../masters/costCenters/CostCenterSelector';
import RequisitionsWaitingForSelector from './RequisitionsWaitingForSelector';
import { useParams } from 'next/navigation';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import UnauthorizedAccess from '@/shared/Information/UnauthorizedAccess';
import { Requisition } from './RequisitionType';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { CostCenter } from '../masters/costCenters/CostCenterType';

interface RequisitionContextType {
  isEditAction: boolean;
  setIsEditAction: (value: boolean) => void;
}

interface FilterDate {
  from?: string | null;
  to?: string | null;
}

interface QueryParams {
  id?: string;
  keyword: string;
  process_type: string;
  next_approval_role_id: number | null;
  cost_center_ids: number[];
  from?: string | null;
  to?: string | null;
}

interface QueryOptions {
  queryKey: string;
  queryParams: QueryParams;
  countKey: string;
  dataKey: string;
}

export const requisitionContext = createContext<RequisitionContextType>({
  isEditAction: false,
  setIsEditAction: () => {},
});

const Requisitions = () => {
    const params = useParams();
    const listRef = useRef<any>(null);
    const { checkOrganizationPermission, authOrganization } = useJumboAuth();
    const [isEditAction, setIsEditAction] = useState(false);
    const [openFilters, setOpenFilters] = useState(false);
    const [filterDate, setFilterDate] = useState<FilterDate>({});
    const [selectedCostCenter, setSelectedCostCenter] = useState<CostCenter[] | null>([]);

    const [queryOptions, setQueryOptions] = useState<QueryOptions>({
        queryKey: 'requisitions',
        queryParams: {
            id: params.id as string,
            keyword: '',
            process_type: 'all',
            next_approval_role_id: null,
            cost_center_ids: authOrganization?.costCenters?.map((cost_center: CostCenter) => cost_center.id) || [],
        },
        countKey: 'total',
        dataKey: 'data',
    });

    const [mounted, setMounted] = React.useState(false);
    React.useEffect(() => {
       setMounted(true);
    }, []);

    useEffect(() => {
        setQueryOptions((state) => ({
            ...state,
            queryParams: { ...state.queryParams, id: params.id as string },
        }));
    }, [params]);

    const renderRequisitions = useCallback((requisition: Requisition) => {
        return <RequisitionsListItem requisition={requisition} />;
    }, []);

    const handleOnChange = useCallback((keyword: string) => {
        setQueryOptions((state) => ({
            ...state,
            queryParams: {
                ...state.queryParams,
                keyword,
            },
        }));
    }, []);

    useEffect(() => {
        setQueryOptions(state => ({
            ...state,
            queryParams: {
                ...state.queryParams,
                cost_center_ids: selectedCostCenter?.map((c: CostCenter) => c.id) || [],
            },
        }));
    }, [selectedCostCenter]);

    const handleOnTypeChange = useCallback((type: string) => {
        setQueryOptions(state => ({
            ...state,
            queryParams: {
                ...state.queryParams,
                process_type: type,
            },
        }));
    }, []);

    const handleOnWaitingForChange = useCallback((next_approval_role_id: number | null) => {
        setQueryOptions(state => ({
            ...state,
            queryParams: {
                ...state.queryParams,
                next_approval_role_id, 
            },
        }));
    }, []);

    if (!mounted) return null;

    if (!checkOrganizationPermission([PERMISSIONS.REQUISITIONS_READ, PERMISSIONS.REQUISITIONS_CREATE, PERMISSIONS.REQUISITIONS_EDIT])) {
        return <UnauthorizedAccess />;
    }

    const multiCostCenters = authOrganization?.costCenters?.length > 1;

    return (
        <requisitionContext.Provider value={{ isEditAction, setIsEditAction }}>
            <LedgerSelectProvider>
                <ProductsProvider>
                    <ProductsSelectProvider>
                        <StakeholderSelectProvider>
                            <CurrencySelectProvider>
                                <JumboRqList
                                    ref={listRef}
                                    refetchOnWindowFocus={true}
                                    wrapperComponent={Card}
                                    service={requisitionsServices.getList}
                                    primaryKey="id"
                                    queryOptions={queryOptions}
                                    itemsPerPage={10}
                                    itemsPerPageOptions={[5, 8, 10, 15, 20]}
                                    renderItem={renderRequisitions}
                                    componentElement="div"
                                    wrapperSx={{
                                        flex: 1,
                                        display: 'flex',
                                        flexDirection: 'column',
                                    }}
                                    toolbar={
                                        <JumboListToolbar
                                            hideItemsPerPage={true}
                                            action={
                                                <Grid container spacing={1} justifyContent={'end'}>
                                                    {openFilters && (
                                                        <>
                                                            <Grid size={{xs: 12, lg: 12}}>
                                                                <Grid container spacing={1}>
                                                                    <Grid size={{xs: 12, md: 6}}>
                                                                        <DateTimePicker
                                                                            label="From"
                                                                            defaultValue={filterDate.from ? dayjs(filterDate.from) : null}
                                                                            minDate={dayjs(authOrganization?.organization?.recording_start_date)}
                                                                            slotProps={{
                                                                                textField: {
                                                                                    size: 'small',
                                                                                    fullWidth: true,
                                                                                },
                                                                            }}
                                                                            onChange={(value: Dayjs | null) => {
                                                                                setFilterDate((filters) => ({ ...filters, from: value?.toISOString() }));
                                                                            }}
                                                                        />
                                                                    </Grid>
                                                                    <Grid size={{xs: 11, md: 5.5}}>
                                                                        <DateTimePicker
                                                                            label="To"
                                                                            defaultValue={filterDate.to ? dayjs(filterDate.to) : null}
                                                                            minDate={dayjs(filterDate.from)}
                                                                            slotProps={{
                                                                                textField: {
                                                                                    size: 'small',
                                                                                    fullWidth: true,
                                                                                },
                                                                            }}
                                                                            onChange={(value: Dayjs | null) => {
                                                                                setFilterDate((filters) => ({ ...filters, to: value?.toISOString() }));
                                                                            }}
                                                                        />
                                                                    </Grid>
                                                                    <Grid size={{xs: 1, md: 0.5}} alignContent={'end'}>
                                                                        <Tooltip title="Filter Dates">
                                                                            <IconButton onClick={() => {
                                                                                setQueryOptions(state => ({
                                                                                    ...state,
                                                                                    queryParams: {
                                                                                        ...state.queryParams,
                                                                                        from: filterDate.from,
                                                                                        to: filterDate.to,
                                                                                    },
                                                                                }));
                                                                            }}>
                                                                                <EventAvailableOutlined />
                                                                            </IconButton>
                                                                        </Tooltip>
                                                                    </Grid>
                                                                </Grid>
                                                            </Grid>
                                                        </>
                                                    )}
                                                    <Grid size={{xs: 12, md: multiCostCenters ? 3.5 : 6, lg: multiCostCenters ? 4 : 6}} textAlign={'center'}>
                                                        <RequisitionsTypeSelector
                                                            value={queryOptions.queryParams.process_type}
                                                            onChange={handleOnTypeChange}
                                                        />
                                                    </Grid>
                                                    <Grid size={{xs: multiCostCenters ? 12 : 11, md: multiCostCenters ? 3.5 : 5, lg: multiCostCenters ? 4 : 5.5}} textAlign={'center'}>
                                                        <RequisitionsWaitingForSelector
                                                            value={queryOptions.queryParams.next_approval_role_id}
                                                            onChange={handleOnWaitingForChange}
                                                        />
                                                    </Grid>
                                                    {multiCostCenters && (
                                                        <Grid size={{xs: 11, md: 4, lg: 3.5}}>
                                                            <CostCenterSelector
                                                                label="Cost Centers"
                                                                allowSameType={true}
                                                                defaultValue={selectedCostCenter}
                                                                onChange={(value: CostCenter | CostCenter[] | null) => {
                                                                    if (value === null) {
                                                                    setSelectedCostCenter([]);
                                                                    } else if (Array.isArray(value)) {
                                                                    setSelectedCostCenter(value);
                                                                    }
                                                                }}
                                                            />
                                                        </Grid>
                                                    )}
                                                    <Grid size={{xs: 1, lg: 0.5}}>
                                                        <Tooltip title={!openFilters ? 'Filter' : 'Clear Filters'}>
                                                            <IconButton size='small' onClick={() => {
                                                                setOpenFilters(!openFilters);
                                                                openFilters && setFilterDate({ from: null, to: null });
                                                                openFilters &&
                                                                    setQueryOptions(state => ({
                                                                        ...state,
                                                                        queryParams: {
                                                                            ...state.queryParams,
                                                                            from: null,
                                                                            to: null,
                                                                        },
                                                                    }));
                                                            }}>
                                                                {!openFilters ? <FilterAltOutlined /> : <FilterAltOffOutlined />}
                                                            </IconButton>
                                                        </Tooltip>
                                                    </Grid>
                                                </Grid>
                                            }
                                            actionTail={
                                              <Grid container spacing={1}>
                                                <Grid size={{xs: 11, lg: 11}}>
                                                  <JumboSearch
                                                    onChange={handleOnChange}
                                                    value={queryOptions.queryParams.keyword}
                                                  />
                                                </Grid>
                                                <Grid size={{xs: 1, lg: 1}}>
                                                    <RequisitionsActionTail />
                                                </Grid>
                                              </Grid>
                                            }
                                        >
                                        </JumboListToolbar>
                                    }
                                />
                            </CurrencySelectProvider>
                        </StakeholderSelectProvider>
                    </ProductsSelectProvider>
                </ProductsProvider>
            </LedgerSelectProvider>
        </requisitionContext.Provider>
    );
};

export default Requisitions;