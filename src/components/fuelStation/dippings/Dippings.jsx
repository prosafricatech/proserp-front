"use client";

import React, { createContext } from 'react';
import { Alert, Box, Stack } from '@mui/material';
import JumboListToolbar from '@jumbo/components/JumboList/components/JumboListToolbar/JumboListToolbar';
import JumboRqList from '@jumbo/components/JumboReactQuery/JumboRqList/JumboRqList';
import JumboSearch from '@jumbo/components/JumboSearch/JumboSearch';
import DippingsListItem from './DippingsListItem';
import ProductsSelectProvider from '../../productAndServices/products/ProductsSelectProvider';

export const DippingsFormContext = createContext({});
// HARDCODED FULL RESPONSE (page 1 of 17, total 170 items)
const HARDCODED_RESPONSE = {
  current_page: 1,
  data: [
    {
      id: 334,
      fuel_station_id: 1,
      as_at: "2025-08-21T03:30:30.000Z",
      remarks: "Dipping after FSS/00677",
      dipping_no: "FD/00334",
      created_at: "2025-09-11T11:43:23.000Z",
      updated_at: "2025-09-11T11:43:23.000000Z",
      created_by: 99,
      deleted_at: null,
    },
    {
      id: 335,
      fuel_station_id: 1,
      as_at: "2025-08-20T03:30:30.000Z",
      remarks: "Dipping after FSS/00674",
      dipping_no: "FD/00335",
      created_at: "2025-09-11T11:44:14.000Z",
      updated_at: "2025-09-11T11:44:14.000000Z",
      created_by: 99,
      deleted_at: null,
    },
    {
      id: 331,
      fuel_station_id: 1,
      as_at: "2025-08-16T03:30:30.000Z",
      remarks: "Dipping after FSS/00663",
      dipping_no: "FD/00331",
      created_at: "2025-09-11T07:56:25.000Z",
      updated_at: "2025-09-11T07:56:25.000000Z",
      created_by: 99,
      deleted_at: null,
    },
    {
      id: 330,
      fuel_station_id: 1,
      as_at: "2025-08-15T03:30:30.000Z",
      remarks: "Dipping after FSS/00661",
      dipping_no: "FD/00330",
      created_at: "2025-09-11T07:29:15.000Z",
      updated_at: "2025-09-11T07:29:15.000000Z",
      created_by: 99,
      deleted_at: null,
    },
    {
      id: 329,
      fuel_station_id: 1,
      as_at: "2025-08-14T03:30:30.000Z",
      remarks: "Dipping after FSS/00659",
      dipping_no: "FD/00329",
      created_at: "2025-09-11T07:18:46.000Z",
      updated_at: "2025-09-11T07:18:46.000000Z",
      created_by: 99,
      deleted_at: null,
    },
    {
      id: 324,
      fuel_station_id: 1,
      as_at: "2025-08-13T03:30:30.000Z",
      remarks: "Dipping after FSS/00650",
      dipping_no: "FD/00324",
      created_at: "2025-09-08T08:13:06.000Z",
      updated_at: "2025-09-08T08:13:06.000000Z",
      created_by: 99,
      deleted_at: null,
    },
    {
      id: 320,
      fuel_station_id: 1,
      as_at: "2025-08-12T03:30:30.000Z",
      remarks: "Dipping after FSS/00641",
      dipping_no: "FD/00320",
      created_at: "2025-09-06T10:03:31.000Z",
      updated_at: "2025-09-06T10:03:31.000000Z",
      created_by: 99,
      deleted_at: null,
    },
    {
      id: 319,
      fuel_station_id: 1,
      as_at: "2025-08-11T03:30:30.000Z",
      remarks: "Dipping after FSS/00639",
      dipping_no: "FD/00319",
      created_at: "2025-09-06T09:48:14.000Z",
      updated_at: "2025-09-06T09:48:14.000000Z",
      created_by: 99,
      deleted_at: null,
    },
    {
      id: 318,
      fuel_station_id: 1,
      as_at: "2025-08-10T03:30:30.000Z",
      remarks: "Dipping after FSS/00637",
      dipping_no: "FD/00318",
      created_at: "2025-09-06T09:31:02.000Z",
      updated_at: "2025-09-06T09:31:02.000000Z",
      created_by: 99,
      deleted_at: null,
    },
    {
      id: 317,
      fuel_station_id: 1,
      as_at: "2025-08-09T03:30:30.000Z",
      remarks: "Dipping after FSS/00635",
      dipping_no: "FD/00317",
      created_at: "2025-09-06T09:20:40.000Z",
      updated_at: "2025-09-06T09:20:40.000000Z",
      created_by: 99,
      deleted_at: null,
    },
  ],
  first_page_url: "https://backend.proserp.co.tz/api/v1/fuel-stations/1/dippings?page=1",
  from: 1,
  last_page: 17,
  last_page_url: "https://backend.proserp.co.tz/api/v1/fuel-stations/1/dippings?page=17",
  links: [
    { url: null, label: "&laquo; Previous", active: false },
    { url: "https://backend.proserp.co.tz/api/v1/fuel-stations/1/dippings?page=1", label: "1", active: true },
    { url: "https://backend.proserp.co.tz/api/v1/fuel-stations/1/dippings?page=2", label: "2", active: false },
    // ... other links
    { url: "https://backend.proserp.co.tz/api/v1/fuel-stations/1/dippings?page=17", label: "17", active: false },
    { url: "https://backend.proserp.co.tz/api/v1/fuel-stations/1/dippings?page=2", label: "Next &raquo;", active: false },
  ],
  next_page_url: "https://backend.proserp.co.tz/api/v1/fuel-stations/1/dippings?page=2",
  path: "https://backend.proserp.co.tz/api/v1/fuel-stations/1/dippings",
  per_page: 10,
  prev_page_url: null,
  to: 10,
  total: 170,
};

