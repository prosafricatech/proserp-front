'use client';

import JumboListToolbar from '@jumbo/components/JumboList/components/JumboListToolbar';
import JumboRqList from '@jumbo/components/JumboReactQuery/JumboRqList';
import JumboSearch from '@jumbo/components/JumboSearch/JumboSearch';
import { Card, Grid, Stack, TableCell, TableRow } from '@mui/material';
import { useCallback, useRef, useState, useEffect } from 'react';
import AuditTrailListItem from './AuditTrailListItem';
import MovementTypeSelector from './MovementTypeSelector';
import { Movement } from './AuditTrailType';
import humanResourcesServices from '@/components/humanResources/humanResourcesServices';

interface AuditTrailTabProps {
  employeeId: number;
}

const TABLE_HEADERS = ['Date', 'From', 'To', 'Reason'];

const AuditTrailTab = ({ employeeId }: AuditTrailTabProps) => {
  const listRef = useRef<any>(null);
  const [movementType, setMovementType] = useState('all');

  const [queryOptions, setQueryOptions] = useState({
    queryKey: ['movements', employeeId, movementType],
    queryParams: {
      keyword: '',
    },
    countKey: 'total',
    dataKey: 'data',
  });

  // Update query key when movement type changes
  useEffect(() => {
    setQueryOptions(prev => ({
      ...prev,
      queryKey: ['movements', employeeId, movementType],
    }));
  }, [employeeId, movementType]);

  const renderAuditTrail = useCallback((movement: Movement) => {
    return <AuditTrailListItem movement={movement} showType={movementType === 'all'} />;
  }, [movementType]);

  const handleOnChange = useCallback((keyword: string) => {
    setQueryOptions((state) => ({
      ...state,
      queryParams: {
        ...state.queryParams,
        keyword: keyword,
      },
    }));
  }, []);

  // Handle movement type change
  const handleMovementTypeChange = useCallback((value: string) => {
    setMovementType(value);
  }, []);

  return (
    <JumboRqList
      ref={listRef}
      wrapperComponent={Card}
      service={(params) => humanResourcesServices.getMovements(employeeId, movementType, params)}
      primaryKey="id"
      queryOptions={queryOptions as any}
      itemsPerPage={20}
      itemsPerPageOptions={[10, 20, 50]}
      renderItem={renderAuditTrail}
      view="table"
      tableHeader={TABLE_HEADERS}
      componentElement="div"
      wrapperSx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
      }}
      toolbar={
        <JumboListToolbar
          hideItemsPerPage={true}
          actionTail={
            <Grid container columnSpacing={1} rowSpacing={1}>
              <Grid size={{ xs: 12, lg: 6 }} alignItems="center">
                <MovementTypeSelector
                  value={movementType}
                  onChange={handleMovementTypeChange}
                />
              </Grid>
              <Grid size={{ xs: 12, lg: 6 }}>
                <Stack direction="row">
                  <JumboSearch
                    onChange={handleOnChange}
                    value={queryOptions.queryParams.keyword}
                  />
                </Stack>
              </Grid>
            </Grid>
          }
        />
      }
    />
  );
};

export default AuditTrailTab;