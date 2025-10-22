import React, { lazy, useState, useMemo, useEffect } from 'react';
import { Alert, Grid, ListItemText, Stack, Typography, Divider, Tooltip, useMediaQuery, Chip, LinearProgress, Box } from '@mui/material';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import JumboSearch from '@jumbo/components/JumboSearch';
import WBSActionTail from './WBSActionTail';
import { useProjectProfile } from '../ProjectProfileProvider';
import WBSItemAction from './WBSItemAction';
import TasksActionTail from './task/TasksActionTail';
import TasksListItem from './task/TasksListItem';
import TasksTreeViewActionTail from './tasksTreeView/TasksTreeViewActionTail';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';

const GanttChartActionTail = lazy(() => import('./ganttChart/GanttChartActionTail'));

function LinearProgressWithLabel({ value, label, color }) {
  return (
    <Box sx={{ width: '100%' }}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <Typography variant="body2" color="text.secondary" sx={{ minWidth: 80 }}>
          {label}
        </Typography>
        <Box sx={{ flexGrow: 1 }}>
          <LinearProgress
            variant="determinate"
            value={Math.min(Number(value) || 0, 100)}
            color={color}
            sx={{ height: 8, borderRadius: 2 }}
          />
        </Box>
        <Typography variant="caption" color="text.secondary">
          {`${Math.min(Number(value) || 0, 100)}%`}
        </Typography>
      </Stack>
    </Box>
  );
}

const TimelineActivityAccordion = ({ activity, expanded, handleChange }) => {
  const [childExpanded, setChildExpanded] = useState({});
  const [openDialog, setOpenDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTasks = activity?.tasks?.filter((task) => {
    const description = task.description?.toLowerCase() || '';
    const name = task.name?.toLowerCase() || '';
    return (
      description.includes(searchQuery.toLowerCase()) ||
      name.includes(searchQuery.toLowerCase())
    );
  });

  const filterActivityChildren = (children) => {
    return children
      .filter(
        (child) =>
          child.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (child.description &&
            child.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
          child.tasks?.some((task) =>
            task.name.toLowerCase().includes(searchQuery.toLowerCase())
          )
      )
      .map((child) => ({
        ...child,
        tasks: child.tasks?.filter((task) =>
          task.name.toLowerCase().includes(searchQuery.toLowerCase())
        ),
        children: filterActivityChildren(child.children),
      }));
  };

  const filteredChildren = filterActivityChildren(activity?.children || []);

  const handleChildChange = (childIndex) => {
    setChildExpanded((prev) => ({
      ...prev,
      [childIndex]: !prev[childIndex],
    }));
  };

  // --- Color Logic ---
  const execPercent = activity.executed_percentage ?? 0;
  const timePercent = activity.percentage_time_elapsed ?? 0;

  let execColor = 'primary';
  if (execPercent >= 100) execColor = 'success';
  else if (execPercent >= 70) execColor = 'warning';
  else if (execPercent < 30) execColor = 'error';

  let timeColor = 'primary';
  if (timePercent >= 100) timeColor = 'error';     
  else if (timePercent >= 80) timeColor = 'warning'; 
  else if (timePercent < 30) timeColor = 'success';

  return (
    <Accordion
      expanded={expanded}
      onChange={handleChange}
      square
      sx={{
        borderRadius: 2,
        borderTop: 2,
        width: '100%',
        px: 1,
        borderColor: 'divider',
        '&:hover': { bgcolor: 'action.hover' },
        '& > .MuiAccordionDetails-root:hover': { bgcolor: 'transparent' },
      }}
    >
      <AccordionSummary
        expandIcon={expanded ? <RemoveIcon /> : <AddIcon />}
        sx={{
          px: 3,
          flexDirection: 'row-reverse',
          '.MuiAccordionSummary-content': {
            alignItems: 'center',
            '&.Mui-expanded': { margin: '12px 0' },
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
            '& svg': { fontSize: '1.25rem' },
          },
        }}
      >
        <Grid
          container
          width={'100%'}
          spacing={1}
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: 1, px: 2 }}
        >
          <Grid size={{xs: 8, md: 5}}>
            <ListItemText
              primary={
                <>
                  <Tooltip title="Activity Name">
                    <Typography component="span" fontWeight={500}>
                      {activity.name}
                    </Typography>
                  </Tooltip>
                  {activity.code && (
                    <Tooltip title="Activity Code">
                      <Typography
                        component="h4"
                        variant="body2"
                        color="text.secondary"
                      >
                        {activity.code}
                      </Typography>
                    </Tooltip>
                  )}
                </>
              }
              secondary={
                <Tooltip title="Description">
                  <Typography component="span">
                    {activity.description}
                  </Typography>
                </Tooltip>
              }
            />
          </Grid>

          <Grid size={{xs: 12, md: 2.5}}>
            <Tooltip title="Start to End Date">
              <Typography variant="body2">
                {activity.start_date || activity.end_date
                  ? `${activity.start_date ? readableDate(activity.start_date, false) : 'Not Set'} ${
                      activity.end_date
                        ? '→ ' + readableDate(activity.end_date, false)
                        : ''
                    }`
                  : 'Not Set'}
              </Typography>
            </Tooltip>
          </Grid>

          <Grid size={{xs: 12, md: 2.5}}>
            <Tooltip title="Duration (in days) and Days Remaining">
              <ListItemText
                primary={
                  <Typography variant="body2" color="text.secondary">
                    <strong>Duration:</strong>{' '}
                    {activity.number_of_days
                      ? `${activity.number_of_days} days`
                      : '-'}
                  </Typography>
                }
                secondary={
                  <Typography
                    variant="caption"
                    color={
                      activity.days_remaining < 0
                        ? 'error.main'
                        : 'text.secondary'
                    }
                  >
                    <strong>Remaining:</strong>{' '}
                    {activity.days_remaining ?? '—'}
                  </Typography>
                }
              />
            </Tooltip>
          </Grid>

          <Grid size={{xs: 12, md: 8}}>
            <Stack spacing={2.5} direction="column">
              <LinearProgressWithLabel
                value={execPercent}
                label="Execution"
                color={execColor}
              />
              <LinearProgressWithLabel
                value={timePercent}
                label="Time"
                color={timeColor}
              />
            </Stack>
          </Grid>

          <Grid size={{xs: 12, md: 4}} textAlign="end">
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              justifyContent="flex-end"
            >
              <Tooltip title="Weighted Percentage">
                <Chip
                  size="small"
                  label={`${activity.weighted_percentage?.toLocaleString() ?? 0}% Weight`}
                  color="default"
                />
              </Tooltip>
              <WBSItemAction activity={activity} />
            </Stack>
          </Grid>
        </Grid>
        <Divider />
      </AccordionSummary>

      <AccordionDetails
        sx={{
          backgroundColor: 'background.paper',
          mb: 3,
          px: 0,
        }}
      >
        <Grid container>
          <Grid
            size={12}
            textAlign="end"
            display="flex"
            justifyContent="flex-end"
            alignItems="center"
          >
            {(activity.children?.length > 0 || activity.tasks.length > 0) && (
              <Grid item pb={1}>
                <Tooltip title="Search Tasks or Activities">
                  <div>
                    <JumboSearch
                      value={searchQuery}
                      onChange={(v) => setSearchQuery(v)}
                    />
                  </div>
                </Tooltip>
              </Grid>
            )}
            <Grid>
              {!activity.children.length > 0 && (
                <Tooltip title="Add Task">
                  <div>
                    <TasksActionTail
                      openDialog={openDialog}
                      setOpenDialog={setOpenDialog}
                      activity={activity}
                    />
                  </div>
                </Tooltip>
              )}
            </Grid>
            <Grid>
              {!activity.tasks?.length > 0 && (
                <Tooltip title="Add Sub-Activity">
                  <div>
                    <WBSItemAction activity={activity} isAccDetails />
                  </div>
                </Tooltip>
              )}
            </Grid>
          </Grid>

          <TasksListItem filteredTasks={filteredTasks} activity={activity} />

          {filteredChildren.length > 0 && (
            <Grid size={12}>
              {filteredChildren.map((child, index) => (
                <TimelineActivityAccordion
                  key={index}
                  activity={child}
                  expanded={!!childExpanded[index]}
                  handleChange={() => handleChildChange(index)}
                  openDialog={openDialog}
                  setOpenDialog={setOpenDialog}
                />
              ))}
            </Grid>
          )}
        </Grid>
      </AccordionDetails>
    </Accordion>
  );
};

