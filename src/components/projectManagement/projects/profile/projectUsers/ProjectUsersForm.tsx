"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Checkbox,
  FormControlLabel,
  Button,
  Divider,
  DialogContent,
  DialogActions,
  DialogTitle,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import { useProjectProfile } from "../ProjectProfileProvider";
import axios from "@/lib/services/config";

function ProjectUsersForm() {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { project } = useProjectProfile();
  const costCenterId = project?.costcenter?.id;
  const [selectedUserIds, setSelectedUserIds] = useState([]);

  const usersQuery = useQuery({
    enabled: !!costCenterId,
    queryKey: ["costcenter-users", costCenterId],
    queryFn: async () => {
      const { data } = await axios.get(`/api/cost-centers/${costCenterId}/users`);
      return data?.data ?? [];
    },
  });

  const toggleUser = (userId) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const attachUsers = useMutation({
    mutationFn: async () => {
      return await axios.put(
        `/api/cost-centers/${costCenterId}/attach-users`,
        { user_ids: selectedUserIds }
      );
    },
    onSuccess: () => {
      enqueueSnackbar("Users attached successfully", { variant: "success" });
      queryClient.invalidateQueries(["costcenter-users", costCenterId]);
    },
    onError: () => enqueueSnackbar("Failed to attach users", { variant: "error" }),
  });

  return (
    <>
       <DialogTitle>
             <Typography variant="h6" gutterBottom>
                Project Users
            </Typography>
       </DialogTitle>
        <DialogContent>
            {usersQuery.data?.map((user) => (
                <FormControlLabel
                    key={user.id}
                    control={
                        <Checkbox
                            checked={selectedUserIds.includes(user.id)}
                            onChange={() => toggleUser(user.id)}
                        />
                    }
                    label={user.name}
                />
            ))
            }
        </DialogContent>
        <DialogActions>
            <Button
                variant="contained"
                color="success"
                disabled={selectedUserIds.length === 0 || attachUsers.isPending}
                onClick={() => attachUsers.mutate()}
            >
                Attach
            </Button>
        </DialogActions>
    </>
  );
}

export default ProjectUsersForm;
