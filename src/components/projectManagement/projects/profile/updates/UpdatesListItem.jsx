import React, { useState } from 'react';
import { Grid, Stack, Tooltip, Typography } from '@mui/material';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import ProductsSelectProvider from '@/components/productAndServices/products/ProductsSelectProvider';
import UpdateItemAction from './UpdateItemAction';

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

function UpdatesListItem({update}) {
  const [openDialog, setOpenDialog] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleChange = () => {
    setExpanded(!expanded);
  };

  return (
    <ProductsSelectProvider>
      <Stack direction={'column'}>
        <UpdatesAccordion
          key={update?.id}
          update={update}
          expanded={expanded}
          handleChange={handleChange}
          openDialog={openDialog}
          setOpenDialog={setOpenDialog}
        />
      </Stack>
    </ProductsSelectProvider>
  );
}

export default UpdatesListItem;
