'use client';

import { Accordion, AccordionDetails, AccordionSummary, Chip, Divider, Grid, ListItemText, Tooltip, Typography } from '@mui/material'
import React, {useState} from 'react'
import RemoveIcon from '@mui/icons-material/Remove';
import AddIcon from '@mui/icons-material/Add'
import CurrencyItemAction from './CurrencyItemAction';
import CurrenciesExchangeRate from './exchangeRates/CurrenciesExchangeRate';
import { Currency } from './CurrencyType';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

function CurrencyListItem({currency}: {currency: Currency}) {
  const [expanded, setExpanded] = useState(false);
  const dictionary = useDictionary();

  return (
    <Accordion
      expanded={expanded}
      square
      sx={{ 
        borderRadius: 2, 
        borderTop: 2,
        borderColor: 'divider',
        '&:hover': {
          bgcolor: 'action.hover',
        },
      }}
      onChange={()=> setExpanded((prevExpanded) => !prevExpanded)}
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
            }},
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
        <Grid mt={1} mb={1}
          sx={{
            cursor: 'pointer',
            width: '100%',
            '&:hover': {
              bgcolor: 'action.hover',
            }
          }}  
          paddingLeft={2}
          paddingRight={2}
          columnSpacing={1}
          alignItems={'center'}
          container
        >
          <Grid size={{xs: 12, md: 3}}>
            <Tooltip title={dictionary.currencies.list.labels.currencyName}>
              <Typography variant="h5" fontSize={14} lineHeight={1.25} mb={0} noWrap>
                {currency.name_plural}
              </Typography>
            </Tooltip>
          </Grid>
          <Grid size={{xs: 6, md: 3}}>
          <Tooltip title={dictionary.currencies.list.labels.currencyCode}>
              <Typography>{currency.code}</Typography>
            </Tooltip>
          </Grid>
          <Grid size={{xs: 6, md: 3}}>
            <Tooltip title={dictionary.currencies.list.labels.symbol}>
              <Typography textAlign={{xs : 'end', md: 'start'}}>{currency.symbol}</Typography>
            </Tooltip>
          </Grid>
          <Grid size={{xs: 6, md: 2.5}}>
            <Tooltip title={dictionary.currencies.list.labels.symbolNative}>
              <Typography>{currency.symbol_native}</Typography>
            </Tooltip>
          </Grid>
          <Grid size={{xs: 6, md: 0.5}} textAlign={'end'}>
           {currency.id > 1 && <CurrencyItemAction currency={currency}/>}
          </Grid>
        </Grid>
        <Divider/>
      </AccordionSummary>
      <AccordionDetails
        sx={{ 
          backgroundColor:'background.paper',
          marginBottom: 3
        }}
      >
        <Grid container>
          <CurrenciesExchangeRate expanded={expanded} currency={currency}/>
        </Grid>
      </AccordionDetails>
    </Accordion>

)
}

export default CurrencyListItem