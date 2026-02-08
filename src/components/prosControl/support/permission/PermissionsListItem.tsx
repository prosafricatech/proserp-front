"use client";

import React, { useContext } from "react";
import { Box, Chip, Divider, Grid, Tooltip, Typography } from "@mui/material";
import PermissionItemAction from "./PermissionItemAction";
import { SelectedTab } from "../troubleshooting/Troubleshooting";

// ---- Types ----
interface Module {
  id: string | number;
  name: string;
}

interface Permission {
  id: string | number;
  name: string;
  description: string;
  is_core: boolean;
  modules: Module[];
}

interface PermissionsListItemProps {
  permission: Permission;
}

function PermissionsListItem({ permission }: PermissionsListItemProps) {
  const { activeTab } = useContext(SelectedTab);
  const isOrganizationPermission = activeTab === 1;

  return (
    <>
      <Grid
        sx={{
          cursor: "pointer",
          "&:hover": {
            bgcolor: "action.hover",
          },
        }}
        container
        columnSpacing={2}
        padding={1}
        alignItems="center"
      >
        {/* Permission Name */}
        <Grid size={{ xs: 12, md: isOrganizationPermission ? 3 : 6 }}>
          <Tooltip title="Name">
            <Typography>{permission.name}</Typography>
          </Tooltip>
        </Grid>

        {/* Modules if Organization Permission */}
        {isOrganizationPermission && (
          <Grid size={{ xs: 12, md: 3 }}>
            <Tooltip title="Modules">
              {!permission.is_core ? (
                <div>
                  {permission.modules.map((module) => (
                    <Chip
                      key={module.id}
                      label={module.name}
                      size="small"
                      sx={{ mr: 0.5 }}
                    />
                  ))}
                </div>
              ) : (
                <Chip label="Core Permission" size="small" sx={{ mr: 0.5 }} />
              )}
            </Tooltip>
          </Grid>
        )}

        {/* Description */}
        <Grid size={{ xs: isOrganizationPermission ? 12 : 6, md: 5 }}>
          <Tooltip title="Description">
            <Typography>{permission.description}</Typography>
          </Tooltip>
        </Grid>

        {/* Actions */}
        <Grid size={{ xs: 12, md: 1 }}>
          <Box display="flex" flexDirection="row" justifyContent="flex-end">
            <PermissionItemAction permission={permission} />
          </Box>
        </Grid>
      </Grid>

      <Divider />
    </>
  );
}

export default PermissionsListItem;
