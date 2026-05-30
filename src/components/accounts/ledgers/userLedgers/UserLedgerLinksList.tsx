'use client';

import React, { useCallback, useRef, useState } from 'react';
import { Card, Chip, Grid, TextField, Tooltip, Typography } from '@mui/material';
import { ClearOutlined } from '@mui/icons-material';
import { IconButton } from '@mui/material';
import JumboListToolbar from '@jumbo/components/JumboList/components/JumboListToolbar';
import JumboRqList from '@jumbo/components/JumboReactQuery/JumboRqList';
import JumboSearch from '@jumbo/components/JumboSearch';
import UsersSelector from '@/components/sharedComponents/UsersSelector';
import userLedgerServices from '../user-ledger-services';
import UserLedgerLinksActionTail from './UserLedgerLinksActionTail';
import UserLedgerUnlinkRowAction from './UserLedgerUnlinkRowAction';

interface UserLedgerLink {
  id: number;
  type: string;
  user?: {
    id: number;
    name?: string;
    email?: string;
    phone?: string | null;
  };
  ledger?: {
    id: number;
    name?: string;
  };
}

type SelectorUser = {
  id: number;
  name: string;
  email?: string;
  phone?: string | null;
};

interface QueryOptions {
  queryKey: string;
  queryParams: {
    keyword: string;
    user_id?: number;
    type: string | null;
  };
  countKey: string;
  dataKey: string;
}

export default function UserLedgerLinksList() {
  const listRef = useRef<any>(null);
  const [selectedUser, setSelectedUser] = useState<SelectorUser | null>(null);
  const [queryOptions, setQueryOptions] = useState<QueryOptions>({
    queryKey: 'user-ledgers-list',
    queryParams: {
      keyword: '',
      type: null,
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

  const handleKeywordChange = React.useCallback((keyword: string) => {
    setQueryParam('keyword', keyword);
  }, [setQueryParam]);

  const handleUserChange = React.useCallback((newValue: any) => {
    const selected = Array.isArray(newValue) ? newValue[0] : newValue;
    setSelectedUser(selected ? { ...selected, name: selected.name || '' } : null);
    setQueryParam('user_id', selected?.id);
  }, [setQueryParam]);

  const handleClearSelectedUser = React.useCallback(() => {
    setSelectedUser(null);
    setQueryParam('user_id', undefined);
  }, [setQueryParam]);

//   const handleTypeChange = React.useCallback((value: string) => {
//     setQueryParam('type', value);
//   }, [setQueryParam]);

  const renderItem = useCallback((item: UserLedgerLink) => {
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
        <Grid size={{ xs: 12, md: 3.5 }}>
          <Tooltip title="User">
            <Typography noWrap>{item.user?.name}</Typography>
          </Tooltip>
          <Typography variant="caption" color="text.secondary" noWrap>
            {item.user?.email}
          </Typography>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Tooltip title="Ledger">
            <Typography noWrap>{item.ledger?.name}</Typography>
          </Tooltip>
        </Grid>
        <Grid size={{ xs: 12, md: 2 }}>
          <Chip size="small" label={String(item.type).toUpperCase()} />
        </Grid>
        <Grid size={{ xs: 12, md: 2.5 }} textAlign={{ md: 'right' }}>
          <UserLedgerUnlinkRowAction
            userLedgerId={item.id}
            userName={item.user?.name}
            ledgerName={item.ledger?.name}
          />
        </Grid>
      </Grid>
    );
  }, []);

  return (
    <JumboRqList
      ref={listRef}
      wrapperComponent={Card}
      service={userLedgerServices.getUserLedgersList}
      primaryKey="id"
      queryOptions={queryOptions}
      itemsPerPage={10}
      itemsPerPageOptions={[10, 20, 30, 50]}
      renderItem={renderItem}
      componentElement="div"
      wrapperSx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
      }}
      toolbar={
        <JumboListToolbar
          hideItemsPerPage
          actionTail={
            <Grid container spacing={1} justifyContent="end">
              <Grid size={{ xs: 12, md: 4.5 }}>
                <UsersSelector
                  label="User"
                  value={selectedUser}
                  defaultValue={null}
                  onChange={handleUserChange}
                />
              </Grid>
              {/* <Grid size={{ xs: 12, md: 2 }}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Type"
                  value={queryOptions.queryParams.type}
                  SelectProps={{ native: true }}
                  onChange={(e) => {
                    handleTypeChange(e.target.value);
                  }}
                >
                  <option value="all">All</option>
                  <option value="imprest">Imprest</option>
                </TextField>
              </Grid> */}
              <Grid size={{ xs: 12, md: 7 }}>
                <JumboSearch
                  onChange={handleKeywordChange}
                  value={queryOptions.queryParams.keyword}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 0.5 }} textAlign={{ md: 'right' }}>
                <UserLedgerLinksActionTail />
              </Grid>
            </Grid>
          }
        />
      }
    />
  );
}
