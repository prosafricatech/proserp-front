"use client";
import React, { createContext } from 'react';
import { Alert, Box, Stack } from '@mui/material';
import JumboListToolbar from '@jumbo/components/JumboList/components/JumboListToolbar/JumboListToolbar';
import JumboRqList from '@jumbo/components/JumboReactQuery/JumboRqList/JumboRqList';
import JumboSearch from '@jumbo/components/JumboSearch/JumboSearch';
import fuelStationServices from '../fuelStationServices';
import DippingsListItem from './DippingsListItem';
import DippingsActionTail from './DippingsActionTail';
import ProductsSelectProvider from '../../productAndServices/products/ProductsSelectProvider';
import { useParams } from 'next/navigation';
import { Dipping, DippingsProps } from './DippingsTypes';


export const DippingsFormContext = createContext({});
const Dippings: React.FC<DippingsProps> = ({ activeStation }) => {
  const params = useParams();
  const listRef = React.useRef<any>(null);
  
  const [queryOptions, setQueryOptions] = React.useState({
  queryKey: 'stationDippings',
    queryParams: { id: params.id, keyword: '', stationId: !!activeStation?.id && activeStation?.id},
    countKey: 'total',
    dataKey: 'data',
  });

 React.useEffect(() => {
    setQueryOptions((state) => ({
      ...state,
      queryKey: 'stationDippings',
      queryParams: { ...state.queryParams, stationId: !!activeStation?.id && activeStation.id },
      }));
  }, [activeStation]);

  const salesShifts = React.useCallback((dipping: Dipping) => {
    return <DippingsListItem dipping={dipping}/>;
  }, []);

  const handleOnChange = React.useCallback(
   (keyword: string) => {
     setQueryOptions((state) => ({
      ...state,
        queryParams: {
          ...state.queryParams,
            keyword: keyword,
          },
      }));
     },
   []
 );

  return (
    <ProductsSelectProvider>
     <DippingsFormContext.Provider value={{ activeStation: activeStation ?? null }}>
       {
        activeStation ?
            <JumboRqList
              ref={listRef}
              wrapperComponent={Box}
              service={fuelStationServices.getStationDippings}
              primaryKey="id"
              queryOptions={queryOptions}
              itemsPerPage={10}
              itemsPerPageOptions={[5, 8, 10, 15, 20]}
              renderItem={salesShifts}
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
                       <DippingsActionTail/>
                   </Stack>
                 }/>
 }
            />
          :
         <Alert variant='outlined' severity='info'>Please select a Station</Alert>
        }
    </DippingsFormContext.Provider>
    </ProductsSelectProvider>
  );
};
export default Dippings;