'use client'

import React, { useEffect, useRef, useState } from 'react';
import { Card, Stack, Typography } from '@mui/material';
import JumboListToolbar from '@jumbo/components/JumboList/components/JumboListToolbar';
import JumboRqList from '@jumbo/components/JumboReactQuery/JumboRqList';
import JumboSearch from '@jumbo/components/JumboSearch';
import measurementUnitServices from './measurement-unit-services';
import MeasurementUnitActionTail from './MeasurementUnitActionTail';
import MeasurementUnitListItem from './MeasurementUnitListItem';
import { useParams } from 'next/navigation';
import UnauthorizedAccess from '@/shared/Information/UnauthorizedAccess';
import { MeasurementUnit } from './MeasurementUnitType';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

const MeasurementUnits = () => {
  const params = useParams<{ category?: string; id?: string; keyword?: string }>();
  const listRef = useRef<any>(null);
  const [mounted, setMounted] = useState(false);
  const {checkOrganizationPermission} = useJumboAuth();
  const dictionary= useDictionary();

  const [queryOptions, setQueryOptions] = React.useState({
    queryKey: 'measurementUnits',
    queryParams: { id: params.id, keyword: '' },
    countKey: 'total',
    dataKey: 'data',
  });

  React.useEffect(() => {
    setQueryOptions((state) => ({
      ...state,
      queryParams: { ...state.queryParams, id: params.id },
    }));
  }, [params]);

  const renderMeasurementUnit = React.useCallback((measurementUnit: MeasurementUnit) => {
    return <MeasurementUnitListItem measurementUnit={measurementUnit} />;
  }, []);

  const handleOnChange = React.useCallback((keyword: string) => {
    setQueryOptions((state) => ({
      ...state,
      queryParams: {
        ...state.queryParams,
        keyword: keyword,
      },
    }));
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null; // ⛔ Prevent mismatch during hydration

  if(!checkOrganizationPermission(PERMISSIONS.MEASUREMENT_UNITS_READ)){
      return <UnauthorizedAccess/>;
  }

  return (
    <React.Fragment>
      <Typography variant={'h4'} mb={2}>{dictionary.measurementUnits.form.labels.listHeader}</Typography>
      <JumboRqList
        ref={listRef}
        wrapperComponent={Card}
        service={measurementUnitServices.getList}
        primaryKey="id"
        queryOptions={queryOptions}
        itemsPerPage={10}
        itemsPerPageOptions={[5, 8, 10, 15, 20]}
        renderItem={renderMeasurementUnit}
        componentElement="div"
        wrapperSx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
        }}
        toolbar={
          <JumboListToolbar hideItemsPerPage={true} actionTail={
              <Stack direction="row">
                <JumboSearch
                  onChange={handleOnChange}
                  value={queryOptions.queryParams.keyword}
                />
                <MeasurementUnitActionTail />
              </Stack>
          }>
          </JumboListToolbar>
        }
      />
    </React.Fragment>
  );
};

export default MeasurementUnits;
