'use client'

import { Card, Grid, IconButton, Tooltip, Typography} from '@mui/material';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {DateTimePicker} from '@mui/x-date-pickers';
import {EventAvailableOutlined,FilterAltOffOutlined,FilterAltOutlined} from '@mui/icons-material';
import dayjs, { Dayjs } from 'dayjs';
import { useParams } from 'next/navigation';
import JumboListToolbar from '@jumbo/components/JumboList/components/JumboListToolbar';
import JumboRqList from '@jumbo/components/JumboReactQuery/JumboRqList';
import JumboSearch from '@jumbo/components/JumboSearch';
import TransactionListItem from './TransactionListItem';
import { useTransactionApp } from './Transactions';
import transactionServices from './transactions-services';
import TransactionsActionTail from './TransactionsActionTail';
import TransactionsTypeSelector from './TransactionsTypeSelector';
import CostCenterSelector from '../../masters/costCenters/CostCenterSelector';
import { Transaction, TransactionTypes } from './TransactionTypes';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { CostCenter } from '@/components/masters/costCenters/CostCenterType';

interface QueryOptions {
  queryKey: string;
  queryParams: {
    id?: string;
    keyword: string;
    type: TransactionTypes;
    cost_center_ids?: number[];
    from?: string | null;
    to?: string | null;
  };
  countKey: string;
  dataKey: string;
}

interface FilterDate {
  from?: string | null;
  to?: string | null;
}

