'use client';

import React from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Chip,
  Grid,
  LinearProgress,
  Tab,
  Tabs,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { useQuery } from '@tanstack/react-query';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import imprestRetirementServices from '@/components/processApproval/imprestRetirements/imprestRetirementServices';
import AttachmentForm from '@/components/filesShelf/attachments/AttachmentForm';
import ImprestRetirementItemAction from './ImprestRetirementItemAction';
import RetirementApprovalsTab from './tabs/RetirementApprovalsTab';

const extractList = (payload: any): any[] => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  return [];
};

type ImprestRetirementListItemProps = {
  requisitionApprovalId: number;
  approvedRequisition: any;
};

function ImprestRetirementListItem({ requisitionApprovalId, approvedRequisition }: ImprestRetirementListItemProps) {
  const [expanded, setExpanded] = React.useState<Record<number, boolean>>({});
  const [activeTabs, setActiveTabs] = React.useState<Record<number, number>>({});

  const { data: retirementsResponse, isFetching } = useQuery({
    queryKey: ['imprestRetirements', { requisition_approval_id: requisitionApprovalId }],
    queryFn: () =>
      imprestRetirementServices.list({
        requisition_approval_id: requisitionApprovalId,
        limit: 20,
      }),
    enabled: !!requisitionApprovalId,
  });

  const retirements = extractList(retirementsResponse);

  const handleAccordionToggle = (retirementId: number) => {
    setExpanded((prev) => ({
      ...prev,
      [retirementId]: !prev[retirementId],
    }));
  };

  const handleTabChange = (retirementId: number, value: number) => {
    setActiveTabs((prev) => ({
      ...prev,
      [retirementId]: value,
    }));
  };

  if (isFetching) {
    return <LinearProgress />;
  }

  if (retirements.length === 0) {
    return (
      <Alert variant="outlined" severity="info">
        No retirement records found.
      </Alert>
    );
  }

  return (
    <Grid container spacing={1}>
      {retirements.map((retirement: any) => {
        const items = retirement?.items || [];
        const totalAmount = Number.isFinite(Number(retirement?.amount))
          ? Number(retirement.amount)
          : items.reduce(
              (sum: number, item: any) =>
                sum + (Number.isFinite(Number(item?.amount)) ? Number(item.amount) : 0),
              0
            );
        const currencyCode= retirement?.requisition?.currency?.code;
        const formattedAmount = currencyCode
          ? totalAmount.toLocaleString('en-US', {
              style: 'currency',
              currency: currencyCode,
            })
          : totalAmount.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            });
        const isRejected = String(
          retirement?.status_label || retirement?.status || ''
        )
          .toLowerCase()
          .includes('reject');
        const activeTab = activeTabs[retirement.id] || 0;

        return (
          <Accordion
            key={retirement.id}
            expanded={!!expanded[retirement.id]}
            onChange={() => handleAccordionToggle(retirement.id)}
            square
            sx={{
              width: '100%',
              borderRadius: 2,
              borderTop: 2,
              borderColor: 'divider',
              '&:hover': {
                bgcolor: 'action.hover',
              },
            }}
          >
            <AccordionSummary
              expandIcon={expanded[retirement.id] ? <RemoveIcon /> : <AddIcon />}
              sx={{
                px: 2,
                flexDirection: 'row-reverse',
                '.MuiAccordionSummary-content': {
                  alignItems: 'center',
                  '&.Mui-expanded': {
                    margin: '10px 0',
                  },
                },
                '.MuiAccordionSummary-expandIconWrapper': {
                  borderRadius: 1,
                  border: 1,
                  color: 'text.secondary',
                  transform: 'none',
                  mr: 0.5,
                  '&.Mui-expanded': {
                    transform: 'none',
                    color: 'primary.main',
                    borderColor: 'primary.main',
                  },
                  '& svg': {
                    fontSize: '0.9rem',
                  },
                },
              }}
            >
              <Grid container spacing={1} alignItems="center" width="100%" px={1}>
                <Grid size={{ xs: 12, md: 3 }}>
                  <Tooltip title="Retirement Number">
                    <Typography lineHeight={1.25} noWrap fontWeight={600}>
                      {retirement?.retirementNo}
                    </Typography>
                  </Tooltip>
                  <Tooltip title="Reference Requisition">
                    <Typography variant="caption" lineHeight={1.2} noWrap>
                      {retirement?.requisition?.requisitionNo}
                    </Typography>
                  </Tooltip>
                </Grid>

                <Grid size={{ xs: 6, md: 2 }}>
                  <Tooltip title="Retirement Date">
                    <Typography lineHeight={1.25} noWrap>
                      {readableDate(retirement?.retirement_date)}
                    </Typography>
                  </Tooltip>
                </Grid>

                <Grid size={{ xs: 6, md: 2 }}>
                  <Tooltip title="Remarks">
                    <Typography lineHeight={1.25} noWrap>
                      {retirement?.remarks}
                    </Typography>
                  </Tooltip>
                </Grid>

                <Grid size={{ xs: 6, md: 2 }}>
                  <Tooltip title="Status">
                    <Chip
                      size="small"
                      label={retirement?.status_label}
                      color={isRejected ? 'error' : 'default'}
                      variant={isRejected ? 'filled' : 'outlined'}
                    />
                  </Tooltip>
                </Grid>

                <Grid size={{ xs: 6, md: 3 }} textAlign={{ md: 'right' }}>
                  <Tooltip title="Amount">
                    <Typography>{formattedAmount}</Typography>
                  </Tooltip>
                </Grid>
              </Grid>
            </AccordionSummary>

            <AccordionDetails sx={{ backgroundColor: 'background.paper', mb: 2 }}>
              <Grid container spacing={1}>
                <Grid size={{ xs: 12 }} textAlign={{ md: 'right' }}>
                  <ImprestRetirementItemAction
                    retirement={retirement}
                    approvedRequisition={approvedRequisition}
                    isExpanded={!!expanded[retirement.id]}
                  />
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Tabs
                    value={activeTab}
                    onChange={(_event, value) => handleTabChange(retirement.id, value)}
                    variant="scrollable"
                    scrollButtons="auto"
                    allowScrollButtonsMobile
                    sx={{ display: 'flex', justifyContent: 'center' }}
                  >
                    <Tab label="Approvals" />
                    <Tab label="Attachments" />
                  </Tabs>
                </Grid>

                {activeTab === 0 && (
                  <Grid size={{ xs: 12 }}>
                    <RetirementApprovalsTab
                      retirement={retirement}
                      isActive={activeTab === 0 && !!expanded[retirement.id]}
                      approvedRequisition={approvedRequisition}
                    />
                  </Grid>
                )}

                {activeTab === 1 && (
                  <Grid size={{ xs: 12 }}>
                    <AttachmentForm
                      hideFeatures
                      attachment_name="imprest retirement"
                      attachmentable_type="imprest_retirement"
                      attachmentable_id={retirement.id}
                      attachment_sourceNo={retirement?.retirementNo || ''}
                    />
                  </Grid>
                )}
              </Grid>
            </AccordionDetails>
          </Accordion>
        );
      })}
    </Grid>
  );
}

export default React.memo(ImprestRetirementListItem);
