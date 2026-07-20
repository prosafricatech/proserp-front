'use client';
import CurrencySelectProvider from '@/components/masters/Currencies/CurrencySelectProvider';
import { getSanitizedSearchKeyword } from '@/utilities/getSanitizedSearchKeyword';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import UnauthorizedAccess from '@/shared/Information/UnauthorizedAccess';
import JumboListToolbar from '@jumbo/components/JumboList/components/JumboListToolbar';
import JumboRqList from '@jumbo/components/JumboReactQuery/JumboRqList';
import JumboSearch from '@jumbo/components/JumboSearch';
import { Card, Grid } from '@mui/material';
import { useParams, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import imprestRetirementServices from '../imprestRetirements/imprestRetirementServices';
import RetirementsListItem from './RetirementsListItem';
import LedgerSelectProvider from '@/components/accounts/ledgers/forms/LedgerSelectProvider';

interface QueryParams {
  id?: string;
  keyword: string;
}

interface QueryOptions {
  queryKey: string;
  queryParams: QueryParams;
  countKey: string;
  dataKey: string;
}
const Retirements = () => {
  const params = useParams();
  const searchParams = useSearchParams();
  const listRef = useRef<any>(null);
  const { checkOrganizationPermission } = useJumboAuth();

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [queryOptions, setQueryOptions] = useState<QueryOptions>({
    queryKey: 'approvedRequisitions',
    queryParams: {
      id: params.id as string,
      keyword: getSanitizedSearchKeyword('Retirements', searchParams),
    },
    countKey: 'total',
    dataKey: 'data',
  });

  const renderRetirements = (retirement: any) => {
    return <RetirementsListItem retirement={retirement} />;
  };

  const handleOnChange = useCallback((keyword: string) => {
    setQueryOptions((state) => ({
      ...state,
      queryParams: {
        ...state.queryParams,
        keyword: keyword,
      },
    }));
  }, []);

  if (!checkOrganizationPermission(PERMISSIONS.IMPREST_RETIREMENTS_READ)) {
    return <UnauthorizedAccess />;
  }
  
  if (!mounted) return null;

  return (
    <CurrencySelectProvider>
      <LedgerSelectProvider>
        <JumboRqList
          ref={listRef}
          wrapperComponent={Card}
          service={imprestRetirementServices.list}
          primaryKey='id'
          queryOptions={queryOptions}
          itemsPerPage={10}
          itemsPerPageOptions={[5, 8, 10, 15, 20]}
          renderItem={renderRetirements}
          componentElement='div'
          wrapperSx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
          }}
          toolbar={
            <JumboListToolbar
              hideItemsPerPage={true}
              action={
                <Grid
                  container
                  columnSpacing={1}
                  rowSpacing={1}
                  justifyContent={'end'}
                >
                  <Grid size={{ xs: 11, lg: 5.5 }}>
                    <JumboSearch
                      onChange={handleOnChange}
                      value={queryOptions.queryParams.keyword}
                    />
                  </Grid>
                </Grid>
              }
            />
          }
        />
      </LedgerSelectProvider>
    </CurrencySelectProvider>
  );
};

export default Retirements;
