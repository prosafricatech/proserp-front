'use client';

import React, { useState } from 'react';
import { Card, Grid, TextField, Tooltip, Typography } from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import dayjs, { Dayjs } from 'dayjs';
import JumboListToolbar from '@jumbo/components/JumboList/components/JumboListToolbar';
import JumboRqList from '@jumbo/components/JumboReactQuery/JumboRqList';
import JumboSearch from '@jumbo/components/JumboSearch';
import UsersSelector from '@/components/sharedComponents/UsersSelector';
import CostCenterSelector from '@/components/masters/costCenters/CostCenterSelector';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { CostCenter } from '@/components/masters/costCenters/CostCenterType';
import userLedgerServices from '../user-ledger-services';

interface UserLedgerPayment {
  id: number;
  voucherNo?: string;
  transaction_date?: string;
  narration?: string;
  reference?: string;
  amount?: number;
  currency?: { code?: string };
  credit_ledger?: { id?: number; name?: string };
  creator?: { name?: string };
}

interface QueryOptions {
  queryKey: string;
  queryParams: {
    keyword: string;
    type: string;
    user_id?: number;
    from?: string | null;
    to?: string | null;
    cost_center_ids?: number[];
  };
  countKey: string;
  dataKey: string;
}

export default function UserLedgerPaymentsList() {
  const { authOrganization } = useJumboAuth();
  const [selectedCostCenter, setSelectedCostCenter] = useState<CostCenter[]>([]);

  const [queryOptions, setQueryOptions] = useState<QueryOptions>({
    queryKey: 'user-ledger-payments-list',
    queryParams: {
      keyword: '',
      type: 'imprest',
      cost_center_ids: authOrganization?.costCenters?.map((cc: CostCenter) => cc.id) || [],
    },
    countKey: 'total',
    dataKey: 'data',
  });

  const setQueryParam = React.useCallback((key: string, value: any) => {
    setQueryOptions((state) => {
      if (state.queryParams[key as keyof typeof state.queryParams] === value) {
        return state;
      }

      return {
        ...state,
        queryParams: {
          ...state.queryParams,
          [key]: value,
        },
      };
    });
  }, []);

  const setCostCenterIds = React.useCallback((ids: number[]) => {
    setQueryOptions((state) => {
      const prevIds = state.queryParams.cost_center_ids || [];
      const sameLength = prevIds.length === ids.length;
      const sameValues = sameLength && prevIds.every((id, index) => id === ids[index]);

      if (sameValues) return state;

      return {
        ...state,
        queryParams: {
          ...state.queryParams,
          cost_center_ids: ids,
        },
      };
    });
  }, []);

  const handleKeywordChange = React.useCallback((keyword: string) => {
    setQueryParam('keyword', keyword);
  }, [setQueryParam]);

  const handleUserChange = React.useCallback((newValue: any) => {
    const selected = Array.isArray(newValue) ? newValue[0] : newValue;
    setQueryParam('user_id', selected?.id);
  }, [setQueryParam]);

  const handleFromChange = React.useCallback((value: Dayjs | null) => {
    setQueryParam('from', value?.toISOString() || null);
  }, [setQueryParam]);

  const handleToChange = React.useCallback((value: Dayjs | null) => {
    setQueryParam('to', value?.toISOString() || null);
  }, [setQueryParam]);

  const handleCostCenterChange = React.useCallback((newValue: CostCenter | CostCenter[] | null) => {
    const values = (Array.isArray(newValue) ? newValue : newValue ? [newValue] : []) as CostCenter[];
    setSelectedCostCenter(values);
  }, []);

  React.useEffect(() => {
    setCostCenterIds(selectedCostCenter.map((c) => c.id));
  }, [selectedCostCenter, setCostCenterIds]);

  return (
    <JumboRqList
      wrapperComponent={Card}
      service={userLedgerServices.getUserLedgerPayments}
      primaryKey="id"
      queryOptions={queryOptions}
      itemsPerPage={10}
      itemsPerPageOptions={[10, 20, 30, 50]}
      renderItem={(item: UserLedgerPayment) => {
        const currencyCode = item?.currency?.code || 'TZS';
        const amount = Number(item?.amount || 0);

        return (
          <Grid
            key={item.id}
            container
            spacing={1}
            sx={{
              borderTop: 1,
              borderColor: 'divider',
              px: 1,
              py: 1.25,
              alignItems: 'center',
            }}
          >
            <Grid size={{ xs: 12, md: 2.5 }}>
              <Tooltip title="Voucher No">
                <Typography noWrap>{item.voucherNo || '-'}</Typography>
              </Tooltip>
              <Typography variant="caption" noWrap>
                {item.transaction_date ? dayjs(item.transaction_date).format('DD MMM YYYY') : '-'}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 3.5 }}>
              <Tooltip title="Narration">
                <Typography noWrap>{item.narration || '-'}</Typography>
              </Tooltip>
              <Typography variant="caption" noWrap>
                Ref: {item.reference || '-'}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 2.5 }}>
              <Tooltip title="Paid To Ledger">
                <Typography noWrap>{item.credit_ledger?.name || '-'}</Typography>
              </Tooltip>
              <Typography variant="caption">By: {item.creator?.name || '-'}</Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 3.5 }} textAlign={{ md: 'right' }}>
              <Typography>
                {amount.toLocaleString('en-US', {
                  style: 'currency',
                  currency: currencyCode,
                })}
              </Typography>
            </Grid>
          </Grid>
        );
      }}
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
            <Grid container spacing={1} justifyContent="end">
              <Grid size={{ xs: 12, md: 3 }}>
                <UsersSelector
                  label="User"
                  defaultValue={null}
                  onChange={handleUserChange}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <DateTimePicker
                  label="From"
                  value={queryOptions.queryParams.from ? dayjs(queryOptions.queryParams.from) : null}
                  slotProps={{ textField: { size: 'small', fullWidth: true } }}
                  onChange={handleFromChange}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <DateTimePicker
                  label="To"
                  value={queryOptions.queryParams.to ? dayjs(queryOptions.queryParams.to) : null}
                  slotProps={{ textField: { size: 'small', fullWidth: true } }}
                  onChange={handleToChange}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 2.5 }}>
                <CostCenterSelector
                  label="Cost Centers"
                  multiple
                  allowSameType
                  defaultValue={selectedCostCenter}
                  onChange={handleCostCenterChange}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 2.5 }}>
                <JumboSearch
                  onChange={handleKeywordChange}
                  value={queryOptions.queryParams.keyword}
                />
              </Grid>
            </Grid>
          }
        />
      }
    />
  );
}
