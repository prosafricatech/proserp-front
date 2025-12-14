'use client'
import React, { useEffect, useState } from 'react';
import { useDashboardSettings } from '../Dashboard';
import JumboCardQuick from '@jumbo/components/JumboCardQuick';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Badge,
  Chip,
  Dialog,
  DialogContent,
  Grid,
  IconButton,
  LinearProgress,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { ExpandMoreOutlined, NotificationsActiveRounded, Print } from '@mui/icons-material';
import JumboChipsGroup from '@jumbo/components/JumboChipsGroup';
import PDFContent from '../../pdf/PDFContent';
import LowStockAlertsPDF from './LowStockAlertsPDF';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { useQuery } from '@tanstack/react-query';
import lowStockThresholdServices from '@/components/procurement/stores/[store_id]/storeStock/lowStockThresholds/lowStockThreshold-services';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { JumboScrollbar } from '@jumbo/components';
import { Div } from '@jumbo/shared';

interface AlertItem {
  product_name: string;
  threshold: number;
  available_stock: number;
  cost_centers: Array<{ name: string }>;
}

interface Store {
  id: number;
  name: string;
  alerts: AlertItem[];
}

interface DocumentDialogProps {
  open: boolean;
  onClose: () => void;
  stores: Store[];
  store?: Store;
}

function LowStockAlerts() {
  const [openDocumentDialog, setOpenDocumentDialog] = useState(false);

  const { theme } = useJumboTheme();
  const smallScreen = useMediaQuery(theme.breakpoints.down('md'));
  const midScreen = useMediaQuery(theme.breakpoints.down('lg'));
  
  const { chartFilters: { to, cost_center_ids } } = useDashboardSettings();
  const [params, setParams] = useState({
    cost_center_ids,
    as_of: to,
  });

  useEffect(() => {
    setParams((params) => ({ ...params, as_of: to, cost_center_ids }));
  }, [to, cost_center_ids]);

  const { data: stores = [], isLoading } = useQuery({
    queryKey: ['lowStockAlerts', params],
    queryFn: async () => {
      return await lowStockThresholdServices.alerts(params);
    }
  });

  const DocumentDialog: React.FC<DocumentDialogProps> = ({ open, onClose, stores }) => {
    const { authOrganization } = useJumboAuth();
    const organization = authOrganization?.organization;
    return (
      <Dialog
        open={open}
        scroll={(smallScreen || !open) ? 'body' : 'paper'}
        fullWidth
        maxWidth="lg"
        onClose={onClose}
      >
        <DialogContent>
          <PDFContent fileName='Low Stock Alert' document={<LowStockAlertsPDF stores={stores as any} organization={organization as any} />} />
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div>
      <JumboCardQuick
        title={'Low Stock Alerts'}
        sx={{
          height: !isLoading && smallScreen && stores.length < 1 ? 200 : (smallScreen || midScreen ? 350 : 310),
        }}
        action={
          stores.length > 0 && (
            <Tooltip title={'Print'}>
              <IconButton onClick={() => setOpenDocumentDialog(true)}>
                <Print />
              </IconButton>
            </Tooltip>
          )
        }
      >
      {
        isLoading ? <LinearProgress/> :
        <JumboScrollbar
            autoHeight
            autoHeightMin={!isLoading && stores.length < 1 ? 200 : (smallScreen ? 300 : 250)}
            autoHide
            autoHideDuration={200}
            autoHideTimeout={500}
        >
          {
            stores.length > 0 ? stores.map((store: any) => (
              <Accordion key={store.id}>
                    <AccordionSummary
                        expandIcon={<ExpandMoreOutlined/>}
                    >
                      <Grid container width={'100%'}>
                        <Grid size={{ xs: 9 }}>
                          <Tooltip title={'Store Name'}>
                            <Typography variant='h4'>{store.name}</Typography>
                          </Tooltip>
                        </Grid>
                        <Grid size={{ xs: 2 }} textAlign={'end'}>
                          <Tooltip
                            title="Alerts found"
                          >
                            <Badge badgeContent={store.alerts.length} color="secondary">
                                <NotificationsActiveRounded/>
                            </Badge>
                          </Tooltip>
                        </Grid>
                      </Grid>
                    </AccordionSummary>
                    <AccordionDetails>
                      <JumboScrollbar
                          autoHeight
                          autoHeightMin={smallScreen ? 350 : 270}
                          autoHide
                          autoHideDuration={200}
                          autoHideTimeout={500}
                      >
                        {
                          store.alerts.map((alert:any, index: number) => (
                            <Grid container width={'100%'} key={index} columnSpacing={1} rowSpacing={1} mt={1}
                              sx={{
                                cursor: 'pointer',
                                borderTop: 2,
                                borderColor: 'divider',
                                '&:hover': {
                                    bgcolor: 'action.hover',
                                },
                                padding: 1,
                              }}
                            >
                                <Grid size={{ xs: 12, lg: 8 }}>
                                  <Tooltip title={'Product Name'}>
                                      <Typography>{alert.product_name}</Typography>
                                  </Tooltip>
                                </Grid>
                                <Grid size={{ xs: 6, lg: 2 }} textAlign={'end'}>
                                  <Tooltip title={'Threshold'}>
                                      <Chip label={alert.threshold} color={'primary'}/>
                                    </Tooltip>
                                </Grid>
                                <Grid size={{ xs: 6, lg: 2 }} textAlign={'end'}>
                                  <Tooltip title={'Available Stock'}>
                                      <Chip label={alert.available_stock} color={alert.available_stock > 0 ? 'warning' : 'error'}/>
                                    </Tooltip>
                                </Grid>
                                <Grid size={{ xs: 12 }}>
                                  <Tooltip title={'Cost Centers'}>
                                    <Div>
                                      <JumboChipsGroup
                                          chips={alert.cost_centers}
                                          mapKeys={{label: "name"}}
                                          spacing={1}
                                          size={"small"}
                                          max={3}
                                      />
                                    </Div>
                                  </Tooltip>
                                </Grid>
                            </Grid>
                          ))
                        }
                      </JumboScrollbar>
                    </AccordionDetails>
                </Accordion>
            )) :  <Alert variant={'outlined'} severity={'info'}>No any low stock alerts</Alert>
          }
        </JumboScrollbar>
      }
      </JumboCardQuick>

      {/* Render the DocumentDialog*/}
      <DocumentDialog open={openDocumentDialog} stores={stores} onClose={() => setOpenDocumentDialog(false)}/>
    </div>
  );
}

export default LowStockAlerts;