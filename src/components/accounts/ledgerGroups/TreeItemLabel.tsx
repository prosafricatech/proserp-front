'use client'

import React from "react";
import { DeleteOutline, EditOutlined} from "@mui/icons-material";
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    IconButton,
    Tooltip,
    Typography,
} from "@mui/material";
import { useSnackbar } from "notistack";
import { LoadingButton } from "@mui/lab";
import { useLedgerGroup } from "./LedgerGroupProvider";
import CreateLedgerGroup from "./CreateLedgerGroup";
import axios from "@/lib/services/config";

interface TreeNode {
    id: number;
    name: string;
    is_editable: number;
}

interface TreeItemLabelProps {
    node: TreeNode;
}

const TreeItemLabel: React.FC<TreeItemLabelProps> = ({ node }) => {
    const [openDelete, setOpenDelete] = React.useState(false);
    const [openEdit, setOpenEdit] = React.useState(false);
    const [loading, setLoading] = React.useState(false);

    const { enqueueSnackbar } = useSnackbar();
    const { refetchLedgerGroups } = useLedgerGroup();

    const deleteLedgerGroup = (nodeId: number) => {
        setLoading(true);
        axios.get("/sanctum/csrf-cookie").then(() => {
            axios
                .delete(`/api/accountsAndFinance/ledgers/${nodeId}/deleteLedgerGroup`)
                .then((res) => {
                    if (res.status === 200) {
                        refetchLedgerGroups();
                        enqueueSnackbar(res.data.message, { variant: "success" });
                        setOpenDelete(false);
                    }
                })
                .catch((err) => {
                    enqueueSnackbar(err.response?.data?.message, { variant: "error" });
                    setOpenDelete(false);
                })
                .finally(() => {
                    setLoading(false);
                });
        });
    };

    return (
        <>
            <Dialog
                open={openDelete}
                onClose={() => setOpenDelete(false)}
                aria-labelledby="delete-dialog-title"
                aria-describedby="delete-dialog-description"
            >
                <DialogTitle color="error" id="delete-dialog-title">
                    {`Delete ${node.name} Ledger Group?`}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="delete-dialog-description">
                        {`Confirming this will delete ${node.name} with all of its sub-groups and ledgers if they are not associated with any transactions.`}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDelete(false)}>Cancel</Button>
                    <LoadingButton
                        variant="outlined"
                        color="error"
                        loading={loading}
                        onClick={() => deleteLedgerGroup(node.id)}
                        autoFocus
                    >
                        Confirm Delete
                    </LoadingButton>
                </DialogActions>
            </Dialog>

            <Dialog
                open={openEdit}
                onClose={() => setOpenEdit(false)}
                fullWidth
                maxWidth="sm"
            >
                <CreateLedgerGroup
                    ledgerGroup={node}
                    setOpenEdit={setOpenEdit}
                />
            </Dialog>

            <Box sx={{ display: "flex", alignItems: "center", minHeight: 40 }}>
                <Typography
                    variant="body2"
                    sx={{ fontWeight: "inherit", flexGrow: 1 }}
                >
                    {node.name}
                </Typography>

                {node.is_editable === 1 && (
                    <>
                        <Tooltip title={`Edit ${node.name}`}>
                            <IconButton onClick={() => setOpenEdit(true)}>
                                <EditOutlined />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title={`Delete ${node.name}`}>
                            <IconButton onClick={() => setOpenDelete(true)}>
                                <DeleteOutline fontSize="small" color="error" />
                            </IconButton>
                        </Tooltip>
                    </>
                )}
            </Box>
        </>
    );
};

export default TreeItemLabel;