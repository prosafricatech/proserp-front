import React, { useState } from 'react';
import { IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { LinkOffOutlined } from '@mui/icons-material';
import projectsServices from '../../project-services';
import { useProjectProfile } from '../ProjectProfileProvider';
import { LoadingButton } from '@mui/lab';

interface ProjectUserActionProps {
    user: {
        id: string;
        name: string;
    };
}

function ProjectUserAction({ user }: ProjectUserActionProps) {
    const [openDialog, setOpenDialog] = useState(false);
    const { project }: any = useProjectProfile();
    const costCenterId = project?.cost_center?.id;

    const { enqueueSnackbar } = useSnackbar();
    const queryClient = useQueryClient();

    const detachUserMutation = useMutation({
        mutationFn: (payload: { user_ids: string[] }) =>
            projectsServices.detachUsers(costCenterId, payload),

        onSuccess: (data) => {
            enqueueSnackbar(data?.message || "User detached successfully", { variant: "success" });
            queryClient.invalidateQueries({ queryKey: ["projectUsers"] });
            setOpenDialog(false);
        },
        onError: (error: any) => {
            const msg = error?.response?.data?.message || "Error occurred";
            enqueueSnackbar(msg, { variant: "error" });
        }
    });

    const handleDetach = () => {
        detachUserMutation.mutate({ user_ids: [user.id] });
    };

    return (
        <>
            <Tooltip title="Detach User">
                <IconButton color="error" onClick={() => setOpenDialog(true)}>
                    <LinkOffOutlined />
                </IconButton>
            </Tooltip>

            <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
                <DialogTitle>Detach User</DialogTitle>

                <DialogContent>
                    <Typography>
                        Are you sure you want to detach <strong>{user.name}</strong> from this project?
                    </Typography>
                </DialogContent>

                <DialogActions>
                    <Button onClick={() => setOpenDialog(false)} size="small">
                        Cancel
                    </Button>
                    <LoadingButton
                        variant="contained"
                        color="error"
                        onClick={handleDetach}
                        size="small"
                        loading={detachUserMutation.isPending}
                    >
                        {detachUserMutation.isPending ? "Detaching..." : "Detach"}
                    </LoadingButton>
                </DialogActions>
            </Dialog>
        </>
    );
}

export default ProjectUserAction;