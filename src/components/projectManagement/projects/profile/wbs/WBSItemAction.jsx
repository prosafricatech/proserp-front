'use client'
import { Dialog, IconButton, Tooltip, useMediaQuery } from '@mui/material'
import React, {  useState} from 'react'
import { DeleteOutlined, EditOutlined, MoreHorizOutlined, PlaylistAddCheck} from '@mui/icons-material'
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog'
import { useSnackbar } from 'notistack'
import WBSForm from './WBSForm'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks'
import projectsServices from '../../project-services'
import { JumboDdMenu } from '@jumbo/components'

function WBSItemAction({activity, isAccDetails}) {
    const {showDialog,hideDialog} = useJumboDialog();
    const {enqueueSnackbar} = useSnackbar();
    const [openEditDialog, setOpenEditDialog] = useState(false);
    const [openDialog, setOpenDialog] = useState(false);
    const queryClient = useQueryClient();

      //Screen handling constants
    const {theme} = useJumboTheme();
    const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

    // React Query v5 syntax for useMutation
    const deleteTimelineActivity = useMutation({
        mutationFn: projectsServices.deleteTimelineActivity,
        onSuccess: (data) => {
            enqueueSnackbar(data.message,{variant : 'success'});
            queryClient.invalidateQueries({queryKey: ['projectTimelineActivities']});
        },
        onError: (error) => {
            enqueueSnackbar(error?.response?.data.message,{variant : 'error'});
        },
    });

    const menuItems = [
        {icon: <EditOutlined/>, title: 'Edit', action: 'edit'},
        !(activity.children.length > 0 || activity.tasks.length > 0) &&{icon: <DeleteOutlined color='error'/>, title: 'Delete', action: 'delete'}
    ].filter(Boolean);

    const handleItemAction = (menuItem) => {
        switch (menuItem.action) {
          case 'edit':
            setOpenEditDialog(true);
            break;
          case 'delete':
            showDialog({
                title: 'Confirm Delete',
                content: 'Are you sure you want to delete this Timeline Activity?',
                onYes: () =>{ 
                    hideDialog();
                    deleteTimelineActivity.mutate(activity);
                },
                onNo: () => hideDialog(),
                variant:'confirm'
            });
            break;
            default:
            break;
        }
      }

  return  (
    <React.Fragment>
        <Dialog
            open={openEditDialog || openDialog}
            fullScreen={belowLargeScreen}
            fullWidth
            maxWidth={'md'}
            scroll={belowLargeScreen ? 'body' : 'paper'}
        >
            {openEditDialog && <WBSForm timelineActivity={activity} setOpenDialog={setOpenEditDialog} /> }
            {openDialog && <WBSForm setOpenDialog={setOpenDialog} parentActivity={activity}/> }
        </Dialog>

        {!isAccDetails &&
            <JumboDdMenu
                icon={
                    <Tooltip title='Actions'>
                        <MoreHorizOutlined/>
                    </Tooltip>
                }
                menuItems={menuItems}
                onClickCallback={handleItemAction}
            />
        }

        {!!isAccDetails &&
            <Tooltip title={"Add Sub Activity"}>
                <IconButton onClick={() => setOpenDialog(true)}>
                    <PlaylistAddCheck/>
                </IconButton>
            </Tooltip>
        }

      </React.Fragment>
  )
}

export default WBSItemAction