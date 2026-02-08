import React, { useState, useEffect } from 'react';
import { Alert, Grid, ListItemText, Stack, Typography, Divider, Tooltip } from '@mui/material';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import JumboSearch from '@jumbo/components/JumboSearch';
import DeliverablesListItem from './DeliverablesListItem';
import { useProjectProfile } from '../ProjectProfileProvider';
import DeliverableGroupItemAction from './DeliverableGroupItemAction';
import DeliverableGroupActionTail from './DeliverableGroupActionTail';

const DeliverableGroupsAccordion = ({ group, expanded, handleChange }) => {
  const [childExpanded, setChildExpanded] = useState({});
  const [openDialog, setOpenDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState(''); 

  const filteredDeliverables = group?.deliverables?.filter(deliverable =>
    deliverable.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filterChildrenGroups = (children) => {
    return children
      .filter(child => 
        child.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (child.description && child.description.toLowerCase().includes(searchQuery.toLowerCase())) || 
        child.deliverables?.some(d => d.description?.toLowerCase().includes(searchQuery.toLowerCase()))
      )
      .map(child => ({
        ...child,
        deliverables: child.deliverables?.filter(d => d.description?.toLowerCase().includes(searchQuery.toLowerCase())),
        children: filterChildrenGroups(child.children || [])
      }));
  };  

  const filteredChildren = filterChildrenGroups(group?.children || []);

  const handleChildChange = (childIndex) => {
    setChildExpanded((prevState) => ({
      ...prevState,
      [childIndex]: !prevState[childIndex], 
    }));
  };

  return (
    <Accordion
      expanded={expanded === true}
      onChange={handleChange}
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
        expandIcon={expanded ? <RemoveIcon /> : <AddIcon />}
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
        <Grid container paddingLeft={1} paddingRight={1} width={'100%'} columnSpacing={1} rowSpacing={1} alignItems={'center'}>
          <Grid size={{xs: 8, md: 5.5}}>
            <ListItemText
              primary={
                <Tooltip title={'Group Name'}>
                  <Typography component="span">{group.name}</Typography>
                </Tooltip>
              }
              secondary={
                <Tooltip title={'Code'}>
                  <Typography component="span">{group.code}</Typography>
                </Tooltip>
              }
            />
          </Grid>
          {group.description &&
            <Grid size={{xs: 8, md: 5.5}}>
              <ListItemText
                secondary={
                  <Tooltip title={'Description'}>
                    <Typography component="span">{group.description}</Typography>
                  </Tooltip>
                }
              />
            </Grid>
          }
          <Grid size={{xs: 4, md: group.description ? 1 : 6.5}} textAlign={'end'}>
            <DeliverableGroupItemAction group={group} />
          </Grid>
        </Grid>
        <Divider />
      </AccordionSummary>

      <AccordionDetails
        sx={{
          backgroundColor: 'background.paper',
          marginBottom: 3,
        }}
      >
        <Grid container>
          <Grid size={{xs: 12}} textAlign={'end'} display="flex" justifyContent="flex-end" alignItems="center">
            {(group.children?.length > 0 || group.deliverables?.length > 0) &&
              <Grid paddingBottom={1} >
                <JumboSearch
                  value={searchQuery}
                  onChange={(value) => setSearchQuery(value)}
                />
              </Grid>
            }
            <Grid>
              {!group.deliverables?.length && <DeliverableGroupActionTail openDialog={openDialog} setOpenDialog={setOpenDialog} group={group} />} {/*Action Tail for New Deliverable Group inside deliverable group*/}
            </Grid>
            <Grid>
              {!group.children?.length && <DeliverableGroupItemAction group={group} isAccDetails={true} />}
            </Grid>
          </Grid>

          <DeliverablesListItem filteredDeliverables={filteredDeliverables} />

          {filteredChildren?.length > 0 && (
            <Grid size={{xs: 12}}>
              {filteredChildren?.map((child, index) => (
                <DeliverableGroupsAccordion
                  key={index}
                  group={child}
                  expanded={childExpanded[index] === true}
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

function DeliverableGroupsListItem() {
  const { deliverable_groups } = useProjectProfile();
  const [openDialog, setOpenDialog] = useState(false);
  const [expanded, setExpanded] = useState([]);
  const [searchQuery, setSearchQuery] = useState(''); 

  // Initialize expanded state with proper boolean values when data loads
  useEffect(() => {
    if (deliverable_groups) {
      // Initialize with all accordions closed (false)
      setExpanded(Array(deliverable_groups.length).fill(false));
    }
  }, [deliverable_groups]);

  const filteredGroups = deliverable_groups?.filter(group =>
    group.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (group.description && group.description.toLowerCase().includes(searchQuery.toLowerCase())) 
  );

  const sortedDeliverableGroups = filteredGroups?.sort((a, b) => {
    if (a.position_index === null) return 1;
    if (b.position_index === null) return -1;
    return a.position_index - b.position_index;
  });

  const handleChange = (index) => {
    const newExpanded = [...expanded];
    newExpanded[index] = !newExpanded[index];
    setExpanded(newExpanded);
  };

  return (
    <React.Fragment>
      <Grid container columnSpacing={1} justifyContent="flex-end" alignItems="center">
        {deliverable_groups?.length > 0 &&
          <Grid>
            <JumboSearch
              value={searchQuery}
              onChange={(value) => setSearchQuery(value)}
            />
          </Grid>
        }
        <Grid>
          <DeliverableGroupActionTail openDialog={openDialog} setOpenDialog={setOpenDialog} group={null} />
        </Grid>
      </Grid>
      <Stack direction={'column'}>
        {sortedDeliverableGroups && sortedDeliverableGroups.length > 0 ? (
          sortedDeliverableGroups.map((group, index) => (
            <DeliverableGroupsAccordion
              key={index}
              group={group}
              expanded={expanded[index] === true}
              handleChange={() => handleChange(index)}
              openDialog={openDialog}
              setOpenDialog={setOpenDialog}
            />
          ))
        ) : (
          <Alert variant="outlined" severity="info">
            No Deliverable Group Found
          </Alert>
        )}
      </Stack>
    </React.Fragment>
  );
}

export default DeliverableGroupsListItem;