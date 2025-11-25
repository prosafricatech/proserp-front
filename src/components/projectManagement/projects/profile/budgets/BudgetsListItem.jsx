import React, { useState } from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Tooltip,
  Typography,
  Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import BudgetsItemAction from './BudgetsItemAction';
import { useProjectProfile } from '../ProjectProfileProvider';
import BudgetsActionTail from './BudgetsActionTail';
import JumboSearch from '@jumbo/components/JumboSearch';
import BudgetsAccordionDetails from './BudgetsAccordionDetails';
import LedgerSelectProvider from '@/components/accounts/ledgers/forms/LedgerSelectProvider';
import ProductsSelectProvider from '@/components/productAndServices/products/ProductsSelectProvider';
import ProductsProvider from '@/components/productAndServices/products/ProductsProvider';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';

function BudgetsListItem() {
  const { projectBudgets } = useProjectProfile();
  const [expanded, setExpanded] = useState({});
  const [searchQuery, setSearchQuery] = useState('');

  const filteredBudgets = projectBudgets?.filter(budget =>
    budget.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleChange = (index) => {
    setExpanded((prevExpanded) => ({
      ...prevExpanded,
      [index]: !prevExpanded[index],
    }));
  };

  return (
    <LedgerSelectProvider>
      <ProductsSelectProvider>
        <ProductsProvider>
          <Grid container columnSpacing={1} width={'100%'} justifyContent="flex-end" alignItems="center">
            <Grid>
              <JumboSearch
                value={searchQuery}
                onChange={(value) => setSearchQuery(value)}
              />
            </Grid>
            <Grid>
              <BudgetsActionTail />
            </Grid>
          </Grid>

          {filteredBudgets?.length > 0 ? (
            filteredBudgets.map((budget, index) => (
              <Accordion
                key={index}
                expanded={!!expanded[index]}
                onChange={() => handleChange(index)}
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
                  expandIcon={expanded[index] ? <RemoveIcon /> : <AddIcon />}
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
                  <Grid container width={'100%'} columnSpacing={2} alignItems="center">
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Tooltip title="Name">
                        <Typography variant="h5" fontSize={14} lineHeight={1.25} mb={0} noWrap>
                          {budget.name}
                        </Typography>
                      </Tooltip>
                    </Grid>
                    <Grid size={{ xs: 6, md: 3.5 }}>
                      <Tooltip title="Start Date">
                        <Typography variant="h5" fontSize={14} lineHeight={1.25} mb={0} noWrap>
                          {readableDate(budget.start_date, false)}
                        </Typography>
                      </Tooltip>
                    </Grid>
                    <Grid size={{ xs: 6, md: 3.5 }}>
                      <Tooltip title="End Date">
                        <Typography variant="h5" fontSize={14} lineHeight={1.25} mb={0} noWrap>
                          {readableDate(budget.end_date, false)}
                        </Typography>
                      </Tooltip>
                    </Grid>
                    <Grid size={{ xs: 12, md: 1 }} textAlign="end">
                      <BudgetsItemAction budget={budget} />
                    </Grid>
                  </Grid>
                </AccordionSummary>

                <AccordionDetails
                  sx={{
                    backgroundColor: 'background.paper',
                    marginBottom: 3,
                    padding: 0.5,
                  }}
                >
                  <Grid container>
                    <BudgetsAccordionDetails budget={budget} expanded={expanded[index]} />
                  </Grid>
                </AccordionDetails>
              </Accordion>
            ))
          ) : (
            <Alert variant='outlined' severity='info'>No budgets found.</Alert>
          )}
        </ProductsProvider>
      </ProductsSelectProvider>
    </LedgerSelectProvider>
  );
}

export default BudgetsListItem;
