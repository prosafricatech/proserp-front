'use client';

import React, { useState } from 'react';
import {
  Alert,
  Box,
  Chip,
  Dialog,
  Grid,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { 
  AddOutlined, 
  Edit as EditIcon, 
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import dayjs from 'dayjs';
import RFQResponsesForm from './form/RFQResponsesForm';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';

interface RFQResponse {
  id: number;
  rfq_id: number;
  supplier_id: number;
  stakeholder?: {
    id: number;
    name: string;
    email?: string;
    phone?: string;
  };
  response_date: string;
  validity_date?: string;
  status: string;
  currency?: {
    id: number;
    name: string;
    code: string;
    symbol: string;
    exchangeRate?: number;
  };
  exchange_rate?: number;
  total_amount?: number;
  remarks?: string;
  creator?: {
    id: number;
    name: string;
    email?: string;
  };
  items?: RFQResponseItem[];
}

interface RFQResponseItem {
  id?: number;
  rfq_item_id: number;
  rfq_item?: {
    id: number;
    description?: string;
    quantity?: number;
    item?: {
      id: number;
      name: string;
    };
    measurement_unit?: {
      id: number;
      name: string;
      symbol: string;
    };
  };
  quantity: number;
  rate: number;
  remarks?: string;
  lead_time_days?: number;
  total?: number;
}

interface RFQListResponseTabProps {
  details: any;
  rfqId: number;
}

const RFQListResponseTab: React.FC<RFQListResponseTabProps> = ({
  details,
  rfqId,
}) => {
  const [openResponseForm, setOpenResponseForm] = useState(false);
  const [responses] = useState<RFQResponse[]>(
    details?.responses || []
  );
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const handleAddResponse = () => {
    setOpenResponseForm(true);
  };

  const handleResponseFormClose = (open: boolean) => {
    setOpenResponseForm(open);
  };

  return (
    <>
      <Box sx={{ width: '100%', px: 0 }}>
        <Grid container spacing={2} sx={{ width: '100%', margin: 0 }}>
          <Grid size={12} display="flex" justifyContent="space-between" alignItems="center" sx={{ px: 0 }}>
            <Typography variant="subtitle2">
            </Typography>
            <Tooltip title="Add Response">
              <IconButton size="small" onClick={handleAddResponse}>
                <AddOutlined fontSize="small" />
              </IconButton>
            </Tooltip>
          </Grid>

          {responses.length > 0 ? (
            <Grid size={12} sx={{ px: 0 }}>
              <TableContainer component={Paper} variant="outlined" sx={{ width: '100%' }}>
                <Table size="small" sx={{ width: '100%' }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ width: '5%' }}>S/N</TableCell>
                      <TableCell sx={{ width: '20%' }}>Supplier</TableCell>
                      <TableCell sx={{ width: '15%' }}>Response Date</TableCell>
                      <TableCell sx={{ width: '15%' }}>Validity Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {responses.map((response: RFQResponse, index: number) => (
                      <TableRow key={response.id || index}>
                        <TableCell>{index + 1}.</TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {response.stakeholder?.name || ''}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {response.response_date 
                            ? readableDate(response.response_date, false)
                            : ''}
                        </TableCell>
                        <TableCell>
                          {response.validity_date 
                            ? readableDate(response.validity_date, false)
                            : ''}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          ) : (
            <Grid size={12} sx={{ px: 0 }}>
              <Alert variant="outlined" severity="info" sx={{ width: '100%' }}>
                No responses yet. Click the add button to create a response.
              </Alert>
            </Grid>
          )}
        </Grid>
      </Box>

      <Dialog
        fullWidth
        maxWidth="lg"
        fullScreen={belowLargeScreen}
        scroll={belowLargeScreen ? 'body' : 'paper'}
        open={openResponseForm}
        onClose={() => handleResponseFormClose(false)}
      >
        <RFQResponsesForm
          toggleOpen={handleResponseFormClose}
          rfqDetails={details}
          rfqId={rfqId}
        />
      </Dialog>
    </>
  );
};

export default RFQListResponseTab;