import { VisibilityOutlined, Delete, Restore, AccountBalanceWalletOutlined } from '@mui/icons-material';
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    Divider,
    Grid,
    IconButton,
    InputAdornment,
    LinearProgress,
    ListItemText,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import RelatableOrderDetails from './RelatableOrderDetails';
import projectsServices from '@/components/projectManagement/projects/project-services.js';
import CertificateOnScreen from '@/components/projectManagement/projects/profile/subcontracts/tabs/certificatesTab/preview/CertificateOnScreen';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import LedgerBudgetCheckDetails from './LedgerBudgetCheckDetails';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { useQuery } from '@tanstack/react-query';
import { readableDate, sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import purchaseServices from '@/components/procurement/purchases/purchase-services';
import { Approval, Requisition, RequisitionItem } from '@/components/processApproval/RequisitionType';
import { Div } from '@jumbo/shared';
import { Currency } from '@/components/masters/Currencies/CurrencyType';
import { Organization } from '@/types/auth-types';

interface FetchRelatableDetailsProps {
    requisition: Requisition;
    relatable: { id: number; orderNo: string; order_date: string } | null;
    toggleOpen: (open: boolean) => void;
}

interface ApprovalRequisitionLedgerItemProps {
    approval?: Approval;
    requisition: Requisition;
    errors: any
    requisitionLedgerItem: RequisitionItem[];
    handleItemChange: any
    setRequisitionLedgerItem: (items: RequisitionItem[]) => void;
    readOnlyMode?: boolean;
}

const FetchRelatableDetails = ({ relatable, toggleOpen }: FetchRelatableDetailsProps) => {
    const { authOrganization } = useJumboAuth();
    if (!relatable) return null;

    // If relatable has order_date, treat as purchase order
    if ('order_date' in relatable && relatable.order_date) {
        const { data: orderDetails, isFetching } = useQuery({
            queryKey: ['purchaseOrder', { id: relatable?.id }],
            queryFn: async () => purchaseServices.orderDetails(relatable?.id)
        });
        if (isFetching) {
            return <LinearProgress/>;
        }
        return <RelatableOrderDetails order={orderDetails} toggleOpen={toggleOpen}/>;
    }

    // If relatable has certificateNo, treat as certificate
    if ('certificateNo' in relatable && relatable.certificateNo) {
        const { data: certificateDetails, isFetching } = useQuery({
            queryKey: ['subcontractCertificate', relatable?.id],
            queryFn: () => projectsServices.getCertificateDetails(relatable?.id),
        });
        if (isFetching) {
            return <LinearProgress />;
        }
        return <>
            <CertificateOnScreen isFromProcessApproval={true} certificate={certificateDetails} organization={authOrganization?.organization as Organization} />
            <DialogActions sx={{ pb: 2 }}>
                <Button variant="outlined" color="primary" onClick={() => toggleOpen(false)}>
                    Close
                </Button>
            </DialogActions>
        </>;
    }

    return null;
};

function ApprovalRequisitionLedgerItem({
    approval,
    requisition,
    errors,
    requisitionLedgerItem,
    handleItemChange,
    setRequisitionLedgerItem,
    readOnlyMode = false,
}: ApprovalRequisitionLedgerItemProps) {
    const [openViewDialog, setOpenViewDialog] = useState(false);
    const [selectedRelated, setSelectedRelated] = useState<{ id: number; orderNo: string; order_date: string } | null>(null);
    const [initialItems, setInitialItems] = useState<RequisitionItem[]>([]);
    const { checkOrganizationPermission } = useJumboAuth();
    const canSeeBudget = checkOrganizationPermission([
        PERMISSIONS.BUDGETS_CREATE,
        PERMISSIONS.BUDGETS_EDIT,
        PERMISSIONS.BUDGETS_READ,
        PERMISSIONS.BUDGETS_DELETE,
    ]);
    const [openLedgerBudgetDialog, setOpenLedgerBudgetDialog] = useState(false);
    const [ledgerDialogData, setLedgerDialogData] = useState<{ ledgerId: number, ledgerName: string, costCenterId: number, currency: Currency } | null>(null);
    const sourceItemsCount = (approval?.items || ('items' in requisition ? requisition.items : []) || []).length;

    useEffect(() => {
        setInitialItems([...requisitionLedgerItem]);
    }, []);

    const handleDeleteItem = (index: number) => {
        const updatedItems = [...requisitionLedgerItem];
        updatedItems.splice(index, 1);
        setRequisitionLedgerItem(updatedItems);
    };

    const handleResetItems = () => {
        setRequisitionLedgerItem([...initialItems]);
    };

    return (
        <React.Fragment>
            {requisitionLedgerItem.map((item: RequisitionItem, itemIndex: number) => (
                <Grid container key={item.id} spacing={1} pb={2} pr={0.5}
                    sx={{
                        cursor: 'pointer',
                        '&:hover': {
                            bgcolor: 'action.hover',
                        },
                    }}
                >
                    <Grid size={{xs: 12}}>
                        <Divider />
                    </Grid>
                    <Grid size={{xs: 1}}>
                        <Div sx={{ mt: 2, mb: 0.5 }}>{itemIndex + 1}.</Div>
                    </Grid>
                    <Grid size={{xs: 11, md: 3, lg: 3}}>
                        <Div sx={{ mt: 2, mb: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <ListItemText
                                primary={
                                    <Tooltip title={'Ledger'}>
                                        <Typography variant="h5" fontSize={14} lineHeight={1.25} mb={0} noWrap>
                                            {item.ledger?.name}
                                            {item.ledger && canSeeBudget && (
                                                <Tooltip title={`${item.ledger.name} Budget check`}>
                                                    <IconButton
                                                        size="small"
                                                        sx={{ ml: 1 }}
                                                        onClick={() => {
                                                            setLedgerDialogData({
                                                                ledgerId: item.ledger.id,
                                                                ledgerName: item.ledger.name,
                                                                costCenterId: requisition.cost_center?.id,
                                                                currency: requisition.currency
                                                            });
                                                            setOpenLedgerBudgetDialog(true);
                                                        }}
                                                    >
                                                        <AccountBalanceWalletOutlined fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                        </Typography>
                                    </Tooltip>
                                }
                                secondary={
                                    item.relatable && (
                                        <>
                                            <Tooltip title={'Relatable To'}>
                                                <Typography variant="caption" fontSize={14} lineHeight={1.25} mb={0}>
                                                    {`${item?.relatable?.orderNo || item?.relatable?.certificateNo || ''} (${readableDate(item.relatable?.order_date || item.relatable?.certificate_date, false)})`}
                                                </Typography>
                                            </Tooltip>
                                            <Tooltip title={item?.relatable_type === 'purchase' ? 'View Order' : 'View Certificate'}>
                                                <IconButton onClick={() => {
                                                    setSelectedRelated(item?.relatable);
                                                    setOpenViewDialog(true);
                                                }}>
                                                    <VisibilityOutlined />
                                                </IconButton>
                                            </Tooltip>
                                        </>
                                    )
                                }
                            />
                        </Div>
                    </Grid>
                    <Grid size={{xs: 6, md: 2, lg: 2}}>
                        <Div sx={{ mt: 1, mb: 0.5 }}>
                            <TextField
                                label="Quantity"
                                fullWidth
                                size="small"
                                defaultValue={item.quantity}
                                disabled={readOnlyMode}
                                onChange={(e) => handleItemChange({ 
                                    index: itemIndex, 
                                    key: 'quantity', 
                                    value: sanitizedNumber(e.target.value) 
                                })}
                                error={!!errors?.[itemIndex]?.quantity}
                                helperText={errors?.[itemIndex]?.quantity?.message || ''}
                                InputProps={{
                                    inputComponent: CommaSeparatedField,
                                    endAdornment: <InputAdornment position="end">{item.measurement_unit?.symbol}</InputAdornment>,
                                }}
                            />
                        </Div>
                    </Grid>
                    <Grid size={{xs: 6, md: 2, lg: 2}}>
                        <Div sx={{ mt: 1, mb: 0.5 }}>
                            <TextField
                                label="Rate"
                                fullWidth
                                size="small"
                                defaultValue={item.rate}
                                disabled={readOnlyMode}
                                error={!!errors?.[itemIndex]?.rate}
                                helperText={errors?.[itemIndex]?.rate?.message || ''}
                                onChange={(e) => handleItemChange({
                                    index: itemIndex, 
                                    key: 'rate', 
                                    value: sanitizedNumber(e.target.value)
                                })}
                                InputProps={{
                                    inputComponent: CommaSeparatedField,
                                }}
                            />
                        </Div>
                    </Grid>
                    <Grid size={{xs: 6, md: 2, lg: 2}}>
                        <Div sx={{ mt: 1, mb: 0.5 }}>
                            <TextField
                                label="Amount"
                                fullWidth
                                size="small"
                                value={item.quantity * item.rate}
                                InputProps={{
                                    inputComponent: CommaSeparatedField,
                                    readOnly: true,
                                }}
                            />
                        </Div>
                    </Grid>
                    <Grid size={{
                        xs: requisitionLedgerItem.length > 1 ? 5 : 6, 
                        md: requisitionLedgerItem.length > 1 ? 1.5 : 2, 
                        lg: requisitionLedgerItem.length > 1 ? 1.5 : 2
                    }}>
                        <Div sx={{ mt: 1, mb: 0.5 }}>
                            <TextField
                                label="Remarks"
                                fullWidth
                                size="small"
                                defaultValue={item.remarks}
                                disabled={readOnlyMode}
                                onChange={(e) => handleItemChange({
                                    index: itemIndex, 
                                    key: 'remarks', 
                                    value: e.target.value
                                })}
                            />
                        </Div>
                    </Grid>
                    {requisitionLedgerItem.length > 1 && !readOnlyMode && (
                        <Grid size={{xs: 1, md: 0.5, lg: 0.5}}>
                            <Div sx={{ mt: 1.5, mb: 0.5 }}>
                                <Tooltip title="Delete item">
                                    <IconButton 
                                        size="small" 
                                        color="error"
                                        onClick={() => handleDeleteItem(itemIndex)}
                                    >
                                        <Delete fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            </Div>
                        </Grid>
                    )}
                </Grid>
            ))}

            {!readOnlyMode && sourceItemsCount > 1 && requisitionLedgerItem.length < initialItems.length && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, mb: 2 }}>
                    <Tooltip title="Restore all deleted items" arrow placement="top">
                        <Button
                            variant="outlined"
                            color="secondary"
                            size='small'
                            startIcon={<Restore />}
                            onClick={handleResetItems}
                        >
                            Reset
                        </Button>
                    </Tooltip>
                </Box>
            )}

            <Dialog open={openViewDialog} maxWidth='md' fullWidth onClose={() => setOpenViewDialog(false)}>
                {selectedRelated && (
                    <FetchRelatableDetails 
                        requisition={requisition} 
                        relatable={selectedRelated} 
                        toggleOpen={setOpenViewDialog} 
                    />
                )}
            </Dialog>

            <LedgerBudgetCheckDetails
                open={openLedgerBudgetDialog}
                onClose={() => setOpenLedgerBudgetDialog(false)}
                ledgerId={ledgerDialogData?.ledgerId || 0}
                costCenterId={ledgerDialogData?.costCenterId || 0}
                currency={ledgerDialogData?.currency as Currency}
                ledgerName={ledgerDialogData?.ledgerName || ''}
            />
        </React.Fragment>
    );
}

export default ApprovalRequisitionLedgerItem;