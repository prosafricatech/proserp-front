'use client'
import { AddOutlined } from '@mui/icons-material';
import {
  ButtonGroup,
  Dialog,
  IconButton,
  Tooltip,
  useMediaQuery,
} from '@mui/material';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import React, { useState } from 'react';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import ProjectFormDialog from './ProjectFormDialog';

const ProjectsActionTail = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const { theme } = useJumboTheme();
  const { checkOrganizationPermission } = useJumboAuth();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

return (
  <React.Fragment>
    <Dialog maxWidth="md" fullScreen={belowLargeScreen} open={openDialog}>
      <ProjectFormDialog setOpenDialog={setOpenDialog} project={null} reFetchProjectAfterEdit={null} />
    </Dialog>

    <ButtonGroup
      variant="outlined"
      size="small"
      disableElevation
      sx={{ '& .MuiButton-root': { px: 1 } }}
    >
      {checkOrganizationPermission(PERMISSIONS.PROJECTS_CREATE) && (
        <Tooltip title="New Project">
          <IconButton onClick={() => setOpenDialog(true)}>
            <AddOutlined />
          </IconButton>
        </Tooltip>
      )}
    </ButtonGroup>
  </React.Fragment>
);
}

export default ProjectsActionTail;
