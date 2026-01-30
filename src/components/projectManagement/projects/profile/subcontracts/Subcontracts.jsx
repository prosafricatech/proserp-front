import LedgerSelectProvider from '@/components/accounts/ledgers/forms/LedgerSelectProvider';
import CurrencySelectProvider from '@/components/masters/currencies/CurrencySelectProvider';
import StakeholderSelectProvider from '@/components/masters/stakeholders/StakeholderSelectProvider';
import ProductsProvider from '@/components/productAndServices/products/ProductsProvider';
import ProductsSelectProvider from '@/components/productAndServices/products/ProductsSelectProvider';
import JumboListToolbar from '@jumbo/components/JumboList/components/JumboListToolbar/JumboListToolbar';
import JumboRqList from '@jumbo/components/JumboReactQuery/JumboRqList/JumboRqList';
import JumboSearch from '@jumbo/components/JumboSearch/JumboSearch';
import { Card, Stack } from '@mui/material';
import { useParams } from 'next/navigation';
import React from 'react';
import projectsServices from '../../project-services';
import { useProjectProfile } from '../ProjectProfileProvider';
import SubcontractActionTail from './SubcontractActionTail';
import SubcontractListItem from './SubcontractListItem';

const Subcontracts = () => {
  const params = useParams();
  const listRef = React.useRef();
  const { project } = useProjectProfile();

  const [queryOptions, setQueryOptions] = React.useState({
    queryKey: 'subcontracts',
    queryParams: { id: params.id, keyword: '', project_id: project?.id },
    countKey: 'total',
    dataKey: 'data',
  });

  React.useEffect(() => {
    setQueryOptions((state) => ({
      ...state,
      queryParams: { ...state.queryParams, id: params.id },
    }));
  }, [params]);

  const renderSubcontract = React.useCallback((subContract) => {
    return <SubcontractListItem subContract={subContract} />;
  }, []);

  const handleOnChange = React.useCallback((keyword) => {
    setQueryOptions((state) => ({
      ...state,
      queryParams: {
        ...state.queryParams,
        keyword: keyword,
      },
    }));
  }, []);

  return (
    <LedgerSelectProvider>
      <StakeholderSelectProvider>
        <CurrencySelectProvider>
          <ProductsProvider>
            <ProductsSelectProvider>
              <JumboRqList
                ref={listRef}
                wrapperComponent={Card}
                service={projectsServices.getSubcontractsList}
                primaryKey='id'
                queryOptions={queryOptions}
                itemsPerPage={10}
                itemsPerPageOptions={[5, 8, 10, 15, 20]}
                renderItem={renderSubcontract}
                componentElement='div'
                bulkActions={null}
                wrapperSx={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                }}
                toolbar={
                  <JumboListToolbar
                    hideItemsPerPage={true}
                    actionTail={
                      <Stack direction='row'>
                        <JumboSearch
                          onChange={handleOnChange}
                          value={queryOptions.queryParams.keyword}
                        />
                        <SubcontractActionTail />
                      </Stack>
                    }
                  />
                }
              />
            </ProductsSelectProvider>
          </ProductsProvider>
        </CurrencySelectProvider>
      </StakeholderSelectProvider>
    </LedgerSelectProvider>
  );
};

export default Subcontracts;
