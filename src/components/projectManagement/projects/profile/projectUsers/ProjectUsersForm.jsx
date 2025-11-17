"use client";

import React, { useState } from "react";
import {
  Typography,
  Button,
  DialogContent,
  DialogActions,
  DialogTitle,
  Autocomplete,
  TextField,
  Checkbox,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import axios from "@/lib/services/config";
import UsersSelector from "@/components/sharedComponents/UsersSelector";
import { Div } from "@jumbo/shared";
import { LoadingButton } from "@mui/lab";
import { useProjectProfile } from "../ProjectProfileProvider";

const ProjectUsersForm = ({ setOpenDialog, actionType }) => {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { project } = useProjectProfile();
  const costCenterId = project?.cost_center?.id;
  const [selectedUserIds, setSelectedUserIds] = useState([]);

  // GET cost center users
  const costCenterUsersQuery = useQuery({
    enabled: !!costCenterId,
    queryKey: ["cost-center-users", costCenterId],
    queryFn: async () => {
      const data = await axios.get(
        `/api/accountsAndFinance/cost-centers/${costCenterId}/costCenterUsers`
      );
      return data?.data ?? [];
    },
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const route =
        actionType === "attach"
          ? `/api/accountsAndFinance/cost-centers/${costCenterId}/attach-users`
          : `/api/accountsAndFinance/cost-centers/${costCenterId}/detach-users`;

      return await axios.put(route, {
        user_ids: selectedUserIds,
      });
    },

    onSuccess: () => {
      enqueueSnackbar(
        actionType === "attach"
          ? "Users attached successfully"
          : "Users detached successfully",
        { variant: "success" }
      );

      queryClient.invalidateQueries({ queryKey: ["projectUsers"] });
      queryClient.invalidateQueries({ queryKey: ["cost-center-users"] });
      setOpenDialog(false);
    },
    onError: () => enqueueSnackbar("Operation failed", { variant: "error" }),
  });

  return (
    <>
        <DialogTitle>
            <Typography
                variant="h4"
                component="div"
                textAlign="center"
            >
                {actionType === "attach" ? "Attach Users" : "Detach Users"}
            </Typography>
        </DialogTitle>

        <DialogContent>
            <Div sx={{ mt: 1 }}>
                {actionType === "attach" ? (
                    <UsersSelector
                        label="Select Users"
                        multiple
                        excludeUsers={costCenterUsersQuery?.data || []}
                        onChange={(newValue) =>
                            setSelectedUserIds(newValue?.map((u) => u.id) || [])
                    }
                    />
                ) : (
                    <Autocomplete
                        multiple
                        size="small"
                        options={costCenterUsersQuery?.data || []}
                        getOptionLabel={(opt) => opt?.name || ""}
                        disableCloseOnSelect
                        value={
                            (costCenterUsersQuery?.data || []).filter((u) =>
                                selectedUserIds.includes(u.id)
                            )
                        }
                        onChange={(e, newValue) =>
                            setSelectedUserIds(newValue?.map((u) => u.id) || [])
                        }
                        renderOption={(optionProps, option, { selected }) => {
                            const { key, ...rest } = optionProps;
                            return (
                                <li key={key} {...rest}>
                                    <Checkbox
                                        style={{ marginRight: 8 }}
                                        checked={selected}
                                    />
                                    {option.name}
                                </li>
                            );
                        }}
                        renderInput={(params) => (
                            <TextField {...params} label="Current Users" />
                        )}
                    />
                )}
            </Div>
        </DialogContent>

        <DialogActions>
            <Button variant="outlined" size="small" onClick={() => setOpenDialog(false)}>
                Cancel
            </Button>

            <LoadingButton
                variant="contained"
                color={actionType === "attach" ? "success" : "error"}
                size="small"
                loading={mutation.isPending}
                disabled={selectedUserIds.length === 0}
                onClick={() => mutation.mutate()}
            >
                {actionType === "attach" ? "Attach" : "Detach"}
            </LoadingButton>
        </DialogActions>
    </>
  );
};

export default ProjectUsersForm;