const Dippings = ({ activeStation }) => {
  const listRef = React.useRef();

  const [queryOptions, setQueryOptions] = React.useState({
    queryKey: 'stationDippings',
    queryParams: { keyword: '' },
    countKey: 'total',
    dataKey: 'data',
  });

  const handleOnChange = React.useCallback((keyword) => {
    setQueryOptions((prev) => ({
      ...prev,
      queryParams: { ...prev.queryParams, keyword },
    }));
  }, []);

  const renderItem = React.useCallback((dipping) => {
    return <DippingsListItem dipping={dipping} />;
  }, []);

  // Custom service that returns hardcoded data
  const mockService = async (params) => {
    // Simulate search filter (client-side)
    let filteredData = HARDCODED_RESPONSE.data;

    if (params.keyword) {
      const kw = params.keyword.toLowerCase();
      filteredData = filteredData.filter((item) =>
        item.dipping_no.toLowerCase().includes(kw) ||
        item.remarks.toLowerCase().includes(kw)
      );
    }

    // Simulate pagination
    const page = params.page || 1;
    const perPage = params.per_page || 10;
    const start = (page - 1) * perPage;
    const end = start + perPage;
    const paginatedData = filteredData.slice(start, end);

    return {
      ...HARDCODED_RESPONSE,
      data: paginatedData,
      total: filteredData.length,
      current_page: page,
      from: filteredData.length > 0 ? start + 1 : null,
      to: Math.min(end, filteredData.length),
      last_page: Math.ceil(filteredData.length / perPage),
    };
  };

  return (
    <ProductsSelectProvider>
      {activeStation ? (
        <JumboRqList
          ref={listRef}
          wrapperComponent={Box}
          service={mockService}                    // Use mock service
          primaryKey="id"
          queryOptions={queryOptions}
          itemsPerPage={10}
          itemsPerPageOptions={[5, 8, 10, 15, 20]}
          renderItem={renderItem}
          componentElement="div"
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
                <Stack direction="row" spacing={2}>
                  <JumboSearch
                    onChange={handleOnChange}
                    value={queryOptions.queryParams.keyword || ''}
                    sx={{ minWidth: 240 }}
                  />
                </Stack>
              }
            />
          }
        />
      ) : (
        <Alert variant="outlined" color="primary" severity="info">
          Please select a Station
        </Alert>
      )}
    </ProductsSelectProvider>
  );
};

export default Dippings;