'use client';
import JumboListToolbar from '@jumbo/components/JumboList/components/JumboListToolbar';
import JumboRqList from '@jumbo/components/JumboReactQuery/JumboRqList';
import JumboSearch from '@jumbo/components/JumboSearch';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { PrintOutlined } from '@mui/icons-material';
import {
  Box,
  Dialog,
  FormControlLabel,
  Grid,
  IconButton,
  Switch,
  Tooltip,
  useMediaQuery,
} from '@mui/material';
import { useParams } from 'next/navigation';
import React, { useState } from 'react';
import storeServices from '../../store-services';
import { useStoreProfile } from '../StoreProfileProvider';
import StockListItem from './StockListItem';
import StockReport from './StockReport';
import LowStockThresholds from './lowStockThresholds/LowStockThresholds';

function StoreStock() {
  const [openDialog, setOpenDialog] = useState(false);
  const params = useParams();
  const listRef = React.useRef();
  const { activeStore: store } = useStoreProfile();
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));
  const belowMidScreen = useMediaQuery(theme.breakpoints.down('md'));
  const [includeChildren, setIncludeChildren] = useState(true);

  const [queryOptions, setQueryOptions] = React.useState({
    queryKey: 'storeStock',
    queryParams: { id: params.id, keyword: '', include_children: true },
    countKey: 'total',
    dataKey: 'data',
  });

  React.useEffect(() => {
    setQueryOptions((state) => ({
      ...state,
      queryParams: {
        ...state.queryParams,
        id: store?.id ? store.id : params.id,
      },
    }));
  }, [params, store]);

  const renderProductStock = React.useCallback((productStock) => {
    return <StockListItem productStock={productStock} />;
  });

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
    <JumboRqList
      ref={listRef}
      wrapperComponent={Box}
      service={storeServices.getStockList}
      primaryKey={'id'}
      queryOptions={queryOptions}
      itemsPerPage={10}
      itemsPerPageOptions={[10, 15, 20, 50, 100]}
      renderItem={renderProductStock}
      componentElement={'div'}
      bulkActions={null}
      wrapperSx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
      }}
      toolbar={
        <JumboListToolbar
          hideItemsPerPage={true}
          action={
            // <Stack direction={'row'}>
            <Grid container>
              <Grid size={{ xs: 10, md: 6 }}>
                <JumboSearch
                  onChange={handleOnChange}
                  value={queryOptions.queryParams.keyword}
                />
              </Grid>
              {belowMidScreen && (
                <>
                  <Grid size={{ xs: 1, md: 1 }} textAlign={'right'}>
                    <LowStockThresholds />
                  </Grid>
                  <Grid size={{ xs: 1, md: 1 }} textAlign={'right'}>
                    <React.Fragment>
                      <Tooltip title='Stock Report'>
                        <IconButton onClick={() => setOpenDialog(true)}>
                          <PrintOutlined />
                        </IconButton>
                      </Tooltip>
                      <Dialog
                        fullWidth
                        open={openDialog}
                        scroll={'paper'}
                        maxWidth='md'
                        fullScreen={belowLargeScreen}
                      >
                        <StockReport setOpenDialog={setOpenDialog} />
                      </Dialog>
                    </React.Fragment>
                  </Grid>
                </>
              )}
              <Grid size={{ xs: 12, md: 4 }} textAlign={'right'}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={includeChildren}
                      onChange={(e) => {
                        const nextValue = e.target.checked;
                        setIncludeChildren(nextValue);
                        setQueryOptions((prev) => {
                          return {
                            ...prev,
                            queryParams: {
                              ...prev.queryParams,
                              include_children: nextValue,
                            },
                          };
                        });
                      }}
                    />
                  }
                  label='Include Substores'
                />
              </Grid>
              {!belowMidScreen && (
                <>
                  <Grid size={{ xs: 4, md: 1 }} textAlign={'right'}>
                    <LowStockThresholds />
                  </Grid>
                  <Grid size={{ xs: 4, md: 1 }} textAlign={'right'}>
                    <React.Fragment>
                      <Tooltip title='Stock Report'>
                        <IconButton onClick={() => setOpenDialog(true)}>
                          <PrintOutlined />
                        </IconButton>
                      </Tooltip>
                      <Dialog
                        fullWidth
                        open={openDialog}
                        scroll={'paper'}
                        maxWidth='md'
                        fullScreen={belowLargeScreen}
                      >
                        <StockReport setOpenDialog={setOpenDialog} />
                      </Dialog>
                    </React.Fragment>
                  </Grid>
                </>
              )}
            </Grid>
            // </Stack>
          }
        ></JumboListToolbar>
      }
    />
  );
}

export default StoreStock;
