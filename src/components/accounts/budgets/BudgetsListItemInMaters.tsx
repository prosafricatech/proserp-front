import { useState } from 'react'
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { Accordion, AccordionDetails, AccordionSummary, Grid, Tooltip, Typography } from '@mui/material'
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import BudgetsItemAction from '@/components/projectManagement/projects/profile/budgets/BudgetsItemAction';
import BudgetsAccordionDetails from '@/components/projectManagement/projects/profile/budgets/BudgetsAccordionDetails';

type BudgetId = number | string;

interface BudgetItem {
    id: BudgetId;
    name: string;
    start_date: string;
    end_date: string;
}

interface BudgetsListItemInMatersProps {
    budgetItem: BudgetItem;
}

function BudgetsListItemInMaters({ budgetItem }: BudgetsListItemInMatersProps) {
    const [expanded, setExpanded] = useState<Record<BudgetId, boolean>>({});

    const handleChange = (id: BudgetId) => {
        setExpanded((prevExpanded) => ({
            ...prevExpanded,
            [id]: !prevExpanded[id],
        }));
    };
  return (
    <Accordion
        key={budgetItem.id}
        expanded={!!expanded[budgetItem.id]}
        onChange={() => handleChange(budgetItem.id)}
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
            expandIcon={expanded[budgetItem.id] ? <RemoveIcon /> : <AddIcon />}
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
                    fontSize: '1.25rem'
                },
            },
            }}
        >
            <Grid container width={'100%'} columnSpacing={2} alignItems="center">
                <Grid size={{ xs: 12, md: 5 }}>
                    <Tooltip title="Name">
                        <Typography variant="h5" fontSize={14} lineHeight={1.25} mb={0} noWrap>
                            {budgetItem.name}
                        </Typography>
                    </Tooltip>
                </Grid>
                <Grid size={{ xs: 6, md: 3.5 }}>
                    <Tooltip title="Start Date">
                    <Typography variant="h5" fontSize={14} lineHeight={1.25} mb={0} noWrap>
                        {readableDate(budgetItem.start_date, false)}
                    </Typography>
                    </Tooltip>
                </Grid>
                <Grid size={{ xs: 6, md: 3.5 }}>
                    <Tooltip title="End Date">
                    <Typography variant="h5" fontSize={14} lineHeight={1.25} mb={0} noWrap>
                        {readableDate(budgetItem.end_date, false)}
                    </Typography>
                    </Tooltip>
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
                <Grid size={{ xs: 12 }} textAlign="end">
                    <BudgetsItemAction budget={budgetItem} />
                </Grid>
                <BudgetsAccordionDetails budget={budgetItem} expanded={expanded[budgetItem.id]}/>
            </Grid>
        </AccordionDetails>
    </Accordion>
  )
}

export default BudgetsListItemInMaters