function WBSListItem() {
  const { projectTimelineActivities } = useProjectProfile();
  const [openDialog, setOpenDialog] = useState(false);
  const [expanded, setExpanded] = useState(
    Array(projectTimelineActivities?.length).fill(false)
  );
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTimelineActivity = projectTimelineActivities?.filter(
    (activity) =>
      activity.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (activity.description &&
        activity.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const sortedTimelineActivity = filteredTimelineActivity?.sort((a, b) => {
    if (a.position_index === null) return 1;
    if (b.position_index === null) return -1;
    return a.position_index - b.position_index;
  });

  const handleChange = (index) => {
    const newExpanded = [...expanded];
    newExpanded[index] = !newExpanded[index];
    setExpanded(newExpanded);
  };

  const { theme } = useJumboTheme();
  const isLargeScreen = useMediaQuery(theme.breakpoints.up('md'));

  return (
    <>
      <Grid container columnSpacing={1} justifyContent="flex-end" alignItems="center">
        {projectTimelineActivities?.length > 0 && (
          <Grid>
            <JumboSearch
              value={searchQuery}
              onChange={(value) => setSearchQuery(value)}
            />
          </Grid>
        )}
        {isLargeScreen && (
          <>
            <Grid>
              <GanttChartActionTail />
            </Grid>
            <Grid>
              <TasksTreeViewActionTail />
            </Grid>
          </>
        )}
        <Grid>
          <WBSActionTail
            openDialog={openDialog}
            setOpenDialog={setOpenDialog}
            activity={null}
          />
        </Grid>
      </Grid>

      <Stack direction="column">
        {sortedTimelineActivity?.length > 0 ? (
          sortedTimelineActivity.map((activity, index) => (
            <TimelineActivityAccordion
              key={index}
              activity={activity}
              expanded={expanded[index]}
              handleChange={() => handleChange(index)}
              openDialog={openDialog}
              setOpenDialog={setOpenDialog}
            />
          ))
        ) : (
          <Alert variant="outlined" severity="info">
            No Timeline Activity Found
          </Alert>
        )}
      </Stack>
    </>
  );
}

export default WBSListItem;