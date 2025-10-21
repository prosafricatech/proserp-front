import React, { useState } from 'react';
import { Alert, Grid, Stack, Tooltip, Typography } from '@mui/material';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { useProjectProfile } from '../ProjectProfileProvider';
import UpdatesActionTail from './UpdatesActionTail';
import UpdateItemAction from './UpdateItemAction';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import ProductsSelectProvider from '@/components/productAndServices/products/ProductsSelectProvider';

const UpdatesAccordion = ({ expanded, handleChange, update }) => {

  return (
    <Accordion
      expanded={expanded}
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
        <Grid container paddingLeft={1} width={'100%'} columnSpacing={1} rowSpacing={1} alignItems={'center'}>
          <Grid size={11}>
            <Tooltip title='Start Date'>
              <Typography variant="h5" fontSize={14} lineHeight={1.25} mb={0} noWrap>
                {readableDate(update.update_date, false)}
              </Typography>
            </Tooltip>
          </Grid>
          <Grid size={1} textAlign={'end'}>
            <UpdateItemAction update={update}/>
          </Grid>
        </Grid>
      </AccordionSummary>

      <AccordionDetails
        sx={{
          backgroundColor: 'background.paper',
          marginBottom: 3,
        }}
      >

      </AccordionDetails>
    </Accordion>
  );
};

function Updates() {
  const { projectUpdates } = useProjectProfile();
  const [openDialog, setOpenDialog] = useState(false);
  const [expanded, setExpanded] = useState(Array(projectUpdates?.length).fill(false));

  const handleChange = (index) => {
    const newExpanded = [...expanded];
    newExpanded[index] = !newExpanded[index];
    setExpanded(newExpanded);
  };

  return (
    <ProductsSelectProvider>
      <Grid container columnSpacing={1} width={'100%'} justifyContent="flex-end" alignItems="center">
        <Grid>
          <UpdatesActionTail openDialog={openDialog} setOpenDialog={setOpenDialog}/>
        </Grid>
      </Grid>
      <Stack direction={'column'}>
        {projectUpdates?.length > 0 ? (
          projectUpdates.map((update, index) => (
            <UpdatesAccordion
              key={index}
              update={update}
              expanded={expanded[index]}
              handleChange={() => handleChange(index)}
              openDialog={openDialog}
              setOpenDialog={setOpenDialog}
            />
          ))
        ) : (
          <Alert variant="outlined" severity="info">
            No Updates Found
          </Alert>
        )}
      </Stack>
    </ProductsSelectProvider>
  );
}

export default Updates;
