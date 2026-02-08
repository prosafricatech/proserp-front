'use client'

import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import { AddOutlined, ListOutlined, ViewComfy } from '@mui/icons-material';
import { Button, ButtonGroup, Tooltip } from '@mui/material';
import React from 'react';
import { useOrganizationProfile } from '../OrganizationProfileProvider';
import { InvitationForm } from './InvitationForm';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

interface ActionTailProps {
  view: 'list' | 'grid';
  setView: (view: 'list' | 'grid') => void;
}

export const ActionTail: React.FC<ActionTailProps> = ({ view, setView }) => {
    const dictionary = useDictionary();
    const actionTailDict = dictionary.organizations.profile.usersTab.actionTail;
    
    const { showDialog } = useJumboDialog();
    const { organization } = useOrganizationProfile();
    const { checkOrganizationPermission, authOrganization } = useJumboAuth();

    const handleInviteClick = () => {
        if (!organization) return;
        
        showDialog({
            title: actionTailDict.inviteDialog.title,
            content: <InvitationForm organization={organization} />,
        });
    };

    return (
        <ButtonGroup
            variant="outlined"
            size="small"
            disableElevation
            sx={{
                '& .MuiButton-root': {
                    px: 1
                }
            }}
        >
            <Tooltip title={actionTailDict.listViewTooltip}>
                <Button 
                    variant={view === "list" ? "contained" : "outlined"}
                    onClick={() => setView("list")}
                >
                    <ListOutlined />
                </Button>
            </Tooltip>
            <Tooltip title={actionTailDict.gridViewTooltip}>
                <Button 
                    variant={view === "grid" ? "contained" : "outlined"}
                    onClick={() => setView("grid")}
                >
                    <ViewComfy />
                </Button>
            </Tooltip>
            {authOrganization?.organization?.id === organization?.id && 
                checkOrganizationPermission(PERMISSIONS.USERS_INVITE) && (
                    <Tooltip title={actionTailDict.inviteUsersTooltip}>
                        <Button onClick={handleInviteClick}>
                            <AddOutlined />
                        </Button>
                    </Tooltip>
                )
            }
        </ButtonGroup>
    );
};