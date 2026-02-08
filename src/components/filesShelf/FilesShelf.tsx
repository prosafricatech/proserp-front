'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Card, Grid, IconButton, Tooltip,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import dayjs, { Dayjs } from 'dayjs';
import { EventAvailableOutlined } from '@mui/icons-material';
import { useParams } from 'next/navigation';
import JumboSearch from '@jumbo/components/JumboSearch';
import JumboListToolbar from '@jumbo/components/JumboList/components/JumboListToolbar';
import JumboRqList from '@jumbo/components/JumboReactQuery/JumboRqList';
import filesShelfServices from './filesShelfServices';
import FilesShelfListItem from './FilesShelfListItem';
import AttachmentablesSelector from './AttachmentablesSelector';
import FileTypesSelector from './FileTypesSelector';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import UnsubscribedAccess from '@/shared/Information/UnsubscribedAccess';
import { Attachment } from './attachments/AttachmentsType';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

function FilesShelf() {
  const params = useParams<{ category?: string; id?: string; keyword?: string }>();
  const listRef = useRef<any>(null);
  const { authOrganization } = useJumboAuth();
  const [mounted, setMounted] = useState(false);
  const dictionary = useDictionary();

  const [filterDate, setFilterDate] = useState<{ from?: string; to?: string }>({});
  const [queryOptions, setQueryOptions] = useState<{
    queryKey: string;
    queryParams: {
      id?: string;
      keyword: string;
      attachmentables: string[];
      extensions: string[];
      from?: string;
      to?: string;
    };
    countKey: string;
    dataKey: string;
  }>({
    queryKey: 'filesShelf',
    queryParams: {
      id: params.id,
      keyword: '',
      attachmentables: [],
      extensions: [],
    },
    countKey: 'total',
    dataKey: 'data',
  });

  const renderAttachments = useCallback(
    (attachment: Attachment) => <FilesShelfListItem attachment={attachment} />,
    [],
  );

  React.useEffect(() => {
    setQueryOptions((state) => ({
      ...state,
      queryParams: { ...state.queryParams, id: params.id },
    }));
  }, [params]);

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

  const handleAttachmentableChange = React.useCallback((attachmentables: string[]) => {
    setQueryOptions(state => ({
      ...state,
      queryParams: {
        ...state.queryParams,
        attachmentables: attachmentables
      }
    }));
  }, [queryOptions.queryParams.attachmentables]);

  const handleFileTypesChange = React.useCallback((extensions: string[]) => {
    setQueryOptions(state => ({
      ...state,
      queryParams: {
        ...state.queryParams,
        extensions: extensions
      }
    }));
  }, [queryOptions.queryParams.extensions]);

  const handleOnKeywordChange = useCallback((keyword: string) => {
    setQueryOptions(prev => ({
    ...prev,
    queryParams: {
      ...prev.queryParams,
      keyword
    }
    }));
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  if (!authOrganization?.organization?.active_subscriptions?.length) {
    return <UnsubscribedAccess />;
  }

  return (
    <JumboRqList
      ref={listRef}
      wrapperComponent={Card}
      service={filesShelfServices.getList}
      primaryKey="id"
      queryOptions={queryOptions}
      itemsPerPage={10}
      itemsPerPageOptions={[8, 10, 15, 20, 30, 50]}
      renderItem={renderAttachments}
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
            <Grid container columnSpacing={1} rowSpacing={1}>
              <Grid size={{ xs: 12, md: 6, lg: 2.6 }}>
                <AttachmentablesSelector
                  value={queryOptions.queryParams.attachmentables}
                  onChange={handleAttachmentableChange}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6, lg: 2.6 }}>
                <FileTypesSelector
                  value={queryOptions.queryParams.extensions}
                  onChange={handleFileTypesChange}
                />
              </Grid>
              <Grid size={{ xs: 11, md: 6, lg: 3.2 }}>
                <DateTimePicker
                  label={dictionary.filesShelf.list.labels.from}
                  value={filterDate.from ? dayjs(filterDate.from) : null}
                  minDate={dayjs(authOrganization?.organization?.recording_start_date)}
                  onChange={(value) => handleDateChange(value, 'from')}
                  slotProps={{
                    textField: { size: 'small', fullWidth: true },
                  }}
                />
              </Grid>
              <Grid size={{ xs: 11, md: 5, lg: 3.2 }}>
                <DateTimePicker
                  label={dictionary.filesShelf.list.labels.to}
                  value={filterDate.to ? dayjs(filterDate.to) : null}
                  minDate={filterDate.from ? dayjs(filterDate.from) : undefined}
                  onChange={(value) => handleDateChange(value, 'to')}
                  slotProps={{
                    textField: { size: 'small', fullWidth: true },
                  }}
                />
              </Grid>
              <Grid size={{ xs: 1, md: 1, lg: 0.4 }}>
                <Tooltip title={dictionary.filesShelf.list.actionTittle.filterDates}>
                  <IconButton onClick={applyDateFilters}>
                    <EventAvailableOutlined />
                  </IconButton>
                </Tooltip>
              </Grid>
            </Grid>
          }
          actionTail={
            <JumboSearch
              value={queryOptions.queryParams.keyword}
              onChange={handleOnKeywordChange}
            />
          }
        />
      }
    />
  );
}

export default FilesShelf;