const TransactionsList: React.FC = () => {
    const params = useParams<{ category?: string; id?: string; keyword?: string }>();
    const listRef = useRef<any>(null);
    const [openFilters, setOpenFilters] = useState(false);
    const [mounted, setMounted] = useState(false);
    const { setSelectedTransactions, setTransactionsListRefresh, refreshTransactionsList } = useTransactionApp();
    const { authOrganization, checkOrganizationPermission } = useJumboAuth();
    const [selectedCostCenter, setSelectedCostCenter] = useState<CostCenter[]>([]);
    const [filterDate, setFilterDate] = useState<FilterDate>({});

    const availableTypes = React.useMemo(() => {
      const typeOptions = [
        { 
          value: 'payments',
          label: 'Payments', 
          permission: [
            PERMISSIONS.ACCOUNTS_TRANSACTIONS_READ,
            PERMISSIONS.ACCOUNTS_TRANSACTIONS_CREATE,
            PERMISSIONS.ACCOUNTS_TRANSACTIONS_DELETE,
            PERMISSIONS.ACCOUNTS_TRANSACTIONS_EDIT,
            PERMISSIONS.PAYMENTS_READ,
            PERMISSIONS.PAYMENTS_CREATE,
            PERMISSIONS.PAYMENTS_EDIT,
            PERMISSIONS.PAYMENTS_DELETE,
          ] 
        },
        {
          value: 'receipts',
          label: 'Receipts', 
          permission: [
            PERMISSIONS.ACCOUNTS_TRANSACTIONS_READ,
            PERMISSIONS.ACCOUNTS_TRANSACTIONS_CREATE,
            PERMISSIONS.ACCOUNTS_TRANSACTIONS_DELETE,
            PERMISSIONS.ACCOUNTS_TRANSACTIONS_EDIT,
            PERMISSIONS.RECEIPTS_READ,
            PERMISSIONS.RECEIPTS_EDIT,
            PERMISSIONS.RECEIPTS_CREATE,
            PERMISSIONS.RECEIPTS_DELETE,
          ] 
        },
        { 
          value: 'journal_vouchers', label: 'Journal Vouchers', 
          permission: [
            PERMISSIONS.ACCOUNTS_TRANSACTIONS_READ,
            PERMISSIONS.ACCOUNTS_TRANSACTIONS_CREATE,
            PERMISSIONS.ACCOUNTS_TRANSACTIONS_DELETE,
            PERMISSIONS.ACCOUNTS_TRANSACTIONS_EDIT,
            PERMISSIONS.JOURNAL_VOUCHERS_READ,
            PERMISSIONS.JOURNAL_VOUCHERS_CREATE,
            PERMISSIONS.JOURNAL_VOUCHERS_DELETE,
            PERMISSIONS.JOURNAL_VOUCHERS_EDIT
          ] 
        },
        { 
          value: 'transfers',
          label: 'Transfers', 
          permission: [
            PERMISSIONS.ACCOUNTS_TRANSACTIONS_READ,
            PERMISSIONS.ACCOUNTS_TRANSACTIONS_CREATE,
            PERMISSIONS.ACCOUNTS_TRANSACTIONS_DELETE,
            PERMISSIONS.ACCOUNTS_TRANSACTIONS_EDIT,
            PERMISSIONS.FUND_TRANSFERS_READ,
            PERMISSIONS.FUND_TRANSFERS_CREATE,
            PERMISSIONS.FUND_TRANSFERS_DELETE,
            PERMISSIONS.FUND_TRANSFERS_EDIT
          ] 
        },
        { 
          value: 'debit', 
          label: 'Debit Notes', 
          permission: [
            PERMISSIONS.ACCOUNTS_TRANSACTIONS_READ,
            PERMISSIONS.ACCOUNTS_TRANSACTIONS_CREATE,
            PERMISSIONS.ACCOUNTS_TRANSACTIONS_DELETE,
            PERMISSIONS.ACCOUNTS_TRANSACTIONS_EDIT,
          ] 
        },
        { 
          value: 'credit', 
          label: 'Credit Notes', 
          permission: [
            PERMISSIONS.ACCOUNTS_TRANSACTIONS_READ,
            PERMISSIONS.ACCOUNTS_TRANSACTIONS_CREATE,
            PERMISSIONS.ACCOUNTS_TRANSACTIONS_DELETE,
            PERMISSIONS.ACCOUNTS_TRANSACTIONS_EDIT,
          ] 
        },
      ];
      return typeOptions.filter(opt => checkOrganizationPermission(opt?.permission));
    }, [checkOrganizationPermission]);

    const defaultType = availableTypes[0]?.value ?? 'payments';

    const [queryOptions, setQueryOptions] = useState<QueryOptions>({
      queryKey: "transactions",
      queryParams: {
        id: params.id,
        keyword: '',
        type: defaultType,
        cost_center_ids: authOrganization?.costCenters?.map((cost_center: CostCenter) => cost_center.id)
      },
      countKey: "total",
      dataKey: "data",
    });

    useEffect(() => {
      setQueryOptions(prev => ({
      ...prev,
      queryParams: {
        ...prev.queryParams,
        id: params.id
      }
      }));
    }, [params.id]);

    useEffect(() => {
      setQueryOptions(prev => ({
      ...prev,
      queryParams: {
        ...prev.queryParams,
        cost_center_ids: selectedCostCenter.map(c => c.id)
      }
      }));
    }, [selectedCostCenter]);

    useEffect(() => {
      if (refreshTransactionsList) {
        listRef.current?.refresh();
        setTransactionsListRefresh(false);
      }
    }, [refreshTransactionsList, setTransactionsListRefresh]);

    const renderTransaction = useCallback((transaction: Transaction) => (
      <TransactionListItem 
        transaction={transaction} 
        type={queryOptions.queryParams.type} 
      />
    ), [queryOptions.queryParams.type]);

    const handleOnTypeChange = useCallback((type: TransactionTypes) => {
      setQueryOptions(prev => ({
      ...prev,
      queryParams: {
        ...prev.queryParams,
        type
      }
      }));
      document.title = type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, " ");
    }, []);

    const handleOnKeywordChange = useCallback((keyword: string) => {
        setQueryOptions(prev => ({
        ...prev,
        queryParams: {
            ...prev.queryParams,
            keyword
        }
        }));
    }, []);

    const handleDateChange = useCallback((date: Dayjs | null, field: 'from' | 'to') => {
        setFilterDate(prev => ({
            ...prev,
            [field]: date?.toISOString() || null
        }));
    }, []);

    const applyDateFilters = useCallback(() => {
        setQueryOptions(prev => ({
        ...prev,
        queryParams: {
            ...prev.queryParams,
            from: filterDate.from,
            to: filterDate.to
        }
        }));
    }, [filterDate.from, filterDate.to]);

    const resetFilters = useCallback(() => {
        setOpenFilters(false);
        setFilterDate({ from: null, to: null });
        setQueryOptions(prev => ({
        ...prev,
        queryParams: {
            ...prev.queryParams,
            from: null,
            to: null
        }
        }));
    }, []);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const multiCostCenters = authOrganization?.costCenters?.length > 1;

  return (
    <React.Fragment>
      <Typography sx={{ textTransform: 'capitalize' }} variant={'h4'} mb={2}>
        {queryOptions.queryParams.type.replace(/_/g, " ")}
      </Typography>
      
      <JumboRqList
        ref={listRef}
        wrapperComponent={Card}
        service={transactionServices.getList}
        primaryKey={"id"}
        queryOptions={queryOptions}
        itemsPerPage={10}
        itemsPerPageOptions={[10, 20, 30, 50, 100, 150]}
        renderItem={renderTransaction}
        componentElement={"div"}
        wrapperSx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column'
        }}
        toolbar={
          <JumboListToolbar
            hideItemsPerPage={true}
            action={
              <Grid container columnSpacing={1} rowSpacing={1} justifyContent={'end'}>
                {openFilters && (
                  <Grid size={12}>
                    <Grid container spacing={1}>
                      <Grid size={{xs: 12, md: 6}}>
                        <DateTimePicker
                          label="From"
                          value={filterDate.from ? dayjs(filterDate.from) : null}
                          minDate={dayjs(authOrganization?.organization?.recording_start_date)}
                          slotProps={{
                            textField: {
                              size: 'small',
                              fullWidth: true,
                            }
                          }}
                          onChange={(value) => handleDateChange(value, 'from')}
                        />
                      </Grid>
                      <Grid size={{xs: 11, md: 5.5}}>
                        <DateTimePicker
                          label="To"
                          value={filterDate.to ? dayjs(filterDate.to) : null}
                          minDate={filterDate.from ? dayjs(filterDate.from) : undefined}
                          slotProps={{
                            textField: {
                              size: 'small',
                              fullWidth: true,
                            }
                          }}
                          onChange={(value) => handleDateChange(value, 'to')}
                        />
                      </Grid>
                      <Grid size={{xs: 1, md: 0.5}} alignContent={'end'}>
                        <Tooltip title="Filter Dates">
                          <IconButton onClick={applyDateFilters}>
                            <EventAvailableOutlined/>
                          </IconButton> 
                        </Tooltip>   
                      </Grid>
                    </Grid>
                  </Grid>
                )}
                
                <Grid size={{xs: 12, md: 6, lg: 3}}>
                  <TransactionsTypeSelector
                    value={queryOptions.queryParams.type}
                    onChange={handleOnTypeChange}
                  />
                </Grid>
                
                {multiCostCenters && (
                  <Grid size={{xs: 12, md: 6, lg: 3}}>
                    <CostCenterSelector
                        label="Cost Centers"
                        allowSameType={true}
                        defaultValue={selectedCostCenter}
                        onChange={(newValue: CostCenter | CostCenter[] | null) => {
                            if (newValue === null) {
                                setSelectedCostCenter([]);
                            } else {
                                setSelectedCostCenter(Array.isArray(newValue) ? newValue : [newValue]);
                            }
                        }}
                    />
                  </Grid>
                )}
                
                <Grid size={{xs: 1, lg: 0.5}}>
                  <Tooltip title={!openFilters ? 'Filter' : 'Clear Filters'}>
                    <IconButton size='small' onClick={!openFilters ? () => setOpenFilters(true) : resetFilters}>
                      {!openFilters ? <FilterAltOutlined/> : <FilterAltOffOutlined/>}
                    </IconButton>
                  </Tooltip>
                </Grid>
                
                <Grid size={{xs: 10, lg: (queryOptions.queryParams.type !== 'credit' && queryOptions.queryParams.type !== 'debit') ? 5 : 5.5}}>
                  <JumboSearch
                    onChange={handleOnKeywordChange}
                    value={queryOptions.queryParams.keyword}
                  />
                </Grid>
                
                {(queryOptions.queryParams.type !== 'credit' && queryOptions.queryParams.type !== 'debit') &&
                  <Grid size={{xs: 1, lg: 0.5}}>
                    <TransactionsActionTail type={queryOptions.queryParams.type} /> 
                  </Grid>
                }
              </Grid>
            }
          />
        }
        onSelectionChange={setSelectedTransactions}
      />
    </React.Fragment>
  );
};

export default TransactionsList;