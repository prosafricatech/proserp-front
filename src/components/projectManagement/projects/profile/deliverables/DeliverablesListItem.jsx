import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
  Typography,
  ListItemText,
  Tabs,
  Tab,
  LinearProgress,
  Skeleton,
  Button,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import DeliverablesItemAction from './DeliverablesItemAction';
import { useProjectProfile } from '../ProjectProfileProvider';
import DeliverableTasks from './tab/DeliverableTasks';
import { useQuery } from '@tanstack/react-query';
import projectsServices from '../../project-services';
import DeliverableSummary from './tab/DeliverableSummary';
import { Stack } from '@mui/system';

function DeliverablesListItem({ filteredDeliverables }) {
  const { activeTab } = useProjectProfile();
  const [expandedIndex, setExpandedIndex] = React.useState(-1);
  const [tabIndex, setTabIndex] = React.useState(0);
  const [visibleCount, setVisibleCount] = useState(60);

  const BATCH_SIZE = 40;
  const LARGE_LIST_THRESHOLD = 80;

  const LOCAL_STORAGE_KEY = 'deliverablesExpandedIndex';

  // Restore expandedIndex from localStorage and reset if out of bounds when filteredDeliverables changes
  React.useEffect(() => {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    let parsed = -1;
    if (stored !== null) {
      parsed = parseInt(stored, 10);
      if (isNaN(parsed)) parsed = -1;
    }
    if (parsed >= filteredDeliverables.length || parsed < 0) {
      setExpandedIndex(-1);
    } else {
      setExpandedIndex(parsed);
    }
  }, [filteredDeliverables]);

  // Persist expandedIndex to localStorage
  React.useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, expandedIndex);
  }, [expandedIndex]);

  useEffect(() => {
    setVisibleCount(60);
    if (expandedIndex >= filteredDeliverables.length) {
      setExpandedIndex(-1);
    }
  }, [filteredDeliverables, expandedIndex]);

  const isLargeList = filteredDeliverables.length > LARGE_LIST_THRESHOLD;

  const visibleDeliverables = useMemo(() => {
    if (!isLargeList) {
      return filteredDeliverables;
    }
    return filteredDeliverables.slice(0, visibleCount);
  }, [filteredDeliverables, isLargeList, visibleCount]);

  const hasMore = isLargeList && visibleCount < filteredDeliverables.length;

  const loadMore = useCallback(() => {
    if (!hasMore) return;
    setVisibleCount((prev) => Math.min(prev + BATCH_SIZE, filteredDeliverables.length));
  }, [hasMore, filteredDeliverables.length]);

  const handleListScroll = useCallback(
    (event) => {
      if (!hasMore) return;
      const target = event.currentTarget;
      const distanceToBottom = target.scrollHeight - target.scrollTop - target.clientHeight;
      if (distanceToBottom < 220) {
        loadMore();
      }
    },
    [hasMore, loadMore]
  );

  const { data: deliverableDetails, isLoading: isDetailsLoading } = useQuery({
    queryKey: ['deliverableDetails', expandedIndex],
    queryFn: () => {
      const deliverableId = filteredDeliverables[expandedIndex]?.id;
      return projectsServices.showDeliverableDetails(deliverableId);
    },
    enabled: expandedIndex !== -1,
    staleTime: activeTab,
    cacheTime: activeTab,
  });

  const handleAccordionToggle = (index) => {
    setExpandedIndex((prevExpandedIndex) => (prevExpandedIndex === index ? -1 : index));
    setTabIndex(0);
  };

  return (
    <Grid size={{xs: 12}}>
      {filteredDeliverables.length > 0 && <Typography>Deliverables</Typography>}
      {isLargeList && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          Showing {visibleDeliverables.length} of {filteredDeliverables.length}
        </Typography>
      )}
      <Box
        onScroll={isLargeList ? handleListScroll : undefined}
        sx={
          isLargeList
            ? {
                maxHeight: '70vh',
                overflowY: 'auto',
                pr: 0.5,
              }
            : undefined
        }
      >
      {visibleDeliverables.map((deliverable, index) => {
        const realIndex = index;
        const currencyCode = deliverable.currency?.code;

        return (
          <Accordion
            key={deliverable?.id ?? index}
            expanded={expandedIndex === realIndex}
            onChange={() => handleAccordionToggle(realIndex)}
            square
            sx={{
              borderRadius: 2,
              borderTop: 2,
              padding: 0.5,
              borderColor: 'divider',
              '&:hover': {
                bgcolor: 'action.hover',
              },
              '& > .MuiAccordionDetails-root:hover': {
                bgcolor: 'transparent',
              },
            }}
          >
            <AccordionSummary
              expandIcon={expandedIndex === realIndex ? <RemoveIcon /> : <AddIcon />}
              sx={{
                px: 3,
                flexDirection: 'row-reverse',
                '.MuiAccordionSummary-content': {
                  alignItems: 'center',
                  '&.Mui-expanded': {
                    margin: '12px 0',
                  },
                },
                '.MuiAccordionSummary-expandIconWrapper': {
                  borderRadius: 1,
                  border: 1,
                  color: 'text.secondary',
                  transform: 'none',
                  mr: 1,
                  '&.Mui-expanded': {
                    transform: 'none',
                    color: 'primary.main',
                    borderColor: 'primary.main',
                  },
                  '& svg': {
                    fontSize: '1.25rem',
                  },
                },
              }}
            >
              <Grid container width={'100%'} columnSpacing={1} rowSpacing={1}>
                <Grid size={{xs: 12, md: deliverable?.contract_rate ? 4 : 7.5}}>
                  <ListItemText
                    primary={
                      <Tooltip title="Description">
                        <Typography component="span">{deliverable.description}</Typography>
                      </Tooltip>
                    }
                    secondary={
                      <Tooltip title="Code">
                        <Typography component="span">{deliverable.code}</Typography>
                      </Tooltip>
                    }
                  />
                </Grid>
                <Grid size={{xs: 6, md: deliverable?.contract_rate ? 2 : 3.5}}>
                  <Tooltip title="Quantity">
                    <Typography textAlign={{ md: 'right' }}>
                      {`${deliverable.quantity?.toLocaleString()} ${deliverable.measurement_unit?.symbol}`}
                    </Typography>
                  </Tooltip>
                </Grid>
                {deliverable?.contract_rate && (
                  <Grid size={{xs: 6, md: 2.5}}>
                    <Tooltip title="Contract Rate">
                      <Typography textAlign="right">
                        {deliverable.contract_rate?.toLocaleString()}
                      </Typography>
                    </Tooltip>
                  </Grid>
                )}
                {deliverable?.contract_rate && (
                  <Grid size={{xs: 6, md: 2.5}}>
                    <Tooltip title="Amount">
                      <Typography textAlign="right">
                        {(
                          (deliverable.quantity || 0) * (deliverable?.contract_rate || 0)
                        ).toLocaleString('en-US', {
                          style: 'currency',
                          currency: currencyCode,
                        })}
                      </Typography>
                    </Tooltip>
                  </Grid>
                )}
                <Grid size={{xs: 6, md: 1}} textAlign="end">
                  <DeliverablesItemAction deliverable={deliverable} />
                </Grid>
              </Grid>
            </AccordionSummary>

            <AccordionDetails sx={{ backgroundColor: 'background.paper', marginBottom: 3 }}>
              <Tabs value={tabIndex} onChange={(event, newValue) => setTabIndex(newValue)}>
                <Tab label="Summary" />
                <Tab label="Tasks" />
              </Tabs>
              
              {isDetailsLoading ? (
                <Stack spacing={2} sx={{ width: '100%', mb: 2 }}>
                  <Skeleton variant="text" width={180} height={32} sx={{ borderRadius: 1, marginLeft: 'auto' }} />
                  <Skeleton variant="rectangular" width="100%" height={48} sx={{ borderRadius: 1 }} />
                  <Skeleton variant="rectangular" width="100%" height={32} sx={{ borderRadius: 1 }} />
                </Stack>
              ) : (
                <>
                  {tabIndex === 0 && (
                    <DeliverableSummary deliverableDetails={deliverableDetails}/>
                  )}
                  {tabIndex === 1 && (
                    <DeliverableTasks deliverableDetails={deliverableDetails} />
                  )}
                </>
              )}
            </AccordionDetails>
          </Accordion>
        );
      })}
      {hasMore && (
        <Box display="flex" justifyContent="center" py={1}>
          <Button size="small" variant="outlined" onClick={loadMore}>
            Load more deliverables
          </Button>
        </Box>
      )}
      </Box>
    </Grid>
  );
}

export default DeliverablesListItem;