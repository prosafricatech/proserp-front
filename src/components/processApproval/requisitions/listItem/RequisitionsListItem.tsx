import React, { useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Badge,
  Chip,
  Grid,
  Paper,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tooltip,
  Typography,
} from '@mui/material';
import RemoveIcon from '@mui/icons-material/Remove';
import AddIcon from '@mui/icons-material/Add';
import RequisitionsItemAction from './RequisitionsItemAction';
import AttachmentForm from '../../../filesShelf/attachments/AttachmentForm';
import ApprovalsTab from './tabs/ApprovalsTab';
import { Attachment, VerifiedRounded } from '@mui/icons-material';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { Requisition } from '../../RequisitionType';
import { getLeaveItems, processTypeConfig, requisitionAmountDisplay } from '../../utils/requisition';

interface RequisitionsListItemProps {
  requisition: Requisition;
}

const RequisitionsListItem = ({ requisition }: RequisitionsListItemProps) => {
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [activeTab, setActiveTab] = useState(0);

  const handleChange = (id: number) => {
    setExpanded((prevExpanded) => ({
      ...prevExpanded,
      [id]: !prevExpanded[id],
    }));
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const processConfig = processTypeConfig[requisition.process_type as keyof typeof processTypeConfig] || {
    label: requisition.process_type,
    color: 'default' as const,
  };

  const isLeaveRequest = requisition.process_type === 'LEAVE_REQUEST';
  const leaveItems = isLeaveRequest ? getLeaveItems(requisition as any) : [];
  
  return (
    <Accordion
      key={requisition.id}
      expanded={!!expanded[requisition.id]}
      onChange={() => handleChange(requisition.id)}
      square
      sx={{ 
        borderRadius: 2, 
        borderTop: 2,
        borderColor: 'divider',
        '&:hover': {
          bgcolor: 'action.hover',
        },
      }}
    >
      <AccordionSummary
        expandIcon={expanded[requisition.id] ? <RemoveIcon /> : <AddIcon />}
        sx={{
          px: 2,
          flexDirection: 'row-reverse',
          '.MuiAccordionSummary-content': {
            alignItems: 'center',
            '&.Mui-expanded': {
              margin: '10px 0',
            }},
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
        <Grid 
          container
          spacing={1}
          alignItems={'center'}
          width={'100%'}
          paddingLeft={1}
          paddingRight={1}
        >
          <Grid size={{xs: 12, md: 2}}>
            <Tooltip title='Requistion No.'>
              <Typography>{requisition.requisitionNo}</Typography>
            </Tooltip>
            <Tooltip title='Requistion Date'>
              <Typography variant='caption'>{readableDate(requisition.requisition_date)}</Typography>
            </Tooltip>
          </Grid>
          <Grid size={{xs: 12, md: 3}}>
            <Tooltip title='Process'>
              <Chip size='small' color={processConfig.color} label={processConfig.label} />
            </Tooltip>
            <Tooltip title={'Cost Center'}>
              <Typography
                variant='caption'
                color='text.secondary'
                sx={{ display: 'block', mt: 0.5 }}
              >
                {requisition.cost_center?.name || '-'}
              </Typography>
            </Tooltip>
          </Grid>
          <Grid size={{xs: 12, md: 4, lg: 4}}>
            <Tooltip title={'Remarks'}>
              <Typography
                component="span"
                variant="body2"
                fontSize={14}
                mb={0}
                sx={{ flexWrap: 'wrap' }}
              >
                {requisition.remarks}
              </Typography>
            </Tooltip>
          </Grid>
          <Grid size={{xs: 8, md: 2.5, lg: 2}}>
            <Tooltip title='Amount'>
              <Typography>
                {requisitionAmountDisplay(requisition, requisition.currency?.code)}
              </Typography>
            </Tooltip>
            <Tooltip title='Status'>
              <Chip
                size='small' 
                label={requisition.status_label}
                color={
                  requisition.status === 'suspended'
                    ? 'primary'
                    : requisition.status?.toLowerCase() === 'rejected'
                    ? 'error'
                    : requisition.status?.toLowerCase() === 'on hold'
                    ? 'warning'
                    : (requisition.status?.toLowerCase() === 'submitted' && requisition.status_label?.toLowerCase() === 'completed')
                    ? 'success'
                    : 'info'
                }                
              /> 
            </Tooltip>
          </Grid>
          <Grid size={{xs: 4, md: 1}}>
            <Stack
              direction="row"
              mt={2}
              spacing={2}
              justifyContent="flex-end"
              alignItems="center"
            >
              {!!requisition?.attachments_count && (
                <Tooltip title="Attachments Count">
                  <Badge badgeContent={requisition.attachments_count} color="info">
                    <Attachment fontSize="small" />
                  </Badge>
                </Tooltip>
              )}
              {isLeaveRequest && leaveItems.length > 0 && (
                <Tooltip title="Leave Items Count">
                  <Badge badgeContent={leaveItems.length} color="secondary">
                    <Chip size="small" label="LR" color="info" />
                  </Badge>
                </Tooltip>
              )}
              {!isLeaveRequest && (requisition.process_type === 'PAYMENT'
                ? requisition.is_fully_paid
                : requisition.is_fully_ordered) && (
                <Tooltip
                  title={requisition.process_type === 'PAYMENT' ? 'Fully Paid' : 'Fully Ordered'}
                >
                  <VerifiedRounded fontSize="small" color="success" />
                </Tooltip>
              )}
            </Stack>
          </Grid>
        </Grid>
      </AccordionSummary>
      <AccordionDetails
        sx={{ 
          backgroundColor:'background.paper',
          marginBottom: 3
        }}
      >
        <Grid container spacing={1}>
          <Grid size={{xs: 12}} textAlign={'end'}>
            <RequisitionsItemAction requisition={requisition} />
          </Grid>
          {isLeaveRequest && (
            <Grid size={{ xs: 12 }}>
              {leaveItems.length ? (
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>S/N</TableCell>
                        <TableCell>Employee</TableCell>
                        <TableCell>Leave Type</TableCell>
                        <TableCell>Start Date</TableCell>
                        <TableCell>End Date</TableCell>
                        <TableCell align="right">Days</TableCell>
                        <TableCell>Reason</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {leaveItems.map((item, index) => (
                        <TableRow key={item.id || `${index}-${item.start_date}`}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>
                            {[item.employee?.first_name, item.employee?.last_name].filter(Boolean).join(' ').trim() || '-'}
                            {item.employee?.employee_number ? ` (${item.employee.employee_number})` : ''}
                          </TableCell>
                          <TableCell>{item.leave_type?.name || '-'}</TableCell>
                          <TableCell>{readableDate(item.start_date, false)}</TableCell>
                          <TableCell>{readableDate(item.end_date, false)}</TableCell>
                          <TableCell align="right">{Number(item.days_requested || 0).toLocaleString()}</TableCell>
                          <TableCell>{item.reason || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Alert severity="info" variant="outlined">No leave items found for this requisition.</Alert>
              )}
            </Grid>
          )}
          <Grid size={{xs: 12}}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
              allowScrollButtonsMobile
              sx={{ display: 'flex', justifyContent: 'center' }}
            >
              <Tab label="Approvals" />
              <Tab label="Attachments" />
            </Tabs>
          </Grid>
        </Grid>

        <Grid container>
          {activeTab === 0 && (
            <Grid container spacing={1} justifyContent="center" width={'100%'} marginTop={1}>
              <Grid size={{xs: 12}}>
                <ApprovalsTab isExpanded={expanded[requisition.id]} requisition={requisition}/>
              </Grid>
            </Grid>
          )}
          {activeTab === 1 && (
            <Grid container spacing={1} justifyContent="center" marginTop={1} width={'100%'}>
              <Grid size={{xs: 12}}>
                <AttachmentForm
                  hideFeatures={true}
                  attachment_name={'Requisition'}
                  attachmentable_type={'requisition'}
                  attachmentable_id={requisition.id}
                />
              </Grid>
            </Grid>
          )}
        </Grid>
      </AccordionDetails>
    </Accordion>
  );
};

export default RequisitionsListItem;